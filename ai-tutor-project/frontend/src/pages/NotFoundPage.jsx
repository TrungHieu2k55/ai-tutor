import { ArrowLeftOutlined, BookOutlined, HomeOutlined, RobotOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Result, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";

const { Title, Text } = Typography;

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        background: "#0E1B2E",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient glow effect */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(47, 111, 237, 0.15)",
          filter: "blur(80px)",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 20,
          background: "rgba(255, 255, 255, 0.98)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
          border: "none",
        }}
        styles={{ body: { padding: "48px 36px" } }}
      >
        <Flex vertical align="center" gap={20}>
          {/* Logo badge */}
          <Flex
            align="center"
            justify="center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2F6FED",
              padding: 4,
              boxShadow: "0 8px 24px rgba(47, 111, 237, 0.4)",
            }}
          >
            <img
              src={aiTutorLogo}
              alt="AI Tutor Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </Flex>

          {/* 404 Header */}
          <div>
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                background: "linear-gradient(135deg, #2F6FED 0%, #0E1B2E 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
                display: "block",
              }}
            >
              404
            </span>
            <Title level={3} style={{ marginTop: 12, marginBottom: 8, color: "#1A2233" }}>
              Trang không tồn tại
            </Title>
            <Text type="secondary" style={{ fontSize: 14, color: "#6B7A90", maxWidth: 400, display: "block" }}>
              Đường dẫn bạn truy cập có thể bị sai, đã bị xoá hoặc bạn không có quyền truy cập vào không gian này.
            </Text>
          </div>

          {/* Action buttons */}
          <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 12 }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<BookOutlined />}
              onClick={() => navigate("/library")}
              style={{
                borderRadius: 12,
                height: 48,
                fontSize: 14,
                fontWeight: 600,
                background: "#2F6FED",
                boxShadow: "0 4px 14px rgba(47, 111, 237, 0.35)",
              }}
            >
              Về Thư viện tài liệu
            </Button>

            <Flex gap={12} style={{ width: "100%" }}>
              <Button
                size="large"
                block
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ borderRadius: 12, height: 44, fontSize: 13 }}
              >
                Quay lại
              </Button>
              <Button
                size="large"
                block
                icon={<HomeOutlined />}
                onClick={() => navigate("/login")}
                style={{ borderRadius: 12, height: 44, fontSize: 13 }}
              >
                Đăng nhập
              </Button>
            </Flex>
          </Space>
        </Flex>
      </Card>
    </Flex>
  );
}
