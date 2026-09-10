import { describe, expect, it } from 'vitest'
import { entryById } from './curriculum'
import { repairProposalForIssue } from './curriculumRepairProposals'
import { createCandidateRepairRecheckBundle, createRepairRecheckBundle } from './curriculumRepairRecheck'

describe('curriculum repair recheck bundles', () => {
  it('moves bounded candidate patches into recheck_pending without mutating seed', () => {
    for (const issueId of ['F001', 'F002', 'F003', 'F004', 'F006', 'F007']) {
      const proposal = repairProposalForIssue(issueId)!
      const before = JSON.stringify(entryById(proposal.nodeId))
      const bundle = createCandidateRepairRecheckBundle(issueId)
      const after = JSON.stringify(entryById(proposal.nodeId))
      expect(bundle.status, issueId).toBe('recheck_pending')
      expect(bundle.autoApply).toBe(false)
      expect(bundle.checks.seedMutationPerformed).toBe(false)
      expect(bundle.candidateMatch).toBe(true)
      expect(bundle.unexpectedChangedFields).toHaveLength(0)
      expect(after).toBe(before)
      expect(bundle.nextGate).toBe('human_subject_review')
    }
  })

  it('limits each known candidate to the intended field scope', () => {
    expect(createCandidateRepairRecheckBundle('F001').changedFields).toEqual(['questionTypes'])
    expect(createCandidateRepairRecheckBundle('F002').changedFields).toEqual(['label'])
    expect(createCandidateRepairRecheckBundle('F003').changedFields).toEqual(['label'])
    expect(createCandidateRepairRecheckBundle('F004').changedFields).toEqual(['label'])
    expect(createCandidateRepairRecheckBundle('F006').changedFields).toEqual(['questionTypes'])
    expect(createCandidateRepairRecheckBundle('F007').changedFields).toEqual(['learningDemand'])
  })

  it('does not claim an ambiguous no-op F005 is ready for recheck', () => {
    const bundle = createCandidateRepairRecheckBundle('F005')
    expect(bundle.status).toBe('no_change')
    expect(bundle.changedFields).toHaveLength(0)
    expect(bundle.nextGate).toBe('human_subject_review')
  })

  it('escalates a draft that changes fields outside the candidate patch scope', () => {
    const proposal = repairProposalForIssue('F001')!
    const bundle = createRepairRecheckBundle('F001', {
      proposedLabel: `${proposal.proposedLabel}（人工改名）`,
      proposedLearningDemand: proposal.proposedLearningDemand,
      proposedQuestionTypes: proposal.proposedQuestionTypes,
    })
    expect(bundle.status).toBe('manual_review_required')
    expect(bundle.unexpectedChangedFields).toEqual(['label'])
    expect(bundle.candidateMatch).toBe(false)
  })

  it('keeps a no-change draft from bypassing repair lifecycle', () => {
    const proposal = repairProposalForIssue('F002')!
    const original = entryById(proposal.nodeId)!
    const bundle = createRepairRecheckBundle('F002', {
      proposedLabel: original.label,
      proposedLearningDemand: original.learningDemand,
      proposedQuestionTypes: original.questionTypes,
    })
    expect(bundle.status).toBe('no_change')
    expect(bundle.checks.changeIsNonEmpty).toBe(false)
  })
})
