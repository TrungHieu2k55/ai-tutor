import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  MessageOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "~/api/client";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Sidebar from "~/components/Sidebar";

const { Title, Text } = Typography;

const STATUS_MAP = {
  indexed: { text: "Sẵn sàng hỏi đáp", status: "success" },
  processing: { text: "Đang xử lý", status: "processing" },
  failed: { text: "Lỗi xử lý", status: "error" },
};

function getFileIcon(fileType) {
  const ft = (fileType || "").toLowerCase();
  if (ft === "pdf") return <FilePdfOutlined style={{ color: "#EF4444", fontSize: 20 }} />;
  if (ft === "docx") return <FileWordOutlined style={{ color: "#2563EB", fontSize: 20 }} />;
  if (ft === "xlsx") return <FileExcelOutlined style={{ color: "#10B981", fontSize: 20 }} />;
  return <FileTextOutlined style={{ color: "#64748B", fontSize: 20 }} />;
}

function formatDate(dateStr) {
  if (!dateStr) return "Chưa học";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa học";
  }
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [progressData, setProgressData] = useState({
    total_documents: 0,
    indexed_documents: 0,
    total_pages_mastered: 0,
    total_questions_asked: 0,
    average_coverage: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    Promise.all([documentsApi.list(), documentsApi.getProgress()])
      .then(([listRes, progRes]) => {
        setDocuments(listRes.data || []);
        setProgressData(
          progRes.data || {
            total_documents: 0,
            indexed_documents: 0,
            total_pages_mastered: 0,
            total_questions_asked: 0,
            average_coverage: 0,
            items: [],
          }
        );
      })
      .catch(() => {
        setDocuments([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const items = progressData.items || [];

  return (
    <Flex style={{ minHeight: "100vh", background: "#F3F6FB" }}>
      <Sidebar documents={documents} />

      <Flex vertical flex={1} gap={24} style={{ padding: "36px 40px", overflowY: "auto" }}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0, color: "#0F172A", fontWeight: 700 }}>
              Tiến độ & Mức độ học tập
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Hệ thống tự động theo dõi tỷ lệ các trang tài liệu bạn đã nghiên cứu và hỏi đáp cùng AI
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
        </Flex>

        {/* Dashboard Stat Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <Statistic
                title={<span style={{ fontSize: 13, color: "#64748B" }}>Mức độ học tập trung bình</span>}
                value={progressData.average_coverage}
                suffix="%"
                valueStyle={{ color: "#10B981", fontWeight: 700, fontSize: 26 }}
                prefix={<TrophyOutlined style={{ color: "#10B981", marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11.5, marginTop: 4, display: "block" }}>
                Mức độ am hiểu toàn bộ thư viện
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <Statistic
                title={<span style={{ fontSize: 13, color: "#64748B" }}>Số trang đã nghiên cứu</span>}
                value={progressData.total_pages_mastered}
                suffix="trang"
                valueStyle={{ color: "#2563EB", fontWeight: 700, fontSize: 26 }}
                prefix={<BookOutlined style={{ color: "#2563EB", marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11.5, marginTop: 4, display: "block" }}>
                Đã được AI trích dẫn & giải đáp
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <Statistic
                title={<span style={{ fontSize: 13, color: "#64748B" }}>Câu hỏi đã trao đổi</span>}
                value={progressData.total_questions_asked}
                suffix="câu"
                valueStyle={{ color: "#8B5CF6", fontWeight: 700, fontSize: 26 }}
                prefix={<MessageOutlined style={{ color: "#8B5CF6", marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11.5, marginTop: 4, display: "block" }}>
                Lượt tương tác học tập cùng AI
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <Statistic
                title={<span style={{ fontSize: 13, color: "#64748B" }}>Tài liệu sẵn sàng học</span>}
                value={progressData.indexed_documents}
                suffix={`/ ${progressData.total_documents}`}
                valueStyle={{ color: "#F59E0B", fontWeight: 700, fontSize: 26 }}
                prefix={<CheckCircleOutlined style={{ color: "#F59E0B", marginRight: 6 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11.5, marginTop: 4, display: "block" }}>
                Tài liệu đã lập chỉ mục hỏi đáp
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Danh sách tiến độ theo từng tài liệu */}
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center">
            <Text strong style={{ fontSize: 15, color: "#1E293B" }}>
              Chi tiết mức độ học tập theo từng tài liệu ({items.length})
            </Text>
          </Flex>

          {loading ? (
            <LoadingSkeleton variant="list" count={4} />
          ) : items.length === 0 ? (
            <Card style={{ borderRadius: 14, textAlign: "center", padding: "40px 20px" }}>
              <Empty
                description={
                  <div>
                    <Text style={{ fontSize: 14, color: "#64748B" }}>
                      Chưa có tài liệu nào trong thư viện học tập.
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Button type="primary" onClick={() => navigate("/library")}>
                        Tải tài liệu tại Thư viện
                      </Button>
                    </div>
                  </div>
                }
              />
            </Card>
          ) : (
            <Flex vertical gap={14}>
              {items.map((doc) => {
                const s = STATUS_MAP[doc.status] || STATUS_MAP.processing;
                const isComplete = doc.coverage_percent >= 100;

                return (
                  <Card
                    key={doc.document_id}
                    hoverable
                    style={{
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                    }}
                    styles={{ body: { padding: "18px 22px" } }}
                  >
                    <Flex vertical gap={14}>
                      {/* Hàng 1: Icon, Tên file, Trạng thái & Nút Vào học */}
                      <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                        <Flex align="center" gap={12} style={{ flex: 1, minWidth: 260 }}>
                          {getFileIcon(doc.file_type)}
                          <div>
                            <Text
                              strong
                              style={{
                                fontSize: 14.5,
                                color: "#0F172A",
                                display: "block",
                                cursor: "pointer",
                              }}
                              onClick={() => navigate(`/chat/${doc.document_id}`)}
                            >
                              {doc.file_name}
                            </Text>
                            <Flex align="center" gap={8} style={{ marginTop: 2 }}>
                              <Badge status={s.status} text={<span style={{ fontSize: 12, color: "#64748B" }}>{s.text}</span>} />
                              <span style={{ color: "#CBD5E1" }}>•</span>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Tổng {doc.total_pages} trang
                              </Text>
                            </Flex>
                          </div>
                        </Flex>

                        <Flex align="center" gap={10}>
                          {doc.status === "indexed" && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<ArrowRightOutlined />}
                              onClick={() => navigate(`/chat/${doc.document_id}`)}
                              style={{
                                borderRadius: 8,
                                background: isComplete ? "#059669" : "#2F6FED",
                                fontWeight: 500,
                              }}
                            >
                              {doc.coverage_percent > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                            </Button>
                          )}
                        </Flex>
                      </Flex>

                      {/* Hàng 2: Thanh tiến độ học tập */}
                      <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                            Mức độ học tập:
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isComplete ? "#059669" : "#2563EB" }}>
                            {doc.coverage_percent}%
                          </span>
                        </Flex>
                        <Progress
                          percent={doc.coverage_percent}
                          status={isComplete ? "success" : "active"}
                          strokeColor={
                            isComplete
                              ? "#10B981"
                              : {
                                "0%": "#3B82F6",
                                "100%": "#10B981",
                              }
                          }
                          strokeWidth={9}
                          style={{ margin: 0 }}
                        />
                      </div>

                      {/* Hàng 3: Chỉ số chi tiết & Các trang đã mở khóa */}
                      <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap={12}
                        style={{
                          paddingTop: 12,
                          borderTop: "1px dashed #E2E8F0",
                          fontSize: 12.5,
                          color: "#475569",
                        }}
                      >
                        <Flex align="center" gap={16} wrap="wrap">
                          <span>
                            📖 <b>{doc.studied_pages_count}</b> / {doc.total_pages} trang đã tra cứu
                          </span>
                          <span>
                            💬 <b>{doc.question_count}</b> câu hỏi đã hỏi
                          </span>
                          <span>
                            <ClockCircleOutlined style={{ marginRight: 4, color: "#94A3B8" }} />
                            Học gần nhất: {formatDate(doc.last_studied_at)}
                          </span>
                        </Flex>

                        {/* Danh sách các trang đã được trích dẫn */}
                        <Flex align="center" gap={6} wrap="wrap">
                          <span style={{ fontSize: 11.5, color: "#64748B" }}>Trang đã học:</span>
                          {doc.studied_pages && doc.studied_pages.length > 0 ? (
                            doc.studied_pages.map((p) => (
                              <Tag
                                key={p}
                                color="geekblue"
                                style={{
                                  fontSize: 11,
                                  borderRadius: 6,
                                  padding: "0 6px",
                                  lineHeight: "18px",
                                  margin: 0,
                                }}
                              >
                                Trang {p}
                              </Tag>
                            ))
                          ) : (
                            <Text type="secondary" style={{ fontSize: 11.5, fontStyle: "italic" }}>
                              Chưa mở khóa trang nào — bấm "Bắt đầu học" để hỏi đáp
                            </Text>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
