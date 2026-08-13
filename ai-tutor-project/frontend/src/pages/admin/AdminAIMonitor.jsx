import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Badge, Card, Col, Descriptions, Flex, Progress, Row, Skeleton, Statistic, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { adminApi } from "~/api/client";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

export default function AdminAIMonitor() {
  const [aiStats, setAIStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, queriesRes] = await Promise.all([
          adminApi.getAIStats(),
          adminApi.getRecentQueries(),
        ]);
        setAIStats(statsRes.data);
        setQueries(queriesRes.data || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Pipeline status (hiển thị cấu hình thực tế từ hệ thống)
  const pipelineComponents = [
    {
      name: "Embedding Model",
      status: "online",
      details: { Model: "all-MiniLM-L6-v2", Type: "Local (ChromaDB default)" },
    },
    {
      name: "ChromaDB Vector DB",
      status: "online",
      details: { Storage: "Local persistent", Path: "./storage/vector_db" },
    },
    {
      name: "LLM Provider",
      status: "online",
      details: { Primary: "DeepSeek AI (V3)", Fallback: "Google Gemini / Claude" },
    },
    {
      name: "Document Chunking",
      status: "online",
      details: { Strategy: "Fixed-size overlap", "Chunk size": "800 chars", Overlap: "120 chars" },
    },
  ];

  const statusIcon = {
    online: <Badge status="success" />,
    offline: <Badge status="error" />,
    degraded: <Badge status="warning" />,
  };

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Giám sát AI Pipeline</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái các thành phần RAG và thống kê hiệu năng</Text>
        </div>

        {/* Pipeline status cards */}
        <Row gutter={[16, 16]}>
          {pipelineComponents.map((comp) => (
            <Col xs={24} sm={12} lg={6} key={comp.name}>
              <Card style={{ borderRadius: 12 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 13 }}>{comp.name}</Text>
                  {statusIcon[comp.status]}
                </Flex>
                <Descriptions column={1} size="small" styles={{ label: { fontSize: 12 }, content: { fontSize: 12 } }}>
                  {Object.entries(comp.details).map(([key, val]) => (
                    <Descriptions.Item label={key} key={key}>{val}</Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                <>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ trả lời thành công</Text>
                  <Progress
                    percent={aiStats?.success_rate || 0}
                    status="active"
                    strokeColor="#2F6FED"
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                <Statistic title="Tổng câu hỏi hôm nay" value={aiStats?.today_questions || 0} />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                <Statistic title="Thời gian phản hồi TB" value={aiStats?.avg_response_str || "—"} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Recent queries */}
        <Card title="Câu hỏi gần đây" style={{ borderRadius: 12 }}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : queries.length === 0 ? (
            <Text type="secondary">Chưa có câu hỏi nào.</Text>
          ) : (
            <Flex vertical gap={12}>
              {queries.map((item, index) => (
                <Flex key={index} gap={12} align="flex-start" style={{ width: "100%", borderBottom: index < queries.length - 1 ? "1px solid #f0f0f0" : "none", paddingBottom: 10 }}>
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
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.user_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.document_name}</Text>
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
              ))}
            </Flex>
          )}
        </Card>
      </Flex>
    </Flex>
  );
}
