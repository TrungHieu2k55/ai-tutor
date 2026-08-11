import { Avatar, Button, Divider, Flex, Form, Input, Modal, Typography, Upload } from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

/**
 * ProfileModal — Popup hồ sơ cá nhân (khớp Figma 07)
 *
 * Props:
 *   open:       boolean — hiện/ẩn modal
 *   onClose:    () => void
 *   user:       { full_name, email } — thông tin user hiện tại
 *   onSave:     (values) => void — callback khi lưu
 */
export default function ProfileModal({ open, onClose, user = {}, onSave }) {
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(null);

  function handleOpen() {
    form.setFieldsValue({
      full_name: user.full_name || "Nguyễn An",
      email: user.email || "an.nguyen@vku.edu.vn",
    });
  }

  function handleSave(values) {
    onSave?.(values);
    onClose?.();
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null);
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
          <Button type="primary" onClick={() => form.submit()} style={{ minWidth: 140 }}>
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
          src={avatarUrl}
          style={{ backgroundColor: "#3A5686", fontSize: 22, flexShrink: 0 }}
        >
          {(user.full_name || "A").charAt(0).toUpperCase()}
        </Avatar>
        <Flex vertical gap={4}>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              const url = URL.createObjectURL(file);
              setAvatarUrl(url);
              return false;
            }}
          >
            <Button type="primary" size="small">Tải ảnh lên</Button>
          </Upload>
          <Button
            type="link"
            danger
            size="small"
            style={{ padding: 0, height: "auto" }}
            onClick={handleRemoveAvatar}
          >
            Xoá ảnh
          </Button>
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
          <Input.Password size="large" placeholder="••••••" />
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
