import { curriculumSeed, entryById, subjectLabels, type CurriculumSubject } from './curriculum'
import { createCandidateRepairRecheckBundle } from './curriculumRepairRecheck'
import { repairProposalForIssue } from './curriculumRepairProposals'
import { mathWave2AuditTasks } from './mathGradeAudit'
import { mathWave2SourceAuditRecord } from './mathWave2SourceAudit'
import { curriculumRepairTasksWave2 } from './curriculumVerificationWave2'

export type HumanReviewType =
  | 'content_patch'
  | 'concept_boundary'
  | 'assessment_binding'
  | 'cross_grade_relation'
  | 'occurrence_reuse'
  | 'data_quality'

export type HumanReviewDecision =
  | 'accept_candidate'
  | 'revise_candidate'
  | 'split_nodes'
  | 'rename_and_reframe'
  | 'retain_single_node'
  | 'keep_unmapped'
  | 'needs_source_evidence'
  | 'propose_curated_mapping'
  | 'keep_raw_relation_only'
  | 'propose_curriculum_relation'
  | 'reject_curriculum_use'
  | 'keep_same_identity'
  | 'split_identity_candidate'
  | 'defer'

export interface HumanReviewCase {
  id: string
  sourceTaskId: string
  subject: CurriculumSubject
  grade: number
  wave: 1 | 2 | 3
  reviewType: HumanReviewType
  title: string
  status: 'awaiting_human_review'
  priority: 'blocking' | 'review'
  summary: string
  sourceRefs: string[]
  checklist: string[]
  allowedDecisions: HumanReviewDecision[]
  nextGate: 'review_decision_ingestion'
  autoApply: false
}

export interface UnsignedHumanReviewDecision {
  schema: 'qiqi-curriculum-human-review-decision/v1'
  caseId: string
  status: 'unsigned_human_review'
  decision: HumanReviewDecision
  rationale: string
  reviewer: {
    name: string
    role: string
  }
  evidenceRefs: string[]
  reviewedAt: string
  humanVerified: false
  autoApply: false
  nextGate: 'review_decision_ingestion'
}

const generalChecklist = [
  '先核对原始来源与 Pointer/sourceLocator，不能只看系统候选文字。',
  '确认知识名称、学习要求、题型或关系语义与该年级教材情境一致。',
  '记录明确的同意/修改/暂缓理由，并引用实际检查过的证据。',
  '不要把机器建议、名称相似或教材顺序直接当作 prerequisite / progression。',
  '审核决定先作为 unsigned decision 保存，不直接改写种子或标记 expert_verified。',
]

const issueChecklist: Record<string, string[]> = {
  F001: [
    '确认“口算”是否为模板污染；若是，只批准删除该异常题型。',
    '若需新增替代题型，必须根据教材活动/题目证据填写，系统不代猜。',
  ],
  F002: [
    '核对例词“安安静静、叽叽喳喳”的结构是否均为 AABB。',
    '确认知识标题应改为 AABB，还是来源中存在其他 ABB 例词需要拆分。',
  ],
  F003: [
    '核对“惊弓之鸟、胆小如鼠”等例词字数与类别。',
    '决定使用“动物相关四字成语/表达”等更准确表述，或给出教材原分类证据。',
  ],
  F004: [
    '分别标注来源例词属于 ABAB、AABB、ABB 中哪一类。',
    '决定保留混合知识点、重命名为混合类别，还是拆成两个知识点。',
  ],
  F005: [
    '分别判断“长话短说/概括”和句法“缩句”是否是两个学习目标。',
    '“长话短说/概括”重点检查信息压缩、主要内容提取；“缩句”重点检查删除修饰成分后保留句子主干。',
    '回看四年级上册本单元教材/练习语境，决定拆分、改名、仅保留一侧目标或暂缓。',
    '不得仅凭当前标题中的括号把两者认定为同义。',
  ],
  F006: [
    '确认英语“How many ...?”条目中的“口算”是否为模板污染。',
    '若确认污染，只批准删除“口算”；替代题型需教材/练习证据。',
  ],
  F007: [
    '对照原始文本确认唯一明确损坏为“回。答”。',
    '确认修复为“回答”后，身高、体重、鞋码、metres/kilograms 等语义均未改变。',
  ],
}

