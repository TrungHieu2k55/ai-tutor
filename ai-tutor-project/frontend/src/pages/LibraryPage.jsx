import { InboxOutlined } from "@ant-design/icons";
import { Badge, Card, Col, Empty, Flex, Row, Tag, Typography, Upload } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "~/api/client";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Sidebar from "~/components/Sidebar";
import { useToast } from "~/components/Toast";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const TYPE_COLORS = { pdf: "red", docx: "blue", xlsx: "green" };

const STATUS_MAP = {
  processing: { text: "Đang xử lý", color: "processing" },
  indexed: { text: "Đã lập chỉ mục", color: "success" },
  failed: { text: "Lỗi xử lý", color: "error" },
};

const MOCK_DOCUMENTS = [
  { id: "demo-1", file_name: "Giao_trinh_Nhap_mon_Tri_tue_Nhan_tao.pdf", file_type: "pdf", page_count: 58, status: "indexed" },
  { id: "demo-2", file_name: "De_thi_Xac_xuat_Thong_ke_2025.docx", file_type: "docx", page_count: 12, status: "indexed" },
  { id: "demo-3", file_name: "Bang_tra_cuu_Cong_thuc_Dai_so.xlsx", file_type: "xlsx", page_count: 5, status: "processing" },
];

export default function LibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await documentsApi.list();
      setDocuments(data && data.length > 0 ? data : MOCK_DOCUMENTS);
    } catch {
      setDocuments(MOCK_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const uploadProps = {
    name: "file",
    multiple: true,
    accept: ".pdf,.docx,.xlsx",
    showUploadList: false,
    customRequest: async ({ file, onSuccess }) => {
      try {
        await documentsApi.upload(file);
        toast?.success(`Đã tải lên "${file.name}" thành công!`);
        onSuccess();
        loadDocuments();
      } catch {
        const ext = file.name.split(".").pop().toLowerCase();
        const mockNewDoc = {
          id: `demo-${Date.now()}`,
          file_name: file.name,
          file_type: ["pdf", "docx", "xlsx"].includes(ext) ? ext : "pdf",
          page_count: Math.floor(Math.random() * 30) + 1,
          status: "indexed",
        };
        setDocuments((prev) => [mockNewDoc, ...prev]);
        toast?.success(`[Mock] Đã tải lên "${file.name}"`);
        onSuccess();
      }
    },
  };

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <Sidebar documents={documents} onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)} />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Thư viện tài liệu</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý tài liệu học tập của bạn</Text>
        </div>

        <Dragger {...uploadProps} style={{ borderRadius: 12, padding: "16px 0" }}>
          <p style={{ marginBottom: 8 }}>
            <InboxOutlined style={{ color: "#2F6FED", fontSize: 40 }} />
          </p>
          <p style={{ fontSize: 13.5, color: "#1A2233" }}>Kéo thả tài liệu vào đây hoặc bấm để chọn file</p>
          <p style={{ fontSize: 12, color: "#6B7A90" }}>Hỗ trợ PDF, DOCX, XLSX — tối đa 50MB</p>
        </Dragger>

        {loading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : documents.length === 0 ? (
          <Empty description="Chưa có tài liệu nào. Tải lên tài liệu đầu tiên để bắt đầu." />
        ) : (
          <Row gutter={[16, 16]}>
            {documents.map((doc) => {
              const status = STATUS_MAP[doc.status] || STATUS_MAP.processing;
              return (
                <Col xs={24} sm={12} lg={8} key={doc.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/chat/${doc.id}`)}
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Flex vertical gap={8}>
                      <Tag color={TYPE_COLORS[doc.file_type] || "default"} style={{ width: "fit-content", fontWeight: 600 }}>
                        {doc.file_type.toUpperCase()}
                      </Tag>
                      <Text strong ellipsis style={{ fontSize: 13.5 }}>{doc.file_name}</Text>
                      <Flex align="center" gap={8}>
                        {doc.page_count > 0 && (
                          <Text type="secondary" style={{ fontSize: 11.5 }}>{doc.page_count} trang</Text>
                        )}
                        <Badge status={status.color} text={<Text type="secondary" style={{ fontSize: 11.5 }}>{status.text}</Text>} />
                      </Flex>
                    </Flex>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Flex>
    </Flex>
  );
}
