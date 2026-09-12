/**
 * 年月值对象与纯导航（无 UI、无副作用）。
 * SRP：只表达「哪一年哪一月」；OCP：扩展范围/步长时加函数即可。
 */

export type YearMonth = {
  year: number;
  /** 1–12 */
  month: number;
};

export function toYearMonth(date = new Date()): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** 落到该月 1 号，便于日历/请求复用 */
export function yearMonthToDate(ym: YearMonth): Date {
  return new Date(ym.year, ym.month - 1, 1);
}

export function yearMonthKey(ym: YearMonth): string {
  return `${ym.year}-${ym.month}`;
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

export function shiftYearMonth(ym: YearMonth, deltaMonths: number): YearMonth {
  return toYearMonth(new Date(ym.year, ym.month - 1 + deltaMonths, 1));
}

export function clampYearMonth(
  ym: YearMonth,
  min: YearMonth,
  max: YearMonth,
): YearMonth {
  const t = ym.year * 12 + ym.month;
  const lo = min.year * 12 + min.month;
  const hi = max.year * 12 + max.month;
  if (t < lo) return { ...min };
  if (t > hi) return { ...max };
  return ym;
}

/** 生成可选年份（默认以锚点为中心前后各 span 年） */
export function listYearOptions(anchorYear: number, span = 5): number[] {
  const years: number[] = [];
  for (let y = anchorYear - span; y <= anchorYear + span; y += 1) {
    years.push(y);
  }
  return years;
}

export const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
] as const;

export function formatYearMonth(ym: YearMonth): string {
  return `${ym.year}年${ym.month}月`;
}
