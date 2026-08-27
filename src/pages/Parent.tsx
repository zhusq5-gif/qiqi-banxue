import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import avatars from '../content/avatars.json'
import icons from '../content/icons.json'
import Avatar from '../components/Avatar'
import SubjectIcon from '../components/SubjectIcon'
import {
  archiveSubject,
  archiveWish,
  auth,
  createSubject,
  createWish,
  exportAllData,
  listCheckinsBetween,
  listCheckinsOn,
  listLedger,
  listSubjects,
  listWishes,
  rpcCheckin,
  rpcRedeem,
  sumLedger,
  updateProfile,
  updateSubject,
  updateWish,
  type Checkin,
  type LedgerEntry,
  type Profile,
  type Subject,
  type Wish,
} from '../lib/cloudbase'
import { todaySH, weekStartSH } from '../lib/date'
import { cx } from '../lib/cx'

type Tab = 'today' | 'stats' | 'subjects' | 'wishes' | 'more'

export default function Parent({
  profile,
  onProfileChange,
  onLogout,
}: {
  profile: Profile
  onProfileChange: (p: Profile) => void
  onLogout: () => void
}) {
  const [tab, setTab] = useState<Tab>('today')
  const [balance, setBalance] = useState(0)

  async function refreshBalance() {
    const ledger: LedgerEntry[] = await listLedger()
    setBalance(sumLedger(ledger))
  }

  useEffect(() => {
    refreshBalance()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">家长视图</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-amber-600 shadow">
            ⭐ {balance}
          </span>
          <Link
            to="/today"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-md active:scale-95"
            aria-label="返回孩子视图"
          >
            🧒
          </Link>
        </div>
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto">
        {(
          [
            ['today', '今日'],
            ['stats', '本周'],
            ['subjects', '科目'],
            ['wishes', '心愿'],
            ['more', '更多'],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'h-11 shrink-0 rounded-full px-5 font-bold',
              tab === id ? 'bg-amber-500 text-white shadow' : 'bg-white text-stone-600 shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'today' && <TodayTab onBalanceChange={refreshBalance} />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'subjects' && <SubjectsTab />}
      {tab === 'wishes' && <WishesTab balance={balance} onBalanceChange={refreshBalance} />}
      {tab === 'more' && (
        <MoreTab profile={profile} onProfileChange={onProfileChange} onLogout={onLogout} />
      )}
    </div>
  )
}

// ---------- 今日 ----------

function TodayTab({ onBalanceChange }: { onBalanceChange: () => void }) {
  const today = todaySH()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [todayStars, setTodayStars] = useState(0)

  async function load() {
    const [subs, checkins] = await Promise.all([listSubjects(), listCheckinsOn(today)])
    setSubjects(subs)
    const m: Record<string, boolean> = {}
    let stars = 0
    ;(checkins as Checkin[]).forEach((c) => {
      m[c.subject_id] = true
      stars += c.stars_awarded
    })
    setDone(m)
    setTodayStars(stars)
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function makeup(s: Subject) {
    await rpcCheckin(s.id, today) // 当天补卡：与正常打卡同一 RPC
    await load()
    onBalanceChange()
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="mb-4 text-sm text-stone-500">
        {today} · 今日获得 <span className="font-bold text-amber-600">⭐ {todayStars}</span>
      </p>
      {subjects.length === 0 && <p className="py-6 text-center text-stone-400">还没有科目，去「科目」添加</p>}
      <ul className="divide-y divide-stone-100">
        {subjects.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <SubjectIcon id={s.icon_id} size={40} />
            <span className="flex-1 font-bold">{s.name}</span>
            {done[s.id] ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                ✓ 已完成
              </span>
            ) : (
              <button
                onClick={() => makeup(s)}
                className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 active:scale-95"
              >
                补卡
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- 本周统计 ----------

function StatsTab() {
  const [days, setDays] = useState<Array<{ date: string; done: number; total: number }>>([])
  const [totalSubjects, setTotalSubjects] = useState(0)

  useEffect(() => {
    ;(async () => {
      const from = weekStartSH()
      const to = todaySH()
      const [subs, checkins] = await Promise.all([listSubjects(), listCheckinsBetween(from, to)])
      const countByDate: Record<string, number> = {}
      ;(checkins as Checkin[]).forEach((c) => {
        countByDate[c.date] = (countByDate[c.date] || 0) + 1
      })
      const list: Array<{ date: string; done: number; total: number }> = []
      const [y, m, d] = from.split('-').map(Number)
      let cur = new Date(Date.UTC(y, m - 1, d, 12))
      const end = new Date(Date.UTC(...(to.split('-').map(Number) as [number, number, number]), 12))
      while (cur <= end) {
        const ds = cur.toISOString().slice(0, 10)
        list.push({ date: ds, done: countByDate[ds] || 0, total: subs.length })
        cur = new Date(cur.getTime() + 86400000)
      }
      setDays(list)
      setTotalSubjects(subs.length)
    })()
  }, [])

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="mb-4 text-sm text-stone-500">本周每日完成（共 {totalSubjects} 个科目）</p>
      {totalSubjects === 0 && <p className="py-6 text-center text-stone-400">先去「科目」添加科目</p>}
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {days.map((d) => {
          const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold text-amber-600">{d.done}</span>
              <div className="flex h-28 w-full items-end justify-center rounded-xl bg-amber-50">
                <div
                  className="w-2/3 rounded-t-xl bg-amber-400 transition-all"
                  style={{ height: Math.max(pct, d.done > 0 ? 8 : 2) + '%' }}
                />
              </div>
              <span className="text-xs text-stone-500">{d.date.slice(8)}日</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- 科目管理 ----------

function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [iconId, setIconId] = useState(icons[0].id)
  const [stars, setStars] = useState(1)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState<Subject | null>(null)

  async function load() {
    setSubjects(await listSubjects())
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function add() {
    if (!name.trim()) { setMsg('请填写科目名称'); return }
    await createSubject({ name: name.trim(), icon_id: iconId, stars })
    setName('')
    setStars(1)
    setMsg('')
    await load()
  }

  async function saveEdit() {
    if (!editing || !editing.name.trim()) return
    await updateSubject(editing.id, { name: editing.name.trim(), icon_id: editing.icon_id, stars: editing.stars })
    setEditing(null)
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="mb-3 font-bold">添加科目</p>
        <input
          className="mb-3 h-12 w-full rounded-2xl border border-stone-200 px-4 outline-none focus:border-amber-400"
          placeholder="科目名称，如：英语磨耳朵"
          value={editing ? editing.name : name}
          onChange={(e) =>
            editing ? setEditing({ ...editing, name: e.target.value }) : setName(e.target.value)
          }
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {icons.map((i) => (
            <button
              key={i.id}
              onClick={() => (editing ? setEditing({ ...editing, icon_id: i.id }) : setIconId(i.id))}
              className={cx(
                'rounded-2xl p-1',
                (editing ? editing.icon_id : iconId) === i.id && 'ring-2 ring-amber-400',
              )}
            >
              <SubjectIcon id={i.id} size={40} />
            </button>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-stone-600">打卡星星数</span>
          <button
            className="h-10 w-10 rounded-full bg-amber-100 text-xl font-bold active:scale-95"
            onClick={() => {
              const cur = editing ? editing.stars : stars
              if (cur > 1) editing ? setEditing({ ...editing, stars: cur - 1 }) : setStars(cur - 1)
            }}
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">
            {editing ? editing.stars : stars}
          </span>
          <button
            className="h-10 w-10 rounded-full bg-amber-100 text-xl font-bold active:scale-95"
            onClick={() => {
              const cur = editing ? editing.stars : stars
              if (cur < 10) editing ? setEditing({ ...editing, stars: cur + 1 }) : setStars(cur + 1)
            }}
          >
            +
          </button>
        </div>
        <button
          className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white active:scale-[0.98]"
          onClick={editing ? saveEdit : add}
        >
          {editing ? '保存修改' : '添加'}
        </button>
        {editing && (
          <button className="mt-2 w-full text-sm text-stone-500" onClick={() => setEditing(null)}>
            取消编辑
          </button>
        )}
        {msg && <p className="mt-3 text-center text-sm text-red-500">{msg}</p>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <ul className="divide-y divide-stone-100">
          {subjects.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <SubjectIcon id={s.icon_id} size={40} />
              <div className="flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-xs text-stone-400">⭐ {s.stars} / 次</p>
              </div>
              <button
                className="rounded-full bg-stone-100 px-3 py-1 text-sm active:scale-95"
                onClick={() => setEditing({ ...s })}
              >
                编辑
              </button>
              <button
                className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-500 active:scale-95"
                onClick={async () => {
                  await archiveSubject(s.id) // 归档保留历史
                  await load()
                }}
              >
                归档
              </button>
            </li>
          ))}
        </ul>
        {subjects.length === 0 && <p className="py-6 text-center text-stone-400">还没有科目</p>}
      </div>
    </div>
  )
}

// ---------- 心愿 ----------

function WishesTab({ balance, onBalanceChange }: { balance: number; onBalanceChange: () => void }) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [title, setTitle] = useState('')
  const [stars, setStars] = useState(20)
  const [msg, setMsg] = useState('')
  const [celebrating, setCelebrating] = useState<Wish | null>(null)
  const [editingWish, setEditingWish] = useState<Wish | null>(null)

  async function load() {
    setWishes(await listWishes())
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function add() {
    if (!title.trim()) { setMsg('请填写心愿名称'); return }
    await createWish({ title: title.trim(), stars })
    setTitle('')
    setMsg('')
    await load()
  }

  async function saveWishEdit() {
    if (!editingWish || !editingWish.title.trim()) return
    await updateWish(editingWish.id, { title: editingWish.title.trim(), stars: editingWish.stars })
    setEditingWish(null)
    await load()
  }

  async function doRedeem(w: Wish) {
    const r = await rpcRedeem(w.id)
    if (!r.ok) {
      setMsg(r.error === 'insufficient_stars' ? '星星还不够，继续加油！' : '兑换失败')
      return
    }
    setCelebrating(w)
    setTimeout(() => setCelebrating(null), 2000)
    await load()
    onBalanceChange()
  }

  return (
    <div className="space-y-4">
      {celebrating && (
        <div className="rounded-3xl bg-emerald-100 p-8 text-center">
          <p className="text-5xl">🎉</p>
          <p className="mt-2 text-lg font-bold text-emerald-700">兑换成功！{celebrating.title}</p>
        </div>
      )}

      {editingWish && (
        <div className="rounded-3xl bg-white p-5 shadow ring-2 ring-amber-400">
          <p className="mb-3 font-bold">编辑心愿</p>
          <input
            className="mb-3 h-12 w-full rounded-2xl border border-stone-200 px-4 outline-none focus:border-amber-400"
            value={editingWish.title}
            onChange={(e) => setEditingWish({ ...editingWish, title: e.target.value })}
          />
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-stone-600">所需星星</span>
            <input
              type="number"
              min={1}
              className="h-12 w-24 rounded-2xl border border-stone-200 px-3 text-center text-lg font-bold outline-none focus:border-amber-400"
              value={editingWish.stars}
              onChange={(e) =>
                setEditingWish({ ...editingWish, stars: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </div>
          <button
            className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white active:scale-[0.98]"
            onClick={saveWishEdit}
          >
            保存修改
          </button>
          <button className="mt-2 w-full text-sm text-stone-500" onClick={() => setEditingWish(null)}>
            取消编辑
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="mb-3 font-bold">添加心愿（当前 ⭐ {balance}）</p>
        <input
          className="mb-3 h-12 w-full rounded-2xl border border-stone-200 px-4 outline-none focus:border-amber-400"
          placeholder="心愿名称，如：去一次游乐场"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-stone-600">所需星星</span>
          <input
            type="number"
            min={1}
            className="h-12 w-24 rounded-2xl border border-stone-200 px-3 text-center text-lg font-bold outline-none focus:border-amber-400"
            value={stars}
            onChange={(e) => setStars(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <button
          className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white active:scale-[0.98]"
          onClick={add}
        >
          添加
        </button>
        {msg && <p className="mt-3 text-center text-sm text-red-500">{msg}</p>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <ul className="divide-y divide-stone-100">
          {wishes.map((w) => {
            const pct = Math.min(100, balance > 0 ? Math.round((balance / w.stars) * 100) : 0)
            const enough = balance >= w.stars
            return (
              <li key={w.id} className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold">{w.title}</p>
                    <p className="text-xs text-stone-400">
                      ⭐ {balance} / {w.stars}
                    </p>
                  </div>
                  <LongPressButton onConfirm={() => doRedeem(w)} disabled={!enough} />
                  <button
                    className="rounded-full bg-stone-100 px-3 py-1 text-sm active:scale-95"
                    onClick={() => setEditingWish({ ...w })}
                  >
                    编辑
                  </button>
                  <button
                    className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-500 active:scale-95"
                    onClick={async () => {
                      await archiveWish(w.id)
                      await load()
                    }}
                  >
                    下架
                  </button>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-amber-50">
                  <div
                    className={cx('h-full rounded-full', enough ? 'bg-emerald-400' : 'bg-amber-400')}
                    style={{ width: pct + '%' }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        {wishes.length === 0 && <p className="py-6 text-center text-stone-400">还没有心愿</p>}
      </div>
    </div>
  )
}

/** 长按 2 秒确认按钮（防儿童误触兑换） */
function LongPressButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [progress, setProgress] = useState(0)
  const timer = useRef<number | null>(null)

  function start() {
    if (disabled) return
    const t0 = Date.now()
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 2000)
      setProgress(p)
      if (p >= 1) {
        stop()
        onConfirm()
      }
    }, 50)
  }

  function stop() {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
    setProgress(0)
  }

  return (
    <button
      className={cx(
        'relative h-10 w-24 overflow-hidden rounded-full text-sm font-bold active:scale-95',
        disabled ? 'bg-stone-100 text-stone-400' : 'bg-amber-500 text-white',
      )}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {!disabled && (
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500"
          style={{ width: progress * 100 + '%' }}
        />
      )}
      <span className="relative">{disabled ? '星星不足' : '长按兑换'}</span>
    </button>
  )
}

// ---------- 更多：档案 / 导出 / 退出 ----------

function MoreTab({
  profile,
  onProfileChange,
  onLogout,
}: {
  profile: Profile
  onProfileChange: (p: Profile) => void
  onLogout: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [avatarId, setAvatarId] = useState(profile.avatar_id)
  const [birthday, setBirthday] = useState(profile.birthday)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) { setMsg('请填写昵称'); return }
    setBusy(true)
    try {
      await updateProfile(profile.id, { name: name.trim(), avatar_id: avatarId, birthday })
      onProfileChange({ ...profile, name: name.trim(), avatar_id: avatarId, birthday })
      setMsg('已保存')
    } catch {
      setMsg('保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function doExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qiqi-banxue-' + todaySH() + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function logout() {
    await auth.signOut()
    onLogout()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="mb-3 font-bold">宝贝档案</p>
        <div className="mb-4 grid grid-cols-4 gap-3">
          {avatars.map((a) => (
            <button
              key={a.id}
              onClick={() => setAvatarId(a.id)}
              className={cx(
                'flex justify-center rounded-2xl p-2',
                avatarId === a.id ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-stone-50',
              )}
            >
              <Avatar id={a.id} size={48} />
            </button>
          ))}
        </div>
        <input
          className="mb-3 h-12 w-full rounded-2xl border border-stone-200 px-4 outline-none focus:border-amber-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="date"
          className="mb-4 h-12 w-full rounded-2xl border border-stone-200 px-4 outline-none focus:border-amber-400"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <button
          className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white active:scale-[0.98] disabled:opacity-50"
          disabled={busy}
          onClick={save}
        >
          保存
        </button>
        {msg && <p className="mt-3 text-center text-sm text-stone-500">{msg}</p>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="mb-3 font-bold">数据</p>
        <p className="mb-4 text-sm text-stone-500">
          导出全部数据（档案、科目、打卡、星星账本、心愿）为 JSON 文件，可随时迁移。
        </p>
        <button
          className="h-12 w-full rounded-2xl bg-stone-100 font-bold active:scale-[0.98]"
          onClick={doExport}
        >
          导出全部数据
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <button
          className="h-12 w-full rounded-2xl bg-red-50 font-bold text-red-500 active:scale-[0.98]"
          onClick={logout}
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
