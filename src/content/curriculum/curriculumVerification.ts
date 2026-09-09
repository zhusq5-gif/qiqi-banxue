import { curriculumSeed, type CurriculumSubject } from './curriculum'
import { mathNormalizedDataset } from './mathNormalized'

export type VerificationWave = 1 | 2 | 3
export type AutomatedVerificationStatus = 'passed' | 'passed_with_findings'
export type ContentVerificationStatus =
  | 'automated_screened'
  | 'patch_proposed'
  | 'queued_patch_review'
  | 'queued'
  | 'recheck_pending'
export type HumanVerificationStatus = 'not_started' | 'pending' | 'verified'
export type RepairTaskStatus = 'patch_proposed' | 'queued' | 'recheck_pending' | 'verified'

export interface GradeVerificationRow {
  id: string
  subject: CurriculumSubject
  grade: number
  wave: VerificationWave
  knowledgePointCount: number
  occurrenceCount: number
  assessmentCount: number
  registeredIssueCount: number
  relationCandidateCount: number
  normalizedDuplicateLabelCount: number
  missingSourceCount: number
  unresolvedAssessmentTargetCount: number
  automatedStatus: AutomatedVerificationStatus
  contentStatus: ContentVerificationStatus
  humanStatus: HumanVerificationStatus
  priorityReason: string
  nextAction: string
}

export interface CurriculumRepairTask {
  id: string
  issueId: string
  subject: CurriculumSubject
  grade: number
  wave: VerificationWave
  status: RepairTaskStatus
  title: string
  repairAction: string
  autoApply: false
  sourcePointer: string
}

const waveAssignments: Record<string, { wave: VerificationWave; reason: string }> = {
  'chinese:1': { wave: 1, reason: '已登记2条内容问题，且低年级基础性强，优先修补。' },
  'chinese:2': { wave: 1, reason: '已登记2条内容问题，优先完成标题/例词一致性复核。' },
  'english:3': { wave: 1, reason: '英语起始年级，用作英语全链路核对基线。' },
  'math:3': { wave: 1, reason: '当前数与代数、图形与几何样板最完整，优先验证规范化与年级归属。' },

  'chinese:4': { wave: 2, reason: '存在“长话短说/缩句”概念边界问题。' },
  'english:4': { wave: 2, reason: '存在英语题型中混入“口算”的已知问题。' },
  'english:6': { wave: 2, reason: '存在文本标点损坏的已知问题。' },
  'math:4': { wave: 2, reason: '用于核对角、条形统计图等跨年级承接。' },
  'math:5': { wave: 2, reason: '用于核对可能性、折线统计图与五下分数意义。' },

  'chinese:3': { wave: 3, reason: '在高风险年级完成后进入全面内容复核。' },
  'chinese:5': { wave: 3, reason: '进入全面内容复核与课标映射复核。' },
  'chinese:6': { wave: 3, reason: '进入毕业年级完整性、进阶关系与课标复核。' },
  'english:5': { wave: 3, reason: '进入全面内容复核与跨年级表达进阶检查。' },
  'math:1': { wave: 3, reason: '低年级数学当前为研究样板，后续补全后逐项复核。' },
  'math:2': { wave: 3, reason: '低年级数学当前为研究样板，后续补全后逐项复核。' },
  'math:6': { wave: 3, reason: '用于分数、圆、圆柱圆锥、扇形统计图的毕业年级收口复核。' },
}

const wave1Executed = new Set(['chinese:1', 'chinese:2', 'english:3', 'math:3'])

