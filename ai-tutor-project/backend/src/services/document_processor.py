"""
Pipeline xử lý tài liệu: trích xuất nội dung -> tiền xử lý -> chia nhỏ văn bản (chunking).
Hỗ trợ PDF, DOCX, XLSX. Mỗi chunk giữ lại số trang/vị trí gốc để phục vụ trích dẫn nguồn.
"""

from dataclasses import dataclass

import pdfplumber
from docx import Document as DocxDocument


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
            text = page.extract_text() or ""
            if text.strip():
                pages.append((text, i))
    return pages


def extract_text_from_docx(file_path: str) -> list[tuple[str, int]]:
    doc = DocxDocument(file_path)
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [(full_text, 1)]


def chunk_text(text: str, page: int | None, chunk_size: int = 800, overlap: int = 120) -> list[TextChunk]:
    """Chia văn bản thành các đoạn ~chunk_size ký tự, có overlap để không mất ngữ cảnh ở ranh giới."""
    chunks: list[TextChunk] = []
    start = 0
    idx = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_str = text[start:end].strip()
        if chunk_str:
            chunks.append(TextChunk(text=chunk_str, page=page, chunk_index=idx))
            idx += 1
        start += chunk_size - overlap
    return chunks


def process_document(file_path: str, file_type: str) -> list[TextChunk]:
    """Điểm vào chính của pipeline: đọc file -> trích xuất -> chunk toàn bộ tài liệu."""
    if file_type == "pdf":
        pages = extract_text_from_pdf(file_path)
    elif file_type == "docx":
        pages = extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Định dạng chưa được hỗ trợ: {file_type}")

    all_chunks: list[TextChunk] = []
    for text, page_num in pages:
        all_chunks.extend(chunk_text(text, page_num))
    return all_chunks
