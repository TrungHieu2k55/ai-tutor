import { Spin } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "~/components/ProtectedRoute";
import { AuthProvider, useAuth } from "~/lib/AuthContext";
import AdminAIMonitor from "~/pages/admin/AdminAIMonitor";
import AdminDashboard from "~/pages/admin/AdminDashboard";
import AdminDocuments from "~/pages/admin/AdminDocuments";
import AdminSettings from "~/pages/admin/AdminSettings";
import AdminUsers from "~/pages/admin/AdminUsers";
import ChatPage from "~/pages/ChatPage";
import LibraryPage from "~/pages/LibraryPage";
import LoginPage from "~/pages/LoginPage";
import NotFoundPage from "~/pages/NotFoundPage";
import ProgressPage from "~/pages/ProgressPage";

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/library"} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:documentId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><AdminDocuments /></ProtectedRoute>} />
        <Route path="/admin/ai-monitor" element={<ProtectedRoute requireAdmin><AdminAIMonitor /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
