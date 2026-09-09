import fs from 'node:fs'
import crypto from 'node:crypto'

const cliArgs = process.argv.slice(2)
const args = new Set(cliArgs)

function argValue(prefix) {
  const raw = cliArgs.find((item) => item.startsWith(`${prefix}=`))
  return raw ? raw.slice(prefix.length + 1) : null
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function candidateDigest(candidate) {
  return sha256Hex(canonical(candidate))
}

function verifySignature(approval, reviewer) {
  try {
    const key = crypto.createPublicKey(reviewer.publicKeyPem)
    return crypto.verify(null, Buffer.from(canonical(approval.payload)), key, Buffer.from(approval.signatureBase64, 'base64'))
  } catch {
    return false
  }
}

function candidateSubject(candidate) {
  return candidate?.snapshot?.proposed?.subject ?? candidate?.subject ?? null
}

function validateCandidate(candidate) {
  const errors = []
  if (candidate?.schema !== 'qiqi-curriculum-content-candidate/v1') errors.push('CANDIDATE_SCHEMA')
  if (!candidate?.id || typeof candidate.id !== 'string') errors.push('CANDIDATE_ID_REQUIRED')
  if (!candidate?.snapshot || typeof candidate.snapshot !== 'object') errors.push('CANDIDATE_SNAPSHOT_REQUIRED')
  if (candidate?.snapshot?.readyForApprovalGate !== true) errors.push('CANDIDATE_NOT_READY_FOR_APPROVAL_GATE')
  if (candidate?.snapshot?.autoApply !== false || candidate?.snapshot?.humanVerified !== false) errors.push('UNSAFE_CANDIDATE_SNAPSHOT_FLAGS')
  if (!Array.isArray(candidate?.evidenceRefs) || candidate.evidenceRefs.length === 0 || candidate.evidenceRefs.some((item) => typeof item !== 'string' || !item.trim())) errors.push('CANDIDATE_EVIDENCE_REQUIRED')
  if (!candidate?.currentVersion || typeof candidate.currentVersion.datasetVersion !== 'string' || !candidate.currentVersion.datasetVersion.trim()) errors.push('CANDIDATE_DATASET_VERSION_REQUIRED')
  if (!candidate?.currentVersion || typeof candidate.currentVersion.sourceCommit !== 'string' || !candidate.currentVersion.sourceCommit.trim()) errors.push('CANDIDATE_SOURCE_COMMIT_REQUIRED')
  if (!candidateSubject(candidate)) errors.push('CANDIDATE_SUBJECT_REQUIRED')
  return errors
}

function selfTest() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const candidate = {
    schema: 'qiqi-curriculum-content-candidate/v1',
    id: 'synthetic-candidate',
    snapshot: {
      schema: 'synthetic-snapshot',
      proposed: { subject: 'math', canonicalLabel: 'synthetic' },
      readyForApprovalGate: true,
      autoApply: false,
      humanVerified: false,
    },
    evidenceRefs: ['synthetic://evidence'],
    currentVersion: { datasetVersion: 'synthetic', sourceCommit: 'synthetic-commit' },
    registeredAt: '2026-09-09T00:00:00Z',
  }
  const payload = {
    candidateId: candidate.id,
    candidateContentSha256: candidateDigest(candidate),
    decision: 'approve',
    reviewerId: 'synthetic-reviewer',
    role: 'content_reviewer',
    reviewedAt: '2026-09-09T00:00:00Z',
  }
  const signature = crypto.sign(null, Buffer.from(canonical(payload)), privateKey)
  const verified = crypto.verify(null, Buffer.from(canonical(payload)), publicKey, signature)
  const tamperedPayloadRejected = !crypto.verify(null, Buffer.from(canonical({ ...payload, decision: 'reject' })), publicKey, signature)
  const changedCandidateInvalidatesDigest = candidateDigest({ ...candidate, evidenceRefs: ['synthetic://changed'] }) !== payload.candidateContentSha256
  const report = {
    selfTest: true,
    signatureVerified: verified,
    tamperRejected: tamperedPayloadRejected,
    changedCandidateInvalidatesApproval: changedCandidateInvalidatesDigest,
  }
  console.log(JSON.stringify(report, null, 2))
  process.exit(verified && tamperedPayloadRejected && changedCandidateInvalidatesDigest ? 0 : 2)
}

if (args.has('--self-test')) selfTest()

const registry = readJson('config/curriculum-content-reviewers.json')
const candidateStore = readJson('approvals/curriculum-content-candidates.json')
const approvalStore = readJson('approvals/curriculum-content-approvals.json')

const candidates = new Map()
const errors = []

for (const candidate of candidateStore.candidates ?? []) {
  const candidateErrors = validateCandidate(candidate)
  if (candidateErrors.length) {
    errors.push(...candidateErrors.map((code) => ({ code, candidateId: candidate?.id ?? null })))
    continue
  }
  if (candidates.has(candidate.id)) {
    errors.push({ code: 'DUPLICATE_CONTENT_CANDIDATE_ID', candidateId: candidate.id })
    continue
  }
  candidates.set(candidate.id, candidate)
}

const validApprovals = []
const decisions = new Map()

