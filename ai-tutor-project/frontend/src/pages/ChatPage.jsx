import {
  BookOutlined,
  CheckOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Flex, Input, Modal, Spin, Tag, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatApi, documentsApi } from "~/api/client";
import Sidebar from "~/components/Sidebar";
import { useToast } from "~/components/Toast";
import { useAuth } from "~/lib/AuthContext";
import { formatMathText, formatSnippetText } from "~/utils/formatters";

const { Text } = Typography;

const QUICK_ACTIONS = [
  "Tóm tắt nội dung chính",
  "Tạo 15 câu trắc nghiệm ôn tập kèm giải thích",
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
  const [downloadingQuizIdx, setDownloadingQuizIdx] = useState(null);
  const [copiedSourceIdx, setCopiedSourceIdx] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);
  const bottomRef = useRef(null);

  function handleCopySnippet(text, idx) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSourceIdx(idx);
    toast.success("Đã sao chép đoạn trích dẫn!");
    setTimeout(() => setCopiedSourceIdx(null), 2000);
  }

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

  // Regex phát hiện intent tạo bộ câu hỏi trắc nghiệm / ôn tập
  const QUIZ_REGEX = /(?:tạo|sinh|tải|xuất|download|làm|lập|ra|đề|bộ).{0,25}(?:trắc nghiệm|câu hỏi|ôn tập|quiz)|(?:trắc nghiệm|đề thi|quiz)/i;

  const handleDownloadBlob = (blob, filename) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "Bo_cau_hoi_on_tap.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  function extractQuestionCount(text) {
    if (!text) return 15;
    // Bắt các mẫu số lượng người dùng yêu cầu: "20 câu", "30 câu trắc nghiệm", "bộ 25 câu", "tạo 20 câu"
    const countMatch =
      text.match(/(\d+)\s*(?:câu|cau|question|q\b)/i) ||
      text.match(/(?:tạo|sinh|làm|ra|lấy|bộ)\s*(\d+)/i);
    if (countMatch && countMatch[1]) {
      const num = parseInt(countMatch[1], 10);
      if (!isNaN(num) && num > 0) {
        return Math.min(Math.max(num, 5), 40); // Hỗ trợ linh hoạt từ 5 đến 40 câu
      }
    }
    return 15; // Mặc định 15 câu ôn tập
  }

  function formatQuizToContent(fileName, questions) {
    let text = `📚 BỘ CÂU HỎI TRẮC NGHIỆM ÔN TẬP\n`;
    text += `Tài liệu: ${fileName} · Số lượng: ${questions.length} câu\n`;
    text += `════════════════════════════════════════\n\n`;

    questions.forEach((q, idx) => {
      text += `Câu ${idx + 1}: ${q.question}\n\n`;
      const opts = q.options || {};
      if (Array.isArray(opts)) {
        opts.forEach((opt, oIdx) => {
          text += `  [ ${String.fromCharCode(65 + oIdx)} ]  ${opt}\n`;
        });
      } else {
        ["A", "B", "C", "D"].forEach((k) => {
          if (opts[k]) text += `  [ ${k} ]  ${opts[k]}\n`;
        });
      }
      text += `\n  💡 Đáp án đúng: ${q.correct_answer || "A"}\n`;
      if (q.explanation) {
        text += `  👉 Lời giải chi tiết: ${q.explanation}\n`;
      }
      text += `\n────────────────────────────────────────\n\n`;
    });

    return text.trim();
  }

  async function handleExportDocx(quizData, messageIndex) {
    if (!quizData) return;
    try {
      setDownloadingQuizIdx(messageIndex);
      const response = await documentsApi.exportQuizDocx(
        quizData.documentId,
        quizData.questions,
        quizData.documentName
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      let filename = `Trac_nghiem_${quizData.documentName || "on_tap"}.docx`;
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;'"\n]+)/i);
        if (utf8Match?.[1]) {
          try {
            filename = decodeURIComponent(utf8Match[1]);
          } catch {
            filename = utf8Match[1];
          }
        } else {
          const fallbackMatch = disposition.match(/filename=['"]?([^;'"\n]+)['"]?/i);
          if (fallbackMatch?.[1]) filename = fallbackMatch[1];
        }
      }

      handleDownloadBlob(blob, filename);
      toast?.success("Đã tải file Word ôn tập thành công!");
    } catch (err) {
      toast?.error("Không thể tải file Word. Vui lòng thử lại.");
    } finally {
      setDownloadingQuizIdx(null);
    }
  }

  async function handleAsk(text) {
    const q = text || question;
    if (!q.trim() || !activeDoc) return;

    const userMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    // Phát hiện intent tạo trắc nghiệm → gọi API sinh câu hỏi trắc nghiệm
    if (QUIZ_REGEX.test(q) && activeDoc.status === "indexed") {
      const targetCount = extractQuestionCount(q);

      try {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📝 Đang đọc tài liệu và soạn bộ ${targetCount} câu hỏi trắc nghiệm ôn tập kèm đầy đủ đáp án & giải thích chi tiết, vui lòng chờ trong giây lát...`,
            isGeneratingQuiz: true,
          },
        ]);

        const { data } = await documentsApi.getQuizQuestions(activeDoc.id, targetCount);
        const questions = data.questions || [];
        const docName = data.file_name || activeDoc.file_name;
        const quizText = formatQuizToContent(docName, questions);

        // Cập nhật tin nhắn hiển thị danh sách câu hỏi trực quan trên web kèm 1 nút tải duy nhất
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Dưới đây là bộ **${questions.length} câu hỏi trắc nghiệm ôn tập** được biên soạn từ tài liệu **${docName}**. Bạn có thể ôn tập trực tiếp ngay trên màn hình, hoặc bấm nút tải file Word bên dưới nếu cần lưu về máy:`,
            isGeneratingQuiz: false,
            quizData: {
              documentId: activeDoc.id,
              documentName: docName,
              questions: questions,
            },
          };
          return updated;
        });
      } catch (err) {
        const detail = err.response?.data?.detail || "Không thể tạo bộ câu hỏi. Vui lòng thử lại.";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `⚠️ ${detail}`,
          };
          return updated;
        });
      } finally {
        setAsking(false);
      }
      return;
    }

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

                    {m.isGeneratingQuiz && (
                      <Flex align="center" gap={8} style={{ marginTop: 10 }}>
                        <Spin size="small" />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Đang phân tích kiến thức và biên soạn đề trắc nghiệm...
                        </Text>
                      </Flex>
                    )}

                    {m.quizData && (
                      <div style={{ marginTop: 14 }}>
                        {/* Thanh tiêu đề hiển thị DUY NHẤT 1 NÚT TẢI */}
                        <Flex
                          align="center"
                          justify="space-between"
                          wrap="wrap"
                          gap={10}
                          style={{
                            padding: "12px 16px",
                            background: "#F0F7FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "12px 12px 0 0",
                          }}
                        >
                          <div>
                            <Text strong style={{ fontSize: 14, color: "#1E3A8A" }}>
                              📚 Đề trắc nghiệm ôn tập ({m.quizData.questions?.length || 0} câu)
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                              Tài liệu: {m.quizData.documentName}
                            </Text>
                          </div>

                          <Button
                            type="primary"
                            size="small"
                            icon={<DownloadOutlined />}
                            loading={downloadingQuizIdx === i}
                            onClick={() => handleExportDocx(m.quizData, i)}
                            style={{
                              borderRadius: 6,
                              background: "#1D4ED8",
                              fontWeight: 500,
                            }}
                          >
                            Tải file Word (.docx)
                          </Button>
                        </Flex>

                        {/* Danh sách từng câu hỏi hiển thị trực quan cho người dùng xem trên web */}
                        <div
                          style={{
                            border: "1px solid #BFDBFE",
                            borderTop: "none",
                            borderRadius: "0 0 12px 12px",
                            background: "#FFFFFF",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                          }}
                        >
                          {(m.quizData.questions || []).map((item, qIdx) => {
                            const opts = item.options || {};
                            const optionsList = Array.isArray(opts)
                              ? opts.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
                              : ["A", "B", "C", "D"]
                                  .filter((k) => opts[k])
                                  .map((k) => ({ key: k, text: opts[k] }));

                            return (
                              <div
                                key={qIdx}
                                style={{
                                  padding: "14px 16px",
                                  background: "#F8FAFC",
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 10,
                                }}
                              >
                                {/* Câu hỏi */}
                                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A", marginBottom: 10 }}>
                                  <span style={{ color: "#2563EB", marginRight: 6 }}>Câu {qIdx + 1}:</span>
                                  {formatMathText(item.question)}
                                </div>

                                {/* Các phương án A, B, C, D */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                  {optionsList.map((opt) => {
                                    const isCorrect = item.correct_answer === opt.key;
                                    return (
                                      <div
                                        key={opt.key}
                                        style={{
                                          display: "flex",
                                          alignItems: "flex-start",
                                          gap: 8,
                                          padding: "7px 12px",
                                          borderRadius: 6,
                                          fontSize: 13,
                                          background: isCorrect ? "#F0FDF4" : "#FFFFFF",
                                          border: isCorrect ? "1px solid #86EFAC" : "1px solid #E2E8F0",
                                          color: isCorrect ? "#166534" : "#334155",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontWeight: 700,
                                            color: isCorrect ? "#15803D" : "#64748B",
                                            minWidth: 20,
                                          }}
                                        >
                                          {opt.key}.
                                        </span>
                                        <span>{formatMathText(opt.text)}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Đáp án & Lời giải chi tiết */}
                                <div
                                  style={{
                                    marginTop: 8,
                                    padding: "10px 14px",
                                    background: "#FEFCE8",
                                    border: "1px solid #FEF08A",
                                    borderRadius: 8,
                                    fontSize: 12.5,
                                    lineHeight: 1.6,
                                    color: "#713F12",
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 700, color: "#854D0E" }}>💡 Đáp án đúng: </span>
                                    <Tag color="success" style={{ fontWeight: 700, marginLeft: 4 }}>
                                      {item.correct_answer || "A"}
                                    </Tag>
                                  </div>
                                  {item.explanation && (
                                    <div style={{ marginTop: 4, color: "#854D0E" }}>
                                      <span style={{ fontWeight: 600 }}>📖 Hướng dẫn giải: </span>
                                      {formatMathText(item.explanation)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {m.sources && m.sources.length > 0 && (
                      <Flex align="center" gap={6} style={{ marginTop: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px dashed #E2E8F0" }}>
                        <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                          📖 Nguồn trích dẫn:
                        </span>
                        {m.sources.map((src, sIdx) => (
                          <Tag
                            key={sIdx}
                            color="blue"
                            style={{
                              fontSize: 11,
                              borderRadius: 6,
                              cursor: "pointer",
                              padding: "0 6px",
                              lineHeight: "20px",
                              margin: 0,
                            }}
                            title="Bấm để xem đoạn trích ở cột bên phải"
                            onClick={() => setLatestSources(m.sources)}
                          >
                            Trang {src.page || 1}
                          </Tag>
                        ))}
                      </Flex>
                    )}
                  </div>
                </div>
              </Flex>
            </Flex>
          ))}

          {asking && !messages.some((m) => m.isGeneratingQuiz) && (
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
        gap={14}
        style={{
          width: 300,
          height: "100vh",
          flexShrink: 0,
          borderLeft: "1px solid #DCE3EE",
          padding: "20px 16px",
          overflowY: "auto",
          background: "#FAFBFD",
        }}
      >
        <Flex justify="space-between" align="center" style={{ flexShrink: 0 }}>
          <Flex align="center" gap={6}>
            <Text strong style={{ fontSize: 11.5, color: "#475569", letterSpacing: 0.5 }}>
              NGUỒN THAM CHIẾU
            </Text>
            {latestSources.length > 0 && (
              <Tag
                color="blue"
                style={{
                  borderRadius: 10,
                  fontSize: 11,
                  padding: "0 6px",
                  lineHeight: "18px",
                  margin: 0,
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {latestSources.length}
              </Tag>
            )}
          </Flex>
        </Flex>

        {latestSources.length > 0 ? (
          latestSources.map((s, i) => {
            const formatted = formatSnippetText(s.snippet);
            const isCopied = copiedSourceIdx === i;
            return (
              <Card
                key={i}
                size="small"
                className="source-card"
                styles={{ body: { padding: "12px 14px" } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Tag
                    color="geekblue"
                    icon={<BookOutlined style={{ marginRight: 4 }} />}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      padding: "1px 8px",
                      margin: 0,
                    }}
                  >
                    Trang {s.page || 1}
                  </Tag>

                  <Tooltip title={isCopied ? "Đã sao chép" : "Sao chép đoạn trích"}>
                    <Button
                      type="text"
                      size="small"
                      icon={isCopied ? <CheckOutlined style={{ color: "#16A34A" }} /> : <CopyOutlined style={{ color: "#94A3B8" }} />}
                      onClick={() => handleCopySnippet(formatted, i)}
                      style={{ width: 24, height: 24, padding: 0 }}
                    />
                  </Tooltip>
                </Flex>

                <div
                  className="source-snippet-text"
                  style={{
                    fontSize: 12.5,
                    color: "#334155",
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {formatted}
                </div>
              </Card>
            );
          })
        ) : (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px dashed #DCE3EE",
              marginTop: 10,
            }}
          >
            <InfoCircleOutlined style={{ fontSize: 26, color: "#94A3B8", marginBottom: 10 }} />
            <Text style={{ fontSize: 12.5, color: "#64748B", display: "block", lineHeight: 1.6 }}>
              Gửi câu hỏi để xem các đoạn trích dẫn nguồn từ tài liệu tại đây.
            </Text>
          </div>
        )}
      </Flex>
    </Flex>
  );
}
