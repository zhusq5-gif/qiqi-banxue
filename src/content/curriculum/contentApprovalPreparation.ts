import contentCandidateStore from '../../../approvals/curriculum-content-candidates.json'
import contentApprovalStore from '../../../approvals/curriculum-content-approvals.json'
import contentReviewerRegistry from '../../../config/curriculum-content-reviewers.json'
import type { CurriculumSubject } from './curriculum'

export type ApprovalReadySnapshot = Record<string, unknown> & {
  schema: 'qiqi-curriculum-structured-candidate-snapshot/v2' | 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2'
  readyForApprovalGate: true
  autoApply: false
  humanVerified: false
}

export interface ContentRegistrationRequest {
  schema: 'qiqi-curriculum-content-registration-request/v1'
  candidateId: string
  subject: CurriculumSubject
  snapshot: ApprovalReadySnapshot
  evidenceRefs: string[]
  currentVersion: {
    datasetVersion: string
    sourceCommit: string
  }
  preparedAt: string
  preparedBy: string
  status: 'browser_preparation_only'
  requiresRepositoryRegistration: true
  autoApply: false
  humanVerified: false
  nextStep: 'register_curriculum_content_candidate'
}

export interface ContentRegistrationInput {
  candidateId: string
  subject: CurriculumSubject
  snapshot: unknown
  evidenceRefs: string[]
  datasetVersion: string
  sourceCommit: string
  preparedBy: string
  preparedAt?: string
}

const acceptedSnapshotSchemas = new Set([
  'qiqi-curriculum-structured-candidate-snapshot/v2',
  'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2',
])

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

export function validateApprovalReadySnapshot(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['SNAPSHOT_OBJECT_REQUIRED']
  const value = snapshot as Record<string, unknown>
  const errors: string[] = []
  if (!acceptedSnapshotSchemas.has(String(value.schema ?? ''))) errors.push('SNAPSHOT_SCHEMA_UNSUPPORTED')
  if (value.readyForApprovalGate !== true) errors.push('SNAPSHOT_NOT_READY_FOR_APPROVAL_GATE')
  if (value.autoApply !== false) errors.push('SNAPSHOT_AUTO_APPLY_MUST_BE_FALSE')
  if (value.humanVerified !== false) errors.push('SNAPSHOT_HUMAN_VERIFIED_MUST_BE_FALSE')
  return errors
}

export function prepareContentRegistrationRequest(input: ContentRegistrationInput): ContentRegistrationRequest {
  const snapshotErrors = validateApprovalReadySnapshot(input.snapshot)
  if (snapshotErrors.length) throw new Error(snapshotErrors.join(' · '))
  if (!/^[A-Za-z0-9._:-]+$/.test(input.candidateId.trim())) throw new Error('CANDIDATE_ID_INVALID')
  if (!['chinese', 'english', 'math'].includes(input.subject)) throw new Error('SUBJECT_INVALID')
  if (!input.evidenceRefs.length || input.evidenceRefs.some((item) => !nonEmpty(item))) throw new Error('EVIDENCE_REFS_REQUIRED')
  if (!nonEmpty(input.datasetVersion)) throw new Error('DATASET_VERSION_REQUIRED')
  if (!nonEmpty(input.sourceCommit)) throw new Error('SOURCE_COMMIT_REQUIRED')
  if (!nonEmpty(input.preparedBy)) throw new Error('PREPARED_BY_REQUIRED')

  return {
    schema: 'qiqi-curriculum-content-registration-request/v1',
    candidateId: input.candidateId.trim(),
    subject: input.subject,
    snapshot: input.snapshot as ApprovalReadySnapshot,
    evidenceRefs: input.evidenceRefs.map((item) => item.trim()),
    currentVersion: {
      datasetVersion: input.datasetVersion.trim(),
      sourceCommit: input.sourceCommit.trim(),
    },
    preparedAt: input.preparedAt ?? new Date().toISOString(),
    preparedBy: input.preparedBy.trim(),
    status: 'browser_preparation_only',
    requiresRepositoryRegistration: true,
    autoApply: false,
    humanVerified: false,
    nextStep: 'register_curriculum_content_candidate',
  }
}

const reviewers = (contentReviewerRegistry as { reviewers?: Record<string, { roles?: string[] }> }).reviewers ?? {}
const registeredContentReviewers = Object.values(reviewers).filter((reviewer) => reviewer.roles?.includes('content_reviewer')).length
const registeredCandidates = ((contentCandidateStore as { candidates?: unknown[] }).candidates ?? []).length
const approvalRecords = ((contentApprovalStore as { approvals?: unknown[] }).approvals ?? []).length

export const contentApprovalRepositoryStatus = {
  schema: 'qiqi-curriculum-content-approval-ui-status/v1',
  registeredCandidates,
  registeredContentReviewers,
  approvalRecords,
  blockers: [
    ...(registeredCandidates === 0 ? ['NO_REGISTERED_CONTENT_CANDIDATE'] : []),
    ...(registeredContentReviewers === 0 ? ['NO_TRUSTED_CONTENT_REVIEWER'] : []),
    ...(registeredCandidates > 0 && approvalRecords === 0 ? ['NO_SIGNED_CONTENT_APPROVAL'] : []),
  ],
  note: 'UI status is an informational mirror of committed registry/store counts. The authoritative decision is scripts/curriculum-content-gate.mjs in CI.',
}
