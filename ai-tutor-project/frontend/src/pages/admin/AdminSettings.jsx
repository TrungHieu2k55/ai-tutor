import { Flex, Typography } from "antd";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

export default function AdminSettings() {
  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px" }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Cài đặt</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý cài đặt hệ thống</Text>
        </div>

        <Text type="secondary">Trang cài đặt đang được phát triển...</Text>
      </Flex>
    </Flex>
  );
}
