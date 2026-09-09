import { curriculumSeed, entryById } from './curriculum'
import { type HumanReviewDecisionV2 } from './humanReviewDecisionV2'
import {
  type AssessmentMappingProposal,
  type ConceptSplitProposal,
  type ContentRevisionProposal,
  type CurriculumRelationProposal,
  type HumanReviewStructuredProposal,
  type IdentitySplitProposal,
  validateHumanReviewStructuredProposal,
} from './humanReviewStructuredProposal'
import { mathNormalizedDataset, mathNormalizedNodeById, mathOccurrencesForNode } from './mathNormalized'

export interface StructuredRegressionCheck {
  id: string
  passed: boolean
  detail: string
}

export interface StructuredRegressionResult {
  schema: 'qiqi-curriculum-human-review-structured-regression/v1'
  accepted: boolean
  caseId: string
  kind: HumanReviewStructuredProposal['kind']
  checks: StructuredRegressionCheck[]
  errors: string[]
  derivedCandidate: Record<string, unknown> | null
  candidateSnapshot: {
    schema: 'qiqi-curriculum-structured-candidate-snapshot/v2'
    caseId: string
    decision: HumanReviewDecisionV2['decision']
    proposal: HumanReviewStructuredProposal
    regressionChecks: StructuredRegressionCheck[]
    derivedCandidate: Record<string, unknown>
    autoApply: false
    humanVerified: false
    readyForApprovalGate: true
  } | null
  nextGate: 'curriculum_content_approval_gate' | 'proposal_revision_required'
}

function check(id: string, passed: boolean, detail: string): StructuredRegressionCheck {
  return { id, passed, detail }
}

function contentRegression(proposal: ContentRevisionProposal) {
  const caseMatch = /^human-review:(F\d{3})$/.exec(proposal.caseId)
  const issue = caseMatch ? curriculumSeed.issues.find((item) => item.id === caseMatch[1]) : null
  const entry = issue ? entryById(issue.nodeId) : null
  const checks = [
    check('source_entry_exists', Boolean(entry), entry ? `source=${entry.id}` : 'source entry missing'),
    check('source_identity_unchanged', Boolean(entry && issue && entry.id === issue.nodeId), '结构化内容修订只修改字段，不替换源节点 ID。'),
    check('seed_immutable', true, '回归仅生成候选对象；没有写回 curriculumSeed。'),
  ]
  const derivedCandidate = entry ? {
    kind: 'content_revision_candidate',
    sourceNodeId: entry.id,
    before: {
      label: entry.label,
      learningDemand: entry.learningDemand,
      questionTypes: entry.questionTypes.slice(),
    },
    after: {
      label: proposal.proposed.proposedLabel,
      learningDemand: proposal.proposed.proposedLearningDemand,
      questionTypes: proposal.proposed.proposedQuestionTypes.slice(),
    },
  } : null
  return { checks, derivedCandidate }
}

function conceptSplitRegression(proposal: ConceptSplitProposal) {
  const source = entryById(proposal.sourceNodeId)
  const tempIds = proposal.proposedNodes.map((item) => item.temporaryId)
  const checks = [
    check('source_entry_exists', Boolean(source), source ? `source=${source.id}` : 'source entry missing'),
    check('candidate_ids_unique', new Set(tempIds).size === tempIds.length, `${tempIds.length} candidate IDs`),
    check('source_occurrence_preserved', proposal.proposedNodes.every((item) => item.inheritsSourceOccurrence), '每个拆分知识都显式继承原教材出现位置；正式应用前需生成多 Occurrence。'),
    check('redirect_plan_complete', Boolean(source && proposal.proposedNodes.length >= 2), '旧 provisional 节点不会静默消失；候选快照保留一对多 redirect 计划。'),
  ]
  const derivedCandidate = source ? {
    kind: 'concept_split_changeset_candidate',
    sourceNodeId: source.id,
    sourceOccurrence: {
      textbookId: source.textbookId,
      unitId: source.unitId,
      grade: source.grade,
      semester: source.semester,
    },
    redirectsTo: proposal.proposedNodes.map((item) => item.temporaryId),
    proposedNodes: proposal.proposedNodes,
  } : null
  return { checks, derivedCandidate }
}

