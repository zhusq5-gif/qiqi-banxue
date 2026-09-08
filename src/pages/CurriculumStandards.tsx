import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { entryById, subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'
import {
  curriculumStandards,
  standardClauseById,
  standardClausesForSubject,
  standardDocumentById,
  standardMappingsForClause,
  type StandardEvidenceScope,
} from '../content/curriculum/standards'

const kindLabels: Record<string, string> = {
  core_competency: '核心素养',
  core_competency_detail: '核心素养分项',
  content_area: '内容领域',
  content_theme: '内容主题',
  learning_task_group: '学习任务群',
  stage_goal: '学段目标',
  course_goal: '课程目标',
  implementation_principle: '实施原则',
}

const scopeLabels: Record<StandardEvidenceScope, string> = {
  standard_document: '课标正文',
  official_interpretation: '官方解读',
  pedagogical_principle: '教学实施原则',
}

function evidenceScopeLabel(scope?: StandardEvidenceScope) {
  return scope ? scopeLabels[scope] : '官方公开证据'
}

export default function CurriculumStandards() {
  const [subject, setSubject] = useState<CurriculumSubject>('chinese')
  const [grade, setGrade] = useState(0)
  const [query, setQuery] = useState('')
  const firstClause = standardClausesForSubject('chinese')[0]
  const [selectedClauseId, setSelectedClauseId] = useState(firstClause?.id ?? '')

  const clauses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return standardClausesForSubject(subject).filter((item) => {
      if (grade && !item.grades.includes(grade)) return false
      if (!q) return true
      return `${item.title} ${item.stage} ${item.evidenceSummary} ${kindLabels[item.kind] ?? item.kind} ${evidenceScopeLabel(item.evidenceScope)}`.toLowerCase().includes(q)
    })
  }, [grade, query, subject])

  const selectedClause = standardClauseById(selectedClauseId)
  const selectedDocument = selectedClause ? standardDocumentById(selectedClause.documentId) : null
  const mappings = selectedClause ? standardMappingsForClause(selectedClause.id) : []
  const grades = subject === 'chinese' ? [1, 2, 3, 4, 5, 6] : subject === 'english' ? [3, 4, 5, 6] : [1, 2, 3, 4, 5, 6]

  function chooseSubject(next: CurriculumSubject) {
    if (next === 'math') return
    const nextClause = standardClausesForSubject(next)[0]
    setSubject(next)
    setGrade(0)
    setQuery('')
    setSelectedClauseId(nextClause?.id ?? '')
  }

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 pb-20 pt-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">2022 课标证据库</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">教育部来源已核</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">映射仍待教研</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{curriculumStandards.scopeNote}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/math-sample" className="rounded-full bg-sky-100 px-4 py-2 text-sm font-black text-sky-700">数学真实样板</Link>
          <Link to="/knowledge-map/standards/review" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">映射审核队列 · {curriculumStandards.mappings.length}</Link>
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">返回知识地图</Link>
          <Link to="/knowledge-map/review" className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 shadow">内容修订</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['标准文档', curriculumStandards.documents.length],
          ['证据记录', curriculumStandards.clauses.length],
          ['候选映射', curriculumStandards.mappings.length],
          ['受信签名', 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        “教育部来源已核”只说明证据来源和摘要已核对。页面进一步区分 <strong>官方解读</strong> 与 <strong>教学实施原则</strong>；后者不能冒充具体课标学段条款。知识点映射仍统一为 <strong>candidate_review</strong>，必须经过真人审核和签名门禁。
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-stone-50 p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="grid grid-cols-2 gap-2">
            {(['chinese', 'english'] as const).map((item) => (
              <button key={item} type="button" onClick={() => chooseSubject(item)} className={`rounded-2xl px-3 py-2 text-sm font-black ${subject === item ? 'bg-amber-500 text-white' : 'bg-white text-stone-600'}`}>
                {subjectLabels[item]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setGrade(0)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${grade === 0 ? 'bg-stone-900 text-white' : 'bg-white text-stone-500'}`}>全年级</button>
            {grades.map((value) => <button key={value} type="button" onClick={() => setGrade(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${grade === value ? 'bg-stone-900 text-white' : 'bg-white text-stone-500'}`}>{value}年级</button>)}
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索条款、任务群或证据摘要" className="mt-3 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
          <div className="mt-3 max-h-[650px] space-y-2 overflow-y-auto pr-1">
            {clauses.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedClauseId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === selectedClauseId ? 'border-amber-300 bg-amber-50' : 'border-stone-100 bg-white'}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-black text-amber-700">{kindLabels[item.kind] ?? item.kind}</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">{evidenceScopeLabel(item.evidenceScope)}</span>
                </div>
                <div className="mt-1 text-sm font-black leading-5 text-stone-900">{item.title}</div>
                <div className="mt-1 text-[11px] text-stone-400">{item.stage} · 适用 {item.grades.filter((value) => value <= 6).join('、') || '全学段'} 年级</div>
              </button>
            ))}
            {clauses.length === 0 ? <p className="py-8 text-center text-sm text-stone-400">没有匹配条款</p> : null}
          </div>
        </aside>

        <main className="rounded-3xl bg-white p-5 shadow">
          {selectedClause ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-amber-600">{kindLabels[selectedClause.kind] ?? selectedClause.kind}</span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-black text-stone-600">{evidenceScopeLabel(selectedClause.evidenceScope)}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-black text-stone-900">{selectedClause.title}</h2>
                  <p className="mt-1 text-xs text-stone-400">{selectedClause.stage}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">证据来源已核</span>
              </div>

              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <div className="text-xs font-black text-stone-400">证据摘要</div>
                <p className="mt-2 text-sm leading-7 text-stone-700">{selectedClause.evidenceSummary}</p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-xs font-black text-stone-400">关联标准文档</div>
                  <div className="mt-2 text-sm font-black text-stone-800">{selectedDocument?.title}</div>
                  <div className="mt-1 text-xs leading-5 text-stone-500">{selectedDocument?.authority} · {selectedDocument?.versionYear} · {selectedDocument?.effectiveFrom} 起执行</div>
                </div>
                <div className="rounded-2xl border border-stone-100 p-4">
                  <div className="text-xs font-black text-stone-400">映射规则</div>
                  <p className="mt-2 text-xs leading-6 text-stone-600">{selectedClause.mappingPolicy}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="text-xs font-black text-emerald-700">官方证据位置</div>
                <div className="mt-2 text-xs leading-5 text-emerald-800">{selectedClause.sourceLocator}</div>
                <a href={selectedClause.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-black text-emerald-700 underline">打开教育部来源 ↗</a>
              </div>

              <section className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-stone-800">知识点映射候选</h3>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-stone-400">{mappings.length} 条</span><Link to="/knowledge-map/standards/review" className="text-xs font-black text-violet-700 underline">进入人工审核</Link></div>
                </div>
                <div className="mt-3 space-y-2">
                  {mappings.map((mapping) => {
                    const entry = entryById(mapping.entryId)
                    return (
                      <article key={mapping.id} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-black text-stone-900">{entry?.label ?? mapping.entryId}</div>
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">{mapping.status} · {Math.round(mapping.confidence * 100)}%</span>
                        </div>
                        {entry ? <div className="mt-1 text-xs text-stone-500">{entry.grade}年级 · {entry.book} · {entry.unit}</div> : null}
                        <p className="mt-2 text-xs leading-6 text-violet-800">{mapping.rationale}</p>
                        <div className="mt-2 text-[11px] font-black text-rose-600">关系：{mapping.relation}；尚未通过受信学科审核者签名。</div>
                      </article>
                    )
                  })}
                  {mappings.length === 0 ? <p className="rounded-2xl bg-stone-50 py-8 text-center text-sm text-stone-400">暂无样板映射</p> : null}
                </div>
              </section>
            </>
          ) : <p className="py-10 text-center text-sm text-stone-400">选择一条课标证据查看详情</p>}
        </main>
      </section>
    </div>
  )
}