function contentReviewType(issueId: string): HumanReviewType {
  return issueId === 'F005' ? 'concept_boundary' : 'content_patch'
}

function contentAllowedDecisions(issueId: string): HumanReviewDecision[] {
  if (issueId === 'F005') return ['split_nodes', 'rename_and_reframe', 'retain_single_node', 'defer']
  return ['accept_candidate', 'revise_candidate', 'defer']
}

const contentCases: HumanReviewCase[] = curriculumRepairTasksWave2.map((task) => {
  const issue = curriculumSeed.issues.find((item) => item.id === task.issueId)
  const entry = issue ? entryById(issue.nodeId) : null
  const proposal = repairProposalForIssue(task.issueId)
  const recheck = createCandidateRepairRecheckBundle(task.issueId)
  if (!issue || !entry || !proposal) throw new Error(`Human review content endpoint missing for ${task.issueId}`)

  return {
    id: `human-review:${task.issueId}`,
    sourceTaskId: task.id,
    subject: task.subject,
    grade: task.grade,
    wave: task.wave,
    reviewType: contentReviewType(task.issueId),
    title: `${task.issueId} · ${entry.label}`,
    status: 'awaiting_human_review',
    priority: issue.severity === 'confirmed_internal' ? 'blocking' : 'review',
    summary: `${issue.finding} 当前候选复测状态：${recheck.status}。候选不会自动写回。`,
    sourceRefs: [
      issue.sourceUrl,
      `${entry.sourcePath}#${entry.sourcePointer}`,
    ],
    checklist: [...generalChecklist, ...(issueChecklist[task.issueId] ?? [])],
    allowedDecisions: contentAllowedDecisions(task.issueId),
    nextGate: 'review_decision_ingestion',
    autoApply: false,
  }
})

function mathReviewType(kind: (typeof mathWave2AuditTasks)[number]['kind']): HumanReviewType {
  if (kind === 'assessment_without_target' || kind === 'source_unlinked_assessment_candidate') return 'assessment_binding'
  if (kind === 'cross_grade_relation_review') return 'cross_grade_relation'
  if (kind === 'reused_prior_grade_occurrence_review') return 'occurrence_reuse'
  return 'data_quality'
}

function mathAllowedDecisions(type: HumanReviewType): HumanReviewDecision[] {
  if (type === 'assessment_binding') return ['keep_unmapped', 'needs_source_evidence', 'propose_curated_mapping', 'defer']
  if (type === 'cross_grade_relation') return ['keep_raw_relation_only', 'propose_curriculum_relation', 'reject_curriculum_use', 'defer']
  if (type === 'occurrence_reuse') return ['keep_same_identity', 'split_identity_candidate', 'defer']
  return ['needs_source_evidence', 'defer']
}

function mathChecklist(type: HumanReviewType, taskId: string): string[] {
  const specific: string[] = []
  if (type === 'assessment_binding') {
    specific.push('先确认完整 raw source 是否存在 tests_concept/tests_skill；excerpt 缺边与源数据未绑定必须分开。')
    specific.push('若 raw 没有绑定，不得凭题意写成 K12-KGraph raw edge；最多提出 curated mapping proposal。')
    if (taskId.includes('math_4a_rjb_exe20')) {
      specific.push('已检查四上 tests_* 连续区段，exe19 后直接进入 exe26；当前 exe20 保持未映射。')
    }
  }
  if (type === 'cross_grade_relation') {
    specific.push('核对 raw relation type 与 evidence；例如 relates_to 不得自动改成 prerequisite。')
    specific.push('如要提出课程进阶关系，必须作为新的 curated curriculum relation 提案并说明教学依据。')
  }
  if (type === 'occurrence_reuse') {
    specific.push('判断低年级概念在高年级章节出现时是否仍应复用同一概念身份。')
    specific.push('重点写明高年级 Occurrence 的学习要求是否变化；不要仅因年级变化复制 KnowledgeNode。')
  }
  return [...generalChecklist, ...specific]
}

