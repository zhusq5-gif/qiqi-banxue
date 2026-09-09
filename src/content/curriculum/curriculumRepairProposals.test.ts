import { describe, expect, it } from 'vitest'
import { curriculumSeed, entryById } from './curriculum'
import { curriculumRepairProposals, repairProposalForIssue } from './curriculumRepairProposals'

describe('curriculum repair proposals', () => {
  it('creates one review-only candidate patch for every registered issue', () => {
    expect(curriculumRepairProposals).toHaveLength(7)
    expect(new Set(curriculumRepairProposals.map((item) => item.issueId))).toEqual(new Set(curriculumSeed.issues.map((item) => item.id)))
    expect(curriculumRepairProposals.every((item) => item.status === 'candidate_patch' && item.autoApply === false)).toBe(true)
  })

  it('removes only the known 口算 contamination from F001 and F006 candidates', () => {
    for (const issueId of ['F001', 'F006']) {
      const proposal = repairProposalForIssue(issueId)
      const original = proposal ? entryById(proposal.nodeId) : null
      expect(original?.questionTypes).toContain('口算')
      expect(proposal?.proposedQuestionTypes).not.toContain('口算')
      expect(proposal?.proposedQuestionTypes.every((item) => original?.questionTypes.includes(item))).toBe(true)
    }
  })

  it('offers explicit label candidates for F002-F004 without mutating source entries', () => {
    expect(repairProposalForIssue('F002')?.proposedLabel).toBe('AABB式词语积累')
    expect(repairProposalForIssue('F003')?.proposedLabel).toBe('动物相关四字成语归类')
    expect(repairProposalForIssue('F004')?.proposedLabel).toBe('ABAB式与AABB式重叠词的语态描写')

    for (const issueId of ['F002', 'F003', 'F004']) {
      const proposal = repairProposalForIssue(issueId)!
      expect(entryById(proposal.nodeId)?.label).not.toBe(proposal.proposedLabel)
    }
  })

  it('does not auto-rewrite the ambiguous F005 concept boundary', () => {
    const proposal = repairProposalForIssue('F005')!
    const original = entryById(proposal.nodeId)!
    expect(proposal.proposedLabel).toBe(original.label)
    expect(proposal.proposedLearningDemand).toBe(original.learningDemand)
    expect(proposal.rationale).toContain('不自动')
  })

  it('limits F007 candidate change to the known punctuation corruption', () => {
    const proposal = repairProposalForIssue('F007')!
    const original = entryById(proposal.nodeId)!
    expect(original.learningDemand).toContain('回。答')
    expect(proposal.proposedLearningDemand).toBe(original.learningDemand.split('回。答').join('回答'))
    expect(proposal.proposedLearningDemand).not.toContain('回。答')
  })
})
