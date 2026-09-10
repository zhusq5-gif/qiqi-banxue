import { createCandidateRepairRecheckBundle } from './curriculumRepairRecheck'
import { repairProposalForIssue } from './curriculumRepairProposals'
import {
  humanReviewCaseById,
  type HumanReviewCase,
  type HumanReviewDecision,
  type UnsignedHumanReviewDecision,
} from './humanReview'

export type HumanReviewIngestionStatus =
  | 'accepted_for_secondary_regression'
  | 'accepted_followup_required'
  | 'rejected'

export type HumanReviewIngestionErrorCode =
  | 'INVALID_SHAPE'
  | 'UNSUPPORTED_SCHEMA'
  | 'CASE_NOT_FOUND'
  | 'DECISION_NOT_ALLOWED'
  | 'UNSAFE_FLAGS'
  | 'REVIEWER_MISSING'
  | 'RATIONALE_MISSING'
  | 'EVIDENCE_MISSING'
  | 'CURRENT_CASE_EVIDENCE_NOT_REFERENCED'
  | 'INVALID_REVIEWED_AT'

export interface HumanReviewIngestionError {
  code: HumanReviewIngestionErrorCode
  message: string
}

export interface HumanReviewCandidateSnapshot {
  schema: 'qiqi-curriculum-human-review-candidate-snapshot/v1'
  caseId: string
  sourceTaskId: string
  subject: HumanReviewCase['subject']
  grade: number
  wave: HumanReviewCase['wave']
  reviewType: HumanReviewCase['reviewType']
  decision: HumanReviewDecision
  reviewer: UnsignedHumanReviewDecision['reviewer']
  reviewedAt: string
  rationale: string
  evidenceRefs: string[]
  currentCase: {
    title: string
    priority: HumanReviewCase['priority']
    sourceRefs: string[]
    allowedDecisions: HumanReviewDecision[]
  }
  contentPatch?: {
    issueId: string
    nodeId: string
    proposedLabel: string
    proposedLearningDemand: string
    proposedQuestionTypes: string[]
  }
  disposition?:
    | 'retain_single_node'
    | 'keep_unmapped'
    | 'keep_raw_relation_only'
    | 'reject_curriculum_use'
    | 'keep_same_identity'
  autoApply: false
  humanVerified: false
  formalApprovalEligible: false
}

