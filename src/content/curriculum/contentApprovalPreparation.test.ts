import { describe, expect, it } from 'vitest'
import {
  contentApprovalRepositoryStatus,
  prepareContentRegistrationRequest,
  validateApprovalReadySnapshot,
} from './contentApprovalPreparation'

const snapshot = {
  schema: 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2' as const,
  caseId: 'human-review-ai:synthetic',
  proposed: { subject: 'math', canonicalLabel: '测试候选' },
  readyForApprovalGate: true as const,
  autoApply: false as const,
  humanVerified: false as const,
}

describe('content approval preparation', () => {
  it('accepts only approval-ready safe candidate snapshots', () => {
    expect(validateApprovalReadySnapshot(snapshot)).toEqual([])
    expect(validateApprovalReadySnapshot({ ...snapshot, readyForApprovalGate: false })).toContain('SNAPSHOT_NOT_READY_FOR_APPROVAL_GATE')
    expect(validateApprovalReadySnapshot({ ...snapshot, autoApply: true })).toContain('SNAPSHOT_AUTO_APPLY_MUST_BE_FALSE')
    expect(validateApprovalReadySnapshot({ ...snapshot, humanVerified: true })).toContain('SNAPSHOT_HUMAN_VERIFIED_MUST_BE_FALSE')
  })

  it('creates a browser-only registration request without claiming formal registration or human verification', () => {
    const request = prepareContentRegistrationRequest({
      candidateId: 'candidate:math:test',
      subject: 'math',
      snapshot,
      evidenceRefs: ['source://one'],
      datasetVersion: '0.3-research',
      sourceCommit: 'abc123',
      preparedBy: '项目维护者',
      preparedAt: '2026-09-09T08:00:00Z',
    })
    expect(request.schema).toBe('qiqi-curriculum-content-registration-request/v1')
    expect(request.status).toBe('browser_preparation_only')
    expect(request.requiresRepositoryRegistration).toBe(true)
    expect(request.autoApply).toBe(false)
    expect(request.humanVerified).toBe(false)
    expect(request.nextStep).toBe('register_curriculum_content_candidate')
  })

  it('requires evidence, dataset version, source commit and preparer identity', () => {
    expect(() => prepareContentRegistrationRequest({ candidateId: 'c', subject: 'math', snapshot, evidenceRefs: [], datasetVersion: 'v', sourceCommit: 'sha', preparedBy: 'p' })).toThrow('EVIDENCE_REFS_REQUIRED')
    expect(() => prepareContentRegistrationRequest({ candidateId: 'c', subject: 'math', snapshot, evidenceRefs: ['x'], datasetVersion: '', sourceCommit: 'sha', preparedBy: 'p' })).toThrow('DATASET_VERSION_REQUIRED')
    expect(() => prepareContentRegistrationRequest({ candidateId: 'c', subject: 'math', snapshot, evidenceRefs: ['x'], datasetVersion: 'v', sourceCommit: '', preparedBy: 'p' })).toThrow('SOURCE_COMMIT_REQUIRED')
  })

  it('mirrors the deliberately blocked committed content-approval state', () => {
    expect(contentApprovalRepositoryStatus.registeredCandidates).toBe(0)
    expect(contentApprovalRepositoryStatus.registeredContentReviewers).toBe(0)
    expect(contentApprovalRepositoryStatus.approvalRecords).toBe(0)
    expect(contentApprovalRepositoryStatus.blockers).toContain('NO_REGISTERED_CONTENT_CANDIDATE')
    expect(contentApprovalRepositoryStatus.blockers).toContain('NO_TRUSTED_CONTENT_REVIEWER')
  })
})
