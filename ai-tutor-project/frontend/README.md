# AI Tutor — Frontend (React + Ant Design)

Giao diện người dùng nền tảng AI Tutor được xây dựng bằng **React + Vite + Ant Design**

---

## 📁 Cấu trúc thư mục

```text
frontend/
├── jsconfig.json             # Cấu hình Path Alias (~/* -> ./src/*)
├── vite.config.js            # Cấu hình Vite bundler & Alias resolution
└── src/
    ├── main.jsx                  # Entry point, wrap ToastProvider & BrowserRouter
    ├── App.jsx                   # Định nghĩa tuyến đường (Student, Admin & 404 routes)
    ├── index.css                 # CSS Reset & Ant Design global overrides
    ├── api/
    │   └── client.js             # Axios client kết nối backend API
    ├── assets/
    │   └── ai_tutor.svg          # Logo ứng dụng (Trắng / Chuẩn SVG)
    ├── lib/
    │   └── AuthContext.jsx       # Quản lý trạng thái xác thực & JWT Token
    ├── components/
    │   ├── Sidebar.jsx           # Sidebar Học viên (+ Cuộc trò chuyện mới, Lịch sử, ProfileModal, Logout)
    │   ├── AdminSidebar.jsx      # Sidebar Quản trị viên
    │   ├── Toast.jsx             # Hệ thống thông báo (antd message & notification)
    │   ├── LoadingSkeleton.jsx   # Hiệu ứng nạp dữ liệu cho Card/List/Chat
    │   ├── ProfileModal.jsx      # Popup Hồ sơ cá nhân & Đổi mật khẩu
    │   └── ProtectedRoute.jsx    # Bảo vệ tuyến đường đăng nhập
    └── pages/
        ├── LoginPage.jsx         # Trang Đăng nhập / Đăng ký / Bypass Test Mode
        ├── LibraryPage.jsx       # Thư viện tài liệu (Drag & Drop upload)
        ├── ChatPage.jsx          # Khung chat hỏi-đáp AI (kèm Panel Nguồn trích dẫn & Tiến độ ôn tập)
        ├── ProgressPage.jsx      # Tiến độ học tập & thống kê
        ├── NotFoundPage.jsx      # Trang lỗi 404 giao diện hiện đại & nút điều hướng
        └── admin/
            ├── AdminDashboard.jsx # Tổng quan hệ thống & Người dùng gần đây
            ├── AdminDocuments.jsx # Tài liệu toàn hệ thống & Nhật ký câu hỏi AI
            ├── AdminUsers.jsx     # Quản lý danh sách người dùng & phân quyền
            ├── AdminAIMonitor.jsx # Giám sát pipeline AI (Model, VectorDB, LLM)
            └── AdminSettings.jsx  # Cài đặt hệ thống
```

---

## 🛠️ Cài đặt & Chạy ứng dụng

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy dev server
npm run dev
```

Ứng dụng mặc định chạy tại: `http://localhost:5173`.

---