function assessmentMappingRegression(proposal: AssessmentMappingProposal) {
  const assessment = mathNormalizedDataset.assessmentTasks.find((item) => item.rawExerciseId === proposal.rawExerciseId)
  const targets = proposal.targetKnowledgeNodeIds.map((id) => mathNormalizedNodeById(id))
  const checks = [
    check('assessment_exists', Boolean(assessment), assessment ? assessment.id : 'assessment missing'),
    check('all_targets_exist', targets.every(Boolean), `${targets.filter(Boolean).length}/${targets.length} targets resolved`),
    check('curated_provenance_preserved', proposal.provenance === 'qiqi_curated_review', 'curated mapping 与 K12-KGraph raw tests_* 分层保存。'),
    check('raw_edge_immutable', true, '不会向 mathFineSample/K12-KGraph raw edge 集合写入 synthetic tests_*。'),
  ]
  const derivedCandidate = assessment && targets.every(Boolean) ? {
    kind: 'curated_assessment_mapping_candidate',
    assessmentTaskId: assessment.id,
    rawExerciseId: assessment.rawExerciseId,
    targetKnowledgeNodeIds: proposal.targetKnowledgeNodeIds.slice(),
    relationType: 'assessed_by',
    provenance: proposal.provenance,
  } : null
  return { checks, derivedCandidate }
}

function prerequisiteGraphWithCandidate(proposal: CurriculumRelationProposal) {
  const graph = new Map<string, Set<string>>()
  for (const relation of mathNormalizedDataset.relations) {
    if (relation.relationType !== 'prerequisites_for') continue
    if (!graph.has(relation.fromKnowledgeNodeId)) graph.set(relation.fromKnowledgeNodeId, new Set())
    graph.get(relation.fromKnowledgeNodeId)!.add(relation.toKnowledgeNodeId)
  }
  if (proposal.relationType === 'prerequisite_for') {
    if (!graph.has(proposal.fromKnowledgeNodeId)) graph.set(proposal.fromKnowledgeNodeId, new Set())
    graph.get(proposal.fromKnowledgeNodeId)!.add(proposal.toKnowledgeNodeId)
  }
  return graph
}

function graphHasCycle(graph: Map<string, Set<string>>) {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(node: string): boolean {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }
  for (const node of graph.keys()) {
    if (visit(node)) return true
  }
  return false
}

function curriculumRelationRegression(proposal: CurriculumRelationProposal) {
  const from = mathNormalizedNodeById(proposal.fromKnowledgeNodeId)
  const to = mathNormalizedNodeById(proposal.toKnowledgeNodeId)
  const graph = prerequisiteGraphWithCandidate(proposal)
  const cycleFree = proposal.relationType !== 'prerequisite_for' || !graphHasCycle(graph)
  const checks = [
    check('relation_endpoints_exist', Boolean(from && to), `${Boolean(from)} / ${Boolean(to)}`),
    check('supporting_evidence_present', proposal.supportingRawRefs.length > 0, `${proposal.supportingRawRefs.length} raw refs`),
    check('raw_relation_unchanged', true, '候选 Curriculum relation 是新增 curated 层，不覆盖 raw relation type/evidence。'),
    check('prerequisite_cycle_free', cycleFree, cycleFree ? 'candidate prerequisite graph is acyclic' : 'candidate would create a prerequisite cycle'),
  ]
  const derivedCandidate = from && to && cycleFree ? {
    kind: 'curriculum_relation_candidate',
    fromKnowledgeNodeId: from.id,
    toKnowledgeNodeId: to.id,
    relationType: proposal.relationType,
    supportingRawRefs: proposal.supportingRawRefs.slice(),
    provenance: proposal.provenance,
  } : null
  return { checks, derivedCandidate }
}

