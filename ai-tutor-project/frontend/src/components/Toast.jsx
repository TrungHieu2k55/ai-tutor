import { message, notification } from "antd";
import { createContext, useContext } from "react";

const ToastContext = createContext(null);

/**
 * Sử dụng:
 *   const toast = useToast();
 *   toast.success("Đã lưu thành công!");
 *   toast.error("Không thể tải tài liệu.");
 *   toast.info("Đang xử lý...");
 *   toast.warning("Dung lượng file quá lớn.");
 *
 *   // Dùng notification (hiển thị góc phải, có tiêu đề):
 *   toast.notify("success", "Upload thành công", "Tài liệu đã được lập chỉ mục.");
 */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [messageApi, messageHolder] = message.useMessage();
  const [notificationApi, notificationHolder] = notification.useNotification();

  const api = {
    // Message nhanh (thanh nhỏ ở đỉnh trang)
    success: (msg) => messageApi.success(msg),
    error: (msg) => messageApi.error(msg),
    info: (msg) => messageApi.info(msg),
    warning: (msg) => messageApi.warning(msg),
    loading: (msg) => messageApi.loading(msg),

    // Notification chi tiết (góc trên bên phải, có tiêu đề + mô tả)
    notify: (type, title, description) =>
      notificationApi[type]?.({
        message: title,
        description,
        placement: "topRight",
        duration: 4,
      }),
  };

  return (
    <ToastContext.Provider value={api}>
      {messageHolder}
      {notificationHolder}
      {children}
    </ToastContext.Provider>
  );
}
