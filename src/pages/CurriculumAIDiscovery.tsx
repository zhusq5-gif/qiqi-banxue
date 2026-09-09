import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  aiDiscoveryBatches,
  aiDiscoveryCandidatesAll,
  aiDiscoveryRegistrySummary,
  createAIDiscoveryDecisionAll,
  exactExistingMatches,
  type AIDiscoveryConfidence,
  type AIDiscoveryDecision,
} from '../content/curriculum/aiDiscoveryRegistry'
import { subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'

const STORAGE_KEY = 'qiqi.curriculum-ai-discovery-review.v1'

type LocalReviewDraft = {
  decision: AIDiscoveryDecision | ''
  reviewerName: string
  reviewerRole: string
  rationale: string
  evidenceRefs: string
}

type DraftStore = Record<string, LocalReviewDraft>

const confidenceLabels: Record<AIDiscoveryConfidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const authorityLabels = {
  official_standard_2022: '教育部2022课标',
  publisher_current_resource: '出版社当前资源',
  publisher_catalog_version_unknown: '出版社目录·版次待核',
}

const decisionLabels: Record<AIDiscoveryDecision, string> = {
  promote_to_human_review: '进入真人精审',
  revise_candidate: '人工修订候选',
  reject_candidate: '拒绝候选',
  defer: '暂缓',
}

function readStore(): DraftStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DraftStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function emptyDraft(): LocalReviewDraft {
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

export default function CurriculumAIDiscovery() {
  const first = aiDiscoveryCandidatesAll[0]
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [confidence, setConfidence] = useState<'all' | AIDiscoveryConfidence>('all')
  const [grade, setGrade] = useState<'all' | number>('all')
  const [selectedId, setSelectedId] = useState(first?.id ?? '')
  const [draft, setDraft] = useState<LocalReviewDraft>(() => readStore()[first?.id ?? ''] ?? emptyDraft())
  const [message, setMessage] = useState('')

  const visible = useMemo(() => aiDiscoveryCandidatesAll.filter((item) => {
    if (subject !== 'all' && item.subject !== subject) return false
    if (confidence !== 'all' && item.confidence !== confidence) return false
    if (grade !== 'all' && !item.grades.includes(grade)) return false
    return true
  }), [subject, confidence, grade])

  const selected = aiDiscoveryCandidatesAll.find((item) => item.id === selectedId) ?? visible[0] ?? null
  const duplicateMatches = selected ? exactExistingMatches(selected) : []

  useEffect(() => {
    if (!selected) return
    setDraft(readStore()[selected.id] ?? emptyDraft())
    setMessage('')
  }, [selected?.id])

  function chooseCandidate(id: string) {
    setSelectedId(id)
  }

  function saveDraft() {
    if (!selected) return
    const store = readStore()
    store[selected.id] = draft
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setMessage('已保存本地审核草稿')
  }

  function exportDecision() {
    if (!selected || !draft.decision) {
      setMessage('请先选择审核决定')
      return
    }
    try {
      const evidenceRefs = draft.evidenceRefs.split(/\n+/).map((item) => item.trim()).filter(Boolean)
      const payload = createAIDiscoveryDecisionAll(
        selected.id,
        draft.decision,
        draft.reviewerName,
        draft.reviewerRole,
        draft.rationale,
        evidenceRefs,
      )
      downloadJson(`ai-discovery-${selected.id}.json`, payload)
      setMessage('已导出 unsigned AI 候选审核决定；没有写入知识库')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '审核决定校验失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">AI 知识候选审校台</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
            AI 负责搜索、抽取和形成候选；真人在这里逐条查看来源、重复命中和置信度，再决定是否进入精审。任何决定都不会自动写入正式知识库。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/review-center" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">Review Center</Link>
          <Link to="/knowledge-map/human-review" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">现有真人核对</Link>
          <Link to="/knowledge-map/verification" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">逐年级核对矩阵</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          ['AI候选', aiDiscoveryRegistrySummary.total],
          ['语文', aiDiscoveryRegistrySummary.chinese],
          ['英语', aiDiscoveryRegistrySummary.english],
          ['数学', aiDiscoveryRegistrySummary.math],
          ['高置信', aiDiscoveryRegistrySummary.highConfidence],
          ['精确重复候选', aiDiscoveryRegistrySummary.exactDuplicateCandidateCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-800">
        <strong>{aiDiscoveryBatches.length} 个搜索批次：</strong>{aiDiscoveryBatches.map((item) => item.batchId).join(' · ')}。高置信主要来自教育部 2022 课标；出版社网页只生成教材主题/功能候选。标题级推断统一降置信度，版次未知的目录不得当作当前教材事实。
      </section>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <select value={subject} onChange={(event) => setSubject(event.target.value as 'all' | CurriculumSubject)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部学科</option>
          <option value="chinese">语文</option>
          <option value="english">英语</option>
          <option value="math">数学</option>
        </select>
        <select value={confidence} onChange={(event) => setConfidence(event.target.value as 'all' | AIDiscoveryConfidence)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部置信度</option>
          <option value="high">高置信</option>
          <option value="medium">中置信</option>
          <option value="low">低置信</option>
        </select>
        <select value={grade} onChange={(event) => setGrade(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="h-10 rounded-xl border border-stone-200 px-3 text-sm">
          <option value="all">全部年级</option>
          {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}年级</option>)}
        </select>
        <span className="self-center text-xs font-bold text-stone-400">当前 {visible.length} 条</span>
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
            {visible.map((item) => {
              const duplicates = exactExistingMatches(item).length
              return (
                <button key={item.id} type="button" onClick={() => chooseCandidate(item.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-blue-200 bg-blue-50' : 'border-transparent bg-white'}`}>
                  <div className="flex items-center justify-between gap-2 text-[10px] font-black">
                    <span className="text-blue-700">{subjectLabels[item.subject]} · G{item.grades.join('/')}</span>
                    <span className={item.confidence === 'high' ? 'text-emerald-600' : item.confidence === 'medium' ? 'text-amber-600' : 'text-rose-500'}>{confidenceLabels[item.confidence]}置信</span>
                  </div>
                  <div className="mt-1 text-sm font-black leading-5 text-stone-900">{item.label}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-stone-400"><span>{item.candidateKind}</span>{duplicates ? <span className="font-black text-amber-600">· 精确重复 {duplicates}</span> : null}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="space-y-4">
          {selected ? (
            <>
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-blue-700">{subjectLabels[selected.subject]} · {selected.grades.map((item) => `${item}年级`).join(' / ')} · {selected.candidateKind}</div>
                    <h2 className="mt-1 text-xl font-black text-stone-900">{selected.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{selected.learningDemand}</p>
                  </div>
                  <div className="text-right text-xs"><div className="font-black text-stone-900">{authorityLabels[selected.sourceAuthority]}</div><div className="mt-1 text-stone-400">{confidenceLabels[selected.confidence]}置信 · ai_candidate</div></div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl bg-blue-50 p-4"><div className="text-xs font-black text-blue-700">AI 提取依据</div><p className="mt-2 text-xs leading-6 text-stone-700">{selected.evidenceSummary}</p><p className="mt-2 text-[11px] leading-5 text-stone-500">{selected.sourceNote}</p></div>
                  <div className="rounded-2xl bg-stone-50 p-4"><div className="text-xs font-black text-stone-500">来源</div><div className="mt-2 space-y-2">{selected.sourceRefs.map((ref) => <a key={ref} href={ref} target="_blank" rel="noreferrer" className="block break-all rounded-xl bg-white px-3 py-2 text-[11px] leading-5 text-blue-700 hover:underline">{ref}</a>)}</div></div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-100 p-4">
                  <div className="text-xs font-black text-amber-700">现有库精确标签检查</div>
                  {duplicateMatches.length ? <div className="mt-2 space-y-1">{duplicateMatches.map((item) => <div key={item.id} className="text-xs text-stone-600"><code>{item.id}</code> · {item.label}</div>)}</div> : <p className="mt-2 text-xs text-stone-500">未发现精确规范化标签重复。注意：这不等于没有语义重复，仍需真人判断。</p>}
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="font-black text-stone-900">真人 UI 决策</h3>
                <p className="mt-1 text-xs leading-5 text-stone-400">“进入真人精审”只把候选送到下一审核阶段，不创建正式 KnowledgeNode。</p>
                <label className="mt-4 block text-xs font-black text-stone-500">决定</label>
                <select value={draft.decision} onChange={(event) => setDraft((current) => ({ ...current, decision: event.target.value as AIDiscoveryDecision | '' }))} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm">
                  <option value="">请选择</option>
                  {(Object.keys(decisionLabels) as AIDiscoveryDecision[]).map((item) => <option key={item} value={item}>{decisionLabels[item]} · {item}</option>)}
                </select>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div><label className="block text-xs font-black text-stone-500">审核人姓名</label><input value={draft.reviewerName} onChange={(event) => setDraft((current) => ({ ...current, reviewerName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
                  <div><label className="block text-xs font-black text-stone-500">角色/学科资质</label><input value={draft.reviewerRole} onChange={(event) => setDraft((current) => ({ ...current, reviewerRole: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
                </div>
                <label className="mt-4 block text-xs font-black text-stone-500">审核理由</label>
                <textarea value={draft.rationale} onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm leading-6" />
                <label className="mt-4 block text-xs font-black text-stone-500">实际查看过的来源（每行一条）</label>
                <textarea value={draft.evidenceRefs} onChange={(event) => setDraft((current) => ({ ...current, evidenceRefs: event.target.value }))} rows={4} placeholder={selected.sourceRefs.join('\n')} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-5" />
                <div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={saveDraft} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white">保存草稿</button><button type="button" onClick={exportDecision} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出审核决定</button>{message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}</div>
              </section>
            </>
          ) : <div className="rounded-3xl bg-white py-20 text-center text-sm text-stone-400">当前筛选没有候选</div>}
        </main>
      </section>
    </div>
  )
}
