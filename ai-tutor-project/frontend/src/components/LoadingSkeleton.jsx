import { Skeleton } from "antd";

/**
 * LoadingSkeleton — hiệu ứng loading placeholder khi dữ liệu đang tải.
 *
 * Props:
 *   variant: "card" | "list" | "chat" | "text"   (mặc định: "card")
 *   count:   số phần tử skeleton cần hiển thị     (mặc định: 3)
 */
export default function LoadingSkeleton({ variant = "card", count = 3 }) {
  if (variant === "card") return <CardSkeleton count={count} />;
  if (variant === "list") return <ListSkeleton count={count} />;
  if (variant === "chat") return <ChatSkeleton count={count} />;
  return <TextSkeleton count={count} />;
}

function CardSkeleton({ count }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #DCE3EE", borderRadius: 12, padding: 16 }}>
          <Skeleton.Avatar active shape="square" size={36} style={{ borderRadius: 8, marginBottom: 12 }} />
          <Skeleton active title={{ width: "75%" }} paragraph={{ rows: 1, width: "50%" }} />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ count }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #DCE3EE", borderRadius: 12, padding: "10px 14px" }}
        >
          <Skeleton active title={false} paragraph={{ rows: 1, width: "100%" }} />
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton({ count }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "28px 40px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
          <div style={{ width: i % 2 === 0 ? 200 : 300 }}>
            <Skeleton active title={false} paragraph={{ rows: 2, width: ["100%", "60%"] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TextSkeleton({ count }) {
  return (
    <Skeleton
      active
      title={false}
      paragraph={{ rows: count, width: Array.from({ length: count }, (_, i) => (i === count - 1 ? "60%" : "100%")) }}
    />
  );
}
