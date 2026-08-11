import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Badge, Card, Col, Descriptions, Flex, List, Progress, Row, Statistic, Tag, Timeline, Typography } from "antd";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

// Mock dữ liệu giám sát AI
const PIPELINE_STATUS = {
  embedding_model: { name: "Embedding Model", status: "online", model: "text-embedding-3-small", latency: "45ms" },
  vector_db: { name: "Qdrant Vector DB", status: "online", collections: 3, total_vectors: 12480 },
  llm: { name: "LLM (GPT-4o-mini)", status: "online", model: "gpt-4o-mini", avg_response: "1.2s" },
  chunking: { name: "Document Chunking", status: "online", strategy: "semantic", avg_chunks: 42 },
};

const RECENT_QUERIES = [
  { time: "21:45:02", user: "Nguyễn Văn An", question: "Mạng nơ-ron nhân tạo hoạt động như thế nào?", doc: "Giao_trinh_AI.pdf", latency: "1.3s", status: "success" },
  { time: "21:42:15", user: "Trần Thị Bình", question: "Công thức Bayes là gì?", doc: "De_thi_Xac_suat.docx", latency: "0.9s", status: "success" },
  { time: "21:40:33", user: "Lê Minh Châu", question: "Chuẩn hoá CSDL 3NF là gì?", doc: "Bai_tap_CSDL.pdf", latency: "1.1s", status: "success" },
  { time: "21:38:10", user: "Phạm Quốc Dũng", question: "Giải thích thuật toán Dijkstra", doc: "Giao_trinh_AI.pdf", latency: "4.2s", status: "slow" },
  { time: "21:35:00", user: "Hoàng Thị Ê", question: "Phân biệt Stack và Queue", doc: "Bai_tap_CSDL.pdf", latency: "—", status: "error" },
];

const statusIcon = {
  online: <Badge status="success" />,
  offline: <Badge status="error" />,
  degraded: <Badge status="warning" />,
};

export default function AdminAIMonitor() {
  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Giám sát AI Pipeline</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái các thành phần RAG theo thời gian thực</Text>
        </div>

        {/* Pipeline status cards */}
        <Row gutter={[16, 16]}>
          {Object.values(PIPELINE_STATUS).map((comp) => (
            <Col xs={24} sm={12} lg={6} key={comp.name}>
              <Card style={{ borderRadius: 12 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 13 }}>{comp.name}</Text>
                  {statusIcon[comp.status]}
                </Flex>
                <Descriptions column={1} size="small" labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12 }}>
                  {comp.model && <Descriptions.Item label="Model">{comp.model}</Descriptions.Item>}
                  {comp.latency && <Descriptions.Item label="Latency">{comp.latency}</Descriptions.Item>}
                  {comp.avg_response && <Descriptions.Item label="Avg Response">{comp.avg_response}</Descriptions.Item>}
                  {comp.collections && <Descriptions.Item label="Collections">{comp.collections}</Descriptions.Item>}
                  {comp.total_vectors && <Descriptions.Item label="Vectors">{comp.total_vectors.toLocaleString()}</Descriptions.Item>}
                  {comp.strategy && <Descriptions.Item label="Strategy">{comp.strategy}</Descriptions.Item>}
                  {comp.avg_chunks && <Descriptions.Item label="Avg chunks/doc">{comp.avg_chunks}</Descriptions.Item>}
                </Descriptions>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ trả lời thành công</Text>
              <Progress percent={94.5} status="active" strokeColor="#2F6FED" style={{ marginTop: 8 }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="Tổng câu hỏi hôm nay" value={89} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="Thời gian phản hồi TB" value="1.2s" />
            </Card>
          </Col>
        </Row>

        {/* Recent queries timeline */}
        <Card title="Câu hỏi gần đây" style={{ borderRadius: 12 }}>
          <List
            dataSource={RECENT_QUERIES}
            renderItem={(item) => (
              <List.Item>
                <Flex gap={12} align="flex-start" style={{ width: "100%" }}>
                  {item.status === "success" ? (
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />
                  ) : item.status === "slow" ? (
                    <ClockCircleOutlined style={{ color: "#faad14", marginTop: 4 }} />
                  ) : (
                    <ExclamationCircleOutlined style={{ color: "#ff4d4f", marginTop: 4 }} />
                  )}
                  <Flex vertical flex={1} gap={2}>
                    <Flex justify="space-between">
                      <Text strong style={{ fontSize: 13 }}>{item.question}</Text>
                      <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>{item.time}</Text>
                    </Flex>
                    <Flex gap={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.user}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.doc}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
                      <Tag
                        color={item.status === "success" ? "green" : item.status === "slow" ? "orange" : "red"}
                        style={{ fontSize: 11 }}
                      >
                        {item.latency}
                      </Tag>
                    </Flex>
                  </Flex>
                </Flex>
              </List.Item>
            )}
          />
        </Card>
      </Flex>
    </Flex>
  );
}
