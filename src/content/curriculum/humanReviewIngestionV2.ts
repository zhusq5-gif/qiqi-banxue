import type { UnsignedHumanReviewDecision } from './humanReview'
import { humanReviewCaseById } from './humanReview'
import { currentHumanReviewCaseState, type HumanReviewDecisionV2 } from './humanReviewDecisionV2'
import { ingestHumanReviewDecision, type HumanReviewCandidateSnapshot, type HumanReviewIngestionResult } from './humanReviewIngestion'

export interface HumanReviewCandidateSnapshotV2 extends Omit<HumanReviewCandidateSnapshot, 'schema' | 'formalApprovalEligible'> {
  schema: 'qiqi-curriculum-human-review-candidate-snapshot/v2'
  caseState: HumanReviewDecisionV2['caseState']
  formalApprovalEligible: true
}

export interface HumanReviewIngestionV2Result {
  schema: 'qiqi-curriculum-human-review-ingestion/v2'
  accepted: boolean
  caseStateMatches: boolean
  readyForApprovalGate: boolean
  errors: string[]
  decision: HumanReviewDecisionV2 | null
  baseIngestion: HumanReviewIngestionResult | null
  candidateSnapshot: HumanReviewCandidateSnapshotV2 | null
  nextGate: HumanReviewIngestionResult['nextGate'] | 'content_approval_gate'
  note: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function parseDecisionV2(input: unknown): HumanReviewDecisionV2 | null {
  if (!isRecord(input) || input.schema !== 'qiqi-curriculum-human-review-decision/v2') return null
  if (typeof input.caseId !== 'string' || typeof input.decision !== 'string') return null
  if (typeof input.rationale !== 'string' || typeof input.reviewedAt !== 'string') return null
  if (!isRecord(input.reviewer) || typeof input.reviewer.name !== 'string' || typeof input.reviewer.role !== 'string') return null
  if (!Array.isArray(input.evidenceRefs) || !input.evidenceRefs.every((item) => typeof item === 'string')) return null
  if (!isRecord(input.caseState)) return null
  if (typeof input.caseState.sourceTaskId !== 'string' || typeof input.caseState.title !== 'string' || typeof input.caseState.reviewType !== 'string') return null
  if (!Array.isArray(input.caseState.sourceRefs) || !input.caseState.sourceRefs.every((item) => typeof item === 'string')) return null
  if (!Array.isArray(input.caseState.allowedDecisions) || !input.caseState.allowedDecisions.every((item) => typeof item === 'string')) return null
  return input as unknown as HumanReviewDecisionV2
}

function caseStateMatchesCurrent(decision: HumanReviewDecisionV2) {
  const reviewCase = humanReviewCaseById(decision.caseId)
  if (!reviewCase) return false
  const current = currentHumanReviewCaseState(decision.caseId)
  return decision.caseState.sourceTaskId === current.sourceTaskId
    && decision.caseState.title === current.title
    && decision.caseState.reviewType === current.reviewType
    && arraysEqual(decision.caseState.sourceRefs, current.sourceRefs)
    && arraysEqual(decision.caseState.allowedDecisions, current.allowedDecisions)
}

function toLegacyDecision(decision: HumanReviewDecisionV2): UnsignedHumanReviewDecision {
  return {
    schema: 'qiqi-curriculum-human-review-decision/v1',
    caseId: decision.caseId,
    status: decision.status,
    decision: decision.decision,
    rationale: decision.rationale,
    reviewer: { ...decision.reviewer },
    evidenceRefs: decision.evidenceRefs.slice(),
    reviewedAt: decision.reviewedAt,
    humanVerified: false,
    autoApply: false,
    nextGate: 'review_decision_ingestion',
  }
}

export function ingestHumanReviewDecisionV2(input: unknown): HumanReviewIngestionV2Result {
  const decision = parseDecisionV2(input)
  if (!decision) {
    return {
      schema: 'qiqi-curriculum-human-review-ingestion/v2',
      accepted: false,
      caseStateMatches: false,
      readyForApprovalGate: false,
      errors: ['INVALID_V2_DECISION'],
      decision: null,
      baseIngestion: null,
      candidateSnapshot: null,
      nextGate: 'none',
      note: '不是有效的 qiqi-curriculum-human-review-decision/v2。',
    }
  }

  const matches = caseStateMatchesCurrent(decision)
  if (!matches) {
    return {
      schema: 'qiqi-curriculum-human-review-ingestion/v2',
      accepted: false,
      caseStateMatches: false,
      readyForApprovalGate: false,
      errors: ['CURRENT_CASE_STATE_MISMATCH'],
      decision,
      baseIngestion: null,
      candidateSnapshot: null,
      nextGate: 'current_case_reconfirmation',
      note: '审核时的 case 快照与当前 case 不一致；必须在当前 case 上重新核对，旧决定不能继续。',
    }
  }

  const base = ingestHumanReviewDecision(toLegacyDecision(decision))
  if (!base.accepted) {
    return {
      schema: 'qiqi-curriculum-human-review-ingestion/v2',
      accepted: false,
      caseStateMatches: true,
      readyForApprovalGate: false,
      errors: base.errors.map((item) => item.code),
      decision,
      baseIngestion: base,
      candidateSnapshot: null,
      nextGate: base.nextGate,
      note: 'case 快照一致，但基础 ingestion 校验未通过。',
    }
  }

  if (!base.candidateSnapshot || base.secondaryRegression.status !== 'passed') {
    return {
      schema: 'qiqi-curriculum-human-review-ingestion/v2',
      accepted: true,
      caseStateMatches: true,
      readyForApprovalGate: false,
      errors: [],
      decision,
      baseIngestion: base,
      candidateSnapshot: null,
      nextGate: base.nextGate,
      note: 'v2 case 已确认，但该决定仍需补充来源或结构化提案，暂不能进入后续审批门禁。',
    }
  }

  const candidateSnapshot: HumanReviewCandidateSnapshotV2 = {
    ...base.candidateSnapshot,
    schema: 'qiqi-curriculum-human-review-candidate-snapshot/v2',
    caseState: decision.caseState,
    formalApprovalEligible: true,
  }

  return {
    schema: 'qiqi-curriculum-human-review-ingestion/v2',
    accepted: true,
    caseStateMatches: true,
    readyForApprovalGate: true,
    errors: [],
    decision,
    baseIngestion: base,
    candidateSnapshot,
    nextGate: 'content_approval_gate',
    note: '当前 case 快照一致且二次回归通过；候选快照可以提交到后续内容审批门禁，但仍不是 humanVerified 或正式发布结果。',
  }
}
