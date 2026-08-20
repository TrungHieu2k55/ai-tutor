"""
Cơ chế RAG (Retrieval-Augmented Generation): lấy các đoạn tài liệu liên quan nhất
đến câu hỏi, đưa làm ngữ cảnh cho LLM để sinh câu trả lời kèm trích dẫn nguồn.

Hỗ trợ các LLM providers (tự động chọn theo API key có sẵn):
  1. DeepSeek AI (DEEPSEEK_API_KEY) — Model deepseek-chat
  2. Google Gemini (GOOGLE_API_KEY) — REST API / SDK
  3. Anthropic Claude (ANTHROPIC_API_KEY)
  4. Offline — trả lại nội dung chunks trực tiếp (không cần API key)
"""

import json
import logging
import time
import urllib.error
import urllib.request

from src.config.environment import settings
from src.providers.vector_store_provider import retrieve_relevant_chunks


logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Bạn là trợ lý học tập AI Tutor. Chỉ trả lời dựa trên đoạn ngữ cảnh được cung cấp. "
    "Nếu ngữ cảnh không đủ để trả lời, hãy nói rõ là không tìm thấy thông tin trong tài liệu, "
    "không được bịa thông tin. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt.\n"
    "LƯU Ý TRÌNH BÀY: Tránh sử dụng mã LaTeX phức tạp như $$, \\text{}, \\times. "
    "Hãy trình bày công thức toán bằng ký tự văn bản thông thường (ví dụ: 3 x 2 = 6 cách, C(n,k), A(n,k)) để người học dễ đọc."
)


def _call_deepseek(context: str, question: str) -> str:
    """Gọi DeepSeek REST API (model deepseek-chat)."""
    api_key = settings.DEEPSEEK_API_KEY.strip()
    url = "https://api.deepseek.com/chat/completions"

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Ngữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
            },
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "stream": False,
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        res_body = resp.read().decode("utf-8")
        data = json.loads(res_body)
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")

    raise ValueError("Không nhận được câu trả lời từ DeepSeek API")


def _call_gemini_rest(context: str, question: str) -> str:
    """Gọi Gemini REST API trực tiếp — tương thích với mọi loại key."""
    api_key = settings.GOOGLE_API_KEY.strip()
    prompt_text = f"{SYSTEM_PROMPT}\n\nNgữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}"
    payload = {"contents": [{"parts": [{"text": prompt_text}]}]}
    req_data = json.dumps(payload).encode("utf-8")

    models_to_try = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
    ]
    last_err = None

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_body = resp.read().decode("utf-8")
                data = json.loads(res_body)
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except Exception as e:
            logger.warning("Thử model %s qua REST thất bại: %s", model_name, e)
            last_err = e

    raise last_err or ValueError("Không nhận được câu trả lời từ Gemini API")


def _call_gemini_sdk(context: str, question: str) -> str:
    """Gọi Google Gemini qua google-genai SDK."""
    from google import genai

    client = genai.Client(api_key=settings.GOOGLE_API_KEY.strip())
    models_to_try = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
    ]
    last_err = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=f"{SYSTEM_PROMPT}\n\nNgữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning("Thử model %s qua SDK thất bại: %s", model_name, e)
            last_err = e

    raise last_err or ValueError("Không nhận được câu trả lời từ Gemini SDK")


def _call_gemini(context: str, question: str) -> str:
    """Thử gọi REST API trước (hỗ trợ key AQ...), nếu lỗi thử SDK."""
    try:
        return _call_gemini_rest(context, question)
    except Exception as e_rest:
        logger.warning("Gemini REST API lỗi: %s, chuyển sang thử SDK...", e_rest)
        try:
            return _call_gemini_sdk(context, question)
        except Exception as e_sdk:
            logger.error("Cả Gemini REST và SDK đều lỗi: %s", e_sdk)
            raise e_sdk


def _call_anthropic(context: str, question: str) -> str:
    """Gọi Anthropic Claude API (hỗ trợ cả SDK và REST API trực tiếp không phụ thuộc thư viện)."""
    api_key = settings.ANTHROPIC_API_KEY.strip()

    # Thử qua SDK nếu package anthropic đã được cài đặt
    try:
        import anthropic  # type: ignore

        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Ngữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
                }
            ],
        )
        return "".join(block.text for block in message.content if block.type == "text")
    except ImportError:
        pass

    # Gọi qua REST API trực tiếp bằng urllib nếu không có thư viện anthropic
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1000,
        "system": SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": f"Ngữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
            }
        ],
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        res_body = resp.read().decode("utf-8")
        data = json.loads(res_body)
        content_blocks = data.get("content", [])
        return "".join(block.get("text", "") for block in content_blocks if block.get("type") == "text")


from src.models.system_setting_model import SystemSetting


