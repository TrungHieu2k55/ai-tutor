import { Card, Col, Flex, Row, Skeleton, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { adminApi } from "~/api/client";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers(),
        ]);
        setStats(statsRes.data);
        const uData = usersRes.data;
        setUsers(Array.isArray(uData) ? uData : (uData?.items || []));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  const columns = [
    {
      title: "Tên",
      dataIndex: "full_name",
      key: "full_name",
      render: (name) => (
        <Text strong style={{ fontSize: 13 }}>{name}</Text>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (e) => <Text style={{ fontSize: 13 }}>{e}</Text>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "blue" : "default"}>
          {role === "admin" ? "Quản trị" : "Sinh viên"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) => (
        <Tag
          color={active ? "green" : "red"}
          style={{ borderRadius: 12, fontSize: 12, padding: "2px 10px" }}
        >
          {active ? "Hoạt động" : "Đã khoá"}
        </Tag>
      ),
    },
  ];

  const statCards = stats
    ? [
        { label: "Người dùng", value: stats.total_users, extra: `+${stats.new_users_week}` },
        { label: "Tài liệu đã tải", value: stats.total_documents, extra: `${stats.indexed_count} indexed` },
        { label: "Câu hỏi đã xử lý", value: stats.total_messages, extra: null },
        { label: "Dung lượng dùng", value: stats.storage_gb, unit: "GB" },
      ]
    : [];

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px" }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Tổng quan hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Theo dõi hoạt động và tình trạng nền tảng AI Tutor</Text>
        </div>

        {/* Stat cards */}
        <Row gutter={[16, 16]}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                  <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                  </Card>
                </Col>
              ))
            : statCards.map((s, i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                  <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                    <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: "#1A2233" }}>
                        {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                      </span>
                      {s.unit && (
                        <Text style={{ fontSize: 16, fontWeight: 600, color: "#1A2233" }}>{s.unit}</Text>
                      )}
                      {s.extra && (
                        <Text style={{ fontSize: 12, color: "#2F6FED" }}>{s.extra}</Text>
                      )}
                    </Flex>
                  </Card>
                </Col>
              ))}
        </Row>

        {/* Người dùng gần đây */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Người dùng gần đây</Text>}
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={(Array.isArray(users) ? users : []).slice(0, 10).map((u) => ({ ...u, key: u.id }))}
            columns={columns}
            pagination={false}
            size="middle"
            loading={loading}
            style={{ fontSize: 13 }}
          />

        </Card>
      </Flex>
    </Flex>
  );
}
