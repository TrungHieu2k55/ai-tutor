import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Input, Modal, Row, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "~/api/client";
import AdminSidebar from "~/components/AdminSidebar";
import { useToast } from "~/components/Toast";

const { Title, Text } = Typography;

const STATUS_MAP = {
  indexed: { text: "Đã lập chỉ mục", color: "green" },
  processing: { text: "Đang xử lý", color: "orange" },
  failed: { text: "Lỗi", color: "red" },
};

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, queriesRes, aiRes] = await Promise.all([
        adminApi.getAllDocuments(),
        adminApi.getRecentQueries(),
        adminApi.getAIStats(),
      ]);
      setDocuments(docsRes.data || []);
      setQueries(queriesRes.data || []);
      setStats(aiRes.data || null);
    } catch {
      toast?.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(docId) {
    Modal.confirm({
      title: "Xác nhận xoá tài liệu",
      content: "Tài liệu sẽ bị xoá vĩnh viễn cùng toàn bộ dữ liệu liên quan.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await adminApi.deleteDocument(docId);
          toast?.success("Đã xoá tài liệu");
          loadData();
        } catch (err) {
          toast?.error(err.response?.data?.detail || "Xoá thất bại");
        }
      },
    });
  }

  const filtered = documents.filter(
    (d) =>
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "file_name",
      key: "file_name",
      render: (name) => <Text style={{ fontSize: 13 }}>{name}</Text>,
    },
    {
      title: "Chủ sở hữu",
      dataIndex: "owner_name",
      key: "owner_name",
      render: (owner) => <Text style={{ fontSize: 13 }}>{owner}</Text>,
    },
    {
      title: "Dung lượng",
      dataIndex: "size_bytes",
      key: "size_bytes",
      render: (size) => <Text style={{ fontSize: 13 }}>{formatSize(size)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Đã lập chỉ mục", value: "indexed" },
        { text: "Đang xử lý", value: "processing" },
        { text: "Lỗi", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const s = STATUS_MAP[status] || STATUS_MAP.processing;
        return (
          <Tag color={s.color} style={{ borderRadius: 12, fontSize: 12, padding: "2px 10px" }}>
            {s.text}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          type="text"
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  const processingCount = documents.filter((d) => d.status === "processing").length;

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px" }}>
        <Title level={4} style={{ marginBottom: 0 }}>Tài liệu & Giám sát AI</Title>

        {/* Stat cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Thời gian phản hồi TB</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A2233", marginTop: 4 }}>
                {stats?.avg_response_str || "—"}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ trả lời thành công</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2F6FED", marginTop: 4 }}>
                {stats?.success_rate ?? "—"}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: "20px 24px" } }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tài liệu đang xử lý</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#faad14", marginTop: 4 }}>
                {processingCount}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Bảng tài liệu toàn hệ thống */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Tài liệu toàn hệ thống</Text>}
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
          extra={
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />
          }
        >
          <Table
            dataSource={filtered.map((d) => ({ ...d, key: d.id }))}
            columns={columns}
            pagination={{ pageSize: 10 }}
            size="middle"
            loading={loading}
          />
        </Card>

        {/* Nhật ký câu hỏi gần đây */}
        <Card
          title={<Text strong style={{ fontSize: 14 }}>Nhật ký câu hỏi gần đây</Text>}
          style={{ borderRadius: 12 }}
        >
          {queries.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>Chưa có câu hỏi nào.</Text>
          ) : (
            <Flex vertical gap={8}>
              {queries.map((item, index) => (
                <Flex key={index} gap={8} align="center" style={{ width: "100%" }}>
                  <Tag
                    color={item.status === "success" ? "green" : item.status === "slow" ? "orange" : "red"}
                    style={{ fontSize: 11, minWidth: 40, textAlign: "center" }}
                  >
                    {item.latency}
                  </Tag>
                  <Text style={{ fontSize: 13, flex: 1 }}>
                    "{item.question}" — <Text type="secondary">{item.user_name}</Text> · <Text type="secondary">{item.document_name}</Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>{item.time}</Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>
      </Flex>
    </Flex>
  );
}