export interface HumanReviewIngestionResult {
  schema: 'qiqi-curriculum-human-review-ingestion/v1'
  status: HumanReviewIngestionStatus
  accepted: boolean
  errors: HumanReviewIngestionError[]
  decision: UnsignedHumanReviewDecision | null
  caseId: string | null
  candidateSnapshot: HumanReviewCandidateSnapshot | null
  secondaryRegression: {
    status: 'passed' | 'followup_required' | 'not_run'
    checks: {
      currentCaseExists: boolean
      decisionAllowed: boolean
      currentCaseEvidenceReferenced: boolean
      candidateRepairRecheckPassed: boolean | null
      seedMutationPerformed: false
    }
  }
  nextGate:
    | 'current_case_reconfirmation'
    | 'structured_proposal_required'
    | 'additional_source_evidence_required'
    | 'deferred'
    | 'none'
  note: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseDecision(input: unknown): UnsignedHumanReviewDecision | null {
  if (!isRecord(input)) return null
  if (input.schema !== 'qiqi-curriculum-human-review-decision/v1') return null
  if (typeof input.caseId !== 'string' || typeof input.decision !== 'string') return null
  if (typeof input.rationale !== 'string' || typeof input.reviewedAt !== 'string') return null
  if (!isRecord(input.reviewer) || typeof input.reviewer.name !== 'string' || typeof input.reviewer.role !== 'string') return null
  if (!Array.isArray(input.evidenceRefs) || !input.evidenceRefs.every((item) => typeof item === 'string')) return null
  return input as unknown as UnsignedHumanReviewDecision
}

function issueIdForCase(reviewCase: HumanReviewCase) {
  const match = /^human-review:(F\d{3})$/.exec(reviewCase.id)
  return match?.[1] ?? null
}

const followupDecisions = new Set<HumanReviewDecision>([
  'revise_candidate',
  'split_nodes',
  'rename_and_reframe',
  'propose_curated_mapping',
  'propose_curriculum_relation',
  'split_identity_candidate',
])

function simpleDisposition(decision: HumanReviewDecision): HumanReviewCandidateSnapshot['disposition'] | null {
  if (decision === 'retain_single_node') return decision
  if (decision === 'keep_unmapped') return decision
  if (decision === 'keep_raw_relation_only') return decision
  if (decision === 'reject_curriculum_use') return decision
  if (decision === 'keep_same_identity') return decision
  return null
}

export function ingestHumanReviewDecision(input: unknown): HumanReviewIngestionResult {
  const errors: HumanReviewIngestionError[] = []
  if (!isRecord(input)) {
    errors.push({ code: 'INVALID_SHAPE', message: '审核决定必须是 JSON object。' })
  } else if (input.schema !== 'qiqi-curriculum-human-review-decision/v1') {
    errors.push({ code: 'UNSUPPORTED_SCHEMA', message: '当前 ingestion 仅接受 qiqi-curriculum-human-review-decision/v1。' })
  }

  const decision = parseDecision(input)
  if (!decision) {
    if (errors.length === 0) errors.push({ code: 'INVALID_SHAPE', message: '审核决定缺少必要字段或字段类型不正确。' })
    return rejected(errors)
  }

  const reviewCase = humanReviewCaseById(decision.caseId)
  if (!reviewCase) errors.push({ code: 'CASE_NOT_FOUND', message: `当前数据中不存在 case：${decision.caseId}` })

  const decisionAllowed = Boolean(reviewCase?.allowedDecisions.includes(decision.decision))
  if (reviewCase && !decisionAllowed) errors.push({ code: 'DECISION_NOT_ALLOWED', message: `决定 ${decision.decision} 不在当前 case 的 allowedDecisions 中。` })

  if (decision.humanVerified !== false || decision.autoApply !== false || decision.status !== 'unsigned_human_review') {
    errors.push({ code: 'UNSAFE_FLAGS', message: '导入决定必须保持 unsigned_human_review / humanVerified=false / autoApply=false。' })
  }
  if (!decision.reviewer.name.trim() || !decision.reviewer.role.trim()) errors.push({ code: 'REVIEWER_MISSING', message: '审核人姓名与角色不能为空。' })
  if (!decision.rationale.trim()) errors.push({ code: 'RATIONALE_MISSING', message: '审核理由不能为空。' })
  if (decision.evidenceRefs.length === 0 || decision.evidenceRefs.some((item) => !item.trim())) errors.push({ code: 'EVIDENCE_MISSING', message: '至少需要一条实际查看过的证据引用。' })
  if (Number.isNaN(Date.parse(decision.reviewedAt))) errors.push({ code: 'INVALID_REVIEWED_AT', message: 'reviewedAt 不是有效日期时间。' })

  const currentCaseEvidenceReferenced = Boolean(reviewCase && decision.evidenceRefs.some((ref) => reviewCase.sourceRefs.includes(ref)))
  if (reviewCase && !currentCaseEvidenceReferenced) {
    errors.push({ code: 'CURRENT_CASE_EVIDENCE_NOT_REFERENCED', message: '至少一条 evidenceRefs 必须与当前 case 的 sourceRefs 完全一致。' })
  }

  if (errors.length > 0 || !reviewCase) return rejected(errors, decision)

  if (decision.decision === 'needs_source_evidence') {
    return acceptedFollowup(decision, reviewCase, currentCaseEvidenceReferenced, 'additional_source_evidence_required', '真人已明确要求补充来源证据；当前不生成候选变更。')
  }
  if (decision.decision === 'defer') {
    return acceptedFollowup(decision, reviewCase, currentCaseEvidenceReferenced, 'deferred', '真人已暂缓决定；当前不生成候选变更。')
  }
  if (followupDecisions.has(decision.decision)) {
    return acceptedFollowup(decision, reviewCase, currentCaseEvidenceReferenced, 'structured_proposal_required', '该决定需要结构化的新内容/关系提案；仅凭 v1 decision 不能安全生成变更。')
  }

  let candidateRepairRecheckPassed: boolean | null = null
  let contentPatch: HumanReviewCandidateSnapshot['contentPatch']
  if (decision.decision === 'accept_candidate') {
    const issueId = issueIdForCase(reviewCase)
    if (!issueId) return rejected([{ code: 'DECISION_NOT_ALLOWED', message: 'accept_candidate 仅适用于内容问题 case。' }], decision)
    const proposal = repairProposalForIssue(issueId)
    const recheck = createCandidateRepairRecheckBundle(issueId)
    candidateRepairRecheckPassed = Boolean(proposal && recheck.status === 'recheck_pending' && recheck.candidateMatch && recheck.checks.candidateScopeRespected)
    if (!proposal || !candidateRepairRecheckPassed) {
      return acceptedFollowup(decision, reviewCase, currentCaseEvidenceReferenced, 'structured_proposal_required', '系统候选 patch 已不满足当前二次回归约束，需要重新提出修补方案。')
    }
    contentPatch = {
      issueId,
      nodeId: proposal.nodeId,
      proposedLabel: proposal.proposedLabel,
      proposedLearningDemand: proposal.proposedLearningDemand,
      proposedQuestionTypes: proposal.proposedQuestionTypes.slice(),
    }
  }

  const disposition = simpleDisposition(decision.decision)
  const candidateSnapshot: HumanReviewCandidateSnapshot = {
    schema: 'qiqi-curriculum-human-review-candidate-snapshot/v1',
    caseId: reviewCase.id,
    sourceTaskId: reviewCase.sourceTaskId,
    subject: reviewCase.subject,
    grade: reviewCase.grade,
    wave: reviewCase.wave,
    reviewType: reviewCase.reviewType,
    decision: decision.decision,
    reviewer: { ...decision.reviewer },
    reviewedAt: decision.reviewedAt,
    rationale: decision.rationale,
    evidenceRefs: decision.evidenceRefs.slice(),
    currentCase: {
      title: reviewCase.title,
      priority: reviewCase.priority,
      sourceRefs: reviewCase.sourceRefs.slice(),
      allowedDecisions: reviewCase.allowedDecisions.slice(),
    },
    ...(contentPatch ? { contentPatch } : {}),
    ...(disposition ? { disposition } : {}),
    autoApply: false,
    humanVerified: false,
    formalApprovalEligible: false,
  }

  return {
    schema: 'qiqi-curriculum-human-review-ingestion/v1',
    status: 'accepted_for_secondary_regression',
    accepted: true,
    errors: [],
    decision,
    caseId: reviewCase.id,
    candidateSnapshot,
    secondaryRegression: {
      status: 'passed',
      checks: {
        currentCaseExists: true,
        decisionAllowed: true,
        currentCaseEvidenceReferenced,
        candidateRepairRecheckPassed,
        seedMutationPerformed: false,
      },
    },
    nextGate: 'current_case_reconfirmation',
    note: 'v1 decision 已通过接收与二次回归，但未绑定 case 版本；候选快照 formalApprovalEligible=false，正式流程前必须在当前 case 上重新确认。',
  }
}

function acceptedFollowup(
  decision: UnsignedHumanReviewDecision,
  reviewCase: HumanReviewCase,
  currentCaseEvidenceReferenced: boolean,
  nextGate: HumanReviewIngestionResult['nextGate'],
  note: string,
): HumanReviewIngestionResult {
  return {
    schema: 'qiqi-curriculum-human-review-ingestion/v1',
    status: 'accepted_followup_required',
    accepted: true,
    errors: [],
    decision,
    caseId: reviewCase.id,
    candidateSnapshot: null,
    secondaryRegression: {
      status: 'followup_required',
      checks: {
        currentCaseExists: true,
        decisionAllowed: true,
        currentCaseEvidenceReferenced,
        candidateRepairRecheckPassed: null,
        seedMutationPerformed: false,
      },
    },
    nextGate,
    note,
  }
}

function rejected(errors: HumanReviewIngestionError[], decision: UnsignedHumanReviewDecision | null = null): HumanReviewIngestionResult {
  return {
    schema: 'qiqi-curriculum-human-review-ingestion/v1',
    status: 'rejected',
    accepted: false,
    errors,
    decision,
    caseId: decision?.caseId ?? null,
    candidateSnapshot: null,
    secondaryRegression: {
      status: 'not_run',
      checks: {
        currentCaseExists: false,
        decisionAllowed: false,
        currentCaseEvidenceReferenced: false,
        candidateRepairRecheckPassed: null,
        seedMutationPerformed: false,
      },
    },
    nextGate: 'none',
    note: '导入未通过校验；未生成任何候选变更。',
  }
}
