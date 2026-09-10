import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { entryById, subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'
import {
  curriculumStandards,
  standardClauseById,
  standardDocumentById,
  standardMappingsForSubject,
} from '../content/curriculum/standards'
import {
  createUnsignedStandardReviewBundle,
  emptyMappingReview,
  type StandardMappingReviewDraft,
  type StandardReviewDecision,
} from '../content/curriculum/standardReview'

const STORAGE_KEY = 'qiqi.curriculum-standard-review.v1'

type ReviewStore = {
  schemaVersion: 1
  drafts: Record<string, StandardMappingReviewDraft>
}

const decisionLabels: Record<StandardReviewDecision, string> = {
  pending: '未处理',
  approve: '建议通过',
  reject: '建议拒绝',
  needs_revision: '需要修订',
}

function emptyStore(): ReviewStore {
  return { schemaVersion: 1, drafts: {} }
}

function readStore(): ReviewStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as ReviewStore
    if (parsed.schemaVersion !== 1 || !parsed.drafts) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function writeStore(store: ReviewStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export default function StandardMappingReview() {
  const firstMappingId = curriculumStandards.mappings[0]?.id ?? ''
  const [subject, setSubject] = useState<CurriculumSubject>('chinese')
  const [decisionFilter, setDecisionFilter] = useState<'all' | StandardReviewDecision>('all')
  const [query, setQuery] = useState('')
  const [selectedMappingId, setSelectedMappingId] = useState(firstMappingId)
  const [draft, setDraft] = useState<StandardMappingReviewDraft>(() => emptyMappingReview(firstMappingId))
  const [storeVersion, setStoreVersion] = useState(0)
  const [message, setMessage] = useState('')

  const store = useMemo(() => readStore(), [storeVersion])
  const subjectMappings = useMemo(() => standardMappingsForSubject(subject), [subject])
  const filteredMappings = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subjectMappings.filter((mapping) => {
      const saved = store.drafts[mapping.id]
      const decision = saved?.decision ?? 'pending'
      if (decisionFilter !== 'all' && decision !== decisionFilter) return false
      if (!q) return true
      const entry = entryById(mapping.entryId)
      const clause = standardClauseById(mapping.clauseId)
      return `${entry?.label ?? ''} ${entry?.unit ?? ''} ${clause?.title ?? ''} ${mapping.rationale}`.toLowerCase().includes(q)
    })
  }, [decisionFilter, query, store.drafts, subjectMappings])

  const mapping = curriculumStandards.mappings.find((item) => item.id === selectedMappingId) ?? null
  const entry = mapping ? entryById(mapping.entryId) : null
  const clause = mapping ? standardClauseById(mapping.clauseId) : null
  const document = clause ? standardDocumentById(clause.documentId) : null

  const counts = useMemo(() => {
    const result: Record<StandardReviewDecision, number> = { pending: 0, approve: 0, reject: 0, needs_revision: 0 }
    for (const item of curriculumStandards.mappings) {
      const decision = store.drafts[item.id]?.decision ?? 'pending'
      result[decision] += 1
    }
    return result
  }, [store.drafts])

  useEffect(() => {
    const saved = readStore().drafts[selectedMappingId]
    setDraft(saved ?? emptyMappingReview(selectedMappingId))
    setMessage(saved ? '已恢复本地审核草稿' : '')
  }, [selectedMappingId])

  function chooseSubject(next: CurriculumSubject) {
    const nextMapping = standardMappingsForSubject(next)[0]
    setSubject(next)
    setDecisionFilter('all')
    setQuery('')
    if (nextMapping) setSelectedMappingId(nextMapping.id)
  }

  function saveDraft() {
    const nextStore = readStore()
    const next = { ...draft, updatedAt: new Date().toISOString() }
    nextStore.drafts[selectedMappingId] = next
    writeStore(nextStore)
    setDraft(next)
    setStoreVersion((value) => value + 1)
    setMessage('审核草稿已保存在此浏览器')
  }

  function clearDraft() {
    const nextStore = readStore()
    delete nextStore.drafts[selectedMappingId]
    writeStore(nextStore)
    setDraft(emptyMappingReview(selectedMappingId))
    setStoreVersion((value) => value + 1)
    setMessage('已清除本地审核草稿')
  }

  async function exportUnsignedReview() {
    if (!mapping) return
    if (draft.decision === 'pending') {
      setMessage('请先给出审核建议，再导出审核包')
      return
    }
    if (!draft.reviewerLabel.trim()) {
      setMessage('请填写审核者标识；这里不自动认定专家身份')
      return
    }
    if (!draft.textbookEvidenceChecked || !draft.standardEvidenceChecked) {
      setMessage('导出前必须勾选教材证据与课标证据均已核对')
      return
    }
    const review = { ...draft, updatedAt: new Date().toISOString() }
    const bundle = await createUnsignedStandardReviewBundle(review)
    downloadJson(`standard-mapping-review-${mapping.id}.json`, bundle)
    setDraft(review)
    setMessage('已导出 unsigned_review_bundle；仍需外部签名验证才能进入正式门禁')
  }

  function exportQueue() {
    downloadJson('standard-mapping-review-queue.json', {
      schema: 'qiqi-standard-mapping-review-queue/v1',
      exportedAt: new Date().toISOString(),
      status: 'draft_only',
      datasetVersion: curriculumStandards.datasetVersion,
      drafts: readStore().drafts,
    })
  }

  return (
    <div className="mx-auto min-h-full max-w-[1400px] px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">课标映射人工审核队列</h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">{curriculumStandards.mappings.length} 条候选</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">正式签名 0</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">这里记录“建议通过/拒绝/修订”等人工判断，但本地决定不会改变 candidate_review 状态。只有经过受信审核者外部签名并通过正式门禁，才允许进入发布数据。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportQueue} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700">导出审核队列</button>
          <Link to="/knowledge-map/standards" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">返回课标证据库</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {(['pending', 'approve', 'reject', 'needs_revision'] as const).map((item) => (
          <div key={item} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{counts[item]}</div>
            <div className="text-xs font-bold text-stone-400">{decisionLabels[item]}</div>
          </div>
        ))}
      </section>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        审核者姓名/标识只是本地草稿字段，不代表平台已经核验其教师或专家资格。正式资格校验与 Ed25519 公钥注册在浏览器之外完成。
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="grid grid-cols-2 gap-2">
            {(['chinese', 'english'] as const).map((item) => (
              <button key={item} type="button" onClick={() => chooseSubject(item)} className={`rounded-2xl px-3 py-2 text-sm font-black ${subject === item ? 'bg-amber-500 text-white' : 'bg-white text-stone-600'}`}>
                {subjectLabels[item]}
              </button>
            ))}
          </div>
          <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as typeof decisionFilter)} className="mt-3 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none">
            <option value="all">全部审核状态</option>
            <option value="pending">未处理</option>
            <option value="approve">建议通过</option>
            <option value="reject">建议拒绝</option>
            <option value="needs_revision">需要修订</option>
          </select>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索知识点、条款或理由" className="mt-2 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
          <div className="mt-3 max-h-[700px] space-y-2 overflow-y-auto pr-1">
            {filteredMappings.map((item) => {
              const itemEntry = entryById(item.entryId)
              const itemClause = standardClauseById(item.clauseId)
              const decision = store.drafts[item.id]?.decision ?? 'pending'
              return (
                <button key={item.id} type="button" onClick={() => setSelectedMappingId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === selectedMappingId ? 'border-violet-300 bg-violet-50' : 'border-stone-100 bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-violet-700">{Math.round(item.confidence * 100)}% · {item.relation}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">{decisionLabels[decision]}</span>
                  </div>
                  <div className="mt-1 text-sm font-black leading-5 text-stone-900">{itemEntry?.label ?? item.entryId}</div>
                  <div className="mt-1 text-[11px] leading-4 text-stone-400">→ {itemClause?.title ?? item.clauseId}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="rounded-3xl bg-white p-5 shadow">
          {mapping && entry && clause && document ? (
            <>
              <div className="flex flex-col gap-3 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black text-violet-700">{mapping.id} · {Math.round(mapping.confidence * 100)}% · {mapping.relation}</div>
                  <h2 className="mt-1 text-xl font-black text-stone-900">{entry.label}</h2>
                  <p className="mt-1 text-xs text-stone-400">{subjectLabels[entry.subject]} · {entry.grade}年级 · {entry.book} · {entry.unit}</p>
                </div>
                <span className="self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">candidate_review</span>
              </div>

              <section className="mt-5 grid gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-xs font-black text-stone-400">教材证据</div>
                  <div className="mt-2 text-sm font-black text-stone-800">{entry.label}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{entry.learningDemand}</p>
                  <div className="mt-3 text-[11px] leading-5 text-stone-400"><div>{entry.sourcePath}</div><div>{entry.sourcePointer}</div></div>
                </article>
                <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="text-xs font-black text-emerald-700">课标证据</div>
                  <div className="mt-2 text-sm font-black text-stone-800">{clause.title} · {clause.stage}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{clause.evidenceSummary}</p>
                  <div className="mt-3 text-[11px] leading-5 text-emerald-700">{document.title}<br />{clause.sourceLocator}</div>
                  <a href={clause.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-black text-emerald-700 underline">打开教育部来源 ↗</a>
                </article>
              </section>

              <div className="mt-4 rounded-2xl bg-violet-50 p-4">
                <div className="text-xs font-black text-violet-700">系统提出该候选的理由</div>
                <p className="mt-2 text-sm leading-6 text-violet-900">{mapping.rationale}</p>
                <p className="mt-2 text-xs leading-5 text-violet-700">条款映射政策：{clause.mappingPolicy}</p>
              </div>

              <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <h3 className="font-black text-stone-900">人工审核草稿</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {(['pending', 'approve', 'reject', 'needs_revision'] as const).map((item) => (
                    <button key={item} type="button" onClick={() => setDraft((current) => ({ ...current, decision: item }))} className={`rounded-xl px-3 py-2 text-xs font-black ${draft.decision === item ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'}`}>
                      {decisionLabels[item]}
                    </button>
                  ))}
                </div>
                <label className="mt-4 block text-xs font-black text-stone-500">审核者标识</label>
                <input value={draft.reviewerLabel} onChange={(event) => setDraft((current) => ({ ...current, reviewerLabel: event.target.value }))} placeholder="例如：语文教研员-A（这里只是本地标识）" className="mt-1 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
                <label className="mt-4 block text-xs font-black text-stone-500">审核备注</label>
                <textarea value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} rows={4} placeholder="记录通过/拒绝理由、颗粒度问题、需要补充的证据。" className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm leading-6 outline-none focus:border-amber-400" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs leading-5 text-stone-600"><input type="checkbox" checked={draft.textbookEvidenceChecked} onChange={(event) => setDraft((current) => ({ ...current, textbookEvidenceChecked: event.target.checked }))} className="mt-0.5" /><span>我已核对教材节点及来源定位</span></label>
                  <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs leading-5 text-stone-600"><input type="checkbox" checked={draft.standardEvidenceChecked} onChange={(event) => setDraft((current) => ({ ...current, standardEvidenceChecked: event.target.checked }))} className="mt-0.5" /><span>我已核对课标证据与教育部来源</span></label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={saveDraft} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-white">保存本地审核草稿</button>
                  <button type="button" onClick={exportUnsignedReview} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出 unsigned 审核包</button>
                  <button type="button" onClick={clearDraft} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm">清除草稿</button>
                </div>
                {message ? <p className="mt-3 text-xs font-bold text-amber-800">{message}</p> : null}
              </section>
            </>
          ) : <p className="py-20 text-center text-sm text-stone-400">没有可审核的映射候选</p>}
        </main>
      </section>
    </div>
  )
}
