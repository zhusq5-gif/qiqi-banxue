import { curriculumSeed, type CurriculumSubject } from './curriculum'
import { mathGradeAudit, mathWave2AuditTasks } from './mathGradeAudit'
import { createCandidateRepairRecheckBundle } from './curriculumRepairRecheck'
import {
  curriculumCoverageTasks as baseCoverageTasks,
  curriculumGradeVerificationRows as baseRows,
  curriculumKnowledgeVerificationItems as baseItems,
  curriculumRepairTasks as baseRepairTasks,
  curriculumVerificationPolicy as basePolicy,
  type GradeVerificationRow,
  type KnowledgeVerificationItem,
  type RepairTaskStatus,
  type VerificationWave,
} from './curriculumVerification'

export type Wave2ContentVerificationStatus =
  | GradeVerificationRow['contentStatus']
  | 'manual_review_required'
  | 'audit_findings'

export interface Wave2GradeVerificationRow extends Omit<GradeVerificationRow, 'contentStatus'> {
  contentStatus: Wave2ContentVerificationStatus
  unlinkedAssessmentCount: number
  relationEvidenceMissingCount: number
  crossGradeSemanticRelationCount: number
  crossGradePrerequisiteCount: number
  reusedPriorGradeOccurrenceCount: number
  futureOriginOccurrenceCount: number
}

export interface Wave2RepairTask extends Omit<(typeof baseRepairTasks)[number], 'status'> {
  status: RepairTaskStatus | 'manual_review_required'
}

const wave1Executed = new Set(['chinese:1', 'chinese:2', 'english:3', 'math:3'])
const wave2Executed = new Set(['chinese:4', 'english:4', 'english:6', 'math:4', 'math:5'])
const executedGrades = new Set([...wave1Executed, ...wave2Executed])

function issueIdsFor(subject: CurriculumSubject, grade: number) {
  return curriculumSeed.issues
    .filter((issue) => issue.subject === subject && issue.grade === grade)
    .map((issue) => issue.id)
}

function issueLifecycle(subject: CurriculumSubject, grade: number): Wave2ContentVerificationStatus | null {
  const issueIds = issueIdsFor(subject, grade)
  if (issueIds.length === 0) return null
  const bundles = issueIds.map((issueId) => createCandidateRepairRecheckBundle(issueId))
  if (bundles.every((bundle) => bundle.status === 'recheck_pending')) return 'recheck_pending'
  if (bundles.some((bundle) => bundle.status === 'manual_review_required' || bundle.status === 'no_change')) return 'manual_review_required'
  return 'patch_proposed'
}

function contentStatusFor(row: GradeVerificationRow): Wave2ContentVerificationStatus {
  const key = `${row.subject}:${row.grade}`
  if (row.coverageStatus === 'gap') return 'coverage_gap'
  if (!executedGrades.has(key)) return row.registeredIssueCount > 0 ? 'queued_patch_review' : 'queued'

  const lifecycle = row.registeredIssueCount > 0 ? issueLifecycle(row.subject, row.grade) : null
  if (lifecycle) return lifecycle

  if (row.subject === 'math' && (row.grade === 4 || row.grade === 5)) {
    const audit = mathGradeAudit(row.grade)
    if (audit && audit.tasks.length > 0) return 'audit_findings'
  }
  return 'automated_screened'
}

function nextActionFor(row: GradeVerificationRow, status: Wave2ContentVerificationStatus) {
  if (row.coverageStatus === 'gap') return '先补齐该年级自身可定位 Occurrence，再进入逐条核对。'
  if (status === 'recheck_pending') return '候选修补已通过机器差异范围检查；下一步真人学科语义复核，确认前不得写回正式种子。'
  if (status === 'manual_review_required') return '系统没有安全自动修补方案；需真人教研判断概念边界、拆分/合并或重写方案，再进入复测。'
  if (status === 'audit_findings') return '先处理数学专项审计：测评知识点绑定、跨年级关系 evidence 与低年级知识复用；不得自动推导 prerequisite。'
  if (status === 'automated_screened') return '继续逐条语义/教材适配核对；机器首筛通过不等于教研已核。'
  if (status === 'queued_patch_review') return '进入对应波次时先处理已登记问题，再逐条核对。'
  return row.nextAction
}

export const curriculumGradeVerificationRowsWave2: Wave2GradeVerificationRow[] = baseRows.map((row) => {
  const audit = row.subject === 'math' ? mathGradeAudit(row.grade) : null
  const contentStatus = contentStatusFor(row)
  const hasMathAuditFinding = Boolean(audit && (
    audit.unlinkedAssessmentCount > 0
    || audit.relationEvidenceMissingCount > 0
    || audit.crossGradeSemanticRelationCount > 0
    || audit.reusedPriorGradeOccurrenceCount > 0
    || audit.futureOriginOccurrenceCount > 0
  ))
  return {
    ...row,
    automatedStatus: row.automatedStatus === 'passed_with_findings' || hasMathAuditFinding ? 'passed_with_findings' : 'passed',
    contentStatus,
    nextAction: nextActionFor(row, contentStatus),
    unlinkedAssessmentCount: audit?.unlinkedAssessmentCount ?? 0,
    relationEvidenceMissingCount: audit?.relationEvidenceMissingCount ?? 0,
    crossGradeSemanticRelationCount: audit?.crossGradeSemanticRelationCount ?? 0,
    crossGradePrerequisiteCount: audit?.crossGradePrerequisiteCount ?? 0,
    reusedPriorGradeOccurrenceCount: audit?.reusedPriorGradeOccurrenceCount ?? 0,
    futureOriginOccurrenceCount: audit?.futureOriginOccurrenceCount ?? 0,
  }
})

