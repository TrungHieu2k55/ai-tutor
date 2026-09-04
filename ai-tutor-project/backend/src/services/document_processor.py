"""
Pipeline xử lý tài liệu: trích xuất nội dung -> tiền xử lý -> chia nhỏ văn bản (chunking).
Hỗ trợ PDF, DOCX, XLSX, TXT. Mỗi chunk giữ lại số trang/vị trí gốc để phục vụ trích dẫn nguồn.
"""

import logging
import re
import unicodedata
from dataclasses import dataclass

import pdfplumber
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)

LIGATURES_MAP = {
    "\ufb00": "ff",
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
    "\ufb05": "ft",
    "\ufb06": "st",
    "\u00a0": " ",  # non-breaking space
    "\u00ad": "",   # soft hyphen
    "\u200b": "",   # zero-width space
    "\u200c": "",   # zero-width non-joiner
    "\u200d": "",   # zero-width joiner
    "\ufeff": "",   # BOM
}


def clean_extracted_text(text: str) -> str:
    """
    Chuẩn hóa văn bản trích xuất:
    1. Chuẩn hóa Unicode NFC (tiếng Việt dựng sẵn, khắc phục lỗi rớt dấu, tổ hợp NFD).
    2. Thay thế typographic ligatures và ký tự ẩn trong PDF.
    3. Nối các từ bị ngắt dòng do gạch nối (line-wrap hyphenation).
    4. Khử các ký tự điều khiển lạ.
    5. Chuẩn hóa khoảng trắng.
    """
    if not text:
        return ""

    # 1. Unicode NFC
    text = unicodedata.normalize("NFC", str(text))

    # 2. Ligatures & ký tự ẩn
    for char, replacement in LIGATURES_MAP.items():
        text = text.replace(char, replacement)

    # 3. Loại bỏ ký tự điều khiển (trừ \n, \t, \r)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # 4. Nối các từ bị gãy dòng có gạch nối
    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)

    # 5. Chuẩn hóa xuống dòng
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 6. Dọn dẹp khoảng trắng trên từng dòng
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    cleaned_lines = []
    for line in lines:
        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


@dataclass
class TextChunk:
    text: str
    page: int | None
    chunk_index: int


def extract_text_from_pdf(file_path: str) -> list[tuple[str, int]]:
    """Trả về danh sách (nội_dung_trang, số_trang)."""
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            raw_text = page.extract_text() or ""
            cleaned = clean_extracted_text(raw_text)
            if cleaned:
                pages.append((cleaned, i))
    return pages


def extract_text_from_docx(file_path: str) -> list[tuple[str, int]]:
    doc = DocxDocument(file_path)
    raw_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    cleaned = clean_extracted_text(raw_text)
    return [(cleaned, 1)] if cleaned else []


def extract_text_from_xlsx(file_path: str) -> list[tuple[str, int]]:
    """Trích xuất text từ tất cả các sheet trong file Excel."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(file_path, data_only=True)
        sheets_data = []
        for idx, sheet_name in enumerate(wb.sheetnames, start=1):
            sheet = wb[sheet_name]
            lines = []
            for row in sheet.iter_rows(values_only=True):
                row_vals = [str(val).strip() for val in row if val is not None and str(val).strip()]
                if row_vals:
                    lines.append(" | ".join(row_vals))
            if lines:
                sheet_text = f"--- Sheet: {sheet_name} ---\n" + "\n".join(lines)
                cleaned = clean_extracted_text(sheet_text)
                if cleaned:
                    sheets_data.append((cleaned, idx))
        return sheets_data
    except Exception as e:
        logger.error("Lỗi trích xuất file XLSX (%s): %s", file_path, str(e))
        return []


def extract_text_from_txt(file_path: str) -> list[tuple[str, int]]:
    """Trích xuất nội dung từ file văn bản thuần (.txt)."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    text = ""
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                text = f.read()
            break
        except UnicodeDecodeError:
            continue
    cleaned = clean_extracted_text(text)
    return [(cleaned, 1)] if cleaned else []


def chunk_text(text: str, page: int | None, chunk_size: int = 800, overlap: int = 120) -> list[TextChunk]:
    """
    Chia văn bản thành các đoạn ~chunk_size ký tự tại ranh giới câu hoặc từ,
    có overlap để không mất ngữ cảnh ở ranh giới và tránh cắt ngang chữ.
    """
    if not text:
        return []

    chunks: list[TextChunk] = []
    start = 0
    idx = 0
    n = len(text)

    while start < n:
        end = start + chunk_size
        if end >= n:
            chunk_str = text[start:].strip()
            if chunk_str:
                chunks.append(TextChunk(text=chunk_str, page=page, chunk_index=idx))
            break

        # Tìm ranh giới ngắt câu hoặc từ thích hợp trong khoảng [end - 100, end]
        split_pos = -1
        for sep in ("\n\n", ".\n", ". ", "? ", "! ", "\n"):
            pos = text.rfind(sep, max(start, end - 100), end)
            if pos != -1:
                split_pos = pos + len(sep)
                break

        # Nếu không có dấu câu, tìm dấu cách để không cắt đôi từ
        if split_pos == -1:
            pos = text.rfind(" ", max(start, end - 80), end)
            if pos != -1:
                split_pos = pos + 1
            else:
                split_pos = end

        chunk_str = text[start:split_pos].strip()
        if chunk_str:
            chunks.append(TextChunk(text=chunk_str, page=page, chunk_index=idx))
            idx += 1

        start = max(start + 1, split_pos - overlap)

    return chunks


def process_document(file_path: str, file_type: str) -> list[TextChunk]:
    """Điểm vào chính của pipeline: đọc file -> trích xuất -> chunk toàn bộ tài liệu."""
    ft = file_type.lower()
    if ft == "pdf":
        pages = extract_text_from_pdf(file_path)
    elif ft == "docx":
        pages = extract_text_from_docx(file_path)
    elif ft == "xlsx":
        pages = extract_text_from_xlsx(file_path)
    elif ft == "txt":
        pages = extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Định dạng chưa được hỗ trợ: {file_type}")

    all_chunks: list[TextChunk] = []
    global_idx = 0
    for text, page_num in pages:
        page_chunks = chunk_text(text, page_num)
        for pc in page_chunks:
            pc.chunk_index = global_idx
            global_idx += 1
        all_chunks.extend(page_chunks)
    return all_chunks

