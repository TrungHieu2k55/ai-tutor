"""
Quản lý Vector Database (ChromaDB, lưu local) — nơi lưu embedding của các đoạn tài liệu
và thực hiện truy xuất ngữ nghĩa (semantic retrieval) khi người dùng đặt câu hỏi.
"""

import chromadb
from chromadb.utils import embedding_functions

from src.core.config import settings
from src.services.document_processor import TextChunk

_client = chromadb.PersistentClient(path=settings.VECTOR_DB_PATH)

# Có thể thay bằng embedding function gọi API ngoài (OpenAI/Voyage/Anthropic) tuỳ nhà cung cấp bạn chọn
_embedding_fn = embedding_functions.DefaultEmbeddingFunction()


def _get_collection(document_id: str):
    return _client.get_or_create_collection(
        name=f"doc_{document_id}", embedding_function=_embedding_fn
    )


def index_chunks(document_id: str, chunks: list[TextChunk]) -> None:
    """Tạo embedding và lưu toàn bộ chunk của 1 tài liệu vào vector DB."""
    if not chunks:
        return
    collection = _get_collection(document_id)
    collection.add(
        ids=[f"{document_id}_{c.chunk_index}" for c in chunks],
        documents=[c.text for c in chunks],
        metadatas=[{"page": c.page or 0, "chunk_index": c.chunk_index} for c in chunks],
    )


def retrieve_relevant_chunks(document_id: str, question: str, top_k: int = 4) -> list[dict]:
    """Truy xuất các đoạn văn bản liên quan nhất đến câu hỏi (semantic retrieval)."""
    collection = _get_collection(document_id)
    results = collection.query(query_texts=[question], n_results=top_k)

    matches = []
    for text, meta in zip(results["documents"][0], results["metadatas"][0]):
        matches.append({"text": text, "page": meta.get("page")})
    return matches


def delete_document_index(document_id: str) -> None:
    _client.delete_collection(name=f"doc_{document_id}")
