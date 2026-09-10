import { curriculumSeed, entryById } from './curriculum'
import { createRepairRecheckBundle, type RepairDraftInput } from './curriculumRepairRecheck'
import { humanReviewCaseById } from './humanReview'
import { type HumanReviewDecisionV2 } from './humanReviewDecisionV2'
import { ingestHumanReviewDecisionV2 } from './humanReviewIngestionV2'
import { mathNormalizedDataset, mathNormalizedNodeById, mathOccurrencesForNode } from './mathNormalized'

export type StructuredProposalKind =
  | 'content_revision'
  | 'concept_split'
  | 'assessment_mapping'
  | 'curriculum_relation'
  | 'identity_split'

interface StructuredProposalBase {
  schema: 'qiqi-curriculum-human-review-structured-proposal/v1'
  caseId: string
  kind: StructuredProposalKind
  rationale: string
  evidenceRefs: string[]
  status: 'structured_proposal_candidate'
  autoApply: false
}

export interface ContentRevisionProposal extends StructuredProposalBase {
  kind: 'content_revision'
  proposed: RepairDraftInput
}

export interface ConceptSplitProposal extends StructuredProposalBase {
  kind: 'concept_split'
  sourceNodeId: string
  proposedNodes: Array<{
    temporaryId: string
    label: string
    learningDemand: string
    questionTypes: string[]
    inheritsSourceOccurrence: true
  }>
}

export interface AssessmentMappingProposal extends StructuredProposalBase {
  kind: 'assessment_mapping'
  rawExerciseId: string
  targetKnowledgeNodeIds: string[]
  mappingType: 'curated_assessed_by'
  provenance: 'qiqi_curated_review'
}

export interface CurriculumRelationProposal extends StructuredProposalBase {
  kind: 'curriculum_relation'
  fromKnowledgeNodeId: string
  toKnowledgeNodeId: string
  relationType: 'prerequisite_for' | 'progresses_to' | 'revisits' | 'related_to'
  supportingRawRefs: string[]
  provenance: 'qiqi_curated_review'
}

export interface IdentitySplitProposal extends StructuredProposalBase {
  kind: 'identity_split'
  sourceKnowledgeNodeId: string
  proposedNodes: Array<{
    temporaryId: string
    canonicalName: string
    occurrenceIds: string[]
  }>
}

export type HumanReviewStructuredProposal =
  | ContentRevisionProposal
  | ConceptSplitProposal
  | AssessmentMappingProposal
  | CurriculumRelationProposal
  | IdentitySplitProposal

export interface StructuredProposalValidationResult {
  schema: 'qiqi-curriculum-human-review-structured-proposal-validation/v1'
  accepted: boolean
  errors: string[]
  decisionCaseMatches: boolean
  proposal: HumanReviewStructuredProposal | null
  candidateSnapshot: {
    schema: 'qiqi-curriculum-structured-candidate-snapshot/v1'
    caseId: string
    decision: HumanReviewDecisionV2['decision']
    proposal: HumanReviewStructuredProposal
    autoApply: false
    humanVerified: false
    readyForSecondaryRegression: true
  } | null
  nextGate: 'structured_proposal_secondary_regression' | 'proposal_revision_required' | 'none'
}

const expectedKindByDecision: Partial<Record<HumanReviewDecisionV2['decision'], StructuredProposalKind>> = {
  revise_candidate: 'content_revision',
  rename_and_reframe: 'content_revision',
  split_nodes: 'concept_split',
  propose_curated_mapping: 'assessment_mapping',
  propose_curriculum_relation: 'curriculum_relation',
  split_identity_candidate: 'identity_split',
}

function nonEmptyStrings(values: string[]) {
  return values.length > 0 && values.every((value) => value.trim().length > 0)
}

function commonChecks(decision: HumanReviewDecisionV2, proposal: HumanReviewStructuredProposal) {
  const errors: string[] = []
  const decisionIngestion = ingestHumanReviewDecisionV2(decision)
  if (!decisionIngestion.accepted || !decisionIngestion.caseStateMatches) errors.push('DECISION_CASE_NOT_CURRENT')
  if (proposal.caseId !== decision.caseId) errors.push('PROPOSAL_CASE_MISMATCH')
  const expectedKind = expectedKindByDecision[decision.decision]
  if (!expectedKind) errors.push('DECISION_DOES_NOT_REQUIRE_STRUCTURED_PROPOSAL')
  if (expectedKind && proposal.kind !== expectedKind) errors.push('PROPOSAL_KIND_MISMATCH')
  if (!proposal.rationale.trim()) errors.push('PROPOSAL_RATIONALE_REQUIRED')
  if (!nonEmptyStrings(proposal.evidenceRefs)) errors.push('PROPOSAL_EVIDENCE_REQUIRED')
  const reviewCase = humanReviewCaseById(decision.caseId)
  if (reviewCase && !proposal.evidenceRefs.some((ref) => reviewCase.sourceRefs.includes(ref))) {
    errors.push('PROPOSAL_MUST_REFERENCE_CURRENT_CASE_EVIDENCE')
  }
  if (proposal.autoApply !== false || proposal.status !== 'structured_proposal_candidate') errors.push('UNSAFE_PROPOSAL_FLAGS')
  return errors
}

