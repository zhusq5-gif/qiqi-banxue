import { describe, expect, it } from 'vitest'
import { curriculumSeed } from './curriculum'
import { mathWave2AuditTasks } from './mathGradeAudit'
import {
  createUnsignedHumanReviewDecision,
  curriculumHumanReviewCases,
  curriculumHumanReviewSummary,
  humanReviewCaseById,
} from './humanReview'

describe('human curriculum review handoff', () => {
  it('creates exactly one human review case for every registered content issue and math wave-2 audit task', () => {
    expect(curriculumHumanReviewSummary.contentCaseCount).toBe(7)
    expect(curriculumHumanReviewSummary.mathCaseCount).toBe(mathWave2AuditTasks.length)
    expect(curriculumHumanReviewCases).toHaveLength(7 + mathWave2AuditTasks.length)
    expect(new Set(curriculumHumanReviewCases.map((item) => item.id)).size).toBe(curriculumHumanReviewCases.length)

    for (const issue of curriculumSeed.issues) {
      expect(humanReviewCaseById(`human-review:${issue.id}`), issue.id).not.toBeNull()
    }
    for (const task of mathWave2AuditTasks) {
      expect(humanReviewCaseById(`human-review:${task.id}`), task.id).not.toBeNull()
    }
  })

  it('requires every case to carry evidence links, a checklist, and no auto-apply path', () => {
    for (const reviewCase of curriculumHumanReviewCases) {
      expect(reviewCase.sourceRefs.length, reviewCase.id).toBeGreaterThan(0)
      expect(reviewCase.sourceRefs.every(Boolean), reviewCase.id).toBe(true)
      expect(reviewCase.checklist.length, reviewCase.id).toBeGreaterThanOrEqual(5)
      expect(reviewCase.allowedDecisions.length, reviewCase.id).toBeGreaterThan(0)
      expect(reviewCase.autoApply, reviewCase.id).toBe(false)
      expect(reviewCase.status, reviewCase.id).toBe('awaiting_human_review')
      expect(reviewCase.nextGate, reviewCase.id).toBe('review_decision_ingestion')
    }
    expect(curriculumHumanReviewSummary.humanVerifiedCount).toBe(0)
  })

  it('keeps F005 as a concept-boundary decision rather than auto-approving a rename', () => {
    const f005 = humanReviewCaseById('human-review:F005')!
    expect(f005.reviewType).toBe('concept_boundary')
    expect(f005.allowedDecisions).toEqual(['split_nodes', 'rename_and_reframe', 'retain_single_node', 'defer'])
    expect(f005.checklist.join(' ')).toContain('长话短说/概括')
    expect(f005.checklist.join(' ')).toContain('缩句')
    expect(f005.allowedDecisions).not.toContain('accept_candidate')
  })

  it('limits F006 and F007 human review to evidence-backed candidate decisions', () => {
    const f006 = humanReviewCaseById('human-review:F006')!
    const f007 = humanReviewCaseById('human-review:F007')!
    expect(f006.summary).toContain('recheck_pending')
    expect(f006.checklist.join(' ')).toContain('口算')
    expect(f007.summary).toContain('recheck_pending')
    expect(f007.checklist.join(' ')).toContain('回。答')
    expect(f007.checklist.join(' ')).toContain('回答')
  })

  it('keeps exe20 unmapped and forbids a direct raw-edge approval decision', () => {
    const exe20 = curriculumHumanReviewCases.find((item) => item.sourceTaskId.includes('math_4a_rjb_exe20'))!
    expect(exe20.reviewType).toBe('assessment_binding')
    expect(exe20.allowedDecisions).toContain('keep_unmapped')
    expect(exe20.allowedDecisions).toContain('needs_source_evidence')
    expect(exe20.allowedDecisions).toContain('propose_curated_mapping')
    expect(exe20.allowedDecisions).not.toContain('accept_candidate')
    expect(exe20.summary).toContain('保持明确未映射')
    expect(exe20.sourceRefs).toContain('math.json L65769-L66025')
  })

  it('never turns math relation or occurrence review into synthetic prerequisite/progression automatically', () => {
    const relationCases = curriculumHumanReviewCases.filter((item) => item.reviewType === 'cross_grade_relation')
    const reuseCases = curriculumHumanReviewCases.filter((item) => item.reviewType === 'occurrence_reuse')
    expect(relationCases.length).toBeGreaterThan(0)
    expect(reuseCases.length).toBeGreaterThan(0)
    expect(relationCases.every((item) => item.allowedDecisions.includes('keep_raw_relation_only'))).toBe(true)
    expect(relationCases.every((item) => item.checklist.join(' ').includes('不得自动改成 prerequisite'))).toBe(true)
    expect(reuseCases.every((item) => item.allowedDecisions.includes('keep_same_identity'))).toBe(true)
  })

  it('exports only unsigned decisions and validates reviewer/evidence fields', () => {
    const decision = createUnsignedHumanReviewDecision(
      'human-review:F006',
      'accept_candidate',
      '已对照四年级下册来源，确认“口算”为不适用于英语条目的题型污染，只同意删除该标签。',
      { name: '示例审核人', role: '小学英语教研' },
      ['output/english/outlines/义务教育教科书·英语（三年级起点）四年级下册.json#/units/3/knowledge_points/2'],
      '2026-09-09T10:00:00+08:00',
    )
    expect(decision.status).toBe('unsigned_human_review')
    expect(decision.humanVerified).toBe(false)
    expect(decision.autoApply).toBe(false)
    expect(decision.nextGate).toBe('review_decision_ingestion')
    expect(() => createUnsignedHumanReviewDecision('human-review:F006', 'split_nodes', 'x', { name: 'a', role: 'b' }, ['evidence'])).toThrow()
    expect(() => createUnsignedHumanReviewDecision('human-review:F006', 'accept_candidate', '', { name: 'a', role: 'b' }, ['evidence'])).toThrow()
  })
})
