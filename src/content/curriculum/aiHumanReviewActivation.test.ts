import { describe, expect, it } from 'vitest'
import { createAIDiscoveryDecisionAll } from './aiDiscoveryRegistry'
import { createAIDiscoveryHumanReviewCaseDraft } from './aiDiscoveryPromotion'
import {
  activateAIDiscoveryHumanReviewCaseDraft,
  aiHumanReviewDecisionStillCurrent,
  createAIHumanReviewDecisionV2,
} from './aiHumanReviewActivation'

function draftFor(candidateId: string, sourceRef: string) {
  const decision = createAIDiscoveryDecisionAll(
    candidateId,
    'promote_to_human_review',
    '初筛教师',
    '小学学科教师',
    '已打开来源，建议进入精审确认知识颗粒度。',
    [sourceRef],
    '2026-09-09T15:20:00+08:00',
  )
  return createAIDiscoveryHumanReviewCaseDraft(decision)
}

describe('AI human-review case activation', () => {
  it('activates a current draft only after rechecking candidate state and evidence', () => {
    const source = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'
    const draft = draftFor('ai3-english-g5-read-write', source)
    const result = activateAIDiscoveryHumanReviewCaseDraft(
      draft,
      { name: '精审教师', role: '小学英语教研' },
      [source],
      '2026-09-09T15:21:00+08:00',
    )
    expect(result.accepted).toBe(true)
    expect(result.currentCandidateStateMatches).toBe(true)
    expect(result.activatedCase?.status).toBe('awaiting_human_review')
    expect(result.activatedCase?.autoApply).toBe(false)
    expect(result.activatedCase?.humanVerified).toBe(false)
  })

  it('rejects a stale draft when candidate state differs from the current registry', () => {
    const source = 'https://www.moe.gov.cn/fbh/live/2022/54382/zjwz/202204/t20220421_620107.html'
    const draft = draftFor('ai3-chinese-task-whole-book', source)
    const stale = {
      ...draft,
      candidateState: { ...draft.candidateState, label: `${draft.candidateState.label}（旧版本）` },
    }
    const result = activateAIDiscoveryHumanReviewCaseDraft(stale, { name: '教师', role: '语文教研' }, [source])
    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('CURRENT_AI_CANDIDATE_STATE_MISMATCH')
    expect(result.activatedCase).toBeNull()
  })

  it('creates decision v2 bound to the activated case and keeps it unsigned', () => {
    const source = 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf'
    const draft = draftFor('ai3-math-integrated-practice', source)
    const activated = activateAIDiscoveryHumanReviewCaseDraft(draft, { name: '教师A', role: '小学数学教研' }, [source]).activatedCase!
    const decision = createAIHumanReviewDecisionV2(
      activated,
      'accept_candidate',
      '确认它适合作为课程领域锚点，但仍需后续结构化候选与正式审批。',
      { name: '教师B', role: '小学数学教研' },
      [source],
      '2026-09-09T15:22:00+08:00',
    )
    expect(decision.status).toBe('unsigned_human_review')
    expect(decision.humanVerified).toBe(false)
    expect(decision.autoApply).toBe(false)
    expect(aiHumanReviewDecisionStillCurrent(decision)).toBe(true)
  })
})
