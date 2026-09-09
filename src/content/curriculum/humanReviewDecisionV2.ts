import {
  humanReviewCaseById,
  type HumanReviewDecision,
  type HumanReviewType,
} from './humanReview'

export interface HumanReviewCaseStateV2 {
  sourceTaskId: string
  title: string
  reviewType: HumanReviewType
  sourceRefs: string[]
  allowedDecisions: HumanReviewDecision[]
}

export interface HumanReviewDecisionV2 {
  schema: 'qiqi-curriculum-human-review-decision/v2'
  caseId: string
  caseState: HumanReviewCaseStateV2
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

export function currentHumanReviewCaseState(caseId: string): HumanReviewCaseStateV2 {
  const reviewCase = humanReviewCaseById(caseId)
  if (!reviewCase) throw new Error(`Human review case not found: ${caseId}`)
  return {
    sourceTaskId: reviewCase.sourceTaskId,
    title: reviewCase.title,
    reviewType: reviewCase.reviewType,
    sourceRefs: reviewCase.sourceRefs.slice(),
    allowedDecisions: reviewCase.allowedDecisions.slice(),
  }
}

export function createHumanReviewDecisionV2(
  caseId: string,
  decision: HumanReviewDecision,
  rationale: string,
  reviewer: { name: string; role: string },
  evidenceRefs: string[],
  reviewedAt = new Date().toISOString(),
): HumanReviewDecisionV2 {
  const reviewCase = humanReviewCaseById(caseId)
  if (!reviewCase) throw new Error(`Human review case not found: ${caseId}`)
  if (!reviewCase.allowedDecisions.includes(decision)) throw new Error(`Decision ${decision} is not allowed for ${caseId}`)
  if (!reviewer.name.trim() || !reviewer.role.trim()) throw new Error('Reviewer name and role are required')
  if (!rationale.trim()) throw new Error('Review rationale is required')
  const normalizedEvidence = evidenceRefs.map((item) => item.trim()).filter(Boolean)
  if (normalizedEvidence.length === 0) throw new Error('At least one evidence reference is required')
  if (!normalizedEvidence.some((item) => reviewCase.sourceRefs.includes(item))) {
    throw new Error('At least one evidence reference must match the current review case sourceRefs')
  }
  if (Number.isNaN(Date.parse(reviewedAt))) throw new Error('reviewedAt must be a valid date/time')

  return {
    schema: 'qiqi-curriculum-human-review-decision/v2',
    caseId,
    caseState: currentHumanReviewCaseState(caseId),
    status: 'unsigned_human_review',
    decision,
    rationale: rationale.trim(),
    reviewer: { name: reviewer.name.trim(), role: reviewer.role.trim() },
    evidenceRefs: normalizedEvidence,
    reviewedAt,
    humanVerified: false,
    autoApply: false,
    nextGate: 'review_decision_ingestion',
  }
}
