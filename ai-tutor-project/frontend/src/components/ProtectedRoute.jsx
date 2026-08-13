import { Alert, Button, Card, Flex, Result, Spin } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "~/lib/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();


  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireAdmin && user?.role !== "admin") {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh", background: "#F3F6FB", padding: 24 }}>
        <Card style={{ maxWidth: 520, borderRadius: 16, textAlign: "center" }} styles={{ body: { padding: 32 } }}>
          <Result
            status="403"
            title="Yêu cầu Quyền Quản trị viên"
            subTitle="Tài khoản hiện tại của bạn là Sinh viên (Student) nên không thể truy cập các API và trang Quản trị."
            extra={
              <Flex vertical gap={12} align="center">
                <Alert
                  type="info"
                  showIcon
                  style={{ textAlign: "left", fontSize: 13 }}
                  message="Đăng nhập tài khoản Quản trị"
                  description="Vui lòng đăng xuất và đăng nhập lại bằng tài khoản admin (ví dụ: admin@aitutor.vn / admin123) hoặc liên hệ Quản trị viên hệ thống để cấp quyền."
                />
                <Flex gap={12} justify="center" wrap="wrap" style={{ marginTop: 8 }}>
                  <Button type="primary" onClick={() => navigate("/library")} style={{ background: "#2F6FED" }}>
                    Quay lại Thư viện
                  </Button>
                </Flex>
              </Flex>
            }
          />
        </Card>
      </Flex>
    );
  }


  return children;
}
