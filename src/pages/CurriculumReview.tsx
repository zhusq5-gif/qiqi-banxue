import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StandardEvidencePanel from '../components/curriculum/StandardEvidencePanel'
import { curriculumSeed, entryById, semesterLabel, subjectLabels } from '../content/curriculum/curriculum'

type RevisionDraft = {
  issueId: string
  nodeId: string
  proposedLabel: string
  proposedLearningDemand: string
  reviewerNote: string
  updatedAt: string
}

type DraftStore = {
  schemaVersion: 1
  drafts: Record<string, RevisionDraft>
}

const STORAGE_KEY = 'qiqi.curriculum-review.v1'

function emptyStore(): DraftStore {
  return { schemaVersion: 1, drafts: {} }
}

function readStore(): DraftStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as DraftStore
    if (parsed.schemaVersion !== 1 || !parsed.drafts) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function makeDraft(issueId: string): RevisionDraft {
  const issue = curriculumSeed.issues.find((item) => item.id === issueId)
  const entry = issue ? entryById(issue.nodeId) : null
  return {
    issueId,
    nodeId: issue?.nodeId ?? '',
    proposedLabel: entry?.label ?? '',
    proposedLearningDemand: entry?.learningDemand ?? '',
    reviewerNote: '',
    updatedAt: '',
  }
}

export default function CurriculumReview() {
  const firstIssueId = curriculumSeed.issues[0]?.id ?? ''
  const [selectedIssueId, setSelectedIssueId] = useState(firstIssueId)
  const [draft, setDraft] = useState<RevisionDraft>(() => makeDraft(firstIssueId))
  const [savedCount, setSavedCount] = useState(() => Object.keys(readStore().drafts).length)
  const [savedMessage, setSavedMessage] = useState('')

  const issue = useMemo(() => curriculumSeed.issues.find((item) => item.id === selectedIssueId) ?? null, [selectedIssueId])
  const entry = issue ? entryById(issue.nodeId) : null

  useEffect(() => {
    const stored = readStore().drafts[selectedIssueId]
    setDraft(stored ?? makeDraft(selectedIssueId))
    setSavedMessage(stored ? '已恢复本地草稿' : '')
  }, [selectedIssueId])

  function saveDraft() {
    const store = readStore()
    const next = { ...draft, updatedAt: new Date().toISOString() }
    store.drafts[selectedIssueId] = next
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setDraft(next)
    setSavedCount(Object.keys(store.drafts).length)
    setSavedMessage('草稿已保存在此浏览器')
  }

  function resetDraft() {
    const store = readStore()
    delete store.drafts[selectedIssueId]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setDraft(makeDraft(selectedIssueId))
    setSavedCount(Object.keys(store.drafts).length)
    setSavedMessage('已恢复种子基线')
  }

  function exportDraft() {
    if (!issue || !entry) return
    const payload = {
      schema: 'qiqi-curriculum-revision-draft/v1',
      exportedAt: new Date().toISOString(),
      status: 'draft_only',
      warning: '此文件不是专家审核记录，不得直接进入正式发布库。',
      issue,
      original: {
        id: entry.id,
        label: entry.label,
        learningDemand: entry.learningDemand,
        sourcePath: entry.sourcePath,
        sourcePointer: entry.sourcePointer,
      },
      proposed: draft,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `curriculum-revision-${issue.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 pb-20 pt-5">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">课程内容修订工作台</h1>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">7 条待教研问题</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-500">修订仅保存在当前浏览器的版本化本地草稿层，不覆盖种子 JSON，不写 CloudBase，也不会生成专家审核状态。</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Link to="/knowledge-map/standards" className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">2022 课标证据</Link>
          <Link to="/knowledge-map" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow">返回知识地图</Link>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <span className="font-black">治理提醒：</span>
        <span>本地已保存 {savedCount} 条草稿。导出的 JSON 仍是 draft_only，必须经过学科审核与发布门禁后才能进入正式库。</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="px-2 pb-2 text-xs font-black text-stone-500">问题清单</div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {curriculumSeed.issues.map((item) => {
              const node = entryById(item.nodeId)
              const hasDraft = Boolean(readStore().drafts[item.id])
              return (
                <button key={item.id} type="button" onClick={() => setSelectedIssueId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === selectedIssueId ? 'border-rose-200 bg-rose-50' : 'border-transparent bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-rose-600">{item.id} · {item.code}</span>
                    {hasDraft ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">有草稿</span> : null}
                  </div>
                  <div className="mt-1 text-sm font-black leading-5 text-stone-800">{node?.label ?? item.name}</div>
                  <div className="mt-1 text-[11px] text-stone-400">{subjectLabels[item.subject]} · {item.grade}年级{item.term}册</div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="rounded-3xl bg-white p-5 shadow">
          {issue && entry ? (
            <>
              <div className="flex flex-col gap-3 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black text-rose-600">{issue.id} · {issue.code} · {issue.severity}</div>
                  <h2 className="mt-1 text-xl font-black text-stone-900">{entry.label}</h2>
                  <p className="mt-1 text-xs text-stone-400">{subjectLabels[entry.subject]} · {entry.grade}年级{semesterLabel(entry.semester)} · {entry.unit}</p>
                </div>
                <span className="self-start rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">needs_review</span>
              </div>

              <section className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <h3 className="text-xs font-black text-stone-500">问题发现</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{issue.finding}</p>
                  <h3 className="mt-4 text-xs font-black text-stone-500">建议处理</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{issue.disposition}</p>
                </div>
                <div className="rounded-2xl border border-stone-100 p-4">
                  <h3 className="text-xs font-black text-stone-400">不可变原始证据</h3>
                  <p className="mt-2 text-sm font-bold text-stone-800">{entry.label}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{entry.learningDemand}</p>
                  <div className="mt-3 text-[11px] leading-5 text-stone-400"><div>{entry.sourcePath}</div><div>{entry.sourcePointer}</div></div>
                </div>
              </section>

              <StandardEvidencePanel entryId={entry.id} />

              <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-stone-900">修订草稿</h3>
                  {savedMessage ? <span className="text-xs font-bold text-amber-700">{savedMessage}</span> : null}
                </div>
                <label className="mt-4 block text-xs font-black text-stone-500">建议知识点名称</label>
                <input value={draft.proposedLabel} onChange={(event) => setDraft((current) => ({ ...current, proposedLabel: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
                <label className="mt-4 block text-xs font-black text-stone-500">建议学习要求</label>
                <textarea value={draft.proposedLearningDemand} onChange={(event) => setDraft((current) => ({ ...current, proposedLearningDemand: event.target.value }))} rows={5} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm leading-6 outline-none focus:border-amber-400" />
                <label className="mt-4 block text-xs font-black text-stone-500">教研备注</label>
                <textarea value={draft.reviewerNote} onChange={(event) => setDraft((current) => ({ ...current, reviewerNote: event.target.value }))} rows={3} placeholder="记录修订理由、需要补查的教材或课标证据。" className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm leading-6 outline-none focus:border-amber-400" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={saveDraft} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-white">保存本地草稿</button>
                  <button type="button" onClick={exportDraft} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出草稿 JSON</button>
                  <button type="button" onClick={resetDraft} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm">恢复种子基线</button>
                </div>
                {draft.updatedAt ? <p className="mt-3 text-[11px] text-stone-400">最近本地保存：{draft.updatedAt}</p> : null}
              </section>
            </>
          ) : <p className="py-20 text-center text-sm text-stone-400">没有可审校的问题记录</p>}
        </main>
      </section>
    </div>
  )
}
