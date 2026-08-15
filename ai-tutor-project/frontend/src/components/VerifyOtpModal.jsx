import { KeyOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { authApi } from "~/api/client";
import { useToast } from "~/components/Toast";

const { Text } = Typography;

export default function VerifyOtpModal({ open, email, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [testOtp, setTestOtp] = useState("");
  const toast = useToast();

  async function handleVerify(values) {
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ email, otp_code: values.otp_code });
      toast?.success("Xác thực email thành công!");
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      onSuccess?.(data);
      onClose?.();
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { data } = await authApi.resendOtp({ email });
      toast?.success(data.detail || "Đã gửi lại mã OTP tới email của bạn!");
    } catch {
      toast?.error("Không thể gửi lại mã OTP.");
    } finally {
      setResending(false);
    }
  }

  return (
    <Modal
      title="Xác thực Email đăng ký"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
    >
      <Form layout="vertical" onFinish={handleVerify} style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
          Vui lòng kiểm tra Hộp thư Email <Text strong>{email}</Text> và nhập mã OTP 6 số để kích hoạt tài khoản.
        </Text>
        <Form.Item
          label="Mã OTP"
          name="otp_code"
          rules={[{ required: true, message: "Nhập mã OTP 6 số" }]}
        >
          <Input prefix={<KeyOutlined />} placeholder="Ví dụ: 123456" size="large" maxLength={6} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 8 }}>
          Xác thực & Hoàn tất
        </Button>

        <Button type="link" block onClick={handleResend} loading={resending} style={{ marginTop: 8, fontSize: 12.5 }}>
          Chưa nhận được mã? Gửi lại OTP
        </Button>
      </Form>
    </Modal>
  );
}