function identitySplitRegression(proposal: IdentitySplitProposal) {
  const source = mathNormalizedNodeById(proposal.sourceKnowledgeNodeId)
  const occurrences = source ? mathOccurrencesForNode(source.id) : []
  const sourceIds = occurrences.map((item) => item.id).sort()
  const assigned = proposal.proposedNodes.flatMap((item) => item.occurrenceIds).sort()
  const uniqueAssigned = new Set(assigned)
  const closure = sourceIds.join('|') === assigned.join('|') && uniqueAssigned.size === assigned.length
  const checks = [
    check('source_node_exists', Boolean(source), source ? source.id : 'source missing'),
    check('source_has_split_evidence', sourceIds.length >= 2, `${sourceIds.length} source occurrences`),
    check('occurrence_reference_closure', closure, closure ? 'all source occurrences assigned exactly once' : 'occurrence assignment is incomplete or duplicated'),
    check('source_node_not_deleted', true, '候选阶段只记录 split/redirect 计划，不删除原 KnowledgeNode。'),
  ]
  const derivedCandidate = source && sourceIds.length >= 2 && closure ? {
    kind: 'knowledge_identity_split_candidate',
    sourceKnowledgeNodeId: source.id,
    sourceOccurrenceIds: sourceIds,
    proposedNodes: proposal.proposedNodes,
    redirectRequired: true,
  } : null
  return { checks, derivedCandidate }
}

export function runHumanReviewStructuredRegression(
  decision: HumanReviewDecisionV2,
  proposal: HumanReviewStructuredProposal,
): StructuredRegressionResult {
  const validation = validateHumanReviewStructuredProposal(decision, proposal)
  if (!validation.accepted || !validation.candidateSnapshot) {
    return {
      schema: 'qiqi-curriculum-human-review-structured-regression/v1',
      accepted: false,
      caseId: proposal.caseId,
      kind: proposal.kind,
      checks: [],
      errors: validation.errors,
      derivedCandidate: null,
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  const regression = proposal.kind === 'content_revision'
    ? contentRegression(proposal)
    : proposal.kind === 'concept_split'
      ? conceptSplitRegression(proposal)
      : proposal.kind === 'assessment_mapping'
        ? assessmentMappingRegression(proposal)
        : proposal.kind === 'curriculum_relation'
          ? curriculumRelationRegression(proposal)
          : identitySplitRegression(proposal)

  const failed = regression.checks.filter((item) => !item.passed)
  if (failed.length > 0 || !regression.derivedCandidate) {
    return {
      schema: 'qiqi-curriculum-human-review-structured-regression/v1',
      accepted: false,
      caseId: proposal.caseId,
      kind: proposal.kind,
      checks: regression.checks,
      errors: failed.map((item) => `REGRESSION_${item.id.toUpperCase()}_FAILED`),
      derivedCandidate: regression.derivedCandidate,
      candidateSnapshot: null,
      nextGate: 'proposal_revision_required',
    }
  }

  return {
    schema: 'qiqi-curriculum-human-review-structured-regression/v1',
    accepted: true,
    caseId: proposal.caseId,
    kind: proposal.kind,
    checks: regression.checks,
    errors: [],
    derivedCandidate: regression.derivedCandidate,
    candidateSnapshot: {
      schema: 'qiqi-curriculum-structured-candidate-snapshot/v2',
      caseId: decision.caseId,
      decision: decision.decision,
      proposal,
      regressionChecks: regression.checks,
      derivedCandidate: regression.derivedCandidate,
      autoApply: false,
      humanVerified: false,
      readyForApprovalGate: true,
    },
    nextGate: 'curriculum_content_approval_gate',
  }
}
