import { describe, expect, it } from 'vitest'
import { curriculumHumanReviewCases } from './humanReview'
import { createHumanReviewDecisionV2 } from './humanReviewDecisionV2'
import type { CurriculumRelationProposal } from './humanReviewStructuredProposal'
import { runHumanReviewStructuredRegression } from './humanReviewStructuredRegression'
import { mathNormalizedDataset } from './mathNormalized'

describe('structured curriculum relation reference closure', () => {
  it('rejects using a reviewed raw relation as evidence for an unrelated KnowledgeNode pair', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.reviewType === 'cross_grade_relation')!
    const rawRelation = mathNormalizedDataset.relations.find((item) => item.rawEdgeId === reviewCase.sourceRefs[0])!
    const unrelated = mathNormalizedDataset.knowledgeNodes.find((item) => item.id !== rawRelation.fromKnowledgeNodeId && item.id !== rawRelation.toKnowledgeNodeId)!
    const decision = createHumanReviewDecisionV2(
      reviewCase.id,
      'propose_curriculum_relation',
      '核对 raw evidence 后提出课程关系候选。',
      { name: '测试审核人', role: '小学数学教研' },
      [reviewCase.sourceRefs[0]],
      '2026-09-09T12:00:00+08:00',
    )
    const proposal: CurriculumRelationProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: reviewCase.id,
      kind: 'curriculum_relation',
      rationale: '测试 raw relation evidence 不能跨端点复用。',
      evidenceRefs: [reviewCase.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      fromKnowledgeNodeId: rawRelation.fromKnowledgeNodeId,
      toKnowledgeNodeId: unrelated.id,
      relationType: 'related_to',
      supportingRawRefs: [reviewCase.sourceRefs[0]],
      provenance: 'qiqi_curated_review',
    }
    const result = runHumanReviewStructuredRegression(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.checks.find((item) => item.id === 'reviewed_relation_pair_preserved')?.passed).toBe(false)
    expect(result.nextGate).toBe('proposal_revision_required')
  })
})
