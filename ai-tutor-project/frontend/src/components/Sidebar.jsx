import { BookOutlined, CrownOutlined, DeleteOutlined, LineChartOutlined, LogoutOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Flex, Menu, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";
import { useAuth } from "~/lib/AuthContext";
import ProfileModal from "./ProfileModal";

const { Text } = Typography;

export default function Sidebar({
  documents = [],
  activeDocumentId,
  onSelectDocument,
  chatHistory = [],
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = user?.full_name || "Sinh viên";
  const userEmail = user?.email || "";
  const userRole = user?.role === "admin" ? "Quản trị viên" : "Sinh viên";

  const navItems = [
    { key: "/library", icon: <BookOutlined />, label: "Thư viện tài liệu" },
    { key: "/progress", icon: <LineChartOutlined />, label: "Tiến độ học tập" },
    ...(user?.role === "admin" ? [{ key: "/admin", icon: <CrownOutlined />, label: "Trang quản trị" }] : []),
  ];

  const docMenuItems = documents.length > 0
    ? [
      {
        type: "group", label: "TÀI LIỆU ĐÃ TẢI", children: documents.map((doc) => ({
          key: `doc-${doc.id}`,
          label: <Text ellipsis style={{ color: "inherit", maxWidth: 160 }}>{doc.file_name}</Text>,
          onClick: () => {
            onSelectDocument?.(doc);
            navigate(`/chat/${doc.id}`);
          },
        }))
      },
    ]
    : [];

  const historyMenuItems = chatHistory.length > 0
    ? [
      {
        type: "group",
        label: "LỊCH SỬ",
        children: chatHistory.map((h) => ({
          key: `history-${h.id}`,
          label: (
            <Flex align="center" justify="space-between" style={{ width: "100%" }}>
              <Text ellipsis style={{ color: "inherit", maxWidth: 135, fontSize: 13 }}>{h.title}</Text>
              <DeleteOutlined
                style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", padding: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation?.(h);
                }}
              />
            </Flex>
          ),
          onClick: () => onSelectConversation?.(h),
        })),
      },
    ]
    : [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Flex
      vertical
      style={{
        width: 256,
        flexShrink: 0,
        background: "#0E1B2E",
        height: "100vh",
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
          onClick={() => {
            onNewConversation?.();
            navigate("/library");
          }}
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
        items={[...navItems, ...docMenuItems]}
        onClick={({ key }) => {
          if (!key.startsWith("doc-")) navigate(key);
        }}
        style={{ background: "transparent", borderRight: "none", flex: "none" }}
      />

      {/* Lịch sử chat */}
      {historyMenuItems.length > 0 && (
        <div style={{ padding: "0 4px" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectable={false}
            items={historyMenuItems}
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
          <Avatar size={28} src={user?.avatar_url} style={{ backgroundColor: "#3A5686" }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.2 }}>{userRole}</div>
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
        user={user || {}}
      />

    </Flex>
  );
}
