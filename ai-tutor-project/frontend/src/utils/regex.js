/**
 * Tập hợp toàn bộ biểu thức chính quy (Regular Expressions) của dự án.
 */

export * from "./validators";

// Regex cho công thức toán học / LaTeX
export const LATEX_REGEX = {
  TEXT: /\\text\{([^}]+)\}/g,
  DOUBLE_DOLLAR: /\$\$(.*?)\$\$/g,
  SINGLE_DOLLAR: /\$(.*?)\$/g,
  TIMES: /\\times/g,
  CDOT: /\\cdot/g,
  DIV: /\\div/g,
  LE: /\\le/g,
  GE: /\\ge/g,
  NEQ: /\\neq/g,
  APPROX: /\\approx/g,
  INFTY: /\\infty/g,
  RIGHT_ARROW: /\\rightarrow/g,
  RIGHT_DOUBLE_ARROW: /\\Rightarrow/g,
  SUM: /\\sum/g,
  PROD: /\\prod/g,
  FRAC: /\\frac\{([^}]+)\}\{([^}]+)\}/g,
  SQRT: /\\sqrt\{([^}]+)\}/g,
};
