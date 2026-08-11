import { LockOutlined, MailOutlined, ThunderboltOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Form, Input, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";
import { useAuth } from "~/lib/AuthContext";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(values) {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(values.email, values.password);
      } else {
        await register(values.fullName, values.email, values.password);
      }
      navigate("/library");
    } catch (err) {
      setError(err.response?.data?.detail || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex style={{ minHeight: "100vh" }}>
      {/* Panel bên trái */}
      <Flex
        vertical
        justify="center"
        gap={16}
        style={{
          width: 420,
          flexShrink: 0,
          background: "#0E1B2E",
          padding: "0 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 256,
            height: 256,
            borderRadius: "50%",
            background: "rgba(47,111,237,0.2)",
            filter: "blur(48px)",
            bottom: -64,
            right: -40,
          }}
        />
        <Flex
          align="center"
          justify="center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#2F6FED",
            flexShrink: 0,
            padding: 3,
            position: "relative",
            zIndex: 10,
          }}
        >
          <img
            src={aiTutorLogo}
            alt="AI Tutor Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </Flex>
        <Title level={2} style={{ color: "#fff", margin: 0, position: "relative", zIndex: 10 }}>AI Tutor</Title>
        <Text style={{ color: "rgba(255,255,255,0.6)", maxWidth: 300, fontSize: 14, position: "relative", zIndex: 10 }}>
          Học cùng tài liệu của bạn — hỏi gì AI cũng tra cứu và trả lời kèm trích dẫn nguồn rõ ràng.
        </Text>
      </Flex>

      {/* Form đăng nhập / đăng ký */}
      <Flex flex={1} align="center" justify="center" style={{ padding: "0 40px" }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {mode === "login" ? "Tiếp tục vào không gian học tập của bạn" : "Bắt đầu học cùng AI Tutor"}
          </Text>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginTop: 16, marginBottom: 8 }} />
          )}

          <Form
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            requiredMark={false}
            style={{ marginTop: 20 }}
          >
            {mode === "register" && (
              <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                <Input prefix={<UserOutlined />} placeholder="Nguyễn An" size="large" />
              </Form.Item>
            )}

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="ban@truong.edu.vn" size="large" />
            </Form.Item>

            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {mode === "login" ? "Đăng nhập" : "Đăng ký"}
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="default"
                block
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  localStorage.setItem("access_token", "mock-token");
                  window.location.href = "/library";
                }}
              >
                Bỏ qua đăng nhập (Test UI Mode)
              </Button>
            </Form.Item>
          </Form>

          <Button
            type="link"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ padding: 0, fontSize: 12.5 }}
          >
            {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </Button>
        </div>
      </Flex>
    </Flex>
  );
}