const mathCases: HumanReviewCase[] = mathWave2AuditTasks.map((task) => {
  const reviewType = mathReviewType(task.kind)
  const sourceAudit = task.id.includes('math_4a_rjb_exe20') ? mathWave2SourceAuditRecord('math_4a_rjb_exe20') : null
  const sourceRefs = [...task.sourceRefs]
  if (sourceAudit) {
    sourceRefs.push(sourceAudit.rawNodeLocator, sourceAudit.rawAppearsInLocator)
    if (sourceAudit.inspectedTestsRange) sourceRefs.push(sourceAudit.inspectedTestsRange)
  }
  return {
    id: `human-review:${task.id}`,
    sourceTaskId: task.id,
    subject: 'math',
    grade: task.grade,
    wave: 2,
    reviewType,
    title: task.title,
    status: 'awaiting_human_review',
    priority: task.severity,
    summary: sourceAudit ? `${task.detail} Raw source audit: ${sourceAudit.note}` : task.detail,
    sourceRefs: Array.from(new Set(sourceRefs)),
    checklist: mathChecklist(reviewType, task.id),
    allowedDecisions: mathAllowedDecisions(reviewType),
    nextGate: 'review_decision_ingestion',
    autoApply: false,
  }
})

export const curriculumHumanReviewCases: HumanReviewCase[] = [...contentCases, ...mathCases]

export const curriculumHumanReviewSummary = {
  caseCount: curriculumHumanReviewCases.length,
  contentCaseCount: contentCases.length,
  mathCaseCount: mathCases.length,
  blockingCount: curriculumHumanReviewCases.filter((item) => item.priority === 'blocking').length,
  wave1Count: curriculumHumanReviewCases.filter((item) => item.wave === 1).length,
  wave2Count: curriculumHumanReviewCases.filter((item) => item.wave === 2).length,
  humanVerifiedCount: 0,
}

export function humanReviewCasesForSubject(subject: CurriculumSubject) {
  return curriculumHumanReviewCases.filter((item) => item.subject === subject)
}

export function humanReviewCaseById(id: string) {
  return curriculumHumanReviewCases.find((item) => item.id === id) ?? null
}

export function createUnsignedHumanReviewDecision(
  caseId: string,
  decision: HumanReviewDecision,
  rationale: string,
  reviewer: { name: string; role: string },
  evidenceRefs: string[],
  reviewedAt = new Date().toISOString(),
): UnsignedHumanReviewDecision {
  const reviewCase = humanReviewCaseById(caseId)
  if (!reviewCase) throw new Error(`Human review case not found: ${caseId}`)
  if (!reviewCase.allowedDecisions.includes(decision)) throw new Error(`Decision ${decision} is not allowed for ${caseId}`)
  if (!reviewer.name.trim() || !reviewer.role.trim()) throw new Error('Reviewer name and role are required')
  if (!rationale.trim()) throw new Error('Review rationale is required')
  if (evidenceRefs.length === 0 || evidenceRefs.some((item) => !item.trim())) throw new Error('At least one evidence reference is required')
  return {
    schema: 'qiqi-curriculum-human-review-decision/v1',
    caseId,
    status: 'unsigned_human_review',
    decision,
    rationale: rationale.trim(),
    reviewer: { name: reviewer.name.trim(), role: reviewer.role.trim() },
    evidenceRefs: evidenceRefs.map((item) => item.trim()),
    reviewedAt,
    humanVerified: false,
    autoApply: false,
    nextGate: 'review_decision_ingestion',
  }
}

export const humanReviewSubjectLabels = subjectLabels
