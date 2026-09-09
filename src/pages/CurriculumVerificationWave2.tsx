import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'
import {
  curriculumGradeVerificationRowsWave2,
  curriculumKnowledgeVerificationItemsWave2,
  curriculumRepairTasksWave2,
  curriculumVerificationPolicyWave2,
  curriculumVerificationSummaryWave2,
  mathWave2AuditTasks,
  verificationItemsForGradeWave2,
  type VerificationWave,
  type Wave2ContentVerificationStatus,
  type Wave2GradeVerificationRow,
} from '../content/curriculum/curriculumVerificationWave2'

const contentStatusLabel: Record<Wave2ContentVerificationStatus, string> = {
  automated_screened: '机器首筛已执行',
  patch_proposed: '已有修补建议',
  queued_patch_review: '排队修补复核',
  queued: '待进入核对波次',
  coverage_gap: '覆盖缺口',
  recheck_pending: '候选修补待真人确认',
  manual_review_required: '必须人工判断',
  audit_findings: '专项审计有待核项',
}

function RowCard({ row, onInspect }: { row: Wave2GradeVerificationRow; onInspect: (id: string) => void }) {
  const hasFindings = row.automatedStatus === 'passed_with_findings'
  const isMathAudit = row.subject === 'math' && row.wave === 2
  return (
    <article className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-stone-900">{subjectLabels[row.subject]} · {row.grade}年级</div>
          <div className="mt-1 text-[11px] font-bold text-stone-400">Wave {row.wave}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${hasFindings ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {hasFindings ? '机器检查有发现' : '机器检查通过'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-stone-50 p-2"><div className="text-lg font-black">{row.knowledgePointCount}</div><div className="text-[10px] text-stone-400">知识点</div></div>
        <div className="rounded-xl bg-stone-50 p-2"><div className="text-lg font-black">{row.occurrenceCount}</div><div className="text-[10px] text-stone-400">Occurrence</div></div>
        <div className="rounded-xl bg-stone-50 p-2"><div className="text-lg font-black">{row.assessmentCount}</div><div className="text-[10px] text-stone-400">Assessment</div></div>
      </div>

      <div className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
        <span className="font-black">内容状态：</span>{contentStatusLabel[row.contentStatus]}
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">{row.priorityReason}</p>
      <p className="mt-2 text-xs leading-5 text-stone-700"><span className="font-black">下一步：</span>{row.nextAction}</p>

      {isMathAudit ? (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-800">
          未绑定测评 {row.unlinkedAssessmentCount} · 跨年级语义关系 {row.crossGradeSemanticRelationCount} · 跨年级 prerequisite {row.crossGradePrerequisiteCount}<br />
          低年级知识复用 {row.reusedPriorGradeOccurrenceCount} · 未来年级来源 {row.futureOriginOccurrenceCount} · 关系证据缺失 {row.relationEvidenceMissingCount}
        </div>
      ) : (
        <div className="mt-3 text-[10px] leading-5 text-stone-400">
          已登记问题 {row.registeredIssueCount} · 来源缺失 {row.missingSourceCount} · 规范化重名 {row.normalizedDuplicateLabelCount}
        </div>
      )}
      <div className="mt-1 text-[10px] font-black text-rose-500">真人学科复核：未开始</div>
      <button type="button" onClick={() => onInspect(row.id)} className="mt-3 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-black text-white">查看逐条台账</button>
    </article>
  )
}

export default function CurriculumVerificationWave2() {
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [wave, setWave] = useState<'all' | VerificationWave>('all')
  const [selectedRowId, setSelectedRowId] = useState('verify:chinese:4')

  const rows = useMemo(() => curriculumGradeVerificationRowsWave2.filter((row) => {
    if (subject !== 'all' && row.subject !== subject) return false
    if (wave !== 'all' && row.wave !== wave) return false
    return true
  }), [subject, wave])

  const selectedRow = rows.find((row) => row.id === selectedRowId) ?? rows[0] ?? null
  const selectedItems = selectedRow ? verificationItemsForGradeWave2(selectedRow.subject, selectedRow.grade) : []

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">三科逐年级核对矩阵</h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">Wave 2</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">逐学科、逐年级、逐知识点执行核对。文本问题进入候选修补/人工判断，数学四五年级增加测评绑定、跨年级 raw relation 与知识复用专项审计；机器通过不等于教研已核。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/review" className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">修订工作台</Link>
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">返回知识地图</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          ['必核年级', curriculumVerificationSummaryWave2.rowCount],
          ['已执行年级', curriculumVerificationSummaryWave2.executedRows],
          ['Wave 2逐条首筛', curriculumVerificationSummaryWave2.wave2ScreenedItems],
          ['修补待真人', curriculumVerificationSummaryWave2.recheckPendingRepairCount],
          ['数学专项任务', curriculumVerificationSummaryWave2.mathWave2AuditTaskCount],
          ['阻断型专项', curriculumVerificationSummaryWave2.mathWave2BlockingTaskCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs leading-6 text-rose-700">
        <strong>正式发布门禁：</strong>{curriculumVerificationPolicyWave2.rule} 当前状态：<strong>{curriculumVerificationSummaryWave2.gradeVerificationReadyForOfficialRelease ? '可发布' : '阻断'}</strong>。
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="text-sm font-black text-stone-900">每个年级强制核对项</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {curriculumVerificationPolicyWave2.requiredChecks.map((item) => <span key={item} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600">{item}</span>)}
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'chinese', 'english', 'math'] as const).map((item) => (
            <button key={item} type="button" onClick={() => setSubject(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${subject === item ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
              {item === 'all' ? '全部学科' : subjectLabels[item]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 1, 2, 3] as const).map((item) => (
            <button key={item} type="button" onClick={() => setWave(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${wave === item ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700'}`}>
              {item === 'all' ? '全部波次' : `Wave ${item}`}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => <RowCard key={row.id} row={row} onInspect={setSelectedRowId} />)}
      </section>

      {selectedRow ? (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-black text-violet-600">逐条核对台账 · Wave {selectedRow.wave}</div>
              <h2 className="mt-1 text-lg font-black text-stone-900">{subjectLabels[selectedRow.subject]} · {selectedRow.grade}年级</h2>
              <p className="mt-1 text-xs text-stone-400">{selectedItems.length} 条 occurrence 级记录；机器状态、问题状态与真人复核状态分开保存。</p>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">human verified = 0</span>
          </div>
          <div className="mt-4 max-h-[560px] overflow-y-auto rounded-2xl border border-stone-100">
            {selectedItems.map((item) => (
              <article key={item.id} className="grid gap-2 border-b border-stone-100 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_150px_110px] md:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-stone-900">{item.label}</div>
                  <code className="mt-1 block truncate text-[10px] text-stone-400">{item.knowledgeId}</code>
                  <div className="mt-1 truncate text-[10px] text-stone-400">{item.sourceRef}</div>
                  {item.registeredIssueIds.length ? <div className="mt-1 text-[10px] font-black text-rose-600">问题：{item.registeredIssueIds.join('、')}</div> : null}
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === 'recheck_pending' ? 'bg-violet-100 text-violet-700' : item.status === 'needs_patch' ? 'bg-amber-100 text-amber-700' : item.status === 'automated_screened' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{item.status}</span>
                <span className="text-[10px] font-black text-rose-500">真人：未开始</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-lg font-black">数学 Wave 2 专项审计</h2><p className="mt-1 text-xs text-stone-400">blocking 表示数据绑定/证据缺口；review 表示有 raw evidence 但仍需教研确认。</p></div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{mathWave2AuditTasks.length} 项</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {mathWave2AuditTasks.map((task) => (
            <article key={task.id} className={`rounded-2xl border p-4 ${task.severity === 'blocking' ? 'border-rose-100 bg-rose-50/50' : 'border-violet-100 bg-violet-50/40'}`}>
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black text-stone-500">数学 · {task.grade}年级 · {task.kind}</div><div className="mt-1 text-sm font-black text-stone-900">{task.title}</div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${task.severity === 'blocking' ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700'}`}>{task.severity}</span></div>
              <p className="mt-2 text-xs leading-6 text-stone-600">{task.detail}</p>
              <div className="mt-2 text-[10px] text-stone-400">{task.sourceRefs.join(' · ') || 'source refs 见年级审计记录'}</div>
              <div className="mt-1 text-[10px] font-black text-rose-500">autoApply=false</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-black">内容修补生命周期</h2><p className="mt-1 text-xs text-stone-400">候选修补通过范围检查后仍需真人确认；F005 不提供自动概念拆分。</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">recheck {curriculumVerificationSummaryWave2.recheckPendingRepairCount} · manual {curriculumVerificationSummaryWave2.manualRepairCount}</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {curriculumRepairTasksWave2.map((task) => (
            <article key={task.id} className="rounded-2xl border border-stone-100 p-4">
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black text-violet-600">{subjectLabels[task.subject]} · {task.grade}年级 · Wave {task.wave}</div><div className="mt-1 text-sm font-black">{task.issueId} · {task.title}</div></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-black text-stone-600">{task.status}</span></div>
              <p className="mt-2 text-xs leading-6 text-stone-600">{task.repairAction}</p>
              <div className="mt-2 text-[10px] font-black text-rose-500">autoApply=false · source {task.sourcePointer}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
