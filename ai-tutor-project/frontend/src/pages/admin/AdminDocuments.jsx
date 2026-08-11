import { Card, Col, Flex, List, Row, Table, Tag, Typography } from "antd";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

const MOCK_DOCS = [
  { key: "1", file_name: "Giai_tich_2_chuong4.pdf", owner: "Nguyễn An", size: "4.2 MB", status: "indexed" },
  { key: "2", file_name: "Giao_trinh_ky_thuat_so.pdf", owner: "Lê Minh Thư", size: "12.8 MB", status: "processing" },
  { key: "3", file_name: "Bang_du_lieu_TN.xlsx", owner: "Trần Bảo", size: "1.1 MB", status: "indexed" },
  { key: "4", file_name: "Tai_lieu_mat.pdf", owner: "Phạm Quang", size: "3.5 MB", status: "failed" },
];

const RECENT_QUERIES = [
  { text: '"Công thức đổi biến sang toạ độ cực dùng khi nào?" — 1.6s, tìm thấy ngữ cảnh' },
  { text: '"Tóm tắt chương phân phối xác suất" — 2.1s, tìm thấy ngữ cảnh' },
  { text: '"So sánh ma trận khả nghịch và không khả nghịch" — 4.4s, không tìm thấy ngữ cảnh phù hợp' },
];

const STATUS_MAP = {
  indexed: { text: "Đã lập chỉ mục", color: "green" },
  processing: { text: "Đang xử lý", color: "orange" },
  failed: { text: "Lỗi", color: "red" },
};

const columns = [
  {
    title: "Tên tài liệu",
    dataIndex: "file_name",
    key: "file_name",
    render: (name) => <Text style={{ fontSize: 13 }}>{name}</Text>,
  },
  {
    title: "Chủ sở hữu",
    dataIndex: "owner",
    key: "owner",
    render: (owner) => <Text style={{ fontSize: 13 }}>{owner}</Text>,
  },
  {
    title: "Dung lượng",
    dataIndex: "size",
    key: "size",
    render: (size) => <Text style={{ fontSize: 13 }}>{size}</Text>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status) => {
      const s = STATUS_MAP[status] || STATUS_MAP.processing;
      return (
        <Tag color={s.color} style={{ borderRadius: 12, fontSize: 12, padding: "2px 10px" }}>
          {s.text}
        </Tag>
      );
    },
  },
];

export default function AdminDocuments() {
  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px" }}>
        <Title level={4} style={{ marginBottom: 0 }}>Tài liệu & Giám sát AI</Title>

        {/* Stat cards — khớp Figma */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Thời gian phản hồi TB</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A2233", marginTop: 4 }}>1.8s</div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ truy xuất thất bại</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ff4d4f", marginTop: 4 }}>3.2%</div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tài liệu đang xử lý</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#faad14", marginTop: 4 }}>2</div>
            </Card>
          </Col>
        </Row>

        {/* Bảng tài liệu toàn hệ thống */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Tài liệu toàn hệ thống</Text>}
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={MOCK_DOCS}
            columns={columns}
            pagination={false}
            size="middle"
          />
        </Card>

        {/* Nhật ký câu hỏi gần đây */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Nhật ký câu hỏi gần đây (ẩn danh)</Text>}
          style={{ borderRadius: 12 }}
        >
          <List
            dataSource={RECENT_QUERIES}
            renderItem={(item) => (
              <List.Item style={{ padding: "8px 0", borderBottom: "none" }}>
                <Text style={{ fontSize: 13 }}>• {item.text}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Flex>
    </Flex>
  );
}
