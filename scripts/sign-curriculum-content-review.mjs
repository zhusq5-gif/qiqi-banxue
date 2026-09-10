import fs from 'node:fs'
import crypto from 'node:crypto'

function arg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

const candidatePath = arg('--candidate')
const reviewerId = arg('--reviewer-id')
const reviewerLabel = arg('--reviewer-label')
const privateKeyPath = arg('--private-key')
const decision = arg('--decision')
const outputPath = arg('--output')
const note = arg('--note') ?? ''
const confirmed = process.argv.includes('--confirm-reviewed')

if (!candidatePath || !reviewerId || !reviewerLabel || !privateKeyPath || !decision || !outputPath || !confirmed) {
  console.error('Usage: node scripts/sign-curriculum-content-review.mjs --candidate candidate.json --reviewer-id <id> --reviewer-label <label> --private-key <pem> --decision approve|reject|needs_revision --output approval.json --confirm-reviewed [--note text]')
  process.exit(2)
}
if (!['approve', 'reject', 'needs_revision'].includes(decision)) throw new Error('Decision must be approve, reject, or needs_revision')

const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'))
if (candidate.schema !== 'qiqi-curriculum-content-candidate/v1') throw new Error('Input is not a formal qiqi curriculum content candidate')
if (!candidate.id?.trim()) throw new Error('Candidate id is required')
if (!candidate.snapshot || candidate.snapshot.readyForApprovalGate !== true) throw new Error('Candidate snapshot has not passed its approval-gate readiness checks')
if (candidate.snapshot.autoApply !== false || candidate.snapshot.humanVerified !== false) throw new Error('Candidate snapshot safety flags are invalid')
if (!Array.isArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0) throw new Error('Candidate evidenceRefs are required')
if (!candidate.currentVersion?.datasetVersion || !candidate.currentVersion?.sourceCommit) throw new Error('Candidate currentVersion datasetVersion/sourceCommit are required')

const payload = {
  candidateId: candidate.id,
  candidateContentSha256: sha256Hex(canonical(candidate)),
  decision,
  reviewerId,
  reviewerLabel,
  role: 'content_reviewer',
  reviewedAt: new Date().toISOString(),
  note,
}

const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath, 'utf8'))
if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Only Ed25519 private keys are accepted')
const signature = crypto.sign(null, Buffer.from(canonical(payload)), privateKey).toString('base64')
const approval = {
  schema: 'qiqi-curriculum-content-approval/v1',
  payload,
  signatureBase64: signature,
}

fs.writeFileSync(outputPath, `${JSON.stringify(approval, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ written: outputPath, candidateId: payload.candidateId, reviewerId, decision }, null, 2))
