import { BookOutlined, CloudSyncOutlined, FileTextOutlined } from "@ant-design/icons";
import { Badge, Card, Col, Empty, Flex, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { documentsApi } from "~/api/client";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Sidebar from "~/components/Sidebar";

const { Title, Text } = Typography;

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
      .then(({ data }) => setDocuments(data || []))
      .catch(() => setDocuments([]))
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
            <Flex vertical gap={8} style={{ marginTop: 12 }}>
              {documents.map((doc) => {
                const s = STATUS_MAP[doc.status] || STATUS_MAP.processing;
                return (
                  <Flex
                    key={doc.id}
                    align="center"
                    justify="space-between"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "#fff",
                      border: "1px solid #DCE3EE",
                    }}
                  >
                    <Text ellipsis style={{ fontSize: 13, flex: 1 }}>{doc.file_name}</Text>
                    <Badge status={s.status} text={<Text type="secondary" style={{ fontSize: 12 }}>{s.text}</Text>} />
                  </Flex>
                );
              })}
            </Flex>
          )}
        </div>
      </Flex>
    </Flex>
  );
}
