import { describe, expect, it } from 'vitest'
import { createAIDiscoveryDecisionAll } from './aiDiscoveryRegistry'
import {
  createAIDiscoveryHumanReviewCaseDraft,
  mergeAIDiscoveryHumanReviewCaseDrafts,
} from './aiDiscoveryPromotion'

describe('AI discovery promotion to human-review case draft', () => {
  it('creates a case draft bound to the current candidate state and evidence', () => {
    const decision = createAIDiscoveryDecisionAll(
      'ai3-english-g5-read-write',
      'promote_to_human_review',
      '真实审核人',
      '小学英语教师',
      '已打开人教社当前五年级上册资源，确认Read and write活动存在，建议进入精审确认具体阅读和写作要求。',
      ['https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'],
      '2026-09-09T15:10:00+08:00',
    )
    const draft = createAIDiscoveryHumanReviewCaseDraft(decision)
    expect(draft.id).toBe('human-review-ai:ai3-english-g5-read-write')
    expect(draft.candidateState.label).toContain('短文阅读')
    expect(draft.sourceRefs).toContain('https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/')
    expect(draft.autoApply).toBe(false)
    expect(draft.humanVerified).toBe(false)
    expect(draft.nextGate).toBe('human_review_case_activation')
  })

  it('rejects non-promotion decisions', () => {
    const decision = createAIDiscoveryDecisionAll(
      'ai3-math-integrated-practice',
      'defer',
      '审核人',
      '小学数学教研',
      '当前先暂缓。',
      ['https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf'],
      '2026-09-09T15:11:00+08:00',
    )
    expect(() => createAIDiscoveryHumanReviewCaseDraft(decision)).toThrow(/Only promote_to_human_review/)
  })

  it('upserts the same candidate draft instead of duplicating the queue', () => {
    const first = createAIDiscoveryHumanReviewCaseDraft(createAIDiscoveryDecisionAll(
      'ai3-chinese-task-whole-book',
      'promote_to_human_review',
      '审核人A',
      '小学语文教师',
      '已核对官方任务群来源。',
      ['https://www.moe.gov.cn/fbh/live/2022/54382/zjwz/202204/t20220421_620107.html'],
      '2026-09-09T15:12:00+08:00',
    ))
    const second = { ...first, promotedAt: '2026-09-09T15:13:00+08:00' }
    const merged = mergeAIDiscoveryHumanReviewCaseDrafts([first], second)
    expect(merged).toHaveLength(1)
    expect(merged[0].promotedAt).toBe('2026-09-09T15:13:00+08:00')
  })
})
