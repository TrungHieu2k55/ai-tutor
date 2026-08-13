/**
 * Các biểu thức chính quy (Regular Expressions) dùng để kiểm tra dữ liệu.
 * Import trực tiếp các regex này ra để sử dụng trong Antd Form rules, .test(), .match(),...
 */

// Regex kiểm tra Email hợp lệ
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex kiểm tra Số điện thoại Việt Nam (ví dụ: 0912345678, +84912345678)
export const PHONE_REGEX = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

// Regex kiểm tra Mật khẩu cơ bản (Tối thiểu 6 ký tự)
export const PASSWORD_REGEX = /^.{6,}$/;

// Regex kiểm tra Mật khẩu mạnh (Tối thiểu 8 ký tự, có cả chữ và số)
export const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// Regex kiểm tra đường dẫn URL
export const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

// Regex kiểm tra đuôi file tài liệu (.pdf, .docx, .txt)
export const DOCUMENT_EXT_REGEX = /\.(pdf|docx|txt)$/i;
