import { describe, expect, it } from 'vitest'
import { createAIDiscoveryDecisionAll, aiDiscoveryCandidateAllById, exactExistingMatches } from './aiDiscoveryRegistry'
import { createAIDiscoveryHumanReviewCaseDraft } from './aiDiscoveryPromotion'
import { activateAIDiscoveryHumanReviewCaseDraft, createAIHumanReviewDecisionV2 } from './aiHumanReviewActivation'
import {
  runAINewKnowledgeSecondaryRegression,
  validateAINewKnowledgeProposal,
  type AINewKnowledgeProposal,
} from './aiNewKnowledgeProposal'

function acceptedDecision(candidateId: string, sourceRef: string) {
  const promote = createAIDiscoveryDecisionAll(
    candidateId,
    'promote_to_human_review',
    '初筛',
    '小学教师',
    '已核来源，进入精审。',
    [sourceRef],
    '2026-09-09T15:30:00+08:00',
  )
  const draft = createAIDiscoveryHumanReviewCaseDraft(promote)
  const activated = activateAIDiscoveryHumanReviewCaseDraft(
    draft,
    { name: '激活人', role: '学科教研' },
    [sourceRef],
    '2026-09-09T15:31:00+08:00',
  ).activatedCase!
  return createAIHumanReviewDecisionV2(
    activated,
    'accept_candidate',
    '确认候选方向可以进入结构化候选，但仍需二次回归和审批。',
    { name: '精审人', role: '学科教研' },
    [sourceRef],
    '2026-09-09T15:32:00+08:00',
  )
}

function proposalFor(candidateId: string, sourceRef: string): AINewKnowledgeProposal {
  const candidate = aiDiscoveryCandidateAllById(candidateId)!
  return {
    schema: 'qiqi-curriculum-ai-new-knowledge-proposal/v1',
    caseId: `human-review-ai:${candidate.id}`,
    candidateId: candidate.id,
    kind: 'new_knowledge_candidate',
    status: 'structured_proposal_candidate',
    autoApply: false,
    rationale: '基于当前来源和真人精审形成新的候选实体。',
    evidenceRefs: [sourceRef],
    proposed: {
      temporaryId: `candidate:new:${candidate.id}`,
      subject: candidate.subject,
      gradeScope: candidate.grades.slice(),
      entityRole: candidate.candidateKind === 'knowledge_domain' ? 'framework_anchor' : 'knowledge_node',
      canonicalLabel: candidate.label,
      learningDemand: candidate.learningDemand,
      aliases: [],
      provenance: 'ai_discovery_human_curated',
      sourceRefs: candidate.sourceRefs.slice(),
      duplicateAnalysis: {
        exactExistingIds: exactExistingMatches(candidate).map((item) => item.id).sort(),
        semanticDisposition: 'no_obvious_duplicate',
        semanticReviewNote: '已对当前知识库进行人工语义复核，未发现足以阻止候选创建的明显同义节点。',
        possibleExistingIds: [],
      },
    },
  }
}

describe('AI reviewed new-knowledge structured proposal', () => {
  it('creates a knowledge-node candidate only after activation, human decision and regression', () => {
    const source = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'
    const decision = acceptedDecision('ai3-english-g5-read-write', source)
    const proposal = proposalFor('ai3-english-g5-read-write', source)
    const validation = validateAINewKnowledgeProposal(decision, proposal)
    expect(validation.accepted).toBe(true)
    expect(validation.candidateSnapshot?.proposed.entityRole).toBe('knowledge_node')
    const regression = runAINewKnowledgeSecondaryRegression(decision, proposal)
    expect(regression.accepted).toBe(true)
    expect(regression.candidateSnapshot?.readyForApprovalGate).toBe(true)
    expect(regression.candidateSnapshot?.autoApply).toBe(false)
    expect(regression.candidateSnapshot?.humanVerified).toBe(false)
  })

  it('forces curriculum task-group/domain candidates to remain framework anchors', () => {
    const source = 'https://www.moe.gov.cn/fbh/live/2022/54382/zjwz/202204/t20220421_620107.html'
    const decision = acceptedDecision('ai3-chinese-task-whole-book', source)
    const proposal = proposalFor('ai3-chinese-task-whole-book', source)
    proposal.proposed.entityRole = 'knowledge_node'
    const result = validateAINewKnowledgeProposal(decision, proposal)
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('NEW_KNOWLEDGE_ENTITY_ROLE_INVALID')
  })

  it('does not allow a human proposal to expand beyond the AI candidate grade scope', () => {
    const source = 'https://www.pep.com.cn/zslth/yyptzy/xypep/4x/'
    const decision = acceptedDecision('ai3-english-g4-integrated-rules-literacy', source)
    const proposal = proposalFor('ai3-english-g4-integrated-rules-literacy', source)
    proposal.proposed.gradeScope = [4, 5]
    const result = validateAINewKnowledgeProposal(decision, proposal)
    expect(result.errors).toContain('NEW_KNOWLEDGE_GRADE_SCOPE_INVALID')
  })

  it('requires explicit semantic duplicate review even when exact labels are clear', () => {
    const source = 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf'
    const decision = acceptedDecision('ai3-math-integrated-practice', source)
    const proposal = proposalFor('ai3-math-integrated-practice', source)
    proposal.proposed.duplicateAnalysis.semanticReviewNote = ''
    const result = validateAINewKnowledgeProposal(decision, proposal)
    expect(result.errors).toContain('NEW_KNOWLEDGE_SEMANTIC_REVIEW_REQUIRED')
  })

  it('keeps seed/raw immutable and sends a passed candidate only to the content approval gate', () => {
    const source = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'
    const decision = acceptedDecision('ai3-english-g5-phonics-spelling', source)
    const proposal = proposalFor('ai3-english-g5-phonics-spelling', source)
    const result = runAINewKnowledgeSecondaryRegression(decision, proposal)
    expect(result.checks.find((item) => item.id === 'seed_immutable')?.passed).toBe(true)
    expect(result.nextGate).toBe('curriculum_content_approval_gate')
  })
})
