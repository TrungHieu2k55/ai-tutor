import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/library", label: "Thư viện tài liệu" },
  { to: "/progress", label: "Tiến độ học tập" },
];

export default function Sidebar({ documents = [], activeDocumentId, onSelectDocument, userName = "Sinh viên" }) {
  return (
    <aside className="w-64 shrink-0 bg-navy text-white flex flex-col p-4">
      <div className="flex items-center gap-2.5 pb-5">
        <div className="w-7 h-7 rounded-lg bg-accent shrink-0" />
        <div>
          <p className="text-[15px] font-semibold leading-tight">AI Tutor</p>
          <p className="text-[11px] text-white/50 leading-tight">Học cùng tài liệu của bạn</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 mb-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `text-[13px] px-2.5 py-2 rounded-md transition-colors ${
                isActive ? "bg-accent/20 text-white font-medium" : "text-white/60 hover:text-white/90"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {documents.length > 0 && (
        <>
          <p className="text-[10px] font-semibold tracking-wider text-white/40 px-2.5 pt-3 pb-2">
            TÀI LIỆU ĐÃ TẢI
          </p>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument?.(doc)}
                className={`text-left text-[13px] px-2.5 py-2 rounded-md truncate transition-colors ${
                  doc.id === activeDocumentId
                    ? "bg-accent/20 text-white font-medium"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                {doc.file_name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto flex items-center gap-2.5 pt-3 border-t border-white/10">
        <div className="w-7 h-7 rounded-full bg-[#3A5686]" />
        <div>
          <p className="text-[12.5px] text-white/90 leading-tight">{userName}</p>
          <p className="text-[11px] text-white/40 leading-tight">Sinh viên</p>
        </div>
      </div>
    </aside>
  );
}
