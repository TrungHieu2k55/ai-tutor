# AI Tutor — Frontend (React + Vite + Tailwind)

Giao diện người dùng cho nền tảng AI Tutor, kết nối trực tiếp tới `backend/` (FastAPI)
qua đường dẫn `/api` (được Vite proxy sang `http://localhost:8000`).

## Cấu trúc

```
src/
  main.jsx              # Entry point
  App.jsx                # Định nghĩa routes
  pages/
    LoginPage.jsx          # Đăng nhập / Đăng ký
    LibraryPage.jsx         # Thư viện tài liệu (upload + danh sách)
    ChatPage.jsx              # Trò chuyện hỏi-đáp với AI (có trích dẫn nguồn)
    ProgressPage.jsx           # Tiến độ học tập
  components/
    Sidebar.jsx              # Sidebar dùng chung
    ProtectedRoute.jsx         # Chặn truy cập khi chưa đăng nhập
  api/client.js             # Axios client + các hàm gọi API backend
  lib/AuthContext.jsx        # Quản lý trạng thái đăng nhập (JWT lưu localStorage)
```

## Cài đặt & chạy

```bash
npm install
npm run dev
```

Mặc định chạy tại `http://localhost:5173`. Cần chạy `backend/` song song ở
`http://localhost:8000` để các API hoạt động (xem `backend/README.md`).

## Đồng bộ thiết kế

Bảng màu trong `tailwind.config.js` (navy `#0E1B2E`, accent `#2F6FED`, nền `#F3F6FB`)
lấy đúng theo bản thiết kế Figma "tech blue, trustworthy" đã chốt.

## Việc cần làm tiếp

- [ ] Trang Admin (Tổng quan, Người dùng, Tài liệu, Giám sát AI) — đã có thiết kế Figma, backend cần bổ sung route trước
- [ ] Backend cần thêm endpoint `GET /progress` để trang Tiến độ học tập hiển thị dữ liệu thật (hiện đang tính tạm từ danh sách tài liệu)
- [ ] Toast/thông báo lỗi rõ ràng hơn thay vì chỉ hiển thị text đỏ
- [ ] Loading skeleton khi tải danh sách tài liệu
