import { describe, expect, it } from 'vitest'
import { curriculumSeed, entryById } from './curriculum'
import { curriculumHumanReviewCases } from './humanReview'
import { createHumanReviewDecisionV2 } from './humanReviewDecisionV2'
import {
  type AssessmentMappingProposal,
  type ConceptSplitProposal,
  type ContentRevisionProposal,
  type CurriculumRelationProposal,
  type IdentitySplitProposal,
} from './humanReviewStructuredProposal'
import { directedEdgesHaveCycle, runHumanReviewStructuredRegression } from './humanReviewStructuredRegression'
import { mathNormalizedDataset, mathOccurrencesForNode } from './mathNormalized'

function reviewCase(caseId: string) {
  const item = curriculumHumanReviewCases.find((candidate) => candidate.id === caseId)
  if (!item) throw new Error(`missing review case ${caseId}`)
  return item
}

function decisionFor(caseId: string, decision: Parameters<typeof createHumanReviewDecisionV2>[1]) {
  const item = reviewCase(caseId)
  return createHumanReviewDecisionV2(
    caseId,
    decision,
    '已在当前 case 上完成核对，并要求系统执行结构化二次回归。',
    { name: '测试审核人', role: '小学学科教研' },
    [item.sourceRefs[0]],
    '2026-09-09T11:50:00+08:00',
  )
}

describe('structured proposal secondary regression', () => {
  it('turns an F006 human revision into a non-mutating candidate ready for the content approval gate', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F006')!
    const entry = entryById(issue.nodeId)!
    const decision = decisionFor('human-review:F006', 'revise_candidate')
    const proposal: ContentRevisionProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'content_revision',
      rationale: '删除异常口算并采用经教材证据确认的英语题型分类。',
      evidenceRefs: [reviewCase(decision.caseId).sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      proposed: {
        proposedLabel: entry.label,
        proposedLearningDemand: entry.learningDemand,
        proposedQuestionTypes: ['填空', '选择'],
      },
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.nextGate).toBe('curriculum_content_approval_gate')
    expect(result.checks.find((item) => item.id === 'seed_immutable')?.passed).toBe(true)
    expect(result.candidateSnapshot?.readyForApprovalGate).toBe(true)
    expect(result.candidateSnapshot?.autoApply).toBe(false)
    expect(result.candidateSnapshot?.humanVerified).toBe(false)
  })

  it('creates an explicit redirect/occurrence plan for the F005 two-node split candidate', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F005')!
    const decision = decisionFor('human-review:F005', 'split_nodes')
    const proposal: ConceptSplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'concept_split',
      rationale: '分别建模篇章概括与句法缩句，并保留原教材出现位置。',
      evidenceRefs: [reviewCase(decision.caseId).sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceNodeId: issue.nodeId,
      proposedNodes: [
        {
          temporaryId: 'candidate:F005:summary',
          label: '记叙文主要内容概括',
          learningDemand: '提取事件主要内容和关键行动，用简洁语言完成篇章层面的概括。',
          questionTypes: ['阅读理解', '简答题'],
          inheritsSourceOccurrence: true,
        },
        {
          temporaryId: 'candidate:F005:sentence-core',
          label: '句子主干提取（缩句）',
          learningDemand: '删除修饰限制成分，在不改变基本句意的前提下保留句子主干。',
          questionTypes: ['填空', '判断'],
          inheritsSourceOccurrence: true,
        },
      ],
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.checks.find((item) => item.id === 'redirect_plan_complete')?.passed).toBe(true)
    expect(result.checks.find((item) => item.id === 'source_occurrence_preserved')?.passed).toBe(true)
    expect(result.derivedCandidate?.kind).toBe('concept_split_changeset_candidate')
  })

  it('keeps an exe20 curated mapping in the curated layer and leaves raw tests edges immutable', () => {
    const caseItem = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))!
    const decision = decisionFor(caseItem.id, 'propose_curated_mapping')
    const proposal: AssessmentMappingProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'assessment_mapping',
      rationale: '人工课程映射候选，明确不回写为 K12-KGraph raw tests_*。',
      evidenceRefs: [caseItem.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      rawExerciseId: 'math_4a_rjb_exe20',
      targetKnowledgeNodeIds: [mathNormalizedDataset.knowledgeNodes[0].id],
      mappingType: 'curated_assessed_by',
      provenance: 'qiqi_curated_review',
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.checks.find((item) => item.id === 'raw_edge_immutable')?.passed).toBe(true)
    expect(result.derivedCandidate?.provenance).toBe('qiqi_curated_review')
  })

  it('keeps a reviewed cross-grade related_to proposal separate from the raw relation', () => {
    const caseItem = curriculumHumanReviewCases.find((item) => item.reviewType === 'cross_grade_relation')!
    const rawRelation = mathNormalizedDataset.relations.find((item) => item.rawEdgeId === caseItem.sourceRefs[0])!
    expect(rawRelation).toBeTruthy()
    const decision = decisionFor(caseItem.id, 'propose_curriculum_relation')
    const proposal: CurriculumRelationProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'curriculum_relation',
      rationale: '基于已核 raw evidence 提出独立 Curriculum related_to 候选。',
      evidenceRefs: [caseItem.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      fromKnowledgeNodeId: rawRelation.fromKnowledgeNodeId,
      toKnowledgeNodeId: rawRelation.toKnowledgeNodeId,
      relationType: 'related_to',
      supportingRawRefs: [caseItem.sourceRefs[0]],
      provenance: 'qiqi_curated_review',
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.checks.find((item) => item.id === 'raw_relation_unchanged')?.passed).toBe(true)
  })

  it('detects directed cycles without adding synthetic prerequisite data to the curriculum sample', () => {
    expect(directedEdgesHaveCycle([
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'A' },
    ])).toBe(true)
    expect(directedEdgesHaveCycle([
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ])).toBe(false)
  })

  it('blocks identity split when the reviewed source lacks enough occurrence evidence', () => {
    const caseItem = curriculumHumanReviewCases.find((item) => item.reviewType === 'occurrence_reuse')!
    const sourceId = caseItem.sourceRefs.find((ref) => ref.startsWith('math:kg:'))!
    const occurrences = mathOccurrencesForNode(sourceId)
    const decision = decisionFor(caseItem.id, 'split_identity_candidate')
    const proposal: IdentitySplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'identity_split',
      rationale: '只有多个已定位 Occurrence 可以完整重分配时才允许拆分身份。',
      evidenceRefs: [caseItem.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceKnowledgeNodeId: sourceId,
      proposedNodes: [
        { temporaryId: 'candidate:identity:a', canonicalName: '候选身份A', occurrenceIds: occurrences.slice(0, 1).map((item) => item.id) },
        { temporaryId: 'candidate:identity:b', canonicalName: '候选身份B', occurrenceIds: occurrences.slice(1).map((item) => item.id) },
      ],
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    if (occurrences.length < 2) {
      expect(result.accepted).toBe(false)
      expect(result.errors).toContain('IDENTITY_SPLIT_SOURCE_HAS_INSUFFICIENT_OCCURRENCES')
    } else {
      expect(result.accepted).toBe(true)
      expect(result.checks.find((item) => item.id === 'occurrence_reference_closure')?.passed).toBe(true)
    }
  })
})
