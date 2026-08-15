import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Flex, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography } from "antd";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "~/api/client";
import AdminSidebar from "~/components/AdminSidebar";
import { useToast } from "~/components/Toast";
import { EMAIL_REGEX, PASSWORD_REGEX } from "~/utils/validators";

const { Title, Text } = Typography;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const toast = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ page, page_size: pageSize, search: search.trim() || undefined });
      if (Array.isArray(data)) {
        setUsers(data);
        setTotalCount(data.length);
      } else {
        setUsers(data.items || []);
        setTotalCount(data.total || 0);
      }
    } catch {
      toast?.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleDelete(id) {
    Modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc muốn xoá người dùng này? Hành động không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await adminApi.deleteUser(id);
          toast?.success("Đã xoá người dùng");
          loadUsers();
        } catch (err) {
          toast?.error(err.response?.data?.detail || "Xoá thất bại");
        }
      },
    });
  }

  async function handleToggleActive(user) {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast?.success(user.is_active ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản");
      loadUsers();
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Cập nhật thất bại");
    }
  }

  function handleEdit(user) {
    setEditingUser(user);
    form.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }

  async function handleSave(values) {
    setSaving(true);
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, {
          full_name: values.full_name,
          email: values.email,
          role: values.role,
        });
        toast?.success("Đã cập nhật người dùng");
      } else {
        await adminApi.createUser(values);
        toast?.success("Đã thêm người dùng mới");
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
      render: (text, record) => (
        <Space>
          <Avatar size={28} src={record.avatar_url} style={{ backgroundColor: "#3A5686" }}>
            {(text || "U").charAt(0).toUpperCase()}
          </Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },

    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Sinh viên", value: "student" },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color={role === "admin" ? "blue" : "default"}>
          {role === "admin" ? "Quản trị" : "Sinh viên"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Khoá"
          size="small"
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (d) => new Date(d).toLocaleDateString("vi-VN"),
    },
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
            <Text type="secondary" style={{ fontSize: 13 }}>Tổng cộng {totalCount} người dùng</Text>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ marginBottom: 16, maxWidth: 360 }}
            allowClear
          />
          <Table
            dataSource={(Array.isArray(users) ? users : []).map((u) => ({ ...u, key: u.id }))}
            columns={columns}
            pagination={{

              current: page,
              pageSize: pageSize,
              total: totalCount,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              showSizeChanger: true,
            }}
            loading={loading}
          />
        </Card>

        {/* Modal thêm/sửa */}
        <Modal
          title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText="Lưu"
          cancelText="Huỷ"
          confirmLoading={saving}
        >
          <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
            <Form.Item label="Họ tên" name="full_name" rules={[{ required: true, message: "Nhập họ tên" }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, message: "Vui lòng nhập Email" }, { pattern: EMAIL_REGEX, message: "Email không đúng định dạng" }]}>
              <Input placeholder="email@truong.edu.vn" />
            </Form.Item>
            <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}>
              <Select options={[{ value: "student", label: "Sinh viên" }, { value: "admin", label: "Quản trị" }]} />
            </Form.Item>
            {!editingUser && (
              <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Nhập mật khẩu" }, { pattern: PASSWORD_REGEX, message: "Mật khẩu tối thiểu 6 ký tự" }]}>
                <Input.Password placeholder="••••••••" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Flex>
    </Flex>
  );
}
