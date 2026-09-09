import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createUnsignedHumanReviewDecision,
  curriculumHumanReviewCases,
  curriculumHumanReviewSummary,
  humanReviewSubjectLabels,
  type HumanReviewDecision,
  type HumanReviewType,
} from '../content/curriculum/humanReview'
import type { CurriculumSubject } from '../content/curriculum/curriculum'

const STORAGE_KEY = 'qiqi.curriculum-human-review-drafts.v1'
const BRANCH_BASE = 'https://github.com/zhusq5-gif/qiqi-banxue/blob/feat/curriculum-knowledge-v03'

const reviewTypeLabels: Record<HumanReviewType, string> = {
  content_patch: '内容修补',
  concept_boundary: '概念边界',
  assessment_binding: '测评绑定',
  cross_grade_relation: '跨年级关系',
  occurrence_reuse: '知识复用',
  data_quality: '数据质量',
}

const decisionLabels: Record<HumanReviewDecision, string> = {
  accept_candidate: '接受候选修补',
  revise_candidate: '修改候选修补',
  split_nodes: '拆分知识点',
  rename_and_reframe: '重命名并重写目标',
  retain_single_node: '保留单一知识点',
  keep_unmapped: '保持未映射',
  needs_source_evidence: '需要更多源证据',
  propose_curated_mapping: '提出 curated mapping',
  keep_raw_relation_only: '只保留 raw relation',
  propose_curriculum_relation: '提出 Curriculum relation',
  reject_curriculum_use: '不用于课程关系',
  keep_same_identity: '保留同一 KnowledgeNode',
  split_identity_candidate: '提出拆分身份候选',
  defer: '暂缓决定',
}

type LocalDraft = {
  decision: HumanReviewDecision | ''
  reviewerName: string
  reviewerRole: string
  rationale: string
  evidenceRefs: string
}

type DraftStore = Record<string, LocalDraft>

