import { entryById } from './curriculum'
import { repairProposalForIssue } from './curriculumRepairProposals'

export type RepairField = 'label' | 'learningDemand' | 'questionTypes'
export type RepairRecheckStatus = 'recheck_pending' | 'manual_review_required' | 'no_change'

export interface RepairDraftInput {
  proposedLabel: string
  proposedLearningDemand: string
  proposedQuestionTypes: string[]
}

export interface RepairRecheckBundle {
  schema: 'qiqi-curriculum-repair-recheck/v1'
  issueId: string
  nodeId: string
  status: RepairRecheckStatus
  autoApply: false
  original: RepairDraftInput
  proposed: RepairDraftInput
  changedFields: RepairField[]
  allowedCandidateFields: RepairField[]
  unexpectedChangedFields: RepairField[]
  candidateMatch: boolean
  checks: {
    sourceEndpointExists: boolean
    changeIsNonEmpty: boolean
    candidateScopeRespected: boolean
    seedMutationPerformed: false
  }
  nextGate: 'human_subject_review'
}

const allowedFieldsByIssue: Record<string, RepairField[]> = {
  F001: ['questionTypes'],
  F002: ['label'],
  F003: ['label'],
  F004: ['label'],
  F005: [],
  F006: ['questionTypes'],
  F007: ['learningDemand'],
}

function sameArray(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function sameDraft(a: RepairDraftInput, b: RepairDraftInput) {
  return a.proposedLabel === b.proposedLabel
    && a.proposedLearningDemand === b.proposedLearningDemand
    && sameArray(a.proposedQuestionTypes, b.proposedQuestionTypes)
}

export function createRepairRecheckBundle(issueId: string, draft: RepairDraftInput): RepairRecheckBundle {
  const proposal = repairProposalForIssue(issueId)
  if (!proposal) throw new Error(`Repair proposal not found for ${issueId}`)
  const entry = entryById(proposal.nodeId)
  if (!entry) throw new Error(`Repair entry not found for ${issueId}`)

  const original: RepairDraftInput = {
    proposedLabel: entry.label,
    proposedLearningDemand: entry.learningDemand,
    proposedQuestionTypes: entry.questionTypes.slice(),
  }
  const candidate: RepairDraftInput = {
    proposedLabel: proposal.proposedLabel,
    proposedLearningDemand: proposal.proposedLearningDemand,
    proposedQuestionTypes: proposal.proposedQuestionTypes.slice(),
  }
  const changedFields: RepairField[] = []
  if (draft.proposedLabel !== original.proposedLabel) changedFields.push('label')
  if (draft.proposedLearningDemand !== original.proposedLearningDemand) changedFields.push('learningDemand')
  if (!sameArray(draft.proposedQuestionTypes, original.proposedQuestionTypes)) changedFields.push('questionTypes')

  const allowedCandidateFields = allowedFieldsByIssue[issueId] ?? []
  const unexpectedChangedFields = changedFields.filter((field) => !allowedCandidateFields.includes(field))
  const candidateMatch = sameDraft(draft, candidate)
  const status: RepairRecheckStatus = changedFields.length === 0
    ? 'no_change'
    : candidateMatch && unexpectedChangedFields.length === 0
      ? 'recheck_pending'
      : 'manual_review_required'

  return {
    schema: 'qiqi-curriculum-repair-recheck/v1',
    issueId,
    nodeId: entry.id,
    status,
    autoApply: false,
    original,
    proposed: {
      proposedLabel: draft.proposedLabel,
      proposedLearningDemand: draft.proposedLearningDemand,
      proposedQuestionTypes: draft.proposedQuestionTypes.slice(),
    },
    changedFields,
    allowedCandidateFields,
    unexpectedChangedFields,
    candidateMatch,
    checks: {
      sourceEndpointExists: true,
      changeIsNonEmpty: changedFields.length > 0,
      candidateScopeRespected: unexpectedChangedFields.length === 0,
      seedMutationPerformed: false,
    },
    nextGate: 'human_subject_review',
  }
}

export function createCandidateRepairRecheckBundle(issueId: string) {
  const proposal = repairProposalForIssue(issueId)
  if (!proposal) throw new Error(`Repair proposal not found for ${issueId}`)
  return createRepairRecheckBundle(issueId, {
    proposedLabel: proposal.proposedLabel,
    proposedLearningDemand: proposal.proposedLearningDemand,
    proposedQuestionTypes: proposal.proposedQuestionTypes,
  })
}
