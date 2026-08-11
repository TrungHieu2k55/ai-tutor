import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "../api/client";
import Sidebar from "../components/Sidebar";

const TYPE_COLORS = {
  pdf: "text-red-600 bg-red-50",
  docx: "text-accent bg-accent/10",
  xlsx: "text-green-600 bg-green-50",
};

const STATUS_LABEL = {
  processing: "Đang xử lý",
  indexed: "Đã lập chỉ mục",
  failed: "Lỗi xử lý",
};

export default function LibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const loadDocuments = useCallback(async () => {
    const { data } = await documentsApi.list();
    setDocuments(data);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleFiles(files) {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await documentsApi.upload(file);
      }
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar documents={documents} onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)} />

      <main className="flex-1 flex flex-col p-10 gap-6">
        <div>
          <h1 className="text-xl font-semibold">Thư viện tài liệu</h1>
          <p className="text-[13px] text-muted mt-1">Quản lý tài liệu học tập của bạn</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl py-9 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
            dragOver ? "border-accent bg-accent/5" : "border-border"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-[13.5px] font-medium text-muted">
            {uploading ? "Đang tải lên..." : "Kéo thả tài liệu vào đây hoặc bấm để chọn file"}
          </p>
          <p className="text-xs text-muted/70">Hỗ trợ PDF, DOCX, XLSX — tối đa 50MB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const badgeColor = TYPE_COLORS[doc.file_type] || "text-muted bg-gray-100";
            return (
              <button
                key={doc.id}
                onClick={() => navigate(`/chat/${doc.id}`)}
                className="text-left bg-white border border-border rounded-xl p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow"
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-[9.5px] font-semibold ${badgeColor}`}>
                  {doc.file_type.toUpperCase()}
                </span>
                <p className="text-[13.5px] font-medium truncate">{doc.file_name}</p>
                <p className="text-[11.5px] text-muted">
                  {doc.page_count > 0 ? `${doc.page_count} trang · ` : ""}
                  {STATUS_LABEL[doc.status]}
                </p>
              </button>
            );
          })}

          {documents.length === 0 && (
            <p className="text-[13px] text-muted col-span-full text-center py-8">
              Chưa có tài liệu nào. Tải lên tài liệu đầu tiên để bắt đầu.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