function readStore(): DraftStore {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return {}
    const parsed = JSON.parse(value) as DraftStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function emptyDraft(): LocalDraft {
  return { decision: '', reviewerName: '', reviewerRole: '', rationale: '', evidenceRefs: '' }
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

export default function CurriculumHumanReview() {
  const firstCase = curriculumHumanReviewCases[0]
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [wave, setWave] = useState<'all' | 1 | 2>('all')
  const [selectedId, setSelectedId] = useState(firstCase?.id ?? '')
  const [draft, setDraft] = useState<LocalDraft>(() => readStore()[firstCase?.id ?? ''] ?? emptyDraft())
  const [message, setMessage] = useState('')

  const visibleCases = useMemo(() => curriculumHumanReviewCases.filter((item) => {
    if (subject !== 'all' && item.subject !== subject) return false
    if (wave !== 'all' && item.wave !== wave) return false
    return true
  }), [subject, wave])

  const selected = curriculumHumanReviewCases.find((item) => item.id === selectedId) ?? visibleCases[0] ?? null

  useEffect(() => {
    if (!selected) return
    const stored = readStore()[selected.id]
    setDraft(stored ?? emptyDraft())
    setMessage(stored ? '已恢复本地审核草稿' : '')
  }, [selected?.id])

  function saveDraft() {
    if (!selected) return
    const store = readStore()
    store[selected.id] = draft
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setMessage('审核草稿已保存在当前浏览器')
  }

  function clearDraft() {
    if (!selected) return
    const store = readStore()
    delete store[selected.id]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setDraft(emptyDraft())
    setMessage('已清除本地草稿')
  }

  function exportDecision() {
    if (!selected || !draft.decision) {
      setMessage('请先选择审核决定')
      return
    }
    try {
      const evidenceRefs = draft.evidenceRefs.split(/\n+/).map((item) => item.trim()).filter(Boolean)
      const payload = createUnsignedHumanReviewDecision(
        selected.id,
        draft.decision,
        draft.rationale,
        { name: draft.reviewerName, role: draft.reviewerRole },
        evidenceRefs,
      )
      downloadJson(`human-review-${selected.id.replace(/[:/]/g, '-')}.json`, payload)
      setMessage('已导出 unsigned decision；尚未产生 human verified 状态')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '审核表单校验失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">课程知识真人核对台</h1>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">human verified = 0</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">按 case 查看原始证据与核对清单，填写 unsigned decision。这里不会修改种子 JSON、CloudBase 或专家审核状态。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${BRANCH_BASE}/docs/curriculum/HUMAN_REVIEW_GUIDE.md`} target="_blank" rel="noreferrer" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">真人核对指南</a>
          <Link to="/knowledge-map/verification" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">逐年级核对矩阵</Link>
          <Link to="/knowledge-map/review" className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">修订工作台</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          ['待真人 case', curriculumHumanReviewSummary.caseCount],
          ['内容 case', curriculumHumanReviewSummary.contentCaseCount],
          ['数学 case', curriculumHumanReviewSummary.mathCaseCount],
          ['blocking', curriculumHumanReviewSummary.blockingCount],
          ['真人已核', curriculumHumanReviewSummary.humanVerifiedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="text-2xl font-black text-stone-900">{value}</div><div className="text-xs font-bold text-stone-400">{label}</div></div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-700">
        <strong>审核边界：</strong>unsigned decision 只是“真人已给出意见”，不是 `expert_verified`。任何修补/映射还要经过 ingestion、recheck、版本与发布门禁。
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(['all', 'chinese', 'english', 'math'] as const).map((item) => <button key={item} type="button" onClick={() => setSubject(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${subject === item ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{item === 'all' ? '全部学科' : humanReviewSubjectLabels[item]}</button>)}
        </div>
        <div className="flex gap-2">
          {(['all', 1, 2] as const).map((item) => <button key={item} type="button" onClick={() => setWave(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${wave === item ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700'}`}>{item === 'all' ? '全部波次' : `Wave ${item}`}</button>)}
        </div>
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="px-2 pb-2 text-xs font-black text-stone-500">审核 case · {visibleCases.length}</div>
          <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
            {visibleCases.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-violet-200 bg-violet-50' : 'border-transparent bg-white'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-violet-600">Wave {item.wave} · {humanReviewSubjectLabels[item.subject]} · {item.grade}年级</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.priority === 'blocking' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{item.priority}</span></div>
                <div className="mt-1 text-sm font-black leading-5 text-stone-900">{item.title}</div>
                <div className="mt-1 text-[10px] text-stone-400">{reviewTypeLabels[item.reviewType]}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-3xl bg-white p-5 shadow">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div><div className="text-xs font-black text-violet-600">{reviewTypeLabels[selected.reviewType]} · {selected.id}</div><h2 className="mt-1 text-xl font-black text-stone-900">{selected.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{selected.summary}</p></div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">awaiting_human_review</span>
              </div>

              <section className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4"><h3 className="text-xs font-black text-stone-500">必须实际查看的证据</h3><div className="mt-3 space-y-2">{selected.sourceRefs.map((ref) => <code key={ref} className="block break-all rounded-xl bg-white px-3 py-2 text-[11px] leading-5 text-stone-600">{ref}</code>)}</div></div>
                <div className="rounded-2xl bg-violet-50 p-4"><h3 className="text-xs font-black text-violet-700">核对清单</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-5 text-stone-700">{selected.checklist.map((item) => <li key={item}>{item}</li>)}</ol></div>
              </section>

              <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black text-stone-900">填写 unsigned decision</h3>{message ? <span className="text-xs font-bold text-amber-700">{message}</span> : null}</div>
                <label className="mt-4 block text-xs font-black text-stone-500">决定</label>
                <select value={draft.decision} onChange={(event) => setDraft((current) => ({ ...current, decision: event.target.value as HumanReviewDecision | '' }))} className="mt-1 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm">
                  <option value="">请选择</option>{selected.allowedDecisions.map((decision) => <option key={decision} value={decision}>{decisionLabels[decision]} · {decision}</option>)}
                </select>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div><label className="block text-xs font-black text-stone-500">审核人姓名</label><input value={draft.reviewerName} onChange={(event) => setDraft((current) => ({ ...current, reviewerName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm" /></div>
                  <div><label className="block text-xs font-black text-stone-500">角色/学科资质</label><input value={draft.reviewerRole} onChange={(event) => setDraft((current) => ({ ...current, reviewerRole: event.target.value }))} placeholder="如：小学四年级语文教师" className="mt-1 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm" /></div>
                </div>
                <label className="mt-4 block text-xs font-black text-stone-500">决策理由</label><textarea value={draft.rationale} onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm leading-6" />
                <label className="mt-4 block text-xs font-black text-stone-500">实际查看过的证据（每行一条）</label><textarea value={draft.evidenceRefs} onChange={(event) => setDraft((current) => ({ ...current, evidenceRefs: event.target.value }))} rows={4} placeholder={selected.sourceRefs.join('\n')} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 font-mono text-xs leading-5" />
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={saveDraft} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-white">保存本地草稿</button><button type="button" onClick={exportDecision} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出 unsigned JSON</button><button type="button" onClick={clearDraft} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm">清除草稿</button></div>
              </section>
            </>
          ) : <div className="py-20 text-center text-sm text-stone-400">当前筛选没有真人审核 case</div>}
        </main>
      </section>
    </div>
  )
}
