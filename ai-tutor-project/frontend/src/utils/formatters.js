import { LATEX_REGEX } from "./regex";

/**
 * Định dạng các công thức toán / ký tự LaTeX sang dạng dễ đọc trong giao diện Chat.
 * @param {string} text 
 * @returns {string}
 */
export function formatMathText(text) {
  if (!text) return "";
  return text
    .replace(LATEX_REGEX.TEXT, "$1")
    .replace(LATEX_REGEX.DOUBLE_DOLLAR, "$1")
    .replace(LATEX_REGEX.SINGLE_DOLLAR, "$1")
    .replace(LATEX_REGEX.TIMES, "×")
    .replace(LATEX_REGEX.CDOT, "·")
    .replace(LATEX_REGEX.DIV, "÷")
    .replace(LATEX_REGEX.LE, "≤")
    .replace(LATEX_REGEX.GE, "≥")
    .replace(LATEX_REGEX.NEQ, "≠")
    .replace(LATEX_REGEX.APPROX, "≈")
    .replace(LATEX_REGEX.INFTY, "∞")
    .replace(LATEX_REGEX.RIGHT_ARROW, "→")
    .replace(LATEX_REGEX.RIGHT_DOUBLE_ARROW, "⇒")
    .replace(LATEX_REGEX.SUM, "∑")
    .replace(LATEX_REGEX.PROD, "∏")
    .replace(LATEX_REGEX.FRAC, "($1/$2)")
    .replace(LATEX_REGEX.SQRT, "√($1)");
}

export function cleanUnicodeText(text) {
  if (!text) return "";
  let s = String(text);

  // 1. Chuẩn hóa Unicode sang dạng dựng sẵn (NFC) tránh lỗi phông / rớt dấu tiếng Việt
  try {
    s = s.normalize("NFC");
  } catch (e) {
    // fallback if environment doesn't support
  }

  // 2. Chuyển đổi các ligatures typographic phổ biến trong PDF thành ký tự thường
  s = s
    .replace(/\uFB00/g, "ff")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/\uFB05/g, "ft")
    .replace(/\uFB06/g, "st")
    .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g, "") // soft hyphen & zero-width
    .replace(/\u00A0/g, " "); // non-breaking space

  // 3. Nối các từ bị gãy do dấu gạch nối xuống dòng trong tài liệu (line-wrap hyphen)
  s = s.replace(/(\p{L}+)-\s*\n\s*(\p{L}+)/gu, "$1$2");

  // 4. Thay thế xuống dòng đơn lẻ trong câu văn thành dấu cách
  s = s.replace(/([^\n])\n([^\n])/g, "$1 $2");

  // 5. Chuẩn hóa khoảng trắng liên tiếp
  s = s.replace(/[ \t]+/g, " ").trim();

  return s;
}

/**
 * Tối ưu nội dung trích dẫn tham chiếu (snippet) không bị lỗi phông, hiển thị mượt mà.
 * @param {string} text
 * @returns {string}
 */
export function formatSnippetText(text) {
  if (!text) return "";
  const cleaned = cleanUnicodeText(text);
  return formatMathText(cleaned);
}