for (const approval of approvalStore.approvals ?? []) {
  if (approval?.schema !== 'qiqi-curriculum-content-approval/v1') {
    errors.push({ code: 'APPROVAL_SCHEMA', candidateId: approval?.payload?.candidateId ?? null })
    continue
  }
  const payload = approval.payload ?? {}
  const candidate = candidates.get(payload.candidateId)
  if (!candidate) {
    errors.push({ code: 'CONTENT_CANDIDATE_NOT_FOUND', candidateId: payload.candidateId ?? null })
    continue
  }
  const reviewer = registry.reviewers?.[payload.reviewerId]
  if (!reviewer || !Array.isArray(reviewer.roles) || !reviewer.roles.includes('content_reviewer')) {
    errors.push({ code: 'UNTRUSTED_CONTENT_REVIEWER', candidateId: candidate.id, reviewerId: payload.reviewerId ?? null })
    continue
  }
  if (payload.role !== 'content_reviewer') {
    errors.push({ code: 'CONTENT_REVIEW_ROLE_MISMATCH', candidateId: candidate.id })
    continue
  }
  const subject = candidateSubject(candidate)
  if (Array.isArray(reviewer.subjects) && reviewer.subjects.length > 0 && !reviewer.subjects.includes('*') && !reviewer.subjects.includes(subject)) {
    errors.push({ code: 'CONTENT_REVIEWER_SUBJECT_MISMATCH', candidateId: candidate.id, reviewerId: payload.reviewerId })
    continue
  }
  if (!['approve', 'reject', 'needs_revision'].includes(payload.decision)) {
    errors.push({ code: 'INVALID_CONTENT_DECISION', candidateId: candidate.id })
    continue
  }
  if (payload.candidateContentSha256 !== candidateDigest(candidate)) {
    errors.push({ code: 'CONTENT_DIGEST_MISMATCH', candidateId: candidate.id })
    continue
  }
  if (!payload.reviewedAt || Number.isNaN(Date.parse(payload.reviewedAt))) {
    errors.push({ code: 'CONTENT_REVIEWED_AT_INVALID', candidateId: candidate.id })
    continue
  }
  if (!verifySignature(approval, reviewer)) {
    errors.push({ code: 'INVALID_CONTENT_SIGNATURE', candidateId: candidate.id })
    continue
  }
  const prior = decisions.get(candidate.id)
  if (prior && prior !== payload.decision) {
    errors.push({ code: 'CONFLICTING_SIGNED_CONTENT_DECISIONS', candidateId: candidate.id })
    continue
  }
  decisions.set(candidate.id, payload.decision)
  validApprovals.push({ candidateId: candidate.id, decision: payload.decision, reviewerId: payload.reviewerId })
}

const approvedIds = new Set(validApprovals.filter((item) => item.decision === 'approve').map((item) => item.candidateId))
const rejectedIds = new Set(validApprovals.filter((item) => item.decision === 'reject').map((item) => item.candidateId))
const revisionIds = new Set(validApprovals.filter((item) => item.decision === 'needs_revision').map((item) => item.candidateId))
const unapprovedIds = Array.from(candidates.keys()).filter((id) => !approvedIds.has(id))

const trustedReviewers = Object.entries(registry.reviewers ?? {}).filter(([, reviewer]) => Array.isArray(reviewer.roles) && reviewer.roles.includes('content_reviewer'))
const blockers = []
if (candidates.size === 0) blockers.push({ code: 'NO_REGISTERED_CONTENT_CANDIDATE', message: 'No secondary-regression-passed candidate snapshot has been registered for formal content approval.' })
if (trustedReviewers.length === 0) blockers.push({ code: 'NO_TRUSTED_CONTENT_REVIEWER', message: 'No offline-vetted content reviewer Ed25519 public key is registered.' })
if (candidates.size > 0 && validApprovals.length === 0) blockers.push({ code: 'NO_SIGNED_CONTENT_APPROVAL', message: 'No registered content candidate has a valid signed disposition.' })
if (unapprovedIds.length > 0) blockers.push({ code: 'UNAPPROVED_CONTENT_CANDIDATES', message: `${unapprovedIds.length} registered candidate(s) do not have a valid approve decision.`, candidateIds: unapprovedIds })
if (rejectedIds.size > 0) blockers.push({ code: 'REJECTED_CONTENT_CANDIDATES', message: `${rejectedIds.size} registered candidate(s) have signed reject decisions.`, candidateIds: Array.from(rejectedIds) })
if (revisionIds.size > 0) blockers.push({ code: 'CONTENT_REVISION_REQUIRED', message: `${revisionIds.size} registered candidate(s) require revision.`, candidateIds: Array.from(revisionIds) })
if (errors.length > 0) blockers.push({ code: 'INVALID_CONTENT_APPROVAL_RECORDS', message: `${errors.length} content candidate/approval record(s) failed verification.` })

const report = {
  schema: 'qiqi-curriculum-content-approval-gate-report/v1',
  readyForCuratedContentRelease: blockers.length === 0,
  registeredCandidateCount: candidates.size,
  validSignedDispositionCount: validApprovals.length,
  signedApprovedCount: approvedIds.size,
  trustedContentReviewerCount: trustedReviewers.length,
  unapprovedCandidateCount: unapprovedIds.length,
  blockers,
  errors,
  note: 'This is the curriculum content gate only. Official release also requires standards mapping, textbook version, rights, and other scope-specific gates.',
}

console.log(JSON.stringify(report, null, 2))

const expectedCandidateRaw = argValue('--expect-candidate-count')
if (expectedCandidateRaw !== null) {
  const expectedCandidateCount = Number(expectedCandidateRaw)
  if (!Number.isInteger(expectedCandidateCount) || report.registeredCandidateCount !== expectedCandidateCount) {
    console.error(`Content candidate count mismatch: expected ${expectedCandidateRaw}, got ${report.registeredCandidateCount}`)
    process.exit(3)
  }
}

if (args.has('--require-ready')) process.exit(report.readyForCuratedContentRelease ? 0 : 2)
if (args.has('--expect-blocked')) process.exit(report.readyForCuratedContentRelease ? 2 : 0)
