import {
  aiHumanReviewDecisionStillCurrent,
  type AIHumanReviewDecisionV2,
} from './aiHumanReviewActivation'
import {
  aiDiscoveryCandidateAllById,
  exactExistingMatches,
} from './aiDiscoveryRegistry'
import type { CurriculumSubject } from './curriculum'

export type AINewKnowledgeEntityRole = 'framework_anchor' | 'knowledge_node'
export type AISemanticDuplicateDisposition = 'no_obvious_duplicate' | 'possible_duplicate_reviewed'

export interface AINewKnowledgeProposal {
  schema: 'qiqi-curriculum-ai-new-knowledge-proposal/v1'
  caseId: string
  candidateId: string
  kind: 'new_knowledge_candidate'
  status: 'structured_proposal_candidate'
  autoApply: false
  rationale: string
  evidenceRefs: string[]
  proposed: {
    temporaryId: string
    subject: CurriculumSubject
    gradeScope: number[]
    entityRole: AINewKnowledgeEntityRole
    canonicalLabel: string
    learningDemand: string
    aliases: string[]
    provenance: 'ai_discovery_human_curated'
    sourceRefs: string[]
    duplicateAnalysis: {
      exactExistingIds: string[]
      semanticDisposition: AISemanticDuplicateDisposition
      semanticReviewNote: string
      possibleExistingIds: string[]
    }
  }
}

export interface AINewKnowledgeProposalValidationResult {
  schema: 'qiqi-curriculum-ai-new-knowledge-validation/v1'
  accepted: boolean
  errors: string[]
  proposal: AINewKnowledgeProposal | null
  candidateSnapshot: {
    schema: 'qiqi-curriculum-ai-new-knowledge-snapshot/v1'
    caseId: string
    candidateId: string
    proposed: AINewKnowledgeProposal['proposed']
    evidenceRefs: string[]
    autoApply: false
    humanVerified: false
    readyForSecondaryRegression: true
  } | null
  nextGate: 'ai_new_knowledge_secondary_regression' | 'proposal_revision_required'
}

function uniqueNonEmpty(values: string[]) {
  return values.length > 0
    && new Set(values).size === values.length
    && values.every((value) => value.trim().length > 0)
}

function sameStringSet(a: string[], b: string[]) {
  return a.length === b.length && a.slice().sort().join('|') === b.slice().sort().join('|')
}

function isGradeScopeSubset(scope: number[], candidateGrades: number[]) {
  return scope.length > 0
    && new Set(scope).size === scope.length
    && scope.every((grade) => Number.isInteger(grade) && grade >= 1 && grade <= 6 && candidateGrades.includes(grade))
}

