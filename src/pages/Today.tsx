import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import StarBalance from '../components/StarBalance'
import SubjectIcon from '../components/SubjectIcon'
import {
  listCheckinsOn,
  listLedger,
  listSubjects,
  rpcCheckin,
  sumLedger,
  type Checkin,
  type Profile,
  type Subject,
} from '../lib/cloudbase'
import { todaySH } from '../lib/date'
import { cx } from '../lib/cx'

function playDing() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.setValueAtTime(1174, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    o.start()
    o.stop(ctx.currentTime + 0.65)
  } catch {
    /* 音频失败不影响功能 */
  }
}

export default function Today({ profile }: { profile: Profile }) {
  const today = todaySH()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [burst, setBurst] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [subs, checkins, ledger] = await Promise.all([
        listSubjects(),
        listCheckinsOn(today),
        listLedger(),
      ])
      setSubjects(subs)
      const m: Record<string, boolean> = {}
      ;(checkins as Checkin[]).forEach((c) => { m[c.subject_id] = true })
      setDone(m)
      setBalance(sumLedger(ledger))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function tap(s: Subject) {
    if (done[s.id]) return
    // 乐观更新（幂等由数据库唯一约束兜底）
    setDone((prev) => ({ ...prev, [s.id]: true }))
    setBalance((b) => b + s.stars)
    playDing()
    setBurst(s.id)
    setTimeout(() => setBurst(null), 1000)
    try {
      const r = await rpcCheckin(s.id, today)
      if (!r.ok) throw new Error(r.error || '打卡失败')
      if (r.already) await load() // 重复打卡：以服务端数据为准
    } catch {
      setDone((prev) => { const n = { ...prev }; delete n[s.id]; return n })
      setBalance((b) => b - s.stars)
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar id={profile.avatar_id} size={48} />
          <div>
            <p className="text-lg font-bold">{profile.name}</p>
            <p className="text-xs text-stone-500">{today} · 今日打卡</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarBalance value={balance} />
          <Link
            to="/parent"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-md active:scale-95"
            aria-label="家长视图"
          >
            👨‍👩‍👧
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="animate-pulse text-4xl">⏳</div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-16 text-center text-stone-500">
          <p className="text-5xl">🌱</p>
          <p className="mt-4 text-lg">还没有学习科目</p>
          <Link to="/parent" className="mt-2 inline-block text-amber-600 underline underline-offset-4">
            去家长视图添加第一个科目
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {subjects.map((s) => {
            const isDone = !!done[s.id]
            return (
              <button
                key={s.id}
                onClick={() => tap(s)}
                className={cx(
                  'relative flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-3xl bg-white p-4 shadow-md transition active:scale-[0.97]',
                  isDone && 'bg-emerald-50 ring-2 ring-emerald-300',
                  burst === s.id && 'star-pop',
                )}
              >
                {burst === s.id && (
                  <span className="float-up pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-3xl">
                    ⭐
                  </span>
                )}
                <SubjectIcon id={s.icon_id} size={56} />
                <span className="text-base font-bold">{s.name}</span>
                {isDone ? (
                  <span className="rounded-full bg-emerald-400 px-3 py-0.5 text-sm font-bold text-white">
                    ✓ 完成
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-bold text-amber-700">
                    ⭐ {s.stars}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
