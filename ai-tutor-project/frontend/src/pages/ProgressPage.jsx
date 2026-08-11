import { BookOutlined, CloudSyncOutlined, FileTextOutlined } from "@ant-design/icons";
import { Badge, Card, Col, Empty, Flex, List, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { documentsApi } from "~/api/client";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Sidebar from "~/components/Sidebar";

const { Title, Text } = Typography;

// Ghi chú: backend hiện chưa có endpoint tổng hợp tiến độ học tập theo chủ đề.
// Tạm thời trang này tính nhanh từ số tài liệu đã tải; khi có endpoint
// GET /progress trả về { topics: [{name, percent}], stats: {...} } thì thay bằng dữ liệu thật.
const MOCK_DOCUMENTS = [
  { id: "demo-1", file_name: "Giao_trinh_Nhap_mon_Tri_tue_Nhan_tao.pdf", file_type: "pdf", page_count: 58, status: "indexed" },
  { id: "demo-2", file_name: "De_thi_Xac_xuat_Thong_ke_2025.docx", file_type: "docx", page_count: 12, status: "indexed" },
  { id: "demo-3", file_name: "Bang_tra_cuu_Cong_thuc_Dai_so.xlsx", file_type: "xlsx", page_count: 5, status: "processing" },
];

const STATUS_MAP = {
  indexed: { text: "Sẵn sàng hỏi đáp", status: "success" },
  processing: { text: "Đang xử lý", status: "processing" },
  failed: { text: "Lỗi", status: "error" },
};

export default function ProgressPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    documentsApi
      .list()
      .then(({ data }) => setDocuments(data && data.length > 0 ? data : MOCK_DOCUMENTS))
      .catch(() => setDocuments(MOCK_DOCUMENTS))
      .finally(() => setLoading(false));
  }, []);

  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <Sidebar documents={documents} />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <Title level={4} style={{ marginBottom: 0 }}>Tiến độ học tập</Title>

        {/* Stat cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Tài liệu đã học"
                value={indexedCount}
                prefix={<BookOutlined style={{ color: "#2F6FED" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Tổng tài liệu đã tải"
                value={documents.length}
                prefix={<FileTextOutlined style={{ color: "#2F6FED" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Đang xử lý"
                value={processingCount}
                prefix={<CloudSyncOutlined style={{ color: "#faad14" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Danh sách tài liệu */}
        <div>
          <Text strong style={{ fontSize: 13.5 }}>Theo tài liệu</Text>

          {loading ? (
            <div style={{ marginTop: 12 }}>
              <LoadingSkeleton variant="list" count={4} />
            </div>
          ) : documents.length === 0 ? (
            <Empty description="Chưa có dữ liệu — hãy tải tài liệu ở Thư viện trước." style={{ marginTop: 24 }} />
          ) : (
            <List
              style={{ marginTop: 12 }}
              dataSource={documents}
              renderItem={(doc) => {
                const s = STATUS_MAP[doc.status] || STATUS_MAP.processing;
                return (
                  <List.Item style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 8, background: "#fff", border: "1px solid #DCE3EE" }}>
                    <Text ellipsis style={{ fontSize: 13, flex: 1 }}>{doc.file_name}</Text>
                    <Badge status={s.status} text={<Text type="secondary" style={{ fontSize: 12 }}>{s.text}</Text>} />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Flex>
    </Flex>
  );
}
