import { FileTextOutlined, SendOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Flex, Input, Progress, Spin, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatApi, documentsApi } from "~/api/client";
import Sidebar from "~/components/Sidebar";

const { Text, Title } = Typography;

const MOCK_DOCUMENTS = [
  { id: "demo-1", file_name: "Giai_tich_2_chuong4.pdf", file_type: "pdf", page_count: 24, status: "indexed" },
  { id: "demo-2", file_name: "De_cuong_on_tap.docx", file_type: "docx", page_count: 12, status: "indexed" },
  { id: "demo-3", file_name: "Bai_giang_xac_suat.pdf", file_type: "pdf", page_count: 48, status: "indexed" },
  { id: "demo-4", file_name: "Bang_du_lieu_TN.xlsx", file_type: "xlsx", page_count: 5, status: "processing" },
];

const QUICK_ACTIONS = [
  "Tóm tắt chương này",
  "Tạo 5 câu hỏi ôn tập",
  "Giải thích lại đơn giản hơn",
];

const MOCK_HISTORY = [
  "Ôn tập tích phân bội",
  "Giải thích phân phối chuẩn",
];

export default function ChatPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [latestSources, setLatestSources] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    documentsApi
      .list()
      .then(({ data }) => {
        const docs = data && data.length > 0 ? data : MOCK_DOCUMENTS;
        setDocuments(docs);
        setActiveDoc(docs.find((d) => d.id === documentId) || docs[0] || null);
      })
      .catch(() => {
        setDocuments(MOCK_DOCUMENTS);
        setActiveDoc(MOCK_DOCUMENTS.find((d) => d.id === documentId) || MOCK_DOCUMENTS[0]);
      });
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleAsk(text) {
    const q = text || question;
    if (!q.trim() || !activeDoc) return;

    const userMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    try {
      const { data } = await chatApi.ask({ document_id: activeDoc.id, question: q });
      const sources = data.sources || [];
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources }]);
      setLatestSources(sources);
      setAsking(false);
    } catch {
      setTimeout(() => {
        const mockSources = [
          { page: 12, snippet: "Phép đổi biến sang toạ độ cực áp dụng khi miền D là hình tròn tâm O." },
          { page: 13, snippet: "Jacobian của phép biến đổi bằng r, do đó dS = r dr dθ." },
        ];
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Dùng khi miền lấy tích phân có dạng hình tròn, hình vành khuyên hoặc biểu thức có x² + y². Khi đó đặt x = r·cosθ, y = r·sinθ sẽ giúp miền tích phân trở nên đơn giản hơn nhiều.`,
            sources: mockSources,
          },
        ]);
        setLatestSources(mockSources);
        setAsking(false);
      }, 500);
    }
  }

  // Tính tiến độ mock
  const reviewProgress = { current: 16, total: 25 };
  const reviewPercent = Math.round((reviewProgress.current / reviewProgress.total) * 100);

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <Sidebar
        documents={documents}
        activeDocumentId={activeDoc?.id}
        onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)}
        chatHistory={MOCK_HISTORY}
      />

      {/* Main chat area */}
      <Flex vertical flex={1} style={{ minWidth: 0 }}>
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          style={{ padding: "16px 28px", borderBottom: "1px solid #DCE3EE" }}
        >
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {activeDoc ? `Giải tích 2 — chương 4: Tích phân bội` : "Chọn một tài liệu"}
            </Text>
            {activeDoc && (
              <Flex align="center" gap={8} style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Đang tham chiếu 1 tài liệu · {activeDoc.page_count} trang
                </Text>
              </Flex>
            )}
          </div>
        </Flex>

        {/* Messages area */}
        <Flex
          vertical
          gap={20}
          flex={1}
          style={{ overflowY: "auto", padding: "28px 40px" }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Đặt câu hỏi bất kỳ về nội dung tài liệu này.
              </Text>
            </div>
          )}

          {messages.map((m, i) => (
            <Flex key={i} justify={m.role === "user" ? "flex-end" : "flex-start"}>
              <Flex gap={10} style={{ maxWidth: 520 }}>
                {m.role === "assistant" && (
                  <Avatar size={28} style={{ backgroundColor: "#0E1B2E", flexShrink: 0, marginTop: 4 }}>
                    AI
                  </Avatar>
                )}
                <div>
                  <div
                    style={{
                      borderRadius: 16,
                      padding: "12px 16px",
                      fontSize: 14,
                      lineHeight: 1.7,
                      ...(m.role === "user"
                        ? { background: "#0E1B2E", color: "#fff", borderTopRightRadius: 4 }
                        : { background: "#F3F6FB", color: "#1A2233", borderTopLeftRadius: 4 }),
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              </Flex>
            </Flex>
          ))}

          {asking && (
            <Flex align="center" gap={8}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 13 }}>Đang tra cứu tài liệu...</Text>
            </Flex>
          )}
          <div ref={bottomRef} />
        </Flex>

        {/* Quick action chips */}
        {messages.length > 0 && (
          <Flex gap={8} wrap="wrap" style={{ padding: "0 40px 8px" }}>
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action}
                size="small"
                onClick={() => handleAsk(action)}
                style={{
                  borderRadius: 16,
                  fontSize: 12,
                  color: "#2F6FED",
                  borderColor: "#DCE3EE",
                }}
              >
                {action}
              </Button>
            ))}
          </Flex>
        )}

        {/* Input area */}
        <Flex gap={10} style={{ padding: "8px 40px 24px" }}>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onPressEnter={() => handleAsk()}
            disabled={!activeDoc}
            placeholder="Hỏi gì đó về tài liệu của bạn..."
            size="large"
            style={{ borderRadius: 12 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            onClick={() => handleAsk()}
            disabled={!activeDoc || asking}
            loading={asking}
            style={{ borderRadius: 12, background: "#2F6FED" }}
          />
        </Flex>
      </Flex>

      {/* Right panel — Nguồn tham chiếu & Tiến độ */}
      <Flex
        vertical
        gap={16}
        style={{
          width: 260,
          flexShrink: 0,
          borderLeft: "1px solid #DCE3EE",
          padding: "20px 16px",
          overflowY: "auto",
          background: "#FAFBFD",
        }}
      >
        <Text strong style={{ fontSize: 11, color: "#6B7A90", letterSpacing: 0.5 }}>
          NGUỒN THAM CHIẾU
        </Text>

        {latestSources.length > 0 ? (
          latestSources.map((s, i) => (
            <Card
              key={i}
              size="small"
              style={{ borderRadius: 10, borderColor: "#DCE3EE" }}
              styles={{ body: { padding: "12px 14px" } }}
            >
              <Tag color="blue" style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                Trang {s.page}
              </Tag>
              <Text style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.5, display: "block" }}>
                {s.snippet}
              </Text>
            </Card>
          ))
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Gửi câu hỏi để xem nguồn trích dẫn tại đây.
          </Text>
        )}

        {/* Tiến độ ôn tập */}
        <Card
          size="small"
          style={{
            borderRadius: 10,
            border: "1px solid #2F6FED",
            background: "rgba(47, 111, 237, 0.04)",
            marginTop: 8,
          }}
          styles={{ body: { padding: "14px 16px" } }}
        >
          <Text strong style={{ fontSize: 13 }}>Tiến độ ôn tập</Text>
          <Progress
            percent={reviewPercent}
            strokeColor="#2F6FED"
            trailColor="#DCE3EE"
            size="small"
            style={{ marginTop: 8, marginBottom: 4 }}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {reviewProgress.current}/{reviewProgress.total} khái niệm đã nắm vững
          </Text>
        </Card>
      </Flex>
    </Flex>
  );
}
