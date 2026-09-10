import {
  type AIDiscoveryHumanReviewCaseDraft,
} from './aiDiscoveryPromotion'
import { aiDiscoveryCandidateAllById } from './aiDiscoveryRegistry'
import type { CurriculumSubject } from './curriculum'

export type AIHumanReviewDecision = 'accept_candidate' | 'revise_candidate' | 'defer'

export interface AIActivatedHumanReviewCase {
  schema: 'qiqi-curriculum-ai-human-review-case/v1'
  id: string
  candidateId: string
  subject: CurriculumSubject
  grades: number[]
  reviewType: 'ai_candidate_content'
  title: string
  status: 'awaiting_human_review'
  priority: 'review'
  candidateState: AIDiscoveryHumanReviewCaseDraft['candidateState']
  sourceRefs: string[]
  checklist: string[]
  allowedDecisions: AIHumanReviewDecision[]
  activationEvidenceRefs: string[]
  activatedBy: { name: string; role: string }
  activatedAt: string
  autoApply: false
  humanVerified: false
  nextGate: 'ai_review_decision_v2'
}

export interface AIHumanReviewActivationResult {
  schema: 'qiqi-curriculum-ai-human-review-activation-result/v1'
  accepted: boolean
  errors: string[]
  currentCandidateStateMatches: boolean
  activatedCase: AIActivatedHumanReviewCase | null
}

export interface AIHumanReviewDecisionV2 {
  schema: 'qiqi-curriculum-ai-human-review-decision/v2'
  caseId: string
  candidateId: string
  caseState: {
    title: string
    candidateState: AIDiscoveryHumanReviewCaseDraft['candidateState']
    sourceRefs: string[]
    allowedDecisions: AIHumanReviewDecision[]
  }
  status: 'unsigned_human_review'
  decision: AIHumanReviewDecision
  rationale: string
  reviewer: { name: string; role: string }
  evidenceRefs: string[]
  reviewedAt: string
  autoApply: false
  humanVerified: false
  nextGate: 'ai_new_knowledge_proposal_or_defer'
}

function stringArrayEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function candidateStateMatches(draft: AIDiscoveryHumanReviewCaseDraft) {
  const current = aiDiscoveryCandidateAllById(draft.candidateId)
  if (!current) return false
  return current.candidateKind === draft.candidateState.candidateKind
    && current.label === draft.candidateState.label
    && current.learningDemand === draft.candidateState.learningDemand
    && current.sourceAuthority === draft.candidateState.sourceAuthority
    && current.confidence === draft.candidateState.confidence
    && stringArrayEqual(current.sourceRefs, draft.candidateState.sourceRefs)
    && stringArrayEqual(current.sourceRefs, draft.sourceRefs)
}

