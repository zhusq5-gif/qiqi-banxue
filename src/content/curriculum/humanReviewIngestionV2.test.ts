import { describe, expect, it } from 'vitest'
import { curriculumHumanReviewCases } from './humanReview'
import { createHumanReviewDecisionV2 } from './humanReviewDecisionV2'
import { ingestHumanReviewDecisionV2 } from './humanReviewIngestionV2'

function decisionFor(caseId: string, decision: Parameters<typeof createHumanReviewDecisionV2>[1]) {
  const reviewCase = curriculumHumanReviewCases.find((item) => item.id === caseId)
  if (!reviewCase) throw new Error(`missing test case ${caseId}`)
  return createHumanReviewDecisionV2(
    caseId,
    decision,
    '已对照当前 case 的来源与核对清单完成审核。',
    { name: '测试审核人', role: '小学学科教研' },
    [reviewCase.sourceRefs[0]],
    '2026-09-09T11:30:00+08:00',
  )
}

describe('case-bound human review ingestion v2', () => {
  it('allows F006 candidate to reach the content approval gate only when current case state matches', () => {
    const result = ingestHumanReviewDecisionV2(decisionFor('human-review:F006', 'accept_candidate'))
    expect(result.accepted).toBe(true)
    expect(result.caseStateMatches).toBe(true)
    expect(result.readyForApprovalGate).toBe(true)
    expect(result.nextGate).toBe('content_approval_gate')
    expect(result.candidateSnapshot?.schema).toBe('qiqi-curriculum-human-review-candidate-snapshot/v2')
    expect(result.candidateSnapshot?.formalApprovalEligible).toBe(true)
    expect(result.candidateSnapshot?.humanVerified).toBe(false)
  })

  it('rejects an old decision when the captured case state no longer matches the current case', () => {
    const input = decisionFor('human-review:F006', 'accept_candidate')
    input.caseState = { ...input.caseState, title: `${input.caseState.title}（旧版本）` }
    const result = ingestHumanReviewDecisionV2(input)
    expect(result.accepted).toBe(false)
    expect(result.caseStateMatches).toBe(false)
    expect(result.errors).toContain('CURRENT_CASE_STATE_MISMATCH')
    expect(result.nextGate).toBe('current_case_reconfirmation')
  })

  it('keeps F005 split_nodes in structured proposal workflow even with matching case state', () => {
    const result = ingestHumanReviewDecisionV2(decisionFor('human-review:F005', 'split_nodes'))
    expect(result.accepted).toBe(true)
    expect(result.caseStateMatches).toBe(true)
    expect(result.readyForApprovalGate).toBe(false)
    expect(result.nextGate).toBe('structured_proposal_required')
    expect(result.candidateSnapshot).toBeNull()
  })

  it('can carry a keep_unmapped assessment decision forward without creating a content patch', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))
    expect(reviewCase).toBeTruthy()
    const result = ingestHumanReviewDecisionV2(decisionFor(reviewCase!.id, 'keep_unmapped'))
    expect(result.readyForApprovalGate).toBe(true)
    expect(result.candidateSnapshot?.disposition).toBe('keep_unmapped')
    expect(result.candidateSnapshot?.contentPatch).toBeUndefined()
  })
})
