import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { mathFineSample, type MathFineThemeId } from '../content/curriculum/mathFineSample'
import {
  mathAssessmentsForNode,
  mathNormalizedDataset,
  mathNormalizedNodeById,
  mathOccurrencesForNode,
  mathRelationsForNode,
  type MathDomain,
  type MathKnowledgeKind,
} from '../content/curriculum/mathNormalized'

const kindLabel: Record<MathKnowledgeKind, string> = {
  concept: '概念',
  skill: '技能',
}

const domainLabel: Record<MathDomain, string> = {
  number_algebra: '数与代数',
  geometry: '图形与几何',
  statistics_probability: '统计与概率',
  unclassified: '未分类',
}

export default function MathNormalizedSample() {
  const first = mathNormalizedDataset.knowledgeNodes[0]
  const [domain, setDomain] = useState<'all' | MathDomain>('all')
  const [kind, setKind] = useState<'all' | MathKnowledgeKind>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(first?.id ?? '')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mathNormalizedDataset.knowledgeNodes.filter((node) => {
      if (domain !== 'all' && !node.domains.includes(domain)) return false
      if (kind !== 'all' && node.kind !== kind) return false
      if (!q) return true
      return `${node.canonicalName} ${node.id} ${node.source.rawId} ${node.definition ?? ''} ${node.description ?? ''}`.toLowerCase().includes(q)
    })
  }, [domain, kind, query])

  const selected = mathNormalizedNodeById(selectedId)
  const occurrences = selected ? mathOccurrencesForNode(selected.id) : []
  const assessments = selected ? mathAssessmentsForNode(selected.id) : []
  const relations = selected ? mathRelationsForNode(selected.id) : []

  function chooseDomain(next: 'all' | MathDomain) {
    setDomain(next)
    setKind('all')
    setQuery('')
    const candidate = mathNormalizedDataset.knowledgeNodes.find((node) => next === 'all' || node.domains.includes(next))
    if (candidate) setSelectedId(candidate.id)
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">小学数学统一 Schema 视图</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
            将 K12-KGraph raw Concept / Skill / Exercise / Chapter 映射为系统统一实体。KnowledgeNode 仍为 provisional；规范化只改变数据组织方式，不改变原始证据、许可证或审核状态。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/math-sample/fine" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">查看 raw 子图</Link>
          <Link to="/knowledge-map/math-sample" className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 shadow">数学样板</Link>
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">知识地图</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['KnowledgeNode', mathNormalizedDataset.knowledgeNodes.length],
          ['Occurrence', mathNormalizedDataset.occurrences.length],
          ['AssessmentTask', mathNormalizedDataset.assessmentTasks.length],
          ['Raw Relation', mathNormalizedDataset.relations.length],
        ].map(([name, value]) => (
          <div key={name} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{name}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        {mathFineSample.progressions.map((progression) => (
          <article key={progression.id} className="rounded-3xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="text-sm font-black text-stone-900">{progression.label}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-black text-violet-700">
              {progression.stages.map((stage, index) => (
                <span key={`${progression.id}-${stage.chapterId}`} className="contents">
                  {index > 0 ? <span className="text-violet-300">→</span> : null}
                  <span className="rounded-full bg-white px-2 py-1">{stage.grade}年级{stage.semester === 1 ? '上' : '下'} · {stage.label}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-5 text-violet-700">教材序列用于课程浏览，不会被规范化为 synthetic prerequisite。</p>
          </article>
        ))}
      </section>

      <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
        数据许可：<strong>{mathFineSample.source.license}</strong> · commercialUse=false。每个规范化对象保留 raw ID 与 sourceLocator，可反查 K12-KGraph 原始证据。
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <main className="rounded-3xl bg-white p-4 shadow">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => chooseDomain('all')} className={`rounded-full px-3 py-1.5 text-xs font-black ${domain === 'all' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700'}`}>全部领域</button>
              {(['number_algebra', 'geometry', 'statistics_probability', 'unclassified'] as const).map((item) => (
                <button key={item} type="button" onClick={() => chooseDomain(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${domain === item ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700'}`}>{domainLabel[item]}</button>
              ))}
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-1.5">
                {(['all', 'concept', 'skill'] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${kind === item ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{item === 'all' ? '全部类型' : kindLabel[item]}</button>
                ))}
              </div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索规范化节点或 raw ID" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-violet-400 md:max-w-sm" />
            </div>
          </div>

          <div className="mt-3 text-xs font-bold text-stone-400">显示 {visible.length} / {mathNormalizedDataset.knowledgeNodes.length} 个 KnowledgeNode</div>
          <div className="mt-3 grid max-h-[720px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {visible.map((node) => (
              <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`rounded-2xl border p-4 text-left ${node.id === selectedId ? 'border-violet-300 bg-violet-50' : 'border-stone-100 bg-white hover:border-stone-200'}`} style={{ contentVisibility: 'auto' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-black leading-5 text-stone-900">{node.canonicalName}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${node.kind === 'concept' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>{kindLabel[node.kind]}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{node.domains.map((item) => <span key={item} className="text-[10px] font-bold text-violet-600">{domainLabel[item]}</span>)}</div>
                <code className="mt-2 block break-all text-[10px] text-stone-400">{node.id}</code>
                <div className="mt-1 text-[10px] text-stone-400">raw: {node.source.rawId}</div>
              </button>
            ))}
            {visible.length === 0 ? <p className="col-span-full py-10 text-center text-sm text-stone-400">当前筛选没有节点</p> : null}
          </div>
        </main>

        <aside className="rounded-3xl bg-white p-5 shadow lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">provisional</span>
                <span className="text-[11px] font-black text-stone-400">{kindLabel[selected.kind]}</span>
              </div>
              <h2 className="mt-2 text-xl font-black leading-7 text-stone-900">{selected.canonicalName}</h2>
              <code className="mt-1 block break-all text-[10px] text-stone-400">{selected.id}</code>

              <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs leading-6 text-stone-700">
                {selected.definition ?? selected.description ?? '当前 raw 节点没有可展示的定义/技能描述。'}
                {selected.formula ? <div className="mt-2 font-black text-stone-900">公式：{selected.formula}</div> : null}
              </div>

              <section className="mt-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-stone-800">Occurrence</h3><span className="text-xs text-stone-400">{occurrences.length}</span></div>
                <div className="mt-2 space-y-2">
                  {occurrences.map((item) => <div key={item.id} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 text-xs"><div className="font-black text-sky-900">{item.grade}年级{item.semester === 1 ? '上' : '下'} · {item.chapterName}</div><code className="mt-1 block break-all text-[10px] text-sky-600">{item.rawAppearsInEdgeId}</code></div>)}
                  {occurrences.length === 0 ? <p className="text-xs text-stone-400">当前摘录没有 appears_in 记录。</p> : null}
                </div>
              </section>

              <section className="mt-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-stone-800">AssessmentTask</h3><span className="text-xs text-stone-400">{assessments.length}</span></div>
                <div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                  {assessments.map((task) => <div key={task.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3"><div className="text-xs font-black text-stone-900">{task.title}</div><div className="mt-1 text-[10px] text-amber-700">{task.questionType ?? '题型未知'} · raw {task.rawExerciseId}</div></div>)}
                  {assessments.length === 0 ? <p className="text-xs text-stone-400">当前摘录没有直接测评任务。</p> : null}
                </div>
              </section>

              <section className="mt-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-stone-800">Raw Relation</h3><span className="text-xs text-stone-400">{relations.length}</span></div>
                <div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                  {relations.map((relation) => {
                    const outbound = relation.fromKnowledgeNodeId === selected.id
                    const other = mathNormalizedNodeById(outbound ? relation.toKnowledgeNodeId : relation.fromKnowledgeNodeId)
                    return <button key={relation.id} type="button" onClick={() => other && setSelectedId(other.id)} className="block w-full rounded-2xl border border-violet-100 bg-violet-50/50 p-3 text-left"><div className="text-[10px] font-black uppercase text-violet-600">{relation.relationType}</div><div className="mt-1 text-xs font-black text-stone-900">{outbound ? '→' : '←'} {other?.canonicalName ?? '未知端点'}</div><div className="mt-1 text-[10px] text-stone-400">raw {relation.rawEdgeId}</div></button>
                  })}
                  {relations.length === 0 ? <p className="text-xs text-stone-400">当前摘录没有 raw semantic relation。</p> : null}
                </div>
              </section>

              <div className="mt-5 border-t border-stone-100 pt-4 text-[11px] leading-5 text-stone-400">
                <div>raw ID：{selected.source.rawId}</div>
                <div>{selected.source.sourceLocator}</div>
                <div className="mt-1">{selected.source.license} · commercialUse=false</div>
              </div>
            </>
          ) : <p className="py-10 text-center text-sm text-stone-400">选择一个规范化节点查看详情</p>}
        </aside>
      </section>
    </div>
  )
}
