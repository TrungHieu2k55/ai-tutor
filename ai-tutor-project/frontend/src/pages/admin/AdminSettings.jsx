import { ApiOutlined, DatabaseOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Flex, Form, Input, InputNumber, Select, Switch, Typography } from "antd";
import { useState } from "react";
import AdminSidebar from "~/components/AdminSidebar";
import { useToast } from "~/components/Toast";

const { Title, Text } = Typography;

export default function AdminSettings() {
  const [form] = Form.useForm();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  function handleSave(values) {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast?.success("Đã lưu cài đặt hệ thống thành công!");
    }, 600);
  }

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px", maxWidth: 900 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Cài đặt hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Cấu hình tham số RAG, LLM providers và quy định tài liệu</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            app_name: "AI Tutor",
            llm_provider: "gemini",
            embedding_model: "text-embedding-3-small",
            chunk_size: 800,
            chunk_overlap: 120,
            max_upload_mb: 50,
            allow_registration: true,
          }}
        >
          {/* Cấu hình chung */}
          <Card title={<Flex align="center" gap={8}><SettingOutlined /> Cấu hình chung</Flex>} style={{ borderRadius: 12, marginBottom: 20 }}>
            <Form.Item label="Tên ứng dụng" name="app_name" rules={[{ required: true }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item label="Cho phép đăng ký tài khoản mới" name="allow_registration" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          {/* Cấu hình AI / LLM */}
          <Card title={<Flex align="center" gap={8}><ApiOutlined /> Cấu hình LLM & AI Pipeline</Flex>} style={{ borderRadius: 12, marginBottom: 20 }}>
            <Form.Item label="LLM Provider mặc định" name="llm_provider">
              <Select
                size="large"
                options={[
                  { label: "DeepSeek AI (Ưu tiên - Nhanh & Thông minh)", value: "deepseek" },
                  { label: "Google Gemini", value: "gemini" },
                  { label: "Anthropic Claude", value: "anthropic" },
                  { label: "Offline (Không gọi LLM API)", value: "offline" },
                ]}
              />
            </Form.Item>
            <Form.Item label="Model Embedding" name="embedding_model">
              <Input size="large" disabled />
            </Form.Item>
          </Card>

          {/* Cấu hình RAG Chunking & Storage */}
          <Card title={<Flex align="center" gap={8}><DatabaseOutlined /> Cấu hình RAG Chunking & Tải lên</Flex>} style={{ borderRadius: 12, marginBottom: 20 }}>
            <Flex gap={16}>
              <Form.Item label="Kích thước Chunk (ký tự)" name="chunk_size" style={{ flex: 1 }}>
                <InputNumber size="large" style={{ width: "100%" }} min={200} max={2000} />
              </Form.Item>
              <Form.Item label="Độ gối Chunk Overlap (ký tự)" name="chunk_overlap" style={{ flex: 1 }}>
                <InputNumber size="large" style={{ width: "100%" }} min={0} max={500} />
              </Form.Item>
            </Flex>
            <Form.Item label="Dung lượng file tối đa (MB)" name="max_upload_mb">
              <InputNumber size="large" style={{ width: "100%" }} min={1} max={200} />
            </Form.Item>
          </Card>

          <Button type="primary" icon={<SaveOutlined />} size="large" htmlType="submit" loading={saving} style={{ background: "#2F6FED" }}>
            Lưu cài đặt
          </Button>
        </Form>
      </Flex>
    </Flex>
  );
}
