import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Form, Input, Typography } from "antd";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";
import tutorBanner from "~/assets/tutor_banner.jpg";
import { useAuth } from "~/lib/AuthContext";
import { EMAIL_REGEX, PASSWORD_REGEX } from "~/utils/validators";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, loading: authLoading, login, register } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/library"} replace />;
  }


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
    <div className="login-container">
      {/* Panel Hero Banner với Ảnh Gia Sư (Tự động responsive / Ẩn trên Mobile) */}
      <div
        className="login-banner-panel"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(14, 27, 46, 0.4) 0%, rgba(15, 23, 42, 0.25) 100%), url(${tutorBanner})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        {/* Vệt sáng ambient trang trí */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "rgba(47, 111, 237, 0.35)",
            filter: "blur(80px)",
            top: -80,
            left: -80,
            pointerEvents: "none",
          }}
        />

        {/* Header & Nội dung chữ hiệu ứng */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <Flex align="center" gap={14} style={{ marginBottom: 36 }}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "linear-gradient(135deg, #2F6FED 0%, #1D4ED8 100%)",
                boxShadow: "0 8px 20px rgba(47, 111, 237, 0.4)",
                padding: 4,
              }}
            >
              <img
                src={aiTutorLogo}
                alt="AI Tutor Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
            </Flex>
            <div>
              <Title level={3} style={{ color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
                AI Tutor
              </Title>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
                Gia Sư & Trợ Lý Học Tập 24/7
              </Text>
            </div>
          </Flex>

          {/* Tiêu đề hiệu ứng Gradient Chữ Ánh Kim / Xanh */}
          <Title
            level={1}
            style={{
              fontSize: 38,
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: 8,
              marginBottom: 20,
              color: "#FFFFFF",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.7)",
            }}
          >
            Học tập hiệu quả cùng Gia Sư AI cá nhân
          </Title>

          <Text style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 1.7, display: "block", maxWidth: 520, marginBottom: 32, textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)", fontWeight: 500 }}>
            Hỏi đáp bài tập, ôn luyện kiến thức và tra cứu tài liệu dễ dàng như đang trao đổi trực tiếp cùng gia sư.
          </Text>

          {/* Danh sách thẻ tính năng hiệu ứng Glassmorphism */}
          <Flex vertical gap={14} style={{ maxWidth: 460 }}>
            {[
              { icon: "👩‍🏫", title: "Hướng dẫn & giải đáp bài tập chi tiết" },
              { icon: "📚", title: "Tra cứu & ôn tập đúng chương trình học" },
              { icon: "🎯", title: "Tự động tạo câu hỏi & bài tập trắc nghiệm" },
            ].map((item, idx) => (
              <Flex
                key={idx}
                align="center"
                gap={14}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "12px 20px",
                  borderRadius: 14,
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{item.title}</Text>
              </Flex>
            ))}
          </Flex>
        </div>


      </div>

      {/* Form đăng nhập / đăng ký (Nằm bên PHẢI, tự động toàn màn hình khi trên Mobile) */}
      <div className="login-form-panel">
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
                <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" size="large" />
              </Form.Item>
            )}

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { pattern: EMAIL_REGEX, message: "Email không đúng định dạng" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="ban@vku.udn.vn" size="large" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { pattern: PASSWORD_REGEX, message: "Mật khẩu phải từ 6 ký tự trở lên" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {mode === "login" ? "Đăng nhập" : "Đăng ký"}
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
      </div>
    </div>
  );
}
