import {
  BarChartOutlined,
  FileTextOutlined,
  LeftOutlined,
  RobotOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar, Flex, Menu, Tag } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import aiTutorLogo from "~/assets/ai_tutor.svg";

const ADMIN_MENU_ITEMS = [
  { key: "/admin", icon: <BarChartOutlined />, label: "Tổng quan" },
  { key: "/admin/users", icon: <TeamOutlined />, label: "Người dùng" },
  { key: "/admin/documents", icon: <FileTextOutlined />, label: "Tài liệu" },
  { key: "/admin/ai-monitor", icon: <RobotOutlined />, label: "Giám sát AI" },
  { key: "/admin/settings", icon: <SettingOutlined />, label: "Cài đặt" },
];

export default function AdminSidebar({ adminName = "Admin" }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Flex
      vertical
      style={{
        width: 200,
        flexShrink: 0,
        background: "#0E1B2E",
        minHeight: "100vh",
      }}
    >
      {/* Logo + Admin badge */}
      <Flex align="center" gap={10} style={{ padding: "20px 20px 16px" }}>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>AI Tutor</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>Bảng quản trị</div>
        </div>
      </Flex>

      {/* Navigation */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={ADMIN_MENU_ITEMS}
        onClick={({ key }) => navigate(key)}
        style={{ background: "transparent", borderRight: "none", fontSize: 13 }}
      />

      {/* Quay lại chế độ Học viên */}
      <Flex
        align="center"
        gap={8}
        onClick={() => navigate("/library")}
        style={{
          marginTop: "auto",
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        <LeftOutlined style={{ fontSize: 10 }} />
        Quay lại chế độ Học viên
      </Flex>
    </Flex>
  );
}