function validateContentRevision(decision: HumanReviewDecisionV2, proposal: ContentRevisionProposal) {
  const errors: string[] = []
  const issueId = /^human-review:(F\d{3})$/.exec(decision.caseId)?.[1] ?? null
  if (!issueId) return ['CONTENT_REVISION_REQUIRES_CONTENT_ISSUE_CASE']
  const issue = curriculumSeed.issues.find((item) => item.id === issueId)
  const sourceEntry = issue ? entryById(issue.nodeId) : null
  if (!issue || !sourceEntry) errors.push('CONTENT_SOURCE_ENDPOINT_MISSING')

  if (decision.decision === 'revise_candidate') {
    const recheck = createRepairRecheckBundle(issueId, proposal.proposed)
    if (!recheck.checks.changeIsNonEmpty) errors.push('CONTENT_REVISION_HAS_NO_CHANGE')
    if (!recheck.checks.candidateScopeRespected) errors.push('CONTENT_REVISION_OUTSIDE_ALLOWED_FIELDS')
    if (!recheck.checks.sourceEndpointExists) errors.push('CONTENT_SOURCE_ENDPOINT_MISSING')
  } else if (decision.decision === 'rename_and_reframe') {
    if (issueId !== 'F005') errors.push('RENAME_REFRAME_CURRENTLY_RESTRICTED_TO_F005')
    if (sourceEntry && proposal.proposed.proposedLabel === sourceEntry.label && proposal.proposed.proposedLearningDemand === sourceEntry.learningDemand) {
      errors.push('RENAME_REFRAME_MUST_CHANGE_LABEL_OR_DEMAND')
    }
  }
  return errors
}

function validateConceptSplit(decision: HumanReviewDecisionV2, proposal: ConceptSplitProposal) {
  const errors: string[] = []
  if (decision.caseId !== 'human-review:F005') errors.push('CONCEPT_SPLIT_CURRENTLY_RESTRICTED_TO_F005')
  const issue = curriculumSeed.issues.find((item) => item.id === 'F005')
  if (!issue || proposal.sourceNodeId !== issue.nodeId) errors.push('CONCEPT_SPLIT_SOURCE_NODE_MISMATCH')
  const source = entryById(proposal.sourceNodeId)
  if (!source) errors.push('CONCEPT_SPLIT_SOURCE_NODE_MISSING')
  if (proposal.proposedNodes.length < 2) errors.push('CONCEPT_SPLIT_REQUIRES_AT_LEAST_TWO_NODES')
  const ids = proposal.proposedNodes.map((item) => item.temporaryId)
  if (new Set(ids).size !== ids.length || ids.some((id) => !id.startsWith('candidate:'))) errors.push('CONCEPT_SPLIT_TEMP_IDS_INVALID')
  for (const node of proposal.proposedNodes) {
    if (!node.label.trim() || !node.learningDemand.trim()) errors.push('CONCEPT_SPLIT_NODE_TEXT_REQUIRED')
    if (!nonEmptyStrings(node.questionTypes)) errors.push('CONCEPT_SPLIT_QUESTION_TYPES_REQUIRED')
    if (node.inheritsSourceOccurrence !== true) errors.push('CONCEPT_SPLIT_OCCURRENCE_PLAN_REQUIRED')
  }
  return errors
}

function validateAssessmentMapping(decision: HumanReviewDecisionV2, proposal: AssessmentMappingProposal) {
  const errors: string[] = []
  const reviewCase = humanReviewCaseById(decision.caseId)
  if (!reviewCase || reviewCase.reviewType !== 'assessment_binding') errors.push('ASSESSMENT_MAPPING_CASE_TYPE_INVALID')
  const caseMatchesExercise = Boolean(reviewCase && (
    reviewCase.sourceTaskId.includes(proposal.rawExerciseId)
    || reviewCase.sourceRefs.some((ref) => ref.includes(proposal.rawExerciseId))
  ))
  if (!caseMatchesExercise) errors.push('ASSESSMENT_MAPPING_EXERCISE_CASE_MISMATCH')
  const assessment = mathNormalizedDataset.assessmentTasks.find((item) => item.rawExerciseId === proposal.rawExerciseId)
  if (!assessment) errors.push('ASSESSMENT_MAPPING_EXERCISE_NOT_FOUND')
  if (!nonEmptyStrings(proposal.targetKnowledgeNodeIds)) errors.push('ASSESSMENT_MAPPING_TARGET_REQUIRED')
  if (proposal.targetKnowledgeNodeIds.some((id) => !mathNormalizedNodeById(id))) errors.push('ASSESSMENT_MAPPING_TARGET_MISSING')
  if (proposal.mappingType !== 'curated_assessed_by' || proposal.provenance !== 'qiqi_curated_review') errors.push('ASSESSMENT_MAPPING_PROVENANCE_INVALID')
  return errors
}