def _call_openrouter(context: str, question: str, preferred_model: str | None = None) -> str:
    """Gọi OpenRouter API (hỗ trợ các model hàng đầu: DeepSeek V3/R1, Gemini, Llama 3.3, GPT-4o...)."""
    api_key = settings.OPENROUTER_API_KEY.strip()
    url = "https://openrouter.ai/api/v1/chat/completions"

    models_to_try = [
        preferred_model.strip() if preferred_model else None,
        settings.OPENROUTER_MODEL.strip() if settings.OPENROUTER_MODEL else None,
        "deepseek/deepseek-chat",
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct",
        "openai/gpt-4o-mini",
    ]

    # Loại bỏ trùng lặp và None
    unique_models = []
    for m in models_to_try:
        if m and m not in unique_models:
            unique_models.append(m)

    last_err = None
    for model_name in unique_models:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Ngữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
                },
            ],
            "temperature": 0.3,
            "max_tokens": 1000,
        }

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://ai-tutor.app",
                "X-Title": "AI Tutor System",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_body = resp.read().decode("utf-8")
                data = json.loads(res_body)
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        logger.info("Gọi thành công OpenRouter API với model %s", model_name)
                        return content
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                pass
            logger.warning("Thử model OpenRouter %s thất bại HTTP %s: %s", model_name, e.code, err_body or e.reason)
            last_err = e
        except Exception as e:
            logger.warning("Thử model OpenRouter %s thất bại: %s", model_name, e)
            last_err = e

    raise last_err or ValueError("Không nhận được câu trả lời từ OpenRouter API")


def _offline_answer(chunks: list[dict], question: str) -> str:
    """Chế độ offline: trả lại nội dung chunks trực tiếp, không cần LLM."""
    if not chunks:
        return "Không tìm thấy nội dung liên quan trong tài liệu."
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"📄 **Đoạn {i}** (trang {c['page']}):\n{c['text']}")
    header = f"🔍 Tìm thấy {len(chunks)} đoạn liên quan đến câu hỏi của bạn:\n\n"
    footer = "\n\n---\n💡 *Đây là kết quả trích xuất trực tiếp từ tài liệu.*"
    return header + "\n\n".join(parts) + footer


async def answer_question(document_id: str, question: str) -> dict:
    start = time.time()

    chunks = retrieve_relevant_chunks(document_id, question, top_k=4)

    if not chunks:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy nội dung phù hợp trong tài liệu để trả lời câu hỏi này.",
            "sources": [],
            "response_time_ms": int((time.time() - start) * 1000),
        }

    context = "\n\n".join(f"[Trang {c['page']}]\n{c['text']}" for c in chunks)

    # Đọc Cài đặt từ Admin Database nếu có
    sys_setting = None
    try:
        sys_setting = await SystemSetting.find_one()
    except Exception:
        pass

    llm_provider = sys_setting.llm_provider if sys_setting else "openrouter"
    openrouter_model = sys_setting.openrouter_model if sys_setting else "deepseek/deepseek-chat"

    answer_text = None

    # Nếu Admin chỉ định Provider cụ thể:
    if llm_provider == "openrouter" and settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip():
        try:
            answer_text = _call_openrouter(context, question, preferred_model=openrouter_model)
            logger.info("Trả lời thành công bằng OpenRouter AI (model: %s)", openrouter_model)
        except Exception as e:
            logger.warning("OpenRouter AI (%s) thất bại: %s", openrouter_model, e)

    elif llm_provider == "deepseek" and settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY.strip():
        try:
            answer_text = _call_deepseek(context, question)
            logger.info("Trả lời thành công bằng DeepSeek AI Direct")
        except Exception as e:
            logger.warning("DeepSeek AI Direct thất bại: %s", e)

    elif llm_provider == "gemini" and settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY.strip():
        try:
            answer_text = _call_gemini(context, question)
            logger.info("Trả lời thành công bằng Google Gemini Direct")
        except Exception as e:
            logger.warning("Google Gemini Direct thất bại: %s", e)

    elif llm_provider == "anthropic" and settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY.strip():
        try:
            answer_text = _call_anthropic(context, question)
            logger.info("Trả lời thành công bằng Anthropic Claude Direct")
        except Exception as e:
            logger.warning("Anthropic Claude Direct thất bại: %s", e)

    elif llm_provider == "offline":
        answer_text = _offline_answer(chunks, question)
        logger.info("Trả lời ở chế độ offline theo cài đặt Admin")

    # Fallback tự động nếu Provider chỉ định gặp sự cố:
    if answer_text is None and settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip():
        try:
            answer_text = _call_openrouter(context, question, preferred_model=openrouter_model)
            logger.info("Fallback trả lời bằng OpenRouter AI")
        except Exception as e:
            logger.warning("Fallback OpenRouter AI thất bại: %s", e)

    if answer_text is None and settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY.strip():
        try:
            answer_text = _call_deepseek(context, question)
            logger.info("Fallback trả lời bằng DeepSeek AI")
        except Exception as e:
            logger.warning("Fallback DeepSeek AI thất bại: %s", e)

    if answer_text is None and settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY.strip():
        try:
            answer_text = _call_gemini(context, question)
            logger.info("Fallback trả lời bằng Google Gemini")
        except Exception as e:
            logger.warning("Fallback Google Gemini thất bại: %s", e)

    if answer_text is None:
        answer_text = _offline_answer(chunks, question)
        logger.info("Trả lời ở chế độ offline")

    return {
        "answer": answer_text,
        "sources": [{"page": c["page"], "snippet": c["text"][:160]} for c in chunks],
        "response_time_ms": int((time.time() - start) * 1000),
    }
