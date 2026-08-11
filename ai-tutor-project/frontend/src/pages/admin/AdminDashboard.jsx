import { ArrowUpOutlined } from "@ant-design/icons";
import { Avatar, Card, Col, Flex, Row, Statistic, Table, Tag, Typography } from "antd";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

// Mock data khớp Figma
const MOCK_USERS = [
  { key: "1", name: "Nguyễn An", email: "an.nguyen@vku.edu.vn", joined: "12/03/2026", doc_count: 6, is_active: true },
  { key: "2", name: "Trần Bảo", email: "bao.tran@vku.edu.vn", joined: "18/03/2026", doc_count: 3, is_active: true },
  { key: "3", name: "Lê Minh Thư", email: "thu.le@vku.edu.vn", joined: "02/04/2026", doc_count: 11, is_active: true },
  { key: "4", name: "Phạm Quang", email: "quang.pham@vku.edu.vn", joined: "15/04/2026", doc_count: 1, is_active: false },
];

const columns = [
  {
    title: "Tên",
    dataIndex: "name",
    key: "name",
    render: (name) => (
      <Flex align="center" gap={10}>
        <Avatar style={{ backgroundColor: "#3A5686", fontSize: 13, flexShrink: 0 }} size={32}>
          {name.charAt(0)}
        </Avatar>
        <Text strong style={{ fontSize: 13 }}>{name}</Text>
      </Flex>
    ),
  },
  { title: "Email", dataIndex: "email", key: "email", render: (e) => <Text style={{ fontSize: 13 }}>{e}</Text> },
  { title: "Ngày tham gia", dataIndex: "joined", key: "joined", render: (d) => <Text style={{ fontSize: 13 }}>{d}</Text> },
  { title: "Số tài liệu", dataIndex: "doc_count", key: "doc_count", render: (n) => <Text style={{ fontSize: 13 }}>{n}</Text> },
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

export default function AdminDashboard() {
  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px" }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Tổng quan hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Theo dõi hoạt động và tình trạng nền tảng AI Tutor</Text>
        </div>

        {/* Stat cards — khớp Figma */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Người dùng</Text>
              <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#1A2233" }}>312</span>
                <Text style={{ fontSize: 12, color: "#2F6FED" }}>+18</Text>
              </Flex>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tài liệu đã tải</Text>
              <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#1A2233" }}>1,204</span>
                <Text style={{ fontSize: 12, color: "#2F6FED" }}>+64</Text>
              </Flex>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Câu hỏi đã xử lý</Text>
              <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#1A2233" }}>9,842</span>
                <Text style={{ fontSize: 12, color: "#2F6FED" }}>+512</Text>
              </Flex>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Dung lượng dùng</Text>
              <Flex align="baseline" gap={8} style={{ marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#1A2233" }}>18.4</span>
                <Text style={{ fontSize: 16, fontWeight: 600, color: "#1A2233" }}>GB</Text>
              </Flex>
            </Card>
          </Col>
        </Row>

        {/* Người dùng gần đây */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Người dùng gần đây</Text>}
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={MOCK_USERS}
            columns={columns}
            pagination={false}
            size="middle"
            style={{ fontSize: 13 }}
          />
        </Card>
      </Flex>
    </Flex>
  );
}
