import { SendOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Flex, Input, Modal, Spin, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatApi, documentsApi } from "~/api/client";
import Sidebar from "~/components/Sidebar";
import { useToast } from "~/components/Toast";
import { useAuth } from "~/lib/AuthContext";
import { formatMathText } from "~/utils/formatters";

const { Text } = Typography;

const QUICK_ACTIONS = [
  "Tóm tắt nội dung chính",
  "Tạo 5 câu hỏi ôn tập",
  "Giải thích lại đơn giản hơn",
];

export default function ChatPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [latestSources, setLatestSources] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const bottomRef = useRef(null);

  // Load documents
  useEffect(() => {
    documentsApi
      .list()
      .then(({ data }) => {
        setDocuments(data || []);
        const found = (data || []).find((d) => d.id === documentId);
        setActiveDoc(found || (data && data[0]) || null);
      })
      .catch(() => {
        setDocuments([]);
        setActiveDoc(null);
      });
  }, [documentId]);

  // Load conversations for this document and auto-select the latest one
  useEffect(() => {
    if (!activeDoc) return;
    chatApi
      .getConversations(activeDoc.id)
      .then(({ data }) => {
        const convs = data || [];
        setConversations(convs);
        if (convs.length > 0) {
          setConversationId(convs[0].id);
        } else {
          setConversationId(null);
          setMessages([]);
          setLatestSources([]);
        }
      })
      .catch(() => {
        setConversations([]);
        setConversationId(null);
        setMessages([]);
        setLatestSources([]);
      });
  }, [activeDoc]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!conversationId) return;
    chatApi
      .getMessages(conversationId)
      .then(({ data }) => {
        const msgs = (data || []).map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources ? JSON.parse(m.sources) : [],
        }));
        setMessages(msgs);
        const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
        setLatestSources(lastAssistant?.sources || []);
      })
      .catch(() => setMessages([]));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleNewConversation() {
    setConversationId(null);
    setMessages([]);
    setLatestSources([]);
  }

  function handleSelectConversation(conv) {
    setConversationId(conv.id);
  }

  function handleDeleteConversation(conv) {
    Modal.confirm({
      title: "Xác nhận xoá cuộc trò chuyện",
      content: `Bạn có chắc muốn xoá lịch sử "${conv.title}"?`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await chatApi.deleteConversation(conv.id);
          toast?.success("Đã xoá cuộc trò chuyện thành công");

          // Nếu đang xoá cuộc trò chuyện hiện tại, reset màn hình
          if (conversationId === conv.id) {
            setConversationId(null);
            setMessages([]);
            setLatestSources([]);
          }

          // Cập nhật lại danh sách lịch sử
          if (activeDoc) {
            const { data } = await chatApi.getConversations(activeDoc.id);
            setConversations(data || []);
          }
        } catch {
          toast?.error("Không thể xoá cuộc trò chuyện. Vui lòng thử lại.");
        }
      },
    });
  }

  async function handleRenameConversation(conv, newTitle) {
    try {
      await chatApi.renameConversation(conv.id, newTitle);
      toast?.success("Đã cập nhật tên cuộc trò chuyện");
      if (activeDoc) {
        const { data } = await chatApi.getConversations(activeDoc.id);
        setConversations(data || []);
      }
    } catch {
      toast?.error("Đổi tên thất bại. Vui lòng thử lại.");
    }
  }

  async function handleAsk(text) {
    const q = text || question;
    if (!q.trim() || !activeDoc) return;

    const userMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    try {
      const { data } = await chatApi.ask({
        document_id: activeDoc.id,
        question: q,
        conversation_id: conversationId || undefined,
      });
      const sources = data.sources || [];
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources }]);
      setLatestSources(sources);

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
        chatApi
          .getConversations(activeDoc.id)
          .then(({ data: convs }) => setConversations(convs || []))
          .catch(() => {});
      }
    } catch (err) {
      const detail = err.response?.data?.detail || "Đã có lỗi xảy ra khi xử lý câu hỏi.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${detail}` },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const chatHistoryItems = conversations.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <Flex style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar
        documents={documents}
        activeDocumentId={activeDoc?.id}
        onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)}
        chatHistory={chatHistoryItems}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Main chat area — Cố định chiều cao 100vh */}
      <Flex vertical flex={1} style={{ height: "100vh", minWidth: 0 }}>
        {/* Header (Cố định ở đỉnh) */}
        <Flex
          align="center"
          justify="space-between"
          style={{ padding: "16px 28px", borderBottom: "1px solid #DCE3EE", background: "#fff", flexShrink: 0 }}
        >
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {activeDoc ? activeDoc.file_name : "Chọn một tài liệu"}
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

        {/* Messages area — ĐÂY LÀ KHU VỰC DUY NHẤT CUỘN TRONG NỘI DUNG CHAT */}
        <Flex
          vertical
          gap={24}
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
              <Flex gap={12} style={{ maxWidth: m.role === "user" ? "70%" : "85%", width: "100%" }}>
                {m.role === "assistant" && (
                  <Avatar size={32} style={{ backgroundColor: "#0E1B2E", flexShrink: 0, marginTop: 2 }}>
                    AI
                  </Avatar>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      padding: "14px 20px",
                      fontSize: 14,
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                      ...(m.role === "user"
                        ? { background: "#0E1B2E", color: "#fff", borderTopRightRadius: 4, marginLeft: "auto" }
                        : { background: "#FFFFFF", color: "#1A2233", border: "1px solid #E2E8F0", borderTopLeftRadius: 4 }),
                    }}
                  >
                    {formatMathText(m.content)}
                  </div>
                </div>
              </Flex>
            </Flex>
          ))}

          {asking && (
            <Flex align="center" gap={10} style={{ background: "#fff", padding: "12px 18px", borderRadius: 12, width: "fit-content", border: "1px solid #E2E8F0" }}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 13 }}>AI đang suy nghĩ và tra cứu tài liệu...</Text>
            </Flex>
          )}
          <div ref={bottomRef} />
        </Flex>

        {/* Quick action chips (Cố định phía trên ô nhập) */}
        {messages.length > 0 && (
          <Flex gap={8} wrap="wrap" style={{ padding: "0 40px 8px", flexShrink: 0 }}>
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

        {/* Footer Input area (Cố định ở đáy trang) */}
        <Flex gap={10} style={{ padding: "8px 40px 24px", flexShrink: 0, background: "#fff" }}>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onPressEnter={() => handleAsk()}
            disabled={!activeDoc || activeDoc.status !== "indexed"}
            placeholder={
              activeDoc?.status === "indexed"
                ? "Hỏi gì đó về tài liệu của bạn..."
                : "Tài liệu chưa sẵn sàng..."
            }
            size="large"
            style={{ borderRadius: 12 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            onClick={() => handleAsk()}
            disabled={!activeDoc || asking || activeDoc.status !== "indexed"}
            loading={asking}
            style={{ borderRadius: 12, background: "#2F6FED" }}
          />
        </Flex>
      </Flex>

      {/* Right panel — Nguồn tham chiếu (Cố định góc phải, cuộn riêng) */}
      <Flex
        vertical
        gap={16}
        style={{
          width: 280,
          height: "100vh",
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
      </Flex>
    </Flex>
  );
}
