"""
Cơ chế RAG (Retrieval-Augmented Generation): lấy các đoạn tài liệu liên quan nhất
đến câu hỏi, đưa làm ngữ cảnh cho LLM để sinh câu trả lời kèm trích dẫn nguồn.
"""

import time

import anthropic

from src.core.config import settings
from src.services.vector_store import retrieve_relevant_chunks

_llm_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM_PROMPT = (
    "Bạn là trợ lý học tập AI Tutor. Chỉ trả lời dựa trên đoạn ngữ cảnh được cung cấp. "
    "Nếu ngữ cảnh không đủ để trả lời, hãy nói rõ là không tìm thấy thông tin trong tài liệu, "
    "không được bịa thông tin. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt."
)


def answer_question(document_id: str, question: str) -> dict:
    start = time.time()

    chunks = retrieve_relevant_chunks(document_id, question, top_k=4)

    if not chunks:
        return {
            "answer": "Xin lỗi, tôi không tìm thấy nội dung phù hợp trong tài liệu để trả lời câu hỏi này.",
            "sources": [],
            "response_time_ms": int((time.time() - start) * 1000),
        }

    context = "\n\n".join(f"[Trang {c['page']}]\n{c['text']}" for c in chunks)

    message = _llm_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Ngữ cảnh từ tài liệu:\n{context}\n\nCâu hỏi: {question}",
            }
        ],
    )

    answer_text = "".join(block.text for block in message.content if block.type == "text")

    return {
        "answer": answer_text,
        "sources": [{"page": c["page"], "snippet": c["text"][:160]} for c in chunks],
        "response_time_ms": int((time.time() - start) * 1000),
    }
