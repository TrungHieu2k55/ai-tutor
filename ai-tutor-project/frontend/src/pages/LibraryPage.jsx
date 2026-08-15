import { DeleteOutlined, InboxOutlined, SearchOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Col, Empty, Flex, Input, Modal, Row, Select, Tag, Typography, Upload } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "~/api/client";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Sidebar from "~/components/Sidebar";
import { useToast } from "~/components/Toast";
import { DOCUMENT_EXT_REGEX } from "~/utils/validators";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const TYPE_COLORS = { pdf: "red", docx: "blue", xlsx: "green", txt: "orange" };

const STATUS_MAP = {
  processing: { text: "Đang xử lý", color: "processing" },
  indexed: { text: "Đã lập chỉ mục", color: "success" },
  failed: { text: "Lỗi xử lý", color: "error" },
};

export default function LibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const toast = useToast();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await documentsApi.list();
      setDocuments(data || []);
    } catch {
      toast?.error("Không thể tải danh sách tài liệu. Vui lòng thử lại.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteDocument = (e, doc) => {
    e.stopPropagation(); // Ngăn mở trang chat
    Modal.confirm({
      title: "Xác nhận xoá tài liệu",
      content: `Bạn có chắc muốn xoá "${doc.file_name}"? Mọi tin nhắn liên quan sẽ bị xoá vĩnh viễn.`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await documentsApi.delete(doc.id);
          toast?.success("Đã xoá tài liệu thành công");
          loadDocuments();
        } catch (err) {
          toast?.error(err.response?.data?.detail || "Xoá tài liệu thất bại");
        }
      },
    });
  };

  const uploadProps = {
    name: "file",
    multiple: true,
    accept: ".pdf,.docx,.xlsx,.txt",
    showUploadList: false,
    beforeUpload: (file) => {
      const isValidExt = DOCUMENT_EXT_REGEX.test(file.name);
      if (!isValidExt) {
        toast?.error(`File "${file.name}" không hợp lệ. Chỉ chấp nhận .pdf, .docx, .xlsx, .txt`);
        return Upload.LIST_IGNORE;
      }
      const isUnder50MB = file.size <= 50 * 1024 * 1024;
      if (!isUnder50MB) {
        toast?.error(`File "${file.name}" vượt quá dung lượng tối đa 50MB.`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await documentsApi.upload(file);
        toast?.success(`Đã tải lên "${file.name}" thành công!`);
        onSuccess();
        loadDocuments();
      } catch (err) {
        const detail = err.response?.data?.detail || "Tải lên thất bại";
        toast?.error(`Lỗi: ${detail}`);
        onError(err);
      }
    },
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesType = typeFilter === "all" || doc.file_type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <Sidebar documents={documents} onSelectDocument={(doc) => navigate(`/chat/${doc.id}`)} />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Thư viện tài liệu</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý và tra cứu tài liệu học tập của bạn</Text>
        </div>

        <Dragger {...uploadProps} style={{ borderRadius: 12, padding: "16px 0" }}>
          <p style={{ marginBottom: 8 }}>
            <InboxOutlined style={{ color: "#2F6FED", fontSize: 40 }} />
          </p>
          <p style={{ fontSize: 13.5, color: "#1A2233" }}>Kéo thả tài liệu vào đây hoặc bấm để chọn file</p>
          <p style={{ fontSize: 12, color: "#6B7A90" }}>Hỗ trợ PDF, DOCX, XLSX, TXT — tối đa 50MB</p>
        </Dragger>

        {/* Thanh Tìm kiếm và Bộ lọc */}
        <Flex gap={12} wrap="wrap" align="center">
          <Input
            placeholder="Tìm kiếm tài liệu..."
            prefix={<SearchOutlined style={{ color: "#BFBFBF" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 140 }}
            options={[
              { value: "all", label: "Tất cả loại file" },
              { value: "pdf", label: "PDF" },
              { value: "docx", label: "DOCX" },
              { value: "xlsx", label: "XLSX" },
              { value: "txt", label: "TXT" },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "indexed", label: "Đã lập chỉ mục" },
              { value: "processing", label: "Đang xử lý" },
              { value: "failed", label: "Lỗi xử lý" },
            ]}
          />
        </Flex>

        {loading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : filteredDocuments.length === 0 ? (
          <Empty description="Không tìm thấy tài liệu phù hợp." />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredDocuments.map((doc) => {
              const status = STATUS_MAP[doc.status] || STATUS_MAP.processing;
              return (
                <Col xs={24} sm={12} lg={8} key={doc.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/chat/${doc.id}`)}
                    style={{ borderRadius: 12, position: "relative" }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Flex vertical gap={8}>
                      <Flex justify="space-between" align="center">
                        <Tag color={TYPE_COLORS[doc.file_type] || "default"} style={{ width: "fit-content", fontWeight: 600 }}>
                          {doc.file_type.toUpperCase()}
                        </Tag>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleDeleteDocument(e, doc)}
                          style={{ opacity: 0.7 }}
                        />
                      </Flex>
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
