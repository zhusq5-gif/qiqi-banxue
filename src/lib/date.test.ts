import { afterEach, describe, expect, it, vi } from 'vitest'

// 避免引入 @types/node：用 vi.stubEnv 修改 TZ
import { todaySH, weekStartSH } from './date'

describe('todaySH（Asia/Shanghai 固定时区）', () => {
  afterEach(() => vi.useRealTimers())

  it('UTC 16:30 已跨入上海次日（23:59→00:00 跨天）', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T16:30:00Z')) // 上海 2026-08-27 00:30
    expect(todaySH()).toBe('2026-08-27')
  })

  it('UTC 15:30 仍属上海当日', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T15:30:00Z')) // 上海 2026-08-26 23:30
    expect(todaySH()).toBe('2026-08-26')
  })

  it('设备时区非上海时不影响结果', () => {
    vi.stubEnv('TZ', 'America/New_York')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-26T16:30:00Z'))
    expect(todaySH()).toBe('2026-08-27')
    vi.unstubAllEnvs()
  })
})

describe('weekStartSH（周一起）', () => {
  it('周四对应本周一', () => {
    expect(weekStartSH('2026-08-27')).toBe('2026-08-24')
  })
  it('周日属于上一个自然周（周一为界）', () => {
    expect(weekStartSH('2026-08-30')).toBe('2026-08-24')
  })
  it('周一即本周起点', () => {
    expect(weekStartSH('2026-08-24')).toBe('2026-08-24')
  })
})
