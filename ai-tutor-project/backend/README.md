# AI Tutor — Boilerplate (FastAPI + MongoDB + RAG)

Bộ code base khởi đầu cho đề tài **"AI Tutor — Nền tảng học tập ứng dụng RAG"**.
Đã dựng sẵn: xác thực người dùng (JWT), upload & xử lý tài liệu (PDF/DOCX),
pipeline chunking + embedding + vector database (ChromaDB), và API hỏi-đáp
theo cơ chế RAG có trích dẫn nguồn. Dùng **MongoDB** (qua ODM **Beanie**) làm
database chính.

## Cấu trúc thư mục

```
src/
  main.py                  # Entry point FastAPI
  core/
    config.py               # Đọc biến môi trường (.env)
    security.py              # Hash mật khẩu, tạo/giải mã JWT
  db/
    database.py              # Kết nối MongoDB (Motor) + khởi tạo Beanie
    models.py                 # User, Document, Conversation, Message (Beanie Documents)
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
- MongoDB >= 6.0 (local hoặc MongoDB Atlas — dịch vụ cloud miễn phí, khuyến khích nếu máy bạn khó cài MongoDB local)
- (Tuỳ chọn) API key của nhà cung cấp LLM để gọi mô hình sinh câu trả lời

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Mở .env và điền MONGODB_URL, JWT_SECRET_KEY, ANTHROPIC_API_KEY...
```

### Chạy MongoDB

**Cách 1 — cài local (Windows/Mac/Linux):**
Tải và cài từ trang chủ MongoDB Community: https://www.mongodb.com/try/download/community
Sau khi cài, service MongoDB tự chạy ở `mongodb://localhost:27017` (đúng giá trị mặc định trong `.env.example`).

**Cách 2 — dùng Docker (nhanh, không cần cài đặt phức tạp):**
```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

**Cách 3 — MongoDB Atlas (cloud, miễn phí, không cần cài gì trên máy):**
Tạo cluster free tại https://www.mongodb.com/cloud/atlas, lấy connection string,
dán vào `MONGODB_URL` trong `.env` (dạng `mongodb+srv://...`).

### Chạy server

```bash
uvicorn src.main:app --reload
```

Server chạy tại: http://localhost:8000
Swagger UI (test API trực tiếp): http://localhost:8000/docs

## Luồng hoạt động (đúng kiến trúc RAG đã thiết kế)

1. `POST /auth/register`, `POST /auth/login` — đăng ký/đăng nhập, nhận JWT token
2. `POST /documents/upload` — tải tài liệu lên; hệ thống chạy nền: trích xuất nội dung → chia nhỏ văn bản (chunking) → tạo embedding → lưu vào Vector Database
3. `GET /documents/` — xem danh sách tài liệu và trạng thái xử lý (processing/indexed/failed)
4. `POST /chat/ask` — đặt câu hỏi về 1 tài liệu; hệ thống truy xuất các đoạn liên quan nhất (semantic retrieval) rồi đưa cho LLM sinh câu trả lời kèm trích dẫn trang nguồn

## ⚠️ Lưu ý quan trọng khi chạy lần đầu

`vector_store.py` dùng embedding function mặc định của ChromaDB — **lần đầu tiên
gọi `index_chunks()`, thư viện sẽ tự tải 1 model ONNX (~80MB) từ internet** về
`~/.cache/chroma/`. Nếu máy bạn:
- Có internet bình thường → chỉ cần chờ vài giây ở lần upload tài liệu đầu tiên, các lần sau sẽ nhanh vì đã cache.
- Ở mạng công ty/trường có tường lửa chặn → tài liệu sẽ báo trạng thái `failed`. Xem log server (`logger.exception` trong `documents.py`) để xác nhận đúng nguyên nhân.

## Đã kiểm thử

- ✅ Toàn bộ module import thành công, routes đăng ký đúng (`/auth/*`, `/documents/*`, `/chat/*`)
- ✅ Đã test thật với PostgreSQL ở bản trước (auth, upload) — khi chuyển MongoDB, phần logic nghiệp vụ giữ nguyên, chỉ đổi lớp truy xuất dữ liệu
- ⚠️ **Chưa test được với MongoDB thật** trong quá trình phát triển bộ khung này (môi trường phát triển không cài được MongoDB service) — bạn là người đầu tiên chạy thật với MongoDB, nếu gặp lỗi khi `insert()`/`find()`/`save()` ở bất kỳ route nào, khả năng cao nằm ở `db/models.py` hoặc `db/database.py`, báo lại để mình sửa tiếp
