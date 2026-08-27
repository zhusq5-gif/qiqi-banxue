/** 统一 Asia/Shanghai 时区的日期工具（D3：日期无时区歧义） */

export function todaySH(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** 本周一（含）的日期串 */
export function weekStartSH(today = todaySH()): string {
  const [y, m, d] = today.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d, 12))
  const offset = (utc.getUTCDay() + 6) % 7 // 周一为一周起点
  return new Date(utc.getTime() - offset * 86400000).toISOString().slice(0, 10)
}

/** 最近 n 天（含今天）的日期串数组，升序 */
export function lastNDays(n: number, today = todaySH()): string[] {
  const [y, m, d] = today.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d, 12))
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base.getTime() - i * 86400000).toISOString().slice(0, 10))
  }
  return out
}
