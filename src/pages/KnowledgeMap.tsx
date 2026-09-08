import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  candidatesForEntry,
  curriculumSeed,
  entryById,
  entriesForTextbook,
  entriesForUnit,
  issueForEntry,
  semesterLabel,
  subjectLabels,
  textbookById,
  textbooksForSubject,
  unitsForTextbook,
  type CurriculumCandidate,
  type CurriculumEntry,
  type CurriculumSubject,
  type CurriculumTextbook,
  type CurriculumView,
} from '../content/curriculum/curriculum'

const viewLabels: Record<CurriculumView, string> = {
  textbook: '教材目录',
  knowledge: '知识能力',
  relations: '关系候选',
}

const editionLabels: Record<string, string> = {
  unknown: '版次待核',
  mismatch: '目录不一致',
  verified: '版次已核',
}

function ReviewBadge({ status }: { status: string }) {
  if (status === 'needs_review') {
    return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">待复核</span>
  }
  if (status === 'expert_verified') {
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">专家已核</span>
  }
  return <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-500">未审核</span>
}

function EditionBadge({ status }: { status: string }) {
  const isMismatch = status === 'mismatch'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isMismatch ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
      {editionLabels[status] ?? status}
    </span>
  )
}

function EntryRow({ entry, selected, onSelect }: { entry: CurriculumEntry; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={`w-full rounded-2xl border p-3 text-left transition ${selected ? 'border-amber-300 bg-amber-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
      style={{ contentVisibility: 'auto' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black leading-5 text-stone-900">{entry.label}</div>
          <div className="mt-1 truncate text-xs text-stone-500">{entry.book} · {entry.unit}</div>
        </div>
        <ReviewBadge status={entry.reviewStatus} />
      </div>
    </button>
  )
}

function RelationCard({ candidate, onSelect }: { candidate: CurriculumCandidate; onSelect: (id: string) => void }) {
  return (
    <article className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4" style={{ contentVisibility: 'auto' }}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">相似标签候选 · 待确认</span>
        <span className="text-xs font-bold text-violet-500">{Math.round(candidate.similarity * 100)}%</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button type="button" onClick={() => onSelect(candidate.fromId)} className="rounded-xl bg-white p-3 text-left text-sm font-bold text-stone-800 shadow-sm">
          {candidate.fromGrade}年级 · {candidate.fromName}
        </button>
        <span className="text-center text-stone-400">↔</span>
        <button type="button" onClick={() => onSelect(candidate.toId)} className="rounded-xl bg-white p-3 text-left text-sm font-bold text-stone-800 shadow-sm">
          {candidate.toGrade}年级 · {candidate.toName}
        </button>
      </div>
      {candidate.reason ? <p className="mt-3 text-xs leading-5 text-violet-700/80">{candidate.reason}</p> : null}
      <p className="mt-2 text-[11px] font-bold text-rose-600">不是 prerequisite / 进阶关系，需人工教研判断。</p>
    </article>
  )
}

function TextbookButton({ book, selected, onSelect }: { book: CurriculumTextbook; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(book.id)}
      className={`w-full rounded-2xl p-3 text-left transition ${selected ? 'bg-amber-100 text-amber-950' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-black">{book.grade}年级{semesterLabel(book.semester)}</div>
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-stone-500">{book.seriesClaim}</div>
        </div>
        <EditionBadge status={book.editionStatus} />
      </div>
    </button>
  )
}

export default function KnowledgeMap() {
  const firstChineseBook = textbooksForSubject('chinese')[0]
  const firstEntry = curriculumSeed.entries.find((entry) => entry.subject === 'chinese')
  const [subject, setSubject] = useState<CurriculumSubject>('chinese')
  const [view, setView] = useState<CurriculumView>('textbook')
  const [textbookId, setTextbookId] = useState(firstChineseBook?.id ?? '')
  const [unitId, setUnitId] = useState<string | null>(null)
  const [grade, setGrade] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedEntryId, setSelectedEntryId] = useState(firstEntry?.id ?? '')

  const textbooks = useMemo(() => textbooksForSubject(subject), [subject])
  const grades = useMemo(() => Array.from(new Set(textbooks.map((book) => book.grade))).sort((a, b) => a - b), [textbooks])
  const units = useMemo(() => unitsForTextbook(textbookId), [textbookId])
  const selectedTextbook = textbookById(textbookId)
  const selectedEntry = entryById(selectedEntryId)
  const selectedIssue = selectedEntry ? issueForEntry(selectedEntry.id) : null
  const selectedCandidates = selectedEntry ? candidatesForEntry(selectedEntry.id) : []
  const selectedEntryTextbook = selectedEntry ? textbookById(selectedEntry.textbookId) : null

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows: CurriculumEntry[]
    if (view === 'textbook') {
      rows = unitId ? entriesForUnit(unitId) : entriesForTextbook(textbookId)
    } else {
      rows = curriculumSeed.entries.filter((entry) => entry.subject === subject && (!grade || entry.grade === grade))
    }
    if (!q) return rows
    return rows.filter((entry) => `${entry.label} ${entry.learningDemand} ${entry.unit} ${entry.book}`.toLowerCase().includes(q))
  }, [grade, query, subject, textbookId, unitId, view])

  const visibleCandidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return curriculumSeed.candidates.filter((candidate) => {
      if (candidate.subject !== subject) return false
      if (grade && candidate.fromGrade !== grade && candidate.toGrade !== grade) return false
      if (!q) return true
      return `${candidate.fromName} ${candidate.toName} ${candidate.reason}`.toLowerCase().includes(q)
    })
  }, [grade, query, subject])

  function chooseSubject(next: CurriculumSubject) {
    const nextBook = textbooksForSubject(next)[0]
    const nextEntry = curriculumSeed.entries.find((entry) => entry.subject === next)
    setSubject(next)
    setGrade(0)
    setQuery('')
    setUnitId(null)
    setTextbookId(nextBook?.id ?? '')
    setSelectedEntryId(nextEntry?.id ?? '')
  }

  function chooseTextbook(id: string) {
    const nextEntry = entriesForTextbook(id)[0]
    setTextbookId(id)
    setUnitId(null)
    if (nextEntry) setSelectedEntryId(nextEntry.id)
  }

  function chooseUnit(id: string | null) {
    setUnitId(id)
    if (id) {
      const nextEntry = entriesForUnit(id)[0]
      if (nextEntry) setSelectedEntryId(nextEntry.id)
    }
  }

  const stats = curriculumSeed.stats

  return (
    <div className="mx-auto min-h-full max-w-[1500px] px-4 pb-20 pt-5">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">小学知识地图</h1>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">研究版 · {curriculumSeed.datasetVersion}</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{curriculumSeed.scopeNote}</p>
        </div>
        <Link to="/parent" className="self-start rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow active:scale-95 md:self-auto">返回家长视图</Link>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          ['全部节点', stats.total],
          ['语文', stats.chinese],
          ['英语', stats.english],
          ['教材', stats.textbooks],
          ['待审问题', stats.issues],
          ['关系候选', stats.candidates],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
        <span className="font-black">正式发布阻断：</span>
        <span>教材版次、课标条款、内容权利和专家审核尚未全部完成。当前页面用于研究、审校与数据建模。</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="grid grid-cols-2 gap-2">
            {(['chinese', 'english'] as const).map((item) => (
              <button key={item} type="button" onClick={() => chooseSubject(item)} className={`rounded-2xl px-3 py-2 text-sm font-black ${subject === item ? 'bg-amber-500 text-white' : 'bg-white text-stone-600'}`}>
                {subjectLabels[item]}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between px-1">
            <h2 className="text-xs font-black tracking-wide text-stone-500">教材目录</h2>
            <span className="text-[11px] text-stone-400">{textbooks.length} 册</span>
          </div>
          <div className="mt-2 max-h-[690px] space-y-2 overflow-y-auto pr-1">
            {textbooks.map((book) => <TextbookButton key={book.id} book={book} selected={book.id === textbookId} onSelect={chooseTextbook} />)}
          </div>
        </aside>

        <main className="min-w-0 rounded-3xl bg-white p-4 shadow">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(viewLabels) as CurriculumView[]).map((item) => (
                <button key={item} type="button" onClick={() => { setView(item); setUnitId(null) }} className={`rounded-full px-4 py-2 text-sm font-black ${view === item ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {viewLabels[item]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setGrade(0)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${grade === 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-50 text-stone-500'}`}>全年级</button>
              {grades.map((value) => <button key={value} type="button" onClick={() => setGrade(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${grade === value ? 'bg-amber-100 text-amber-800' : 'bg-stone-50 text-stone-500'}`}>{value}年级</button>)}
            </div>
          </div>

          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索知识点、学习要求、单元或关系候选" className="mt-4 h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-amber-400" />

          {view === 'textbook' ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2 border-b border-stone-100 pb-4">
                <button type="button" onClick={() => chooseUnit(null)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${unitId === null ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}>全部单元</button>
                {units.map((unit) => <button key={unit.id} type="button" onClick={() => chooseUnit(unit.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${unitId === unit.id ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}>{unit.number}. {unit.title}</button>)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                <span>{selectedTextbook?.title ?? '请选择教材'}</span><span>{visibleEntries.length} 条</span>
              </div>
            </>
          ) : null}

          {view === 'knowledge' ? <div className="mt-4 text-xs font-bold text-stone-400">{subjectLabels[subject]} · {grade ? `${grade}年级` : '全年级'} · {visibleEntries.length} 条匹配</div> : null}
          {view === 'relations' ? <div className="mt-4 rounded-2xl bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-700">关系视图当前仅展示 {visibleCandidates.length} 对“相似标签候选”。它们用于发现可能的复现、同概念或进阶线索，尚未经过教研确认。</div> : null}

          <div className="mt-3 max-h-[680px] space-y-2 overflow-y-auto pr-1">
            {view !== 'relations' ? visibleEntries.map((entry) => <EntryRow key={entry.id} entry={entry} selected={entry.id === selectedEntryId} onSelect={setSelectedEntryId} />) : visibleCandidates.map((candidate) => <RelationCard key={candidate.id} candidate={candidate} onSelect={setSelectedEntryId} />)}
            {view !== 'relations' && visibleEntries.length === 0 ? <p className="py-10 text-center text-sm text-stone-400">没有匹配知识点</p> : null}
            {view === 'relations' && visibleCandidates.length === 0 ? <p className="py-10 text-center text-sm text-stone-400">没有匹配候选关系</p> : null}
          </div>
        </main>

        <aside className="rounded-3xl bg-white p-5 shadow lg:sticky lg:top-4 lg:self-start">
          {selectedEntry ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-amber-600">{subjectLabels[selectedEntry.subject]} · {selectedEntry.grade}年级{semesterLabel(selectedEntry.semester)}</div>
                  <h2 className="mt-1 text-xl font-black leading-7 text-stone-900">{selectedEntry.label}</h2>
                </div>
                <ReviewBadge status={selectedEntry.reviewStatus} />
              </div>

              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-xs font-black text-stone-400">本次学习要求</dt><dd className="mt-1 leading-6 text-stone-700">{selectedEntry.learningDemand}</dd></div>
                <div><dt className="text-xs font-black text-stone-400">教材位置</dt><dd className="mt-1 text-stone-700">{selectedEntry.book} · 第 {selectedEntry.unitNumber} 单元 · {selectedEntry.unit}</dd></div>
                <div><dt className="text-xs font-black text-stone-400">难度 / 题型</dt><dd className="mt-1 text-stone-700">难度 {selectedEntry.difficulty} · {selectedEntry.questionTypes.join('、')}</dd></div>
              </dl>

              {selectedEntryTextbook ? (
                <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-stone-500">教材版本卡</span><EditionBadge status={selectedEntryTextbook.editionStatus} /></div>
                  <div className="mt-2 text-sm font-bold text-stone-800">{selectedEntryTextbook.seriesClaim}</div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">{selectedEntryTextbook.versionNote || '尚无进一步版次说明。'}</p>
                  <p className="mt-1 text-[11px] text-stone-400">ISBN：{selectedEntryTextbook.isbn ?? '未知'} · 版次年份：{selectedEntryTextbook.editionYear ?? '未知'}</p>
                </div>
              ) : null}

              {selectedIssue ? (
                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="text-xs font-black text-rose-700">已登记问题 · {selectedIssue.code}</div>
                  <p className="mt-2 text-sm leading-6 text-rose-800">{selectedIssue.finding}</p>
                  <p className="mt-2 text-xs leading-5 text-rose-600">处理建议：{selectedIssue.disposition}</p>
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-violet-100 p-4">
                <div className="flex items-center justify-between"><span className="text-xs font-black text-violet-700">关系候选</span><span className="text-xs text-violet-400">{selectedCandidates.length}</span></div>
                {selectedCandidates.length ? <div className="mt-2 space-y-2">{selectedCandidates.slice(0, 4).map((candidate) => {
                  const otherName = candidate.fromId === selectedEntry.id ? candidate.toName : candidate.fromName
                  const otherId = candidate.fromId === selectedEntry.id ? candidate.toId : candidate.fromId
                  return <button key={candidate.id} type="button" onClick={() => setSelectedEntryId(otherId)} className="block w-full rounded-xl bg-violet-50 px-3 py-2 text-left text-xs font-bold text-violet-700">↔ {otherName} · {Math.round(candidate.similarity * 100)}%</button>
                })}</div> : <p className="mt-2 text-xs text-stone-400">暂无相似标签候选。</p>}
              </div>

              <div className="mt-5 border-t border-stone-100 pt-4 text-[11px] leading-5 text-stone-400">
                <div>来源文件：{selectedEntry.sourcePath}</div>
                <div>JSON Pointer：{selectedEntry.sourcePointer}</div>
                <div className="mt-1 font-bold text-rose-500">来源可追溯 ≠ 已完成教研审核。</div>
              </div>
            </>
          ) : <p className="py-10 text-center text-sm text-stone-400">选择一个知识点查看详情</p>}
        </aside>
      </section>
    </div>
  )
}
