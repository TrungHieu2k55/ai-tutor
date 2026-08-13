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
