import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Input, Modal, Form, Select, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import AdminSidebar from "~/components/AdminSidebar";

const { Title, Text } = Typography;

const MOCK_USERS = [
  { key: "1", id: "u1", full_name: "Nguyễn Văn An", email: "an.nv@truong.edu.vn", role: "student", is_active: true, created_at: "2026-08-10" },
  { key: "2", id: "u2", full_name: "Trần Thị Bình", email: "binh.tt@truong.edu.vn", role: "student", is_active: true, created_at: "2026-08-09" },
  { key: "3", id: "u3", full_name: "Lê Minh Châu", email: "chau.lm@truong.edu.vn", role: "admin", is_active: true, created_at: "2026-08-08" },
  { key: "4", id: "u4", full_name: "Phạm Quốc Dũng", email: "dung.pq@truong.edu.vn", role: "student", is_active: false, created_at: "2026-08-07" },
  { key: "5", id: "u5", full_name: "Hoàng Thị Ê", email: "e.ht@truong.edu.vn", role: "student", is_active: true, created_at: "2026-08-06" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id) {
    Modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc muốn xoá người dùng này?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: () => setUsers((prev) => prev.filter((u) => u.id !== id)),
    });
  }

  function handleEdit(user) {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }

  function handleSave(values) {
    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
    } else {
      const newUser = {
        key: `${Date.now()}`,
        id: `u${Date.now()}`,
        ...values,
        is_active: true,
        created_at: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setModalOpen(false);
  }

  const columns = [
    { title: "Họ tên", dataIndex: "full_name", key: "full_name", sorter: (a, b) => a.full_name.localeCompare(b.full_name) },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      filters: [{ text: "Admin", value: "admin" }, { text: "Sinh viên", value: "student" }],
      onFilter: (value, record) => record.role === value,
      render: (role) => <Tag color={role === "admin" ? "blue" : "default"}>{role === "admin" ? "Quản trị" : "Sinh viên"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) => <Tag color={active ? "green" : "red"}>{active ? "Hoạt động" : "Khoá"}</Tag>,
    },
    { title: "Ngày tạo", dataIndex: "created_at", key: "created_at", sorter: (a, b) => a.created_at.localeCompare(b.created_at) },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: 40 }}>
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>Quản lý người dùng</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Tổng cộng {users.length} người dùng</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm người dùng
          </Button>
        </Flex>

        <Card style={{ borderRadius: 12 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 360 }}
            allowClear
          />
          <Table dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
        </Card>

        {/* Modal thêm/sửa */}
        <Modal
          title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText="Lưu"
          cancelText="Huỷ"
        >
          <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
            <Form.Item label="Họ tên" name="full_name" rules={[{ required: true, message: "Nhập họ tên" }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}>
              <Input placeholder="email@truong.edu.vn" />
            </Form.Item>
            <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
              <Select options={[{ value: "student", label: "Sinh viên" }, { value: "admin", label: "Quản trị" }]} />
            </Form.Item>
            {!editingUser && (
              <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
                <Input.Password placeholder="••••••••" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Flex>
    </Flex>
  );
}
