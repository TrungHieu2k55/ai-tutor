import { useEffect, useState } from "react";
import { documentsApi } from "../api/client";
import Sidebar from "../components/Sidebar";

// Ghi chú: backend hiện chưa có endpoint tổng hợp tiến độ học tập theo chủ đề.
// Tạm thời trang này tính nhanh từ số tài liệu đã tải; khi có endpoint
// GET /progress trả về { topics: [{name, percent}], stats: {...} } thì thay bằng dữ liệu thật.
export default function ProgressPage() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    documentsApi.list().then(({ data }) => setDocuments(data));
  }, []);

  const indexedCount = documents.filter((d) => d.status === "indexed").length;

  return (
    <div className="min-h-screen flex">
      <Sidebar documents={documents} />

      <main className="flex-1 p-10 flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Tiến độ học tập</h1>

        <div className="grid grid-cols-3 gap-3.5">
          <StatCard label="Tài liệu đã học" value={indexedCount} />
          <StatCard label="Tổng tài liệu đã tải" value={documents.length} />
          <StatCard label="Đang xử lý" value={documents.filter((d) => d.status === "processing").length} />
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[13.5px] font-medium">Theo tài liệu</p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3.5 bg-white border border-border rounded-xl px-3.5 py-3"
            >
              <span className="text-[13px] flex-1 truncate">{doc.file_name}</span>
              <span className="text-xs text-muted">
                {doc.status === "indexed" ? "Sẵn sàng hỏi đáp" : doc.status === "processing" ? "Đang xử lý" : "Lỗi"}
              </span>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-[13px] text-muted">Chưa có dữ liệu — hãy tải tài liệu ở Thư viện trước.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3.5 flex flex-col gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}
