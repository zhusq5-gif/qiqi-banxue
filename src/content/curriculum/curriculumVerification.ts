import { curriculumSeed, type CurriculumSubject } from './curriculum'
import { mathNormalizedDataset } from './mathNormalized'

export type VerificationWave = 1 | 2 | 3
export type AutomatedVerificationStatus = 'passed' | 'passed_with_findings'
export type CoverageStatus = 'present' | 'gap'
export type ContentVerificationStatus =
  | 'automated_screened'
  | 'patch_proposed'
  | 'queued_patch_review'
  | 'queued'
  | 'coverage_gap'
  | 'recheck_pending'
export type HumanVerificationStatus = 'not_started' | 'pending' | 'verified'
export type RepairTaskStatus = 'patch_proposed' | 'queued' | 'recheck_pending' | 'verified'
export type ItemVerificationStatus = 'automated_screened' | 'needs_patch' | 'queued' | 'recheck_pending'

export interface GradeVerificationRow {
  id: string
  subject: CurriculumSubject
  grade: number
  wave: VerificationWave
  coverageStatus: CoverageStatus
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

export interface KnowledgeVerificationItem {
  id: string
  subject: CurriculumSubject
  grade: number
  wave: VerificationWave
  knowledgeId: string
  occurrenceId: string
  label: string
  sourceRef: string
  sourcePresent: boolean
  gradeBound: boolean
  registeredIssueIds: string[]
  status: ItemVerificationStatus
  humanStatus: HumanVerificationStatus
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

export interface CurriculumCoverageTask {
  id: string
  subject: CurriculumSubject
  grade: number
  wave: VerificationWave
  status: 'queued' | 'in_progress' | 'recheck_pending' | 'verified'
  title: string
  action: string
  blocking: true
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
  'math:2': { wave: 3, reason: '当前只有二年级概念被高年级章节复用，缺少二年级自身 Occurrence，先补覆盖再核对。' },
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
  const coverageStatus: CoverageStatus = entries.length > 0 ? 'present' : 'gap'
  const hasFindings = coverageStatus === 'gap' || issues.length > 0 || missingSourceCount > 0 || normalizedDuplicateLabelCount > 0
  return {
    subject,
    grade,
    coverageStatus,
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
  const coverageStatus: CoverageStatus = occurrences.length > 0 ? 'present' : 'gap'
  const hasFindings = coverageStatus === 'gap' || missingSourceCount > 0 || unresolvedAssessmentTargetCount > 0 || normalizedDuplicateLabelCount > 0
  return {
    subject: 'math',
    grade,
    coverageStatus,
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
  const contentStatus: ContentVerificationStatus = base.coverageStatus === 'gap'
    ? 'coverage_gap'
    : executed
      ? (base.registeredIssueCount > 0 ? 'patch_proposed' : 'automated_screened')
      : (base.registeredIssueCount > 0 ? 'queued_patch_review' : 'queued')
  const nextAction = base.coverageStatus === 'gap'
    ? '先补齐该年级可定位的知识点与 Occurrence，再执行逐条核对；当前缺口阻断正式发布。'
    : contentStatus === 'patch_proposed'
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

function itemStatus(subject: CurriculumSubject, grade: number, hasIssue: boolean): ItemVerificationStatus {
  const key = `${subject}:${grade}`
  if (!wave1Executed.has(key)) return 'queued'
  return hasIssue ? 'needs_patch' : 'automated_screened'
}

const textVerificationItems: KnowledgeVerificationItem[] = curriculumSeed.entries.map((entry) => {
  const row = curriculumGradeVerificationRows.find((item) => item.subject === entry.subject && item.grade === entry.grade)
  if (!row) throw new Error(`Missing verification row for entry ${entry.id}`)
  const issueIds = curriculumSeed.issues.filter((issue) => issue.nodeId === entry.id).map((issue) => issue.id)
  return {
    id: `item:${entry.subject}:${entry.grade}:${entry.id}`,
    subject: entry.subject,
    grade: entry.grade,
    wave: row.wave,
    knowledgeId: entry.id,
    occurrenceId: entry.id,
    label: entry.label,
    sourceRef: `${entry.sourcePath}#${entry.sourcePointer}`,
    sourcePresent: Boolean(entry.sourcePath && entry.sourcePointer),
    gradeBound: entry.grade === row.grade,
    registeredIssueIds: issueIds,
    status: itemStatus(entry.subject, entry.grade, issueIds.length > 0),
    humanStatus: 'not_started',
  }
})

const mathVerificationItems: KnowledgeVerificationItem[] = mathNormalizedDataset.occurrences.map((occurrence) => {
  const row = curriculumGradeVerificationRows.find((item) => item.subject === 'math' && item.grade === occurrence.grade)
  const node = mathNormalizedDataset.knowledgeNodes.find((item) => item.id === occurrence.knowledgeNodeId)
  if (!row || !node) throw new Error(`Missing math verification endpoint for occurrence ${occurrence.id}`)
  return {
    id: `item:math:${occurrence.grade}:${occurrence.id}`,
    subject: 'math',
    grade: occurrence.grade,
    wave: row.wave,
    knowledgeId: node.id,
    occurrenceId: occurrence.id,
    label: node.canonicalName,
    sourceRef: `${node.source.rawId}@${node.source.sourceLocator};${occurrence.rawAppearsInEdgeId}@${occurrence.source.sourceLocator}`,
    sourcePresent: Boolean(node.source.rawId && node.source.sourceLocator && occurrence.source.rawId && occurrence.source.sourceLocator),
    gradeBound: chapterGrade(occurrence.chapterId) === occurrence.grade,
    registeredIssueIds: [],
    status: itemStatus('math', occurrence.grade, false),
    humanStatus: 'not_started',
  }
})

export const curriculumKnowledgeVerificationItems: KnowledgeVerificationItem[] = [
  ...textVerificationItems,
  ...mathVerificationItems,
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

export const curriculumCoverageTasks: CurriculumCoverageTask[] = curriculumGradeVerificationRows
  .filter((row) => row.coverageStatus === 'gap')
  .map((row) => ({
    id: `coverage:${row.subject}:${row.grade}`,
    subject: row.subject,
    grade: row.grade,
    wave: row.wave,
    status: 'queued',
    title: `补齐${row.grade}年级${row.subject === 'math' ? '数学' : row.subject}可核数据`,
    action: '获取并核验该年级自身教材章节中的 KnowledgeNode/Occurrence；禁止使用“在更高年级被复用”替代该年级覆盖。补齐后重新运行逐条台账与 CI。',
    blocking: true,
  }))

export const curriculumVerificationSummary = {
  rowCount: curriculumGradeVerificationRows.length,
  itemCount: curriculumKnowledgeVerificationItems.length,
  textItemCount: textVerificationItems.length,
  mathOccurrenceItemCount: mathVerificationItems.length,
  automatedCheckedRows: curriculumGradeVerificationRows.length,
  wave1ExecutedRows: curriculumGradeVerificationRows.filter((row) => row.wave === 1 && wave1Executed.has(`${row.subject}:${row.grade}`)).length,
  wave1ScreenedItems: curriculumKnowledgeVerificationItems.filter((item) => item.status === 'automated_screened' || item.status === 'needs_patch').length,
  rowsWithFindings: curriculumGradeVerificationRows.filter((row) => row.automatedStatus === 'passed_with_findings').length,
  coverageGapCount: curriculumCoverageTasks.length,
  repairTaskCount: curriculumRepairTasks.length + curriculumCoverageTasks.length,
  patchProposedCount: curriculumRepairTasks.filter((task) => task.status === 'patch_proposed').length,
  humanVerifiedRows: curriculumGradeVerificationRows.filter((row) => row.humanStatus === 'verified').length,
  humanVerifiedItems: curriculumKnowledgeVerificationItems.filter((item) => item.humanStatus === 'verified').length,
  gradeVerificationReadyForOfficialRelease: curriculumCoverageTasks.length === 0
    && curriculumGradeVerificationRows.every((row) => row.humanStatus === 'verified')
    && curriculumKnowledgeVerificationItems.every((item) => item.humanStatus === 'verified')
    && curriculumRepairTasks.every((task) => task.status === 'verified'),
}

export const curriculumVerificationPolicy = {
  requiredChecks: [
    '覆盖完整性',
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
  rule: '机器检查、覆盖补齐、修补建议与真人教研复核分层记录。任何年级覆盖缺口、知识点未完成真人复核或修补未复测时，不得标记为正式已核。',
}

export function verificationRowsForSubject(subject: CurriculumSubject) {
  return curriculumGradeVerificationRows.filter((row) => row.subject === subject)
}

export function verificationRowsForWave(wave: VerificationWave) {
  return curriculumGradeVerificationRows.filter((row) => row.wave === wave)
}

export function verificationItemsForGrade(subject: CurriculumSubject, grade: number) {
  return curriculumKnowledgeVerificationItems.filter((item) => item.subject === subject && item.grade === grade)
}

export function repairTasksForGrade(subject: CurriculumSubject, grade: number) {
  return curriculumRepairTasks.filter((task) => task.subject === subject && task.grade === grade)
}
