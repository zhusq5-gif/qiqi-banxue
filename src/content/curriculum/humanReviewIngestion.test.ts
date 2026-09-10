import { describe, expect, it } from 'vitest'
import { createUnsignedHumanReviewDecision, curriculumHumanReviewCases } from './humanReview'
import { ingestHumanReviewDecision } from './humanReviewIngestion'

function decisionFor(caseId: string, decision: Parameters<typeof createUnsignedHumanReviewDecision>[1]) {
  const reviewCase = curriculumHumanReviewCases.find((item) => item.id === caseId)
  if (!reviewCase) throw new Error(`missing test case ${caseId}`)
  return createUnsignedHumanReviewDecision(
    caseId,
    decision,
    '已逐项查看当前 case 的原始证据，并按允许决定给出意见。',
    { name: '测试审核人', role: '小学学科教研' },
    [reviewCase.sourceRefs[0]],
    '2026-09-09T11:00:00+08:00',
  )
}

describe('human review decision ingestion', () => {
  it('ingests F006 accept_candidate and reruns the candidate recheck', () => {
    const result = ingestHumanReviewDecision(decisionFor('human-review:F006', 'accept_candidate'))
    expect(result.accepted).toBe(true)
    expect(result.status).toBe('accepted_for_secondary_regression')
    expect(result.secondaryRegression.status).toBe('passed')
    expect(result.secondaryRegression.checks.candidateRepairRecheckPassed).toBe(true)
    expect(result.candidateSnapshot?.contentPatch?.issueId).toBe('F006')
    expect(result.candidateSnapshot?.contentPatch?.proposedQuestionTypes).not.toContain('口算')
    expect(result.candidateSnapshot?.autoApply).toBe(false)
    expect(result.candidateSnapshot?.formalApprovalEligible).toBe(false)
    expect(result.nextGate).toBe('current_case_reconfirmation')
  })

  it('rejects decisions that do not cite any current case source reference', () => {
    const input = decisionFor('human-review:F007', 'accept_candidate')
    input.evidenceRefs = ['some-other-source']
    const result = ingestHumanReviewDecision(input)
    expect(result.accepted).toBe(false)
    expect(result.errors.map((item) => item.code)).toContain('CURRENT_CASE_EVIDENCE_NOT_REFERENCED')
    expect(result.candidateSnapshot).toBeNull()
  })

  it('requires a structured proposal for F005 split_nodes', () => {
    const result = ingestHumanReviewDecision(decisionFor('human-review:F005', 'split_nodes'))
    expect(result.accepted).toBe(true)
    expect(result.status).toBe('accepted_followup_required')
    expect(result.nextGate).toBe('structured_proposal_required')
    expect(result.candidateSnapshot).toBeNull()
  })

  it('keeps exe20 explicitly unmapped without synthesizing a raw tests edge', () => {
    const reviewCase = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))
    expect(reviewCase).toBeTruthy()
    const result = ingestHumanReviewDecision(decisionFor(reviewCase!.id, 'keep_unmapped'))
    expect(result.accepted).toBe(true)
    expect(result.candidateSnapshot?.reviewType).toBe('assessment_binding')
    expect(result.candidateSnapshot?.disposition).toBe('keep_unmapped')
    expect(result.candidateSnapshot?.contentPatch).toBeUndefined()
  })

  it('requires structured relation data before a curriculum relation proposal can continue', () => {
    const relationCase = curriculumHumanReviewCases.find((item) => item.reviewType === 'cross_grade_relation')
    expect(relationCase).toBeTruthy()
    const result = ingestHumanReviewDecision(decisionFor(relationCase!.id, 'propose_curriculum_relation'))
    expect(result.accepted).toBe(true)
    expect(result.status).toBe('accepted_followup_required')
    expect(result.nextGate).toBe('structured_proposal_required')
    expect(result.candidateSnapshot).toBeNull()
  })
})
