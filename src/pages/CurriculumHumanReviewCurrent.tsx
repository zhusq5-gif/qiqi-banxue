import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  curriculumHumanReviewCases,
  humanReviewSubjectLabels,
  type HumanReviewDecision,
} from '../content/curriculum/humanReview'
import { createHumanReviewDecisionV2, type HumanReviewDecisionV2 } from '../content/curriculum/humanReviewDecisionV2'
import { ingestHumanReviewDecisionV2, type HumanReviewIngestionV2Result } from '../content/curriculum/humanReviewIngestionV2'

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function CurriculumHumanReviewCurrent() {
  const [selectedId, setSelectedId] = useState(curriculumHumanReviewCases[0]?.id ?? '')
  const [decision, setDecision] = useState<HumanReviewDecision | ''>('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerRole, setReviewerRole] = useState('')
  const [rationale, setRationale] = useState('')
  const [evidenceText, setEvidenceText] = useState('')
  const [payload, setPayload] = useState<HumanReviewDecisionV2 | null>(null)
  const [ingestion, setIngestion] = useState<HumanReviewIngestionV2Result | null>(null)
  const [message, setMessage] = useState('')

  const selected = useMemo(() => curriculumHumanReviewCases.find((item) => item.id === selectedId) ?? null, [selectedId])

  function chooseCase(caseId: string) {
    const next = curriculumHumanReviewCases.find((item) => item.id === caseId) ?? null
    setSelectedId(caseId)
    setDecision('')
    setRationale('')
    setEvidenceText(next?.sourceRefs.join('\n') ?? '')
    setPayload(null)
    setIngestion(null)
    setMessage('')
  }

  function buildDecision() {
    if (!selected || !decision) {
      setMessage('请选择 case 和决定')
      return
    }
    try {
      const evidenceRefs = evidenceText.split(/\n+/).map((item) => item.trim()).filter(Boolean)
      const next = createHumanReviewDecisionV2(
        selected.id,
        decision,
        rationale,
        { name: reviewerName, role: reviewerRole },
        evidenceRefs,
      )
      setPayload(next)
      setIngestion(ingestHumanReviewDecisionV2(next))
      setMessage('已生成当前 case 绑定的 v2 decision，并完成即时 ingestion')
    } catch (error) {
      setPayload(null)
      setIngestion(null)
      setMessage(error instanceof Error ? error.message : '审核决定生成失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">当前 Case 真人复核台</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">decision v2</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">重新基于当前 case 的来源、任务、类型和 allowedDecisions 做人工确认。v2 decision 保存当前 caseState，后续 ingestion 会逐字段比对，旧 case 决定不能直接复用。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/human-review" className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">原始核对台</Link>
          <Link to="/knowledge-map/human-review/ingest" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">JSON ingestion</Link>
          <Link to="/knowledge-map/verification" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">逐年级矩阵</Link>
        </div>
      </header>

      <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-6 text-emerald-800">
        <strong>边界：</strong>`readyForApprovalGate=true` 只表示当前 caseState 一致且二次回归通过；它仍然不是 `humanVerified`，也不会自动写入种子或正式发布。
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="text-xs font-black text-stone-500">选择当前 case</div>
          <select value={selectedId} onChange={(event) => chooseCase(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm">
            {curriculumHumanReviewCases.map((item) => <option key={item.id} value={item.id}>Wave {item.wave} · {humanReviewSubjectLabels[item.subject]} G{item.grade} · {item.title}</option>)}
          </select>

          {selected ? <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-stone-50 p-3"><div className="text-[10px] font-black text-stone-400">CASE</div><div className="mt-1 break-all text-xs font-black text-stone-800">{selected.id}</div><div className="mt-1 text-[10px] text-stone-500">{selected.reviewType} · {selected.priority}</div></div>
            <div className="rounded-2xl bg-violet-50 p-3"><div className="text-[10px] font-black text-violet-600">当前来源</div><div className="mt-2 space-y-2">{selected.sourceRefs.map((ref) => <code key={ref} className="block break-all rounded-lg bg-white px-2 py-1.5 text-[10px] leading-4 text-stone-600">{ref}</code>)}</div></div>
            <div className="rounded-2xl bg-amber-50 p-3"><div className="text-[10px] font-black text-amber-700">允许决定</div><div className="mt-2 flex flex-wrap gap-1">{selected.allowedDecisions.map((item) => <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-stone-600">{item}</span>)}</div></div>
          </div> : null}
        </aside>

        <main className="space-y-4">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-stone-900">1. 在当前 case 上重新确认</h2>
            {selected ? <p className="mt-2 text-sm leading-6 text-stone-600">{selected.summary}</p> : null}
            <label className="mt-4 block text-xs font-black text-stone-500">决定</label>
            <select value={decision} onChange={(event) => setDecision(event.target.value as HumanReviewDecision | '')} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm">
              <option value="">请选择</option>
              {selected?.allowedDecisions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><label className="block text-xs font-black text-stone-500">审核人姓名</label><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
              <div><label className="block text-xs font-black text-stone-500">角色/学科资质</label><input value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" placeholder="如：小学四年级英语教研" /></div>
            </div>
            <label className="mt-4 block text-xs font-black text-stone-500">审核理由</label>
            <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm leading-6" />
            <label className="mt-4 block text-xs font-black text-stone-500">实际核对的当前证据（每行一条）</label>
            <textarea value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} rows={5} placeholder={selected?.sourceRefs.join('\n')} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-5" />
            <div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={buildDecision} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">生成 v2 + 即时复测</button>{message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}</div>
          </section>

          {payload ? <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-black text-stone-900">2. 当前 case 绑定的 decision v2</h2><p className="mt-1 text-xs text-stone-400">caseState 会随 JSON 一起保存。</p></div><button type="button" onClick={() => downloadJson(`human-review-v2-${payload.caseId.replace(/[:/]/g, '-')}.json`, payload)} className="rounded-full bg-violet-600 px-4 py-2 text-xs font-black text-white">导出 v2 JSON</button></div><pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-stone-950 p-4 text-[10px] leading-5 text-stone-100">{JSON.stringify(payload, null, 2)}</pre></section> : null}

          {ingestion ? <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-black text-stone-900">3. v2 ingestion 结果</h2><p className="mt-1 text-xs text-stone-400">caseStateMatches={String(ingestion.caseStateMatches)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${ingestion.readyForApprovalGate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ingestion.readyForApprovalGate ? 'readyForApprovalGate' : ingestion.nextGate}</span></div><p className="mt-3 text-xs leading-6 text-stone-600">{ingestion.note}</p>{ingestion.candidateSnapshot ? <div className="mt-4 rounded-2xl border border-emerald-100 p-4"><div className="flex items-center justify-between gap-2"><div><div className="text-xs font-black text-emerald-700">Candidate Snapshot v2</div><div className="mt-1 text-[10px] text-stone-400">humanVerified=false · autoApply=false</div></div><button type="button" onClick={() => downloadJson(`candidate-v2-${ingestion.candidateSnapshot!.caseId.replace(/[:/]/g, '-')}.json`, ingestion.candidateSnapshot)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">导出候选快照</button></div></div> : null}</section> : null}
        </main>
      </section>
    </div>
  )
}
