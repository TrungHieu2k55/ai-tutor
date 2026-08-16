# 🎓 AI Tutor - Gia Sư & Trợ Lý Học Tập AI 24/7

Nền tảng Gia sư & Trợ lý học tập thông minh dựa trên kỹ thuật **RAG (Retrieval-Augmented Generation)** kết hợp cùng Mô hình ngôn ngữ lớn (LLM). Hệ thống giúp sinh viên tra cứu, hỏi đáp trực tiếp dựa trên nội dung tài liệu (PDF, DOCX, TXT), tự động trích xuất câu hỏi ôn tập và nguồn tham chiếu chuẩn xác.

---

## ✨ 🚀 Tính năng nổi bật

### 1. 👨‍🎓 Dành cho Sinh viên (Student)
- **Tải lên & Quản lý Tài liệu**: Hỗ trợ upload file tài liệu học tập (PDF, Word, Text), tự động trích xuất nội dung và phân chia văn bản (Chunking).
- **Hỏi đáp RAG Thông minh**: Hỏi bất kỳ câu hỏi nào liên quan đến tài liệu, hệ thống tự động tìm kiếm đoạn văn bản liên quan nhất trong **Vector Database (ChromaDB)** và đưa ra câu trả lời cùng số trang tham chiếu.
- **Quản lý Hội thoại**: Lưu vết lịch sử chat theo từng tài liệu, tạo mới cuộc trò chuyện hoặc xóa lịch sử dễ dàng.
- **Hồ sơ Cá nhân & Avatar**: Cho phép cập nhật thông tin cá nhân, tải ảnh đại diện trực tiếp lên **Cloudinary** và đổi mật khẩu an toàn.

### 2. 🛡️ Dành cho Quản trị viên (Admin Dashboard)
- **Tổng quan Hệ thống**: Thống kê tổng số lượng người dùng, số tài liệu đã được index, số câu hỏi đã xử lý và dung lượng lưu trữ.
- **Quản lý Người dùng**: Xem danh sách, tìm kiếm, thêm mới, chỉnh sửa thông tin, bật/tắt kích hoạt tài khoản hoặc phân quyền (`Student` / `Admin`).
- **Quản lý Tài liệu Toàn hệ thống**: Xem và xóa các tài liệu vi phạm hoặc lỗi trên hệ thống.
- **Giám sát AI & Nhật ký**: Xem số lượng token đã tiêu thụ và lịch sử truy vấn gần đây.

---

## 🏗️ 🛠️ Công nghệ Sử dụng (Tech Stack)

### Backend (FastAPI - Clean Architecture)
- **Framework**: Python 3.12, [FastAPI](https://fastapi.tiangolo.com/)
- **Database & ODM**: MongoDB Atlas + [Beanie ODM](https://beanie-odm.dev/) (Async Motor Driver)
- **Vector Database**: [ChromaDB](https://www.trychroma.com/) (Lưu trữ Vector Embeddings)
- **Bảo mật & Phân quyền**: JWT (PyJWT), Bcrypt (Passlib), Phân quyền RBAC (Role-Based Access Control)
- **Lưu trữ Ảnh**: [Cloudinary SDK](https://cloudinary.com/) (Upload stream ảnh đại diện)
- **LLM Pipeline**: Integration với các model LLMs hàng đầu (DeepSeek / Gemini / Claude)

### Frontend (React + Vite)
- **Core**: React 18, Vite
- **UI Component Library**: [Ant Design 5 (antd)](https://ant.design/)
- **State Management & Routing**: React Context API (`AuthContext`), React Router DOM v6
- **HTTP Client**: Axios (Cấu hình Interceptor đính kèm JWT Bearer token)

---

## 🗂️ 📂 Cấu trúc Dự án Clean Architecture

```text
ai-tutor-project/
├── backend/                  # Mã nguồn FastAPI Backend
│   ├── src/
│   │   ├── config/           # Cấu hình môi trường (.env), kết nối DB & Security
│   │   ├── models/           # Định nghĩa Beanie Document Models (User, Document, Conversation, Message)
│   │   ├── validations/      # Pydantic DTOs & Validation Schemas
│   │   ├── providers/        # Dịch vụ bên thứ 3 (Cloudinary, Vector Store ChromaDB)
│   │   ├── services/         # Tầng xử lý nghiệp vụ chính (Auth, Document, Chat RAG, Admin)
│   │   ├── middlewares/      # Middleware phân quyền RBAC & dependency injection
│   │   ├── controllers/      # Tầng HTTP API Routers (Auth, Document, Chat, Admin)
│   │   └── main.py           # Entrypoint ứng dụng FastAPI
│   ├── .env.example          # Mẫu khai báo biến môi trường Backend
│   └── requirements.txt      # Danh sách thư viện Python
│
├── frontend/                 # Mã nguồn React Frontend
│   ├── src/
│   │   ├── api/              # Cấu hình Axios Client gọi API Backend
│   │   ├── components/       # Các UI Component dùng chung (Sidebar, ProfileModal, ProtectedRoute, Toast)
│   │   ├── lib/              # AuthContext quản lý trạng thái đăng nhập
│   │   ├── pages/            # Các trang giao diện (LoginPage, LibraryPage, ChatPage, Admin Pages)
│   │   ├── utils/            # Helper formatters & validators
│   │   └── App.jsx           # Cấu hình điều hướng routes chính
│   └── vercel.json           # Cấu hình SPA Routing khi deploy lên Vercel
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## ⚡ ⚙️ Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Chuẩn bị Môi trường
- Python >= 3.10
- Node.js >= 18.x
- MongoDB Atlas Connection String

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo venv (tùy chọn nhưng khuyên dùng)
python -m venv .venv

# Kích hoạt venv (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Tạo file .env từ file mẫu và cấu hình thông số
cp .env.example .env
```

**Khởi chạy Backend Server:**
```bash
uvicorn src.main:app --reload --port 8000
```
> Server sẽ khởi chạy tại: `http://localhost:8000`. Tài liệu API Swagger UI xem tại: `http://localhost:8000/docs`.

---

### 3. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói npm
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
> Web ứng dụng sẽ khởi chạy tại: `http://localhost:5173`.

---

## 🔑 🗝️ Tài khoản Đăng nhập Mặc định

Hệ thống sẽ tự động khởi tạo tài khoản **Admin mặc định** trong lần chạy đầu tiên:

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@aitutor.vn` | `admin123` |
| **Sinh viên (Student)** | Đăng ký tự do tại màn hình Login hoặc dùng tính năng Thêm người dùng từ Admin |

---

## 📄 📜 
Đồ án / Dự án được phát triển phục vụ mục đích học tập và nghiên cứu ứng dụng AI trong Giáo dục.
