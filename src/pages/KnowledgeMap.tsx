import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import chineseGrade1 from '../content/curriculum/chinese-g1.json'

type SeedItem = {
  id: string
  grade: number
  semester: number
  book: string
  unit: string
  label: string
  reviewStatus: string
}

const stats = [
  ['语文知识点', '299'],
  ['英语知识点', '160'],
  ['教材册次', '20'],
  ['待教研问题', '7'],
]

const blockers = [
  '教材版次仍需逐册核验',
  '正式课标条款尚未逐条挂接',
  '当前正式专家审核记录为 0',
  '来源内容公开发布权利仍需确认',
]

export default function KnowledgeMap() {
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState<0 | 1 | 2>(0)
  const rows = chineseGrade1 as SeedItem[]
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((item) => {
      if (semester && item.semester !== semester) return false
      if (!q) return true
      return `${item.label} ${item.unit} ${item.book}`.toLowerCase().includes(q)
    })
  }, [query, rows, semester])

  return (
    <div className="mx-auto min-h-full max-w-5xl px-4 pb-20 pt-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-600">课程知识体系 · 研究版</p>
          <h1 className="mt-1 text-2xl font-black text-stone-900">小学知识地图</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            当前接入已审计的统编语文与 PEP 英语种子数据。这里展示的是研究数据状态，不代表正式教研认证。
          </p>
        </div>
        <Link
          to="/parent"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow active:scale-95"
        >
          返回家长视图
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-3xl font-black text-stone-900">{value}</div>
            <div className="mt-1 text-xs font-bold text-stone-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900">真实种子数据浏览</h2>
            <p className="mt-1 text-sm text-stone-500">
              第一批迁移：一年级语文 {rows.length} 条。其他年级将在同一目录下逐批迁入。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([0, 1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSemester(value)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${semester === value ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}
              >
                {value === 0 ? '全部' : value === 1 ? '上册' : '下册'}
              </button>
            ))}
          </div>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索知识点、单元或册次"
          className="mt-4 h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-amber-400"
        />
        <div className="mt-4 text-xs font-bold text-stone-400">显示 {filtered.length} / {rows.length} 条</div>
        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-stone-900">{item.label}</div>
                  <div className="mt-1 text-xs text-stone-500">{item.book} · {item.unit}</div>
                </div>
                {item.reviewStatus === 'needs_review' && (
                  <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">待复核</span>
                )}
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-stone-400">没有匹配结果</p>}
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-900">发布就绪度</h2>
            <p className="mt-1 text-sm text-stone-500">v0.2.1 新增自动发布就绪度检查。</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">研究版可用</span>
        </div>
        <div className="mt-4 rounded-2xl bg-rose-50 p-4">
          <div className="text-sm font-black text-rose-700">正式发布仍被阻断</div>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-rose-700/80">
            {blockers.map((item) => (
              <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
