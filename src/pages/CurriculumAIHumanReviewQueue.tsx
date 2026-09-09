import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AI_PROMOTED_REVIEW_STORAGE_KEY,
  type AIDiscoveryHumanReviewCaseDraft,
} from '../content/curriculum/aiDiscoveryPromotion'
import { subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'

function readQueue(): AIDiscoveryHumanReviewCaseDraft[] {
  try {
    const raw = window.localStorage.getItem(AI_PROMOTED_REVIEW_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AIDiscoveryHumanReviewCaseDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function CurriculumAIHumanReviewQueue() {
  const [queue, setQueue] = useState<AIDiscoveryHumanReviewCaseDraft[]>(() => readQueue())
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [selectedId, setSelectedId] = useState(queue[0]?.id ?? '')

  const visible = useMemo(() => queue.filter((item) => subject === 'all' || item.subject === subject), [queue, subject])
  const selected = queue.find((item) => item.id === selectedId) ?? visible[0] ?? null

  function removeDraft(id: string) {
    const next = queue.filter((item) => item.id !== id)
    setQueue(next)
    window.localStorage.setItem(AI_PROMOTED_REVIEW_STORAGE_KEY, JSON.stringify(next))
    if (selectedId === id) setSelectedId(next[0]?.id ?? '')
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">AI 候选真人精审队列</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">这里展示在 AI 候选页通过 UI 点“进入真人精审”生成的 case draft。它们已经绑定候选快照和来源，但尚未成为正式 HumanReviewCase，更不代表 expert verified。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/discovery" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">返回 AI 候选池</Link>
          <Link to="/knowledge-map/review-center" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">Review Center</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['精审草稿', queue.length],
          ['语文', queue.filter((item) => item.subject === 'chinese').length],
          ['英语', queue.filter((item) => item.subject === 'english').length],
          ['数学', queue.filter((item) => item.subject === 'math').length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="text-2xl font-black text-stone-900">{value}</div><div className="text-xs font-bold text-stone-400">{label}</div></div>)}
      </section>

      <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-6 text-violet-800">
        <strong>下一步：</strong>本页先解决“AI候选 → UI真人精审队列”的直接迁移。后续会把这些草稿激活为 current-case decision v2，再进入 new-knowledge structured proposal；当前仍 `autoApply=false / humanVerified=false`。
      </section>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <select value={subject} onChange={(event) => setSubject(event.target.value as 'all' | CurriculumSubject)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部学科</option><option value="chinese">语文</option><option value="english">英语</option><option value="math">数学</option>
        </select>
        <span className="self-center text-xs font-bold text-stone-400">当前 {visible.length} 条</span>
      </div>

      {queue.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white py-20 text-center text-sm text-stone-400">还没有候选进入真人精审。请先在 AI 候选审校台完成来源核对并选择“进入真人精审”。</div>
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
            <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
              {visible.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-violet-200 bg-violet-50' : 'border-transparent bg-white'}`}><div className="text-[10px] font-black text-violet-700">{subjectLabels[item.subject]} · G{item.grades.join('/')}</div><div className="mt-1 text-sm font-black leading-5 text-stone-900">{item.candidateState.label}</div><div className="mt-1 text-[10px] text-stone-400">{item.candidateState.confidence} · {item.candidateState.sourceAuthority}</div></button>)}
            </div>
          </aside>

          <main className="space-y-4">
            {selected ? <>
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black text-violet-700">{subjectLabels[selected.subject]} · {selected.grades.map((grade) => `${grade}年级`).join(' / ')}</div><h2 className="mt-1 text-xl font-black text-stone-900">{selected.candidateState.label}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{selected.candidateState.learningDemand}</p></div><div className="text-right text-xs text-stone-500">case draft<br />humanVerified=false</div></div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-violet-50 p-4"><div className="text-xs font-black text-violet-700">第一次 UI 促进入队理由</div><p className="mt-2 text-xs leading-6 text-stone-700">{selected.promotionRationale}</p><p className="mt-2 text-[10px] text-stone-400">{selected.promotedBy.name} · {selected.promotedBy.role} · {selected.promotedAt}</p></div>
                  <div className="rounded-2xl bg-stone-50 p-4"><div className="text-xs font-black text-stone-500">证据</div><div className="mt-2 space-y-2">{selected.sourceRefs.map((ref) => <a key={ref} href={ref} target="_blank" rel="noreferrer" className="block break-all rounded-xl bg-white px-3 py-2 text-[11px] leading-5 text-blue-700 hover:underline">{ref}</a>)}</div></div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="font-black text-stone-900">精审核对清单</h3><ol className="mt-3 space-y-2 text-sm leading-6 text-stone-600">{selected.checklist.map((item, index) => <li key={item} className="flex gap-3"><span className="font-black text-violet-500">{index + 1}.</span><span>{item}</span></li>)}</ol></section>

              <section className="flex flex-wrap gap-2 rounded-3xl bg-white p-5 shadow-sm"><button type="button" onClick={() => downloadJson(`ai-human-review-case-${selected.candidateId}.json`, selected)} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出审计副本</button><button type="button" onClick={() => removeDraft(selected.id)} className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">从本地精审队列移除</button><span className="self-center text-xs text-stone-400">这里不提供“正式通过”按钮。</span></section>
            </> : null}
          </main>
        </section>
      )}
    </div>
  )
}
