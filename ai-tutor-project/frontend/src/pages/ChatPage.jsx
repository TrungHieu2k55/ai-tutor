import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatApi, documentsApi } from "../api/client";
import Sidebar from "../components/Sidebar";

export default function ChatPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    documentsApi.list().then(({ data }) => {
      setDocuments(data);
      setActiveDoc(data.find((d) => d.id === documentId) || null);
    });
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || !activeDoc) return;

    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    try {
      const { data } = await chatApi.ask({ document_id: activeDoc.id, question: userMsg.content });
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.response?.data?.detail || "Có lỗi khi xử lý câu hỏi." },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        documents={documents}
        activeDocumentId={activeDoc?.id}
        onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)}
      />

      <main className="flex-1 flex flex-col">
        <div className="px-7 py-4 border-b border-border">
          <h1 className="text-[15px] font-semibold">{activeDoc?.file_name || "Chọn một tài liệu"}</h1>
          {activeDoc && (
            <p className="text-xs text-muted mt-0.5">
              Đang tham chiếu 1 tài liệu {activeDoc.page_count ? `· ${activeDoc.page_count} trang` : ""}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-7 flex flex-col gap-5">
          {messages.length === 0 && (
            <p className="text-[13px] text-muted text-center mt-10">
              Đặt câu hỏi bất kỳ về nội dung tài liệu này.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
              <div
                className={`max-w-[420px] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-navy text-white rounded-tr-sm"
                    : "bg-accent/10 text-ink rounded-tl-sm"
                }`}
              >
                {m.content}
                {m.sources?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.sources.map((s, j) => (
                      <span key={j} className="text-[11px] text-muted">
                        📄 Trang {s.page ?? "?"} — {s.snippet}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {asking && <p className="text-[13px] text-muted">Đang tra cứu tài liệu...</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="px-10 pb-6 pt-3">
          <div className="flex items-center gap-2.5 border border-border bg-white rounded-xl px-4 py-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!activeDoc}
              placeholder="Hỏi gì đó về tài liệu của bạn..."
              className="flex-1 text-[14px] outline-none placeholder:text-muted/60 disabled:bg-transparent"
            />
            <button
              type="submit"
              disabled={!activeDoc || asking}
              className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