function itemStatus(item: KnowledgeVerificationItem): KnowledgeVerificationItem['status'] {
  const key = `${item.subject}:${item.grade}`
  if (!executedGrades.has(key)) return 'queued'
  if (item.registeredIssueIds.length === 0) return 'automated_screened'
  const bundles = item.registeredIssueIds.map((issueId) => createCandidateRepairRecheckBundle(issueId))
  return bundles.every((bundle) => bundle.status === 'recheck_pending') ? 'recheck_pending' : 'needs_patch'
}

export const curriculumKnowledgeVerificationItemsWave2: KnowledgeVerificationItem[] = baseItems.map((item) => ({
  ...item,
  status: itemStatus(item),
}))

export const curriculumRepairTasksWave2: Wave2RepairTask[] = baseRepairTasks.map((task) => {
  const executed = executedGrades.has(`${task.subject}:${task.grade}`)
  if (!executed) return { ...task, status: 'queued' }
  const recheck = createCandidateRepairRecheckBundle(task.issueId)
  if (recheck.status === 'recheck_pending') return { ...task, status: 'recheck_pending' }
  if (recheck.status === 'manual_review_required' || recheck.status === 'no_change') return { ...task, status: 'manual_review_required' }
  return { ...task, status: 'patch_proposed' }
})

export const curriculumCoverageTasksWave2 = baseCoverageTasks

const wave1Items = curriculumKnowledgeVerificationItemsWave2.filter((item) => item.wave === 1)
const wave2Items = curriculumKnowledgeVerificationItemsWave2.filter((item) => item.wave === 2)
const blockingMathAuditTasks = mathWave2AuditTasks.filter((task) => task.severity === 'blocking')

export const curriculumVerificationSummaryWave2 = {
  rowCount: curriculumGradeVerificationRowsWave2.length,
  itemCount: curriculumKnowledgeVerificationItemsWave2.length,
  executedRows: curriculumGradeVerificationRowsWave2.filter((row) => executedGrades.has(`${row.subject}:${row.grade}`)).length,
  wave1ExecutedRows: curriculumGradeVerificationRowsWave2.filter((row) => row.wave === 1 && wave1Executed.has(`${row.subject}:${row.grade}`)).length,
  wave2ExecutedRows: curriculumGradeVerificationRowsWave2.filter((row) => row.wave === 2 && wave2Executed.has(`${row.subject}:${row.grade}`)).length,
  wave1ScreenedItems: wave1Items.filter((item) => item.status !== 'queued').length,
  wave2ScreenedItems: wave2Items.filter((item) => item.status !== 'queued').length,
  coverageGapCount: curriculumCoverageTasksWave2.length,
  contentRepairTaskCount: curriculumRepairTasksWave2.length,
  recheckPendingRepairCount: curriculumRepairTasksWave2.filter((task) => task.status === 'recheck_pending').length,
  manualRepairCount: curriculumRepairTasksWave2.filter((task) => task.status === 'manual_review_required').length,
  mathWave2AuditTaskCount: mathWave2AuditTasks.length,
  mathWave2BlockingTaskCount: blockingMathAuditTasks.length,
  verificationTaskCount: curriculumRepairTasksWave2.length + curriculumCoverageTasksWave2.length + mathWave2AuditTasks.length,
  humanVerifiedRows: curriculumGradeVerificationRowsWave2.filter((row) => row.humanStatus === 'verified').length,
  humanVerifiedItems: curriculumKnowledgeVerificationItemsWave2.filter((item) => item.humanStatus === 'verified').length,
  gradeVerificationReadyForOfficialRelease: curriculumCoverageTasksWave2.length === 0
    && blockingMathAuditTasks.length === 0
    && curriculumGradeVerificationRowsWave2.every((row) => row.humanStatus === 'verified')
    && curriculumKnowledgeVerificationItemsWave2.every((item) => item.humanStatus === 'verified')
    && curriculumRepairTasksWave2.every((task) => task.status === 'verified'),
}

export const curriculumVerificationPolicyWave2 = {
  requiredChecks: [
    ...basePolicy.requiredChecks.filter((item) => item !== '真人学科复核'),
    '测评任务知识点绑定',
    '真人学科复核',
  ],
  rule: '机器检查、候选修补、测评绑定审计、跨年级关系复核与真人教研分层记录。任何阻断型审计任务、覆盖缺口、知识点未完成人工复核或修补未复测时，不得标记为正式已核。',
}

export { mathWave2AuditTasks }
export type { VerificationWave }

export function verificationRowsForSubjectWave2(subject: CurriculumSubject) {
  return curriculumGradeVerificationRowsWave2.filter((row) => row.subject === subject)
}

export function verificationRowsForWave2(wave: VerificationWave) {
  return curriculumGradeVerificationRowsWave2.filter((row) => row.wave === wave)
}

export function verificationItemsForGradeWave2(subject: CurriculumSubject, grade: number) {
  return curriculumKnowledgeVerificationItemsWave2.filter((item) => item.subject === subject && item.grade === grade)
}

export function repairTasksForGradeWave2(subject: CurriculumSubject, grade: number) {
  return curriculumRepairTasksWave2.filter((task) => task.subject === subject && task.grade === grade)
}
