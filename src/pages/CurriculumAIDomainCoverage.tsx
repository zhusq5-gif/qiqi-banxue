import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  aiDiscoveryDomainCoverageCells,
  aiDiscoveryDomainCoverageSummary,
  type AIDiscoveryDomainStatus,
} from '../content/curriculum/aiDiscoveryDomainCoverage'
import { subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'

const statusLabel: Record<AIDiscoveryDomainStatus, string> = {
  search_required: '需要搜索',
  shallow_candidates: '候选较浅',
  review_pool_ready: '可开始审校',
}

export default function CurriculumAIDomainCoverage() {
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [grade, setGrade] = useState<'all' | number>('all')
  const [status, setStatus] = useState<'all' | AIDiscoveryDomainStatus>('all')

  const visible = useMemo(() => aiDiscoveryDomainCoverageCells.filter((cell) => {
    if (subject !== 'all' && cell.subject !== subject) return false
    if (grade !== 'all' && cell.grade !== grade) return false
    if (status !== 'all' && cell.status !== status) return false
    return true
  }), [grade, status, subject])

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">AI 领域深度搜索矩阵</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">把 AI 扩库从“每年级凑几条”升级为按学科、年级、领域/任务群找空白。这个矩阵只用于搜索规划，不代表正式课程覆盖率。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/discovery" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">AI候选审校</Link>
          <Link to="/knowledge-map/review-center" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">Review Center</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['领域单元', aiDiscoveryDomainCoverageSummary.cellCount],
          ['需要搜索', aiDiscoveryDomainCoverageSummary.searchRequiredCount],
          ['候选较浅', aiDiscoveryDomainCoverageSummary.shallowCount],
          ['可开始审校', aiDiscoveryDomainCoverageSummary.reviewPoolReadyCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="text-2xl font-black text-stone-900">{value}</div><div className="text-xs font-bold text-stone-400">{label}</div></div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        <strong>口径：</strong>{aiDiscoveryDomainCoverageSummary.note} “可开始审校”只表示同一领域已有至少两条 AI 候选，不表示该领域知识完整。
      </section>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <select value={subject} onChange={(event) => setSubject(event.target.value as 'all' | CurriculumSubject)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部学科</option><option value="chinese">语文</option><option value="english">英语</option><option value="math">数学</option>
        </select>
        <select value={grade} onChange={(event) => setGrade(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部年级</option>{[1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value}年级</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as 'all' | AIDiscoveryDomainStatus)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部状态</option><option value="search_required">需要搜索</option><option value="shallow_candidates">候选较浅</option><option value="review_pool_ready">可开始审校</option>
        </select>
        <span className="self-center text-xs font-bold text-stone-400">当前 {visible.length} 个领域单元</span>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="grid grid-cols-[90px_70px_minmax(170px,1fr)_90px_120px] gap-2 border-b border-stone-100 px-4 py-3 text-[11px] font-black text-stone-400">
          <span>学科</span><span>年级</span><span>领域</span><span>候选数</span><span>搜索状态</span>
        </div>
        <div className="max-h-[720px] overflow-y-auto">
          {visible.map((cell) => (
            <div key={cell.id} className="grid grid-cols-[90px_70px_minmax(170px,1fr)_90px_120px] gap-2 border-b border-stone-50 px-4 py-3 text-xs">
              <span className="font-black text-stone-700">{subjectLabels[cell.subject]}</span>
              <span className="font-bold text-stone-500">G{cell.grade}</span>
              <div><div className="font-black text-stone-900">{cell.domainLabel}</div><div className="mt-1 text-[10px] leading-4 text-stone-400">{cell.note}</div></div>
              <span className="font-black text-stone-700">{cell.candidateCount}<span className="ml-1 text-[10px] font-bold text-emerald-600">H{cell.highConfidenceCount}</span></span>
              <span className={`h-fit w-fit rounded-full px-2 py-1 text-[10px] font-black ${cell.status === 'search_required' ? 'bg-rose-100 text-rose-700' : cell.status === 'shallow_candidates' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{statusLabel[cell.status]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