export function activateAIDiscoveryHumanReviewCaseDraft(
  draft: AIDiscoveryHumanReviewCaseDraft,
  activatedBy: { name: string; role: string },
  activationEvidenceRefs: string[],
  activatedAt = new Date().toISOString(),
): AIHumanReviewActivationResult {
  const errors: string[] = []
  const current = aiDiscoveryCandidateAllById(draft.candidateId)
  if (!current) errors.push('CURRENT_AI_CANDIDATE_MISSING')
  const stateMatches = candidateStateMatches(draft)
  if (!stateMatches) errors.push('CURRENT_AI_CANDIDATE_STATE_MISMATCH')
  if (!activatedBy.name.trim() || !activatedBy.role.trim()) errors.push('ACTIVATOR_IDENTITY_REQUIRED')
  const evidenceRefs = activationEvidenceRefs.map((item) => item.trim()).filter(Boolean)
  if (evidenceRefs.length === 0) errors.push('ACTIVATION_EVIDENCE_REQUIRED')
  if (current && !evidenceRefs.some((ref) => current.sourceRefs.includes(ref))) {
    errors.push('ACTIVATION_EVIDENCE_MUST_MATCH_CURRENT_CANDIDATE')
  }
  if (Number.isNaN(Date.parse(activatedAt))) errors.push('ACTIVATED_AT_INVALID')
  if (draft.autoApply !== false || draft.humanVerified !== false || draft.status !== 'human_review_case_draft') {
    errors.push('UNSAFE_CASE_DRAFT_FLAGS')
  }

  if (errors.length > 0 || !current) {
    return {
      schema: 'qiqi-curriculum-ai-human-review-activation-result/v1',
      accepted: false,
      errors,
      currentCandidateStateMatches: stateMatches,
      activatedCase: null,
    }
  }

  return {
    schema: 'qiqi-curriculum-ai-human-review-activation-result/v1',
    accepted: true,
    errors: [],
    currentCandidateStateMatches: true,
    activatedCase: {
      schema: 'qiqi-curriculum-ai-human-review-case/v1',
      id: draft.id,
      candidateId: draft.candidateId,
      subject: draft.subject,
      grades: draft.grades.slice(),
      reviewType: 'ai_candidate_content',
      title: draft.title,
      status: 'awaiting_human_review',
      priority: 'review',
      candidateState: { ...draft.candidateState, sourceRefs: draft.candidateState.sourceRefs.slice() },
      sourceRefs: current.sourceRefs.slice(),
      checklist: draft.checklist.slice(),
      allowedDecisions: ['accept_candidate', 'revise_candidate', 'defer'],
      activationEvidenceRefs: evidenceRefs,
      activatedBy: { name: activatedBy.name.trim(), role: activatedBy.role.trim() },
      activatedAt,
      autoApply: false,
      humanVerified: false,
      nextGate: 'ai_review_decision_v2',
    },
  }
}

export function createAIHumanReviewDecisionV2(
  reviewCase: AIActivatedHumanReviewCase,
  decision: AIHumanReviewDecision,
  rationale: string,
  reviewer: { name: string; role: string },
  evidenceRefs: string[],
  reviewedAt = new Date().toISOString(),
): AIHumanReviewDecisionV2 {
  if (!reviewCase.allowedDecisions.includes(decision)) throw new Error(`Decision ${decision} is not allowed for ${reviewCase.id}`)
  if (!reviewer.name.trim() || !reviewer.role.trim()) throw new Error('Reviewer name and role are required')
  if (!rationale.trim()) throw new Error('Review rationale is required')
  const normalizedEvidence = evidenceRefs.map((item) => item.trim()).filter(Boolean)
  if (normalizedEvidence.length === 0) throw new Error('At least one evidence reference is required')
  if (!normalizedEvidence.some((ref) => reviewCase.sourceRefs.includes(ref))) {
    throw new Error('At least one evidence reference must match the current AI review case sourceRefs')
  }
  if (Number.isNaN(Date.parse(reviewedAt))) throw new Error('reviewedAt must be a valid date/time')
  return {
    schema: 'qiqi-curriculum-ai-human-review-decision/v2',
    caseId: reviewCase.id,
    candidateId: reviewCase.candidateId,
    caseState: {
      title: reviewCase.title,
      candidateState: { ...reviewCase.candidateState, sourceRefs: reviewCase.candidateState.sourceRefs.slice() },
      sourceRefs: reviewCase.sourceRefs.slice(),
      allowedDecisions: reviewCase.allowedDecisions.slice(),
    },
    status: 'unsigned_human_review',
    decision,
    rationale: rationale.trim(),
    reviewer: { name: reviewer.name.trim(), role: reviewer.role.trim() },
    evidenceRefs: normalizedEvidence,
    reviewedAt,
    autoApply: false,
    humanVerified: false,
    nextGate: 'ai_new_knowledge_proposal_or_defer',
  }
}

export function aiHumanReviewDecisionStillCurrent(decision: AIHumanReviewDecisionV2) {
  const current = aiDiscoveryCandidateAllById(decision.candidateId)
  if (!current) return false
  const state = decision.caseState.candidateState
  return current.label === state.label
    && current.learningDemand === state.learningDemand
    && current.candidateKind === state.candidateKind
    && current.sourceAuthority === state.sourceAuthority
    && current.confidence === state.confidence
    && stringArrayEqual(current.sourceRefs, state.sourceRefs)
    && stringArrayEqual(current.sourceRefs, decision.caseState.sourceRefs)
}