export function validateAINewKnowledgeProposal(
  decision: AIHumanReviewDecisionV2,
  proposal: AINewKnowledgeProposal,
): AINewKnowledgeProposalValidationResult {
  const errors: string[] = []
  const candidate = aiDiscoveryCandidateAllById(decision.candidateId)

  if (!candidate) errors.push('CURRENT_AI_CANDIDATE_MISSING')
  if (!aiHumanReviewDecisionStillCurrent(decision)) errors.push('AI_REVIEW_DECISION_NOT_CURRENT')
  if (!['accept_candidate', 'revise_candidate'].includes(decision.decision)) errors.push('AI_DECISION_DOES_NOT_CREATE_NEW_KNOWLEDGE')
  if (proposal.caseId !== decision.caseId || proposal.candidateId !== decision.candidateId) errors.push('NEW_KNOWLEDGE_CASE_MISMATCH')
  if (!proposal.rationale.trim()) errors.push('NEW_KNOWLEDGE_RATIONALE_REQUIRED')
  if (proposal.status !== 'structured_proposal_candidate' || proposal.autoApply !== false) errors.push('UNSAFE_NEW_KNOWLEDGE_FLAGS')
  if (!uniqueNonEmpty(proposal.evidenceRefs)) errors.push('NEW_KNOWLEDGE_EVIDENCE_REQUIRED')

  if (candidate) {
    if (!proposal.evidenceRefs.some((ref) => candidate.sourceRefs.includes(ref))) errors.push('NEW_KNOWLEDGE_MUST_REFERENCE_CURRENT_SOURCE')
    if (proposal.proposed.subject !== candidate.subject) errors.push('NEW_KNOWLEDGE_SUBJECT_MISMATCH')
    if (!isGradeScopeSubset(proposal.proposed.gradeScope, candidate.grades)) errors.push('NEW_KNOWLEDGE_GRADE_SCOPE_INVALID')
    if (!sameStringSet(proposal.proposed.sourceRefs, candidate.sourceRefs)) errors.push('NEW_KNOWLEDGE_SOURCE_CLOSURE_FAILED')
    const expectedRole: AINewKnowledgeEntityRole = candidate.candidateKind === 'knowledge_domain' ? 'framework_anchor' : 'knowledge_node'
    if (proposal.proposed.entityRole !== expectedRole) errors.push('NEW_KNOWLEDGE_ENTITY_ROLE_INVALID')

    const exactIds = exactExistingMatches(candidate).map((item) => item.id).sort()
    if (!sameStringSet(proposal.proposed.duplicateAnalysis.exactExistingIds, exactIds)) errors.push('NEW_KNOWLEDGE_EXACT_DUPLICATE_ANALYSIS_STALE')
    if (exactIds.length > 0) errors.push('NEW_KNOWLEDGE_EXACT_DUPLICATE_BLOCKS_CREATION')
  }

  if (!proposal.proposed.temporaryId.startsWith('candidate:new:')) errors.push('NEW_KNOWLEDGE_TEMP_ID_INVALID')
  if (!proposal.proposed.canonicalLabel.trim() || !proposal.proposed.learningDemand.trim()) errors.push('NEW_KNOWLEDGE_TEXT_REQUIRED')
  if (new Set(proposal.proposed.aliases).size !== proposal.proposed.aliases.length || proposal.proposed.aliases.some((item) => !item.trim())) errors.push('NEW_KNOWLEDGE_ALIASES_INVALID')
  if (proposal.proposed.provenance !== 'ai_discovery_human_curated') errors.push('NEW_KNOWLEDGE_PROVENANCE_INVALID')
  if (!proposal.proposed.duplicateAnalysis.semanticReviewNote.trim()) errors.push('NEW_KNOWLEDGE_SEMANTIC_REVIEW_REQUIRED')
  if (proposal.proposed.duplicateAnalysis.semanticDisposition === 'possible_duplicate_reviewed' && proposal.proposed.duplicateAnalysis.possibleExistingIds.length === 0) {
    errors.push('NEW_KNOWLEDGE_POSSIBLE_DUPLICATE_IDS_REQUIRED')
  }
  if (proposal.proposed.duplicateAnalysis.semanticDisposition === 'no_obvious_duplicate' && proposal.proposed.duplicateAnalysis.possibleExistingIds.length > 0) {
    errors.push('NEW_KNOWLEDGE_DUPLICATE_DISPOSITION_CONFLICT')
  }

  if (errors.length > 0) {
    return {
      schema: 'qiqi-curriculum-ai-new-knowledge-validation/v1',
      accepted: false,
      errors,
      proposal,
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  return {
    schema: 'qiqi-curriculum-ai-new-knowledge-validation/v1',
    accepted: true,
    errors: [],
    proposal,
    candidateSnapshot: {
      schema: 'qiqi-curriculum-ai-new-knowledge-snapshot/v1',
      caseId: proposal.caseId,
      candidateId: proposal.candidateId,
      proposed: proposal.proposed,
      evidenceRefs: proposal.evidenceRefs.slice(),
      autoApply: false,
      humanVerified: false,
      readyForSecondaryRegression: true,
    },
    nextGate: 'ai_new_knowledge_secondary_regression',
  }
}

export interface AINewKnowledgeRegressionResult {
  schema: 'qiqi-curriculum-ai-new-knowledge-regression/v1'
  accepted: boolean
  checks: Array<{ id: string; passed: boolean; detail: string }>
  errors: string[]
  candidateSnapshot: {
    schema: 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2'
    caseId: string
    candidateId: string
    proposed: AINewKnowledgeProposal['proposed']
    regressionChecks: Array<{ id: string; passed: boolean; detail: string }>
    autoApply: false
    humanVerified: false
    readyForApprovalGate: true
  } | null
  nextGate: 'curriculum_content_approval_gate' | 'proposal_revision_required'
}

export function runAINewKnowledgeSecondaryRegression(
  decision: AIHumanReviewDecisionV2,
  proposal: AINewKnowledgeProposal,
): AINewKnowledgeRegressionResult {
  const validation = validateAINewKnowledgeProposal(decision, proposal)
  if (!validation.accepted || !validation.candidateSnapshot) {
    return {
      schema: 'qiqi-curriculum-ai-new-knowledge-regression/v1',
      accepted: false,
      checks: [],
      errors: validation.errors,
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  const candidate = aiDiscoveryCandidateAllById(proposal.candidateId)!
  const checks = [
    { id: 'candidate_state_current', passed: aiHumanReviewDecisionStillCurrent(decision), detail: 'review decision still matches current AI candidate state' },
    { id: 'source_reference_closure', passed: sameStringSet(proposal.proposed.sourceRefs, candidate.sourceRefs), detail: 'all current AI source refs are retained in candidate provenance' },
    { id: 'grade_scope_within_candidate', passed: isGradeScopeSubset(proposal.proposed.gradeScope, candidate.grades), detail: 'human proposal may narrow but not expand AI grade scope' },
    { id: 'exact_duplicate_clear', passed: exactExistingMatches(candidate).length === 0, detail: 'exact normalized duplicate check must remain clear before new entity creation' },
    { id: 'seed_immutable', passed: true, detail: 'regression constructs a candidate snapshot only; seed/raw/CloudBase are not mutated' },
    { id: 'framework_anchor_not_knowledge_node', passed: candidate.candidateKind !== 'knowledge_domain' || proposal.proposed.entityRole === 'framework_anchor', detail: 'curriculum/task-group framework anchors cannot be silently converted into KnowledgeNode identity' },
  ]
  const failed = checks.filter((item) => !item.passed)
  if (failed.length > 0) {
    return {
      schema: 'qiqi-curriculum-ai-new-knowledge-regression/v1',
      accepted: false,
      checks,
      errors: failed.map((item) => `REGRESSION_${item.id.toUpperCase()}_FAILED`),
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  return {
    schema: 'qiqi-curriculum-ai-new-knowledge-regression/v1',
    accepted: true,
    checks,
    errors: [],
    candidateSnapshot: {
      schema: 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2',
      caseId: proposal.caseId,
      candidateId: proposal.candidateId,
      proposed: proposal.proposed,
      regressionChecks: checks,
      autoApply: false,
      humanVerified: false,
      readyForApprovalGate: true,
    },
    nextGate: 'curriculum_content_approval_gate',
  }
}
