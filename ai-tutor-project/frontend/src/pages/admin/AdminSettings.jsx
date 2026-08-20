import { ApiOutlined, DatabaseOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Form, Input, InputNumber, Select, Spin, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import { adminApi } from "~/api/client";
import AdminSidebar from "~/components/AdminSidebar";
import { useToast } from "~/components/Toast";

const { Title, Text } = Typography;

export default function AdminSettings() {
  const [form] = Form.useForm();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedProvider = Form.useWatch("llm_provider", form);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data } = await adminApi.getSettings();
        form.setFieldsValue({
          app_name: data.app_name || "AI Tutor",
          llm_provider: data.llm_provider || "openrouter",
          openrouter_model: data.openrouter_model || "deepseek/deepseek-chat",
          embedding_model: data.embedding_model || "text-embedding-3-small",
          chunk_size: data.chunk_size || 800,
          chunk_overlap: data.chunk_overlap || 120,
          max_upload_mb: data.max_upload_mb || 50,
          allow_registration: data.allow_registration ?? true,
        });
      } catch {
        toast?.error("Không thể tải cài đặt hệ thống.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  async function handleSave(values) {
    setSaving(true);
    try {
      await adminApi.updateSettings(values);
      toast?.success("Đã lưu cài đặt hệ thống thành công!");
    } catch {
      toast?.error("Lỗi khi lưu cài đặt hệ thống.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <AdminSidebar />

      <Flex vertical flex={1} gap={24} style={{ padding: "40px 48px", maxWidth: 900 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Cài đặt hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Cấu hình tham số RAG, LLM providers và quy định tài liệu</Text>
        </div>

        {loading ? (
          <Flex justify="center" align="center" style={{ minHeight: 300 }}>
            <Spin size="large" />
          </Flex>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              app_name: "AI Tutor",
              llm_provider: "openrouter",
              openrouter_model: "deepseek/deepseek-chat",
              embedding_model: "text-embedding-3-small",
              chunk_size: 800,
              chunk_overlap: 120,
              max_upload_mb: 50,
              allow_registration: true,
            }}
          >
            {/* Cấu hình chung */}
            <Card title={<Flex align="center" gap={8}><SettingOutlined /> Cấu hình chung</Flex>} style={{ borderRadius: 12, marginBottom: 20 }}>
              <Form.Item label="Tên ứng dụng" name="app_name" rules={[{ required: true, message: "Vui lòng nhập tên ứng dụng" }]}>
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
                    { label: "OpenRouter AI (Đa mô hình: DeepSeek, Gemini, Llama, GPT)", value: "openrouter" },
                    { label: "DeepSeek AI (Trực tiếp)", value: "deepseek" },
                    { label: "Google Gemini (Trực tiếp)", value: "gemini" },
                    { label: "Anthropic Claude (Trực tiếp)", value: "anthropic" },
                    { label: "Offline (Trích xuất tài liệu trực tiếp, không gọi LLM)", value: "offline" },
                  ]}
                />
              </Form.Item>

              {selectedProvider === "openrouter" && (
                <Form.Item
                  label="Mô hình OpenRouter (OpenRouter Model)"
                  name="openrouter_model"
                  rules={[{ required: true, message: "Vui lòng chọn model" }]}
                >
                  <Select
                    size="large"
                    options={[
                      { label: "DeepSeek V3 (deepseek/deepseek-chat) - Khuyên dùng", value: "deepseek/deepseek-chat" },
                      { label: "DeepSeek R1 Reasoning (deepseek/deepseek-r1:free)", value: "deepseek/deepseek-r1:free" },
                      { label: "Google Gemini 2.5 Flash (google/gemini-2.5-flash)", value: "google/gemini-2.5-flash" },
                      { label: "Meta Llama 3.3 70B (meta-llama/llama-3.3-70b-instruct)", value: "meta-llama/llama-3.3-70b-instruct" },
                      { label: "OpenAI GPT-4o Mini (openai/gpt-4o-mini)", value: "openai/gpt-4o-mini" },
                      { label: "Anthropic Claude 3.5 Haiku (anthropic/claude-3.5-haiku)", value: "anthropic/claude-3.5-haiku" },
                    ]}
                  />
                </Form.Item>
              )}

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
        )}
      </Flex>
    </Flex>
  );
}
