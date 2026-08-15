import { LockOutlined, MailOutlined, KeyOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { authApi } from "~/api/client";
import { useToast } from "~/components/Toast";
import { EMAIL_REGEX, PASSWORD_REGEX } from "~/utils/validators";

const { Text } = Typography;

export default function ForgotPasswordModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();
  const toast = useToast();

  function handleCancel() {
    setStep(1);
    form.resetFields();
    resetForm.resetFields();
    onClose?.();
  }

  async function handleSendCode(values) {
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email: values.email });
      setEmail(values.email);
      resetForm.resetFields();
      toast?.success(data.detail || "Mã xác nhận đã được gửi tới email của bạn!");
      setStep(2);
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(values) {
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({
        email,
        reset_token: values.reset_token,
        new_password: values.new_password,
      });
      toast?.success(data.detail || "Đổi mật khẩu thành công!");
      handleCancel();
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Đặt lại mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Quên mật khẩu"
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={400}
    >
      {step === 1 ? (
        <Form form={form} layout="vertical" onFinish={handleSendCode} style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
            Nhập email tài khoản của bạn để nhận mã đặt lại mật khẩu qua Email.
          </Text>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập Email" },
              { pattern: EMAIL_REGEX, message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="ban@gmail.com" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 8 }}>
            Gửi mã xác nhận
          </Button>
        </Form>
      ) : (
        <Form form={resetForm} layout="vertical" onFinish={handleResetPassword} style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
            Vui lòng kiểm tra Hộp thư Email <Text strong>{email}</Text> và nhập mã 6 số cùng mật khẩu mới.
          </Text>
          <Form.Item
            label="Mã đặt lại mật khẩu"
            name="reset_token"
            rules={[{ required: true, message: "Vui lòng nhập mã" }]}
          >
            <Input prefix={<KeyOutlined />} placeholder="Nhập mã 6 số từ Email" size="large" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="new_password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { pattern: PASSWORD_REGEX, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 8 }}>
            Đặt lại mật khẩu
          </Button>
        </Form>
      )}
    </Modal>
  );
}
