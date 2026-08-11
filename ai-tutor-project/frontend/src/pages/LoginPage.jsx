import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      navigate("/library");
    } catch (err) {
      setError(err.response?.data?.detail || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-[420px] shrink-0 bg-navy flex-col justify-center px-14 gap-4 relative overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full bg-accent/20 blur-3xl -bottom-16 -right-10" />
        <div className="w-11 h-11 rounded-xl bg-accent relative z-10" />
        <h1 className="text-[26px] font-semibold text-white relative z-10">AI Tutor</h1>
        <p className="text-sm text-white/60 max-w-[300px] relative z-10">
          Học cùng tài liệu của bạn — hỏi gì AI cũng tra cứu và trả lời kèm trích dẫn nguồn rõ ràng.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-10">
        <form onSubmit={handleSubmit} className="w-full max-w-[340px] flex flex-col gap-4">
          <div>
            <h2 className="text-[22px] font-semibold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
            <p className="text-[13px] text-muted mt-1">
              {mode === "login" ? "Tiếp tục vào không gian học tập của bạn" : "Bắt đầu học cùng AI Tutor"}
            </p>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {mode === "register" && (
            <Field label="Họ và tên">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn An"
                className="input"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@truong.edu.vn"
              className="input"
            />
          </Field>

          <Field label="Mật khẩu">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white text-[13.5px] font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[12.5px] text-muted text-left"
          >
            {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