function validateCurriculumRelation(decision: HumanReviewDecisionV2, proposal: CurriculumRelationProposal) {
  const errors: string[] = []
  const reviewCase = humanReviewCaseById(decision.caseId)
  if (!reviewCase || reviewCase.reviewType !== 'cross_grade_relation') errors.push('CURRICULUM_RELATION_CASE_TYPE_INVALID')
  if (!mathNormalizedNodeById(proposal.fromKnowledgeNodeId) || !mathNormalizedNodeById(proposal.toKnowledgeNodeId)) errors.push('CURRICULUM_RELATION_ENDPOINT_MISSING')
  if (proposal.fromKnowledgeNodeId === proposal.toKnowledgeNodeId) errors.push('CURRICULUM_RELATION_SELF_LOOP')
  if (!nonEmptyStrings(proposal.supportingRawRefs)) errors.push('CURRICULUM_RELATION_SUPPORT_REQUIRED')
  if (reviewCase && !proposal.supportingRawRefs.some((ref) => reviewCase.sourceRefs.includes(ref))) errors.push('CURRICULUM_RELATION_SUPPORT_CASE_MISMATCH')
  if (proposal.provenance !== 'qiqi_curated_review') errors.push('CURRICULUM_RELATION_PROVENANCE_INVALID')
  return errors
}

function validateIdentitySplit(decision: HumanReviewDecisionV2, proposal: IdentitySplitProposal) {
  const errors: string[] = []
  const reviewCase = humanReviewCaseById(decision.caseId)
  if (!reviewCase || reviewCase.reviewType !== 'occurrence_reuse') errors.push('IDENTITY_SPLIT_CASE_TYPE_INVALID')
  if (reviewCase && !reviewCase.sourceRefs.includes(proposal.sourceKnowledgeNodeId)) errors.push('IDENTITY_SPLIT_SOURCE_CASE_MISMATCH')
  const source = mathNormalizedNodeById(proposal.sourceKnowledgeNodeId)
  if (!source) return [...errors, 'IDENTITY_SPLIT_SOURCE_NODE_MISSING']
  const sourceOccurrenceIds = mathOccurrencesForNode(source.id).map((item) => item.id).sort()
  if (sourceOccurrenceIds.length < 2) errors.push('IDENTITY_SPLIT_SOURCE_HAS_INSUFFICIENT_OCCURRENCES')
  if (proposal.proposedNodes.length < 2) errors.push('IDENTITY_SPLIT_REQUIRES_AT_LEAST_TWO_NODES')
  const tempIds = proposal.proposedNodes.map((item) => item.temporaryId)
  if (new Set(tempIds).size !== tempIds.length || tempIds.some((id) => !id.startsWith('candidate:'))) errors.push('IDENTITY_SPLIT_TEMP_IDS_INVALID')
  const assigned = proposal.proposedNodes.flatMap((item) => item.occurrenceIds)
  if (new Set(assigned).size !== assigned.length) errors.push('IDENTITY_SPLIT_OCCURRENCE_DUPLICATED')
  if (assigned.some((id) => !sourceOccurrenceIds.includes(id))) errors.push('IDENTITY_SPLIT_OCCURRENCE_NOT_OWNED_BY_SOURCE')
  if (assigned.slice().sort().join('|') !== sourceOccurrenceIds.join('|')) errors.push('IDENTITY_SPLIT_MUST_ASSIGN_ALL_OCCURRENCES')
  if (proposal.proposedNodes.some((item) => !item.canonicalName.trim() || item.occurrenceIds.length === 0)) errors.push('IDENTITY_SPLIT_NODE_ASSIGNMENT_REQUIRED')
  return errors
}

export function validateHumanReviewStructuredProposal(
  decision: HumanReviewDecisionV2,
  proposal: HumanReviewStructuredProposal,
): StructuredProposalValidationResult {
  const errors = commonChecks(decision, proposal)
  if (errors.length === 0) {
    if (proposal.kind === 'content_revision') errors.push(...validateContentRevision(decision, proposal))
    if (proposal.kind === 'concept_split') errors.push(...validateConceptSplit(decision, proposal))
    if (proposal.kind === 'assessment_mapping') errors.push(...validateAssessmentMapping(decision, proposal))
    if (proposal.kind === 'curriculum_relation') errors.push(...validateCurriculumRelation(decision, proposal))
    if (proposal.kind === 'identity_split') errors.push(...validateIdentitySplit(decision, proposal))
  }

  if (errors.length > 0) {
    return {
      schema: 'qiqi-curriculum-human-review-structured-proposal-validation/v1',
      accepted: false,
      errors,
      decisionCaseMatches: !errors.includes('DECISION_CASE_NOT_CURRENT'),
      proposal,
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  return {
    schema: 'qiqi-curriculum-human-review-structured-proposal-validation/v1',
    accepted: true,
    errors: [],
    decisionCaseMatches: true,
    proposal,
    candidateSnapshot: {
      schema: 'qiqi-curriculum-structured-candidate-snapshot/v1',
      caseId: decision.caseId,
      decision: decision.decision,
      proposal,
      autoApply: false,
      humanVerified: false,
      readyForSecondaryRegression: true,
    },
    nextGate: 'structured_proposal_secondary_regression',
  }
}