function normalizeLabel(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

function duplicateExcess(labels: string[]) {
  const normalized = labels.map(normalizeLabel).filter(Boolean)
  return normalized.length - new Set(normalized).size
}

function chapterGrade(chapterId: string) {
  const match = /^math_(\d+)[ab]_rjb_ch/.exec(chapterId)
  return match ? Number(match[1]) : null
}

function textRow(subject: Extract<CurriculumSubject, 'chinese' | 'english'>, grade: number): Omit<GradeVerificationRow, 'id' | 'wave' | 'priorityReason' | 'contentStatus' | 'humanStatus' | 'nextAction'> {
  const entries = curriculumSeed.entries.filter((entry) => entry.subject === subject && entry.grade === grade)
  const issues = curriculumSeed.issues.filter((issue) => issue.subject === subject && issue.grade === grade)
  const candidates = curriculumSeed.candidates.filter(
    (candidate) => candidate.subject === subject && (candidate.fromGrade === grade || candidate.toGrade === grade),
  )
  const missingSourceCount = entries.filter((entry) => !entry.sourcePath || !entry.sourcePointer).length
  const normalizedDuplicateLabelCount = duplicateExcess(entries.map((entry) => entry.label))
  const hasFindings = issues.length > 0 || missingSourceCount > 0 || normalizedDuplicateLabelCount > 0
  return {
    subject,
    grade,
    knowledgePointCount: entries.length,
    occurrenceCount: entries.length,
    assessmentCount: 0,
    registeredIssueCount: issues.length,
    relationCandidateCount: candidates.length,
    normalizedDuplicateLabelCount,
    missingSourceCount,
    unresolvedAssessmentTargetCount: 0,
    automatedStatus: hasFindings ? 'passed_with_findings' : 'passed',
  }
}

function mathRow(grade: number): Omit<GradeVerificationRow, 'id' | 'wave' | 'priorityReason' | 'contentStatus' | 'humanStatus' | 'nextAction'> {
  const occurrences = mathNormalizedDataset.occurrences.filter((item) => item.grade === grade)
  const knowledgeNodeIds = Array.from(new Set(occurrences.map((item) => item.knowledgeNodeId)))
  const nodes = mathNormalizedDataset.knowledgeNodes.filter((node) => knowledgeNodeIds.includes(node.id))
  const assessments = mathNormalizedDataset.assessmentTasks.filter((task) => task.chapterIds.some((id) => chapterGrade(id) === grade))
  const unresolvedAssessmentTargetCount = assessments.reduce((sum, task) => sum + task.unresolvedRawTargetIds.length, 0)
  const missingSourceCount = [
    ...nodes.filter((node) => !node.source.rawId || !node.source.sourceLocator),
    ...occurrences.filter((item) => !item.source.rawId || !item.source.sourceLocator),
    ...assessments.filter((task) => !task.source.rawId || !task.source.sourceLocator),
  ].length
  const normalizedDuplicateLabelCount = duplicateExcess(nodes.map((node) => node.canonicalName))
  const relationCandidateCount = mathNormalizedDataset.relations.filter(
    (relation) => knowledgeNodeIds.includes(relation.fromKnowledgeNodeId) || knowledgeNodeIds.includes(relation.toKnowledgeNodeId),
  ).length
  const hasFindings = missingSourceCount > 0 || unresolvedAssessmentTargetCount > 0 || normalizedDuplicateLabelCount > 0
  return {
    subject: 'math',
    grade,
    knowledgePointCount: knowledgeNodeIds.length,
    occurrenceCount: occurrences.length,
    assessmentCount: assessments.length,
    registeredIssueCount: 0,
    relationCandidateCount,
    normalizedDuplicateLabelCount,
    missingSourceCount,
    unresolvedAssessmentTargetCount,
    automatedStatus: hasFindings ? 'passed_with_findings' : 'passed',
  }
}

function rowFor(subject: CurriculumSubject, grade: number): GradeVerificationRow {
  const key = `${subject}:${grade}`
  const assignment = waveAssignments[key]
  if (!assignment) throw new Error(`Missing verification wave assignment for ${key}`)
  const base = subject === 'math' ? mathRow(grade) : textRow(subject, grade)
  const executed = wave1Executed.has(key)
  const contentStatus: ContentVerificationStatus = executed
    ? (base.registeredIssueCount > 0 ? 'patch_proposed' : 'automated_screened')
    : (base.registeredIssueCount > 0 ? 'queued_patch_review' : 'queued')
  const nextAction = contentStatus === 'patch_proposed'
    ? '按修补任务处理已登记问题，修补后进入逐条内容复核与回归。'
    : contentStatus === 'automated_screened'
      ? '继续进行逐条语义/教材适配核对；机器筛查通过不等于教研已核。'
      : base.registeredIssueCount > 0
        ? '进入对应波次时先处理已登记问题，再逐条核对。'
        : '进入对应波次后执行逐条内容核对、课标映射核对与真人复核。'
  return {
    id: `verify:${key}`,
    ...base,
    wave: assignment.wave,
    priorityReason: assignment.reason,
    contentStatus,
    humanStatus: 'not_started',
    nextAction,
  }
}

export const curriculumGradeVerificationRows: GradeVerificationRow[] = [
  ...[1, 2, 3, 4, 5, 6].map((grade) => rowFor('chinese', grade)),
  ...[3, 4, 5, 6].map((grade) => rowFor('english', grade)),
  ...[1, 2, 3, 4, 5, 6].map((grade) => rowFor('math', grade)),
]

const repairActionByIssueId: Record<string, string> = {
  F001: '核对并移除/替换语文题型中的“口算”异常标签；正确题型需由语文教研确认后写回。',
  F002: '依据例词复核“ABB式”标题，当前候选修补为“AABB式词语积累”；确认后再写入发布数据。',
  F003: '复核“八字成语”标题与四字例词不一致问题；当前候选修补为“动物相关四字成语归类”。',
  F004: '按实际例词重新确认重叠词类型，避免继续使用与 ABAB/AABB 例词不一致的“ABB式”标题。',
  F005: '区分“长话短说/概括”与句法“缩句”，必要时拆分为两个知识点或重写标题与学习要求。',
  F006: '核对并移除/替换英语题型中的“口算”异常标签；正确题型需英语教研确认。',
  F007: '修复“回。答”等标点损坏，同时核对修复前后语义和原始来源。',
}

export const curriculumRepairTasks: CurriculumRepairTask[] = curriculumSeed.issues.map((issue) => {
  const row = curriculumGradeVerificationRows.find((item) => item.subject === issue.subject && item.grade === issue.grade)
  if (!row) throw new Error(`Verification row missing for issue ${issue.id}`)
  return {
    id: `repair:${issue.id}`,
    issueId: issue.id,
    subject: issue.subject,
    grade: issue.grade,
    wave: row.wave,
    status: row.wave === 1 ? 'patch_proposed' : 'queued',
    title: issue.name,
    repairAction: repairActionByIssueId[issue.id] ?? issue.disposition ?? '进入对应年级核对波次后人工处理。',
    autoApply: false,
    sourcePointer: issue.sourcePointer,
  }
})

export const curriculumVerificationSummary = {
  rowCount: curriculumGradeVerificationRows.length,
  automatedCheckedRows: curriculumGradeVerificationRows.length,
  wave1ExecutedRows: curriculumGradeVerificationRows.filter((row) => row.wave === 1 && wave1Executed.has(`${row.subject}:${row.grade}`)).length,
  rowsWithFindings: curriculumGradeVerificationRows.filter((row) => row.automatedStatus === 'passed_with_findings').length,
  repairTaskCount: curriculumRepairTasks.length,
  patchProposedCount: curriculumRepairTasks.filter((task) => task.status === 'patch_proposed').length,
  humanVerifiedRows: curriculumGradeVerificationRows.filter((row) => row.humanStatus === 'verified').length,
  gradeVerificationReadyForOfficialRelease: curriculumGradeVerificationRows.every((row) => row.humanStatus === 'verified')
    && curriculumRepairTasks.every((task) => task.status === 'verified'),
}

export const curriculumVerificationPolicy = {
  requiredChecks: [
    '来源/Pointer完整性',
    '学科与年级归属',
    '知识名称与学习要求一致性',
    '题型与学科适配',
    '重复/近义知识点复核',
    '跨年级关系证据',
    '课标映射证据',
    '许可证/权利状态',
    '真人学科复核',
  ],
  rule: '机器检查、修补建议与真人教研复核分层记录。任何年级未完成真人复核前，不得把该年级标记为正式已核。',
}

export function verificationRowsForSubject(subject: CurriculumSubject) {
  return curriculumGradeVerificationRows.filter((row) => row.subject === subject)
}

export function verificationRowsForWave(wave: VerificationWave) {
  return curriculumGradeVerificationRows.filter((row) => row.wave === wave)
}

export function repairTasksForGrade(subject: CurriculumSubject, grade: number) {
  return curriculumRepairTasks.filter((task) => task.subject === subject && task.grade === grade)
}
