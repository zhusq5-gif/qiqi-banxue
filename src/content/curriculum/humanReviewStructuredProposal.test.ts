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
  validateHumanReviewStructuredProposal,
} from './humanReviewStructuredProposal'
import { mathNormalizedDataset, mathOccurrencesForNode } from './mathNormalized'

function decisionFor(caseId: string, decision: Parameters<typeof createHumanReviewDecisionV2>[1]) {
  const reviewCase = curriculumHumanReviewCases.find((item) => item.id === caseId)
  if (!reviewCase) throw new Error(`missing review case ${caseId}`)
  return createHumanReviewDecisionV2(
    caseId,
    decision,
    '已按当前 case 的教材/来源证据完成真人核对，并要求结构化记录后续变更。',
    { name: '测试审核人', role: '小学学科教研' },
    [reviewCase.sourceRefs[0]],
    '2026-09-09T11:40:00+08:00',
  )
}

function caseEvidence(caseId: string) {
  const reviewCase = curriculumHumanReviewCases.find((item) => item.id === caseId)
  if (!reviewCase) throw new Error(`missing review case ${caseId}`)
  return reviewCase.sourceRefs[0]
}

describe('structured human review proposal validation', () => {
  it('accepts an F006 human revision when only the allowed questionTypes field changes', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F006')!
    const entry = entryById(issue.nodeId)!
    const decision = decisionFor('human-review:F006', 'revise_candidate')
    const proposal: ContentRevisionProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'content_revision',
      rationale: '确认口算为污染，同时根据实际英语练习证据增加选择题分类。',
      evidenceRefs: [caseEvidence(decision.caseId)],
      status: 'structured_proposal_candidate',
      autoApply: false,
      proposed: {
        proposedLabel: entry.label,
        proposedLearningDemand: entry.learningDemand,
        proposedQuestionTypes: ['填空', '选择'],
      },
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.nextGate).toBe('structured_proposal_secondary_regression')
    expect(result.candidateSnapshot?.autoApply).toBe(false)
    expect(result.candidateSnapshot?.humanVerified).toBe(false)
  })

  it('rejects an F006 revision that also changes the knowledge label', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F006')!
    const entry = entryById(issue.nodeId)!
    const decision = decisionFor('human-review:F006', 'revise_candidate')
    const proposal: ContentRevisionProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'content_revision',
      rationale: '测试超出允许字段的修订必须被拦截。',
      evidenceRefs: [caseEvidence(decision.caseId)],
      status: 'structured_proposal_candidate',
      autoApply: false,
      proposed: {
        proposedLabel: `${entry.label}（改名）`,
        proposedLearningDemand: entry.learningDemand,
        proposedQuestionTypes: ['填空'],
      },
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('CONTENT_REVISION_OUTSIDE_ALLOWED_FIELDS')
  })

  it('accepts a two-node F005 concept split candidate without applying it', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F005')!
    const decision = decisionFor('human-review:F005', 'split_nodes')
    const proposal: ConceptSplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'concept_split',
      rationale: '将篇章层面的主要内容概括与句法层面的缩句拆开，避免两个不同学习目标共用一个知识身份。',
      evidenceRefs: [caseEvidence(decision.caseId)],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceNodeId: issue.nodeId,
      proposedNodes: [
        {
          temporaryId: 'candidate:F005:summary',
          label: '记叙文主要内容概括',
          learningDemand: '根据事件与关键行动提取主要内容，用较简洁的语言概括叙事。',
          questionTypes: ['阅读理解', '简答题'],
          inheritsSourceOccurrence: true,
        },
        {
          temporaryId: 'candidate:F005:sentence-core',
          label: '句子主干提取（缩句）',
          learningDemand: '删除句子中的修饰、限制成分，在不改变基本句意的前提下保留主要成分。',
          questionTypes: ['填空', '判断'],
          inheritsSourceOccurrence: true,
        },
      ],
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(true)
    expect(result.candidateSnapshot?.proposal.kind).toBe('concept_split')
    expect(result.candidateSnapshot?.readyForSecondaryRegression).toBe(true)
  })

  it('rejects an F005 split that points at a different source node', () => {
    const issue = curriculumSeed.issues.find((item) => item.id === 'F006')!
    const decision = decisionFor('human-review:F005', 'split_nodes')
    const proposal: ConceptSplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'concept_split',
      rationale: '测试不能把 F005 审核决定套到其他知识点。',
      evidenceRefs: [caseEvidence(decision.caseId)],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceNodeId: issue.nodeId,
      proposedNodes: [
        { temporaryId: 'candidate:a', label: 'A', learningDemand: 'A demand', questionTypes: ['填空'], inheritsSourceOccurrence: true },
        { temporaryId: 'candidate:b', label: 'B', learningDemand: 'B demand', questionTypes: ['判断'], inheritsSourceOccurrence: true },
      ],
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('CONCEPT_SPLIT_SOURCE_NODE_MISMATCH')
  })

  it('accepts an exe20 curated assessment mapping but keeps provenance separate from raw edges', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))!
    const target = mathNormalizedDataset.knowledgeNodes[0]
    const decision = decisionFor(reviewCase.id, 'propose_curated_mapping')
    const proposal: AssessmentMappingProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'assessment_mapping',
      rationale: '这是人工课程映射候选，仅用于 curated 层，不改写 K12-KGraph raw tests_*。',
      evidenceRefs: [reviewCase.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      rawExerciseId: 'math_4a_rjb_exe20',
      targetKnowledgeNodeIds: [target.id],
      mappingType: 'curated_assessed_by',
      provenance: 'qiqi_curated_review',
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(true)
    expect((result.candidateSnapshot?.proposal as AssessmentMappingProposal).provenance).toBe('qiqi_curated_review')
  })

  it('rejects an assessment mapping when the reviewed case belongs to another exercise', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))!
    const otherAssessment = mathNormalizedDataset.assessmentTasks.find((item) => item.rawExerciseId !== 'math_4a_rjb_exe20')!
    const decision = decisionFor(reviewCase.id, 'propose_curated_mapping')
    const proposal: AssessmentMappingProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'assessment_mapping',
      rationale: '测试审核 case 与 Exercise 必须一致。',
      evidenceRefs: [reviewCase.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      rawExerciseId: otherAssessment.rawExerciseId,
      targetKnowledgeNodeIds: [mathNormalizedDataset.knowledgeNodes[0].id],
      mappingType: 'curated_assessed_by',
      provenance: 'qiqi_curated_review',
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('ASSESSMENT_MAPPING_EXERCISE_CASE_MISMATCH')
  })

  it('accepts a curated curriculum relation only when it cites the reviewed raw relation evidence', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.reviewType === 'cross_grade_relation')!
    const rawEdgeId = reviewCase.sourceRefs[0]
    const rawRelation = mathNormalizedDataset.relations.find((item) => item.rawEdgeId === rawEdgeId)!
    expect(rawRelation).toBeTruthy()
    const decision = decisionFor(reviewCase.id, 'propose_curriculum_relation')
    const proposal: CurriculumRelationProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'curriculum_relation',
      rationale: '保留 raw relation，同时提出独立的课程 related_to 候选。',
      evidenceRefs: [reviewCase.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      fromKnowledgeNodeId: rawRelation.fromKnowledgeNodeId,
      toKnowledgeNodeId: rawRelation.toKnowledgeNodeId,
      relationType: 'related_to',
      supportingRawRefs: [reviewCase.sourceRefs[0]],
      provenance: 'qiqi_curated_review',
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(true)

    const selfLoop = { ...proposal, toKnowledgeNodeId: proposal.fromKnowledgeNodeId }
    const selfLoopResult = validateHumanReviewStructuredProposal(decision, selfLoop)
    expect(selfLoopResult.accepted).toBe(false)
    expect(selfLoopResult.errors).toContain('CURRICULUM_RELATION_SELF_LOOP')
  })

  it('does not allow identity splitting without enough occurrence evidence', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.reviewType === 'occurrence_reuse')!
    expect(reviewCase).toBeTruthy()
    const sourceId = reviewCase.sourceRefs.find((ref) => ref.startsWith('math:kg:'))!
    const occurrences = mathOccurrencesForNode(sourceId)
    const decision = decisionFor(reviewCase.id, 'split_identity_candidate')
    const proposal: IdentitySplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'identity_split',
      rationale: '只有出现记录足够且能完整重分配时才允许拆分身份。',
      evidenceRefs: [reviewCase.sourceRefs[0]],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceKnowledgeNodeId: sourceId,
      proposedNodes: [
        { temporaryId: 'candidate:identity:a', canonicalName: '候选身份A', occurrenceIds: occurrences.slice(0, 1).map((item) => item.id) },
        { temporaryId: 'candidate:identity:b', canonicalName: '候选身份B', occurrenceIds: occurrences.slice(1).map((item) => item.id) },
      ],
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    if (occurrences.length < 2) {
      expect(result.accepted).toBe(false)
      expect(result.errors).toContain('IDENTITY_SPLIT_SOURCE_HAS_INSUFFICIENT_OCCURRENCES')
    } else {
      expect(result.accepted).toBe(true)
    }
  })

  it('rejects a structured proposal when the underlying v2 decision captured an old case state', () => {
    const decision = decisionFor('human-review:F005', 'split_nodes')
    decision.caseState = { ...decision.caseState, title: `${decision.caseState.title}（旧 case）` }
    const issue = curriculumSeed.issues.find((item) => item.id === 'F005')!
    const proposal: ConceptSplitProposal = {
      schema: 'qiqi-curriculum-human-review-structured-proposal/v1',
      caseId: decision.caseId,
      kind: 'concept_split',
      rationale: '旧 case decision 不能继续驱动当前结构变更。',
      evidenceRefs: [caseEvidence(decision.caseId)],
      status: 'structured_proposal_candidate',
      autoApply: false,
      sourceNodeId: issue.nodeId,
      proposedNodes: [
        { temporaryId: 'candidate:old:a', label: 'A', learningDemand: 'A demand', questionTypes: ['填空'], inheritsSourceOccurrence: true },
        { temporaryId: 'candidate:old:b', label: 'B', learningDemand: 'B demand', questionTypes: ['判断'], inheritsSourceOccurrence: true },
      ],
    }
    const result = validateHumanReviewStructuredProposal(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('DECISION_CASE_NOT_CURRENT')
    expect(result.decisionCaseMatches).toBe(false)
  })
})
