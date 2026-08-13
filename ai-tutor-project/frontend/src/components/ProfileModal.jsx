import { Avatar, Button, Divider, Flex, Form, Input, Modal, Typography, Upload } from "antd";
import { useState } from "react";
import { authApi } from "~/api/client";
import { useToast } from "~/components/Toast";
import { useAuth } from "~/lib/AuthContext";

const { Title } = Typography;

export default function ProfileModal({ open, onClose, user = {}, onSave }) {
  const [form] = Form.useForm();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const { updateUser } = useAuth();
  const toast = useToast();

  function handleOpen() {
    form.setFieldsValue({
      full_name: user.full_name || "",
      email: user.email || "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  }

  async function handleSave(values) {
    setSaving(true);
    try {
      // 1. Update Profile (Họ tên) nếu có thay đổi
      if (values.full_name && values.full_name !== user.full_name) {
        const { data } = await authApi.updateProfile({ full_name: values.full_name });
        updateUser(data);
        toast?.success("Đã cập nhật thông tin cá nhân");
      }

      // 2. Change Password nếu có nhập mật khẩu mới
      if (values.new_password) {
        if (!values.current_password) {
          toast?.error("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu");
          setSaving(false);
          return;
        }
        await authApi.changePassword({
          current_password: values.current_password,
          new_password: values.new_password,
        });
        toast?.success("Đã đổi mật khẩu thành công!");
      }

      onSave?.(values);
      onClose?.();
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file) {
    setUploadingAvatar(true);
    try {
      const { data } = await authApi.uploadAvatar(file);
      updateUser(data);
      toast?.success("Đã cập nhật ảnh đại diện!");
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Upload ảnh thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setUploadingAvatar(false);
    }
    return false;
  }

  async function handleRemoveAvatar() {
    if (!user.avatar_url) return;
    setUploadingAvatar(true);
    try {
      const { data } = await authApi.deleteAvatar();
      updateUser(data);
      toast?.success("Đã xoá ảnh đại diện!");
    } catch (err) {
      toast?.error(err.response?.data?.detail || "Xoá ảnh thất bại.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <Modal
      title={<Title level={5} style={{ margin: 0 }}>Hồ sơ cá nhân</Title>}
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => { if (visible) handleOpen(); }}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose} style={{ minWidth: 100 }}>Huỷ</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving} style={{ minWidth: 140 }}>
            Lưu thay đổi
          </Button>
        </Flex>
      }
      width={520}
      centered
    >
      {/* Avatar section */}
      <Flex align="center" gap={16} style={{ marginBottom: 24, marginTop: 8 }}>
        <Avatar
          size={56}
          src={user.avatar_url}
          style={{ backgroundColor: "#3A5686", fontSize: 22, flexShrink: 0 }}
        >
          {(user.full_name || "A").charAt(0).toUpperCase()}
        </Avatar>
        <Flex vertical gap={4}>
          <Upload
            showUploadList={false}
            beforeUpload={handleAvatarUpload}
            accept="image/*"
          >
            <Button type="primary" size="small" loading={uploadingAvatar}>
              Tải ảnh lên
            </Button>
          </Upload>
          {user.avatar_url && (
            <Button
              type="link"
              danger
              size="small"
              disabled={uploadingAvatar}
              style={{ padding: 0, height: "auto" }}
              onClick={handleRemoveAvatar}
            >
              Xoá ảnh
            </Button>
          )}
        </Flex>
      </Flex>


      <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
        <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true, message: "Nhập họ tên" }]}>
          <Input size="large" />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input size="large" disabled style={{ background: "#f5f5f5", color: "#8c8c8c" }} />
        </Form.Item>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>Đổi mật khẩu</Title>

        <Form.Item label="Mật khẩu hiện tại" name="current_password">
          <Input.Password size="large" placeholder="••••••••" />
        </Form.Item>

        <Form.Item label="Mật khẩu mới" name="new_password">
          <Input.Password size="large" placeholder="••••••••" />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirm_password"
          dependencies={["new_password"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) return Promise.resolve();
                return Promise.reject(new Error("Mật khẩu không khớp!"));
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
