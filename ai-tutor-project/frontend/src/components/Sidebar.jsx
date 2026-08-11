import { BookOutlined, LineChartOutlined, LogoutOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Flex, Menu, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";
import ProfileModal from "./ProfileModal";

const { Text } = Typography;

const NAV_ITEMS = [
  { key: "/library", icon: <BookOutlined />, label: "Thư viện tài liệu" },
  { key: "/progress", icon: <LineChartOutlined />, label: "Tiến độ học tập" },
];

export default function Sidebar({ documents = [], activeDocumentId, onSelectDocument, userName = "Sinh viên", chatHistory = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const docMenuItems = documents.length > 0
    ? [
      {
        type: "group", label: "TÀI LIỆU ĐÃ TẢI", children: documents.map((doc) => ({
          key: `doc-${doc.id}`,
          label: <Text ellipsis style={{ color: "inherit", maxWidth: 160 }}>{doc.file_name}</Text>,
          onClick: () => onSelectDocument?.(doc),
        }))
      },
    ]
    : [];

  function handleLogout() {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  return (
    <Flex
      vertical
      style={{
        width: 256,
        flexShrink: 0,
        background: "#0E1B2E",
        minHeight: "100vh",
      }}
    >
      {/* Logo */}
      <Flex align="center" gap={10} style={{ padding: "16px 16px 8px" }}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#2F6FED",
            flexShrink: 0,
            padding: 2,
          }}
        >
          <img
            src={aiTutorLogo}
            alt="AI Tutor Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </Flex>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>AI Tutor</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.2 }}>Học cùng tài liệu của bạn</div>
        </div>
      </Flex>

      {/* New chat button */}
      <div style={{ padding: "8px 12px 28px 12px" }}>
        <Button
          type="text"
          icon={<PlusOutlined />}
          block
          onClick={() => navigate("/library")}
          style={{
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            fontSize: 13,
            textAlign: "left",
            height: 36,
          }}
        >
          Cuộc trò chuyện mới
        </Button>
      </div>

      {/* Navigation + Documents */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname, ...(activeDocumentId ? [`doc-${activeDocumentId}`] : [])]}
        items={[...NAV_ITEMS, ...docMenuItems]}
        onClick={({ key }) => {
          if (!key.startsWith("doc-")) navigate(key);
        }}
        style={{ background: "transparent", borderRight: "none", flex: "none" }}
      />

      {/* Lịch sử */}
      {chatHistory.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectable={false}
            items={[
              {
                type: "group",
                label: "LỊCH SỬ",
                children: chatHistory.map((h, i) => ({
                  key: `history-${i}`,
                  label: <Text ellipsis style={{ color: "inherit", maxWidth: 160, fontSize: 13 }}>{h}</Text>,
                })),
              },
            ]}
            style={{ background: "transparent", borderRight: "none", flex: "none" }}
          />
        </div>
      )}

      {/* User profile + Logout */}
      <Flex
        align="center"
        gap={10}
        style={{
          marginTop: "auto",
          padding: 16,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Flex
          align="center"
          gap={10}
          onClick={() => setProfileOpen(true)}
          style={{ flex: 1, cursor: "pointer", borderRadius: 6, padding: "4px 0" }}
        >
          <Avatar size={28} style={{ backgroundColor: "#3A5686" }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.2 }}>Sinh viên</div>
          </div>
        </Flex>

        <Tooltip title="Đăng xuất">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4d4f")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          />
        </Tooltip>
      </Flex>

      {/* Profile popup */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{ full_name: userName, email: "an.nguyen@vku.edu.vn" }}
      />
    </Flex>
  );
}

