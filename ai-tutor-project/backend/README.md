# AI Tutor — Boilerplate (FastAPI + PostgreSQL + RAG)

Bộ code base khởi đầu cho đề tài **"AI Tutor — Nền tảng học tập ứng dụng RAG"**.
Đã dựng sẵn: xác thực người dùng (JWT), upload & xử lý tài liệu (PDF/DOCX),
pipeline chunking + embedding + vector database (ChromaDB), và API hỏi-đáp
theo cơ chế RAG có trích dẫn nguồn.

## Cấu trúc thư mục

```
src/
  main.py                  # Entry point FastAPI
  core/
    config.py               # Đọc biến môi trường (.env)
    security.py              # Hash mật khẩu, tạo/giải mã JWT
  db/
    database.py              # Kết nối PostgreSQL (SQLAlchemy async)
    models.py                 # User, Document, Conversation, Message
  schemas/                   # Pydantic schemas (request/response)
  services/
    document_processor.py     # Trích xuất + chunking tài liệu
    vector_store.py            # Embedding + ChromaDB (semantic retrieval)
    rag_pipeline.py             # Kết hợp retrieval + gọi LLM sinh câu trả lời
  api/
    deps.py                    # Dependency lấy user hiện tại từ token
    routes/
      auth.py                   # /auth/register, /auth/login
      documents.py               # /documents/upload, /documents/
      chat.py                     # /chat/ask
```

## Yêu cầu

- Python >= 3.10
- PostgreSQL >= 14
- (Tuỳ chọn) API key của nhà cung cấp LLM để gọi mô hình sinh câu trả lời

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Mở .env và điền DATABASE_URL, JWT_SECRET_KEY, ANTHROPIC_API_KEY...

# Tạo database PostgreSQL trước (ví dụ dùng psql hoặc pgAdmin)
createdb ai_tutor

uvicorn src.main:app --reload
```

Server chạy tại: http://localhost:8000
Swagger UI (test API trực tiếp): http://localhost:8000/docs

## Luồng hoạt động (đúng kiến trúc RAG đã thiết kế)

1. `POST /auth/register`, `POST /auth/login` — đăng ký/đăng nhập, nhận JWT token
2. `POST /documents/upload` — tải tài liệu lên; hệ thống chạy nền: trích xuất nội dung → chia nhỏ văn bản (chunking) → tạo embedding → lưu vào Vector Database
3. `GET /documents/` — xem danh sách tài liệu và trạng thái xử lý (processing/indexed/failed)
4. `POST /chat/ask` — đặt câu hỏi về 1 tài liệu; hệ thống truy xuất các đoạn liên quan nhất (semantic retrieval) rồi đưa cho LLM sinh câu trả lời kèm trích dẫn trang nguồn


