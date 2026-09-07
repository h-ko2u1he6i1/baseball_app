// 日付ユーティリティ（server-only にしない: テスト・クライアント双方から使う）

const JST_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 与えた時刻（既定は現在）を JST の "YYYY-MM-DD" に変換 */
export function jstYmd(d: Date = new Date()): string {
  return JST_YMD.format(d);
}

/** JST の「今日」から n 日前の "YYYY-MM-DD" */
export function jstYmdDaysAgo(n: number): string {
  const d = new Date(`${jstYmd()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** "2026-09-07" -> "2026/09/07"（Date を経由しないのでタイムゾーンの影響なし） */
export function formatIsoDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return y && m && d ? `${y}/${m}/${d}` : ymd;
}

/** "YYYY-MM-DD" 形式かつ実在する日付か */
export function isValidDateString(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
}
