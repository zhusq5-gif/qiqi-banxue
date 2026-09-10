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

const bundlePath = arg('--bundle')
const reviewerId = arg('--reviewer-id')
const privateKeyPath = arg('--private-key')
const outputPath = arg('--output')
const confirmed = process.argv.includes('--confirm-reviewed')

if (!bundlePath || !reviewerId || !privateKeyPath || !outputPath || !confirmed) {
  console.error('Usage: node scripts/sign-curriculum-standard-review.mjs --bundle review.json --reviewer-id <id> --private-key <pem> --output approval.json --confirm-reviewed')
  process.exit(2)
}

const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))
if (bundle.schema !== 'qiqi-standard-mapping-review/v1' || bundle.status !== 'unsigned_review_bundle') {
  throw new Error('Input is not a qiqi unsigned standard mapping review bundle')
}
const review = bundle.payload?.review
if (!review || review.decision === 'pending') throw new Error('A non-pending human review decision is required')
if (!review.textbookEvidenceChecked || !review.standardEvidenceChecked) throw new Error('Both textbook and standard evidence checks are required')
if (!review.reviewerLabel?.trim()) throw new Error('Reviewer label is required')
if (review.reviewerRole !== 'subject_reviewer') throw new Error('Only subject_reviewer role is supported')

const payload = {
  mappingId: bundle.mappingId,
  mappingContentSha256: bundle.mappingContentSha256,
  decision: review.decision,
  reviewerId,
  reviewerLabel: review.reviewerLabel,
  role: 'subject_reviewer',
  reviewedAt: review.updatedAt || new Date().toISOString(),
  note: review.note || '',
  evidenceChecks: {
    textbook: true,
    standard: true,
  },
}

const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath, 'utf8'))
if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Only Ed25519 private keys are accepted')
const signature = crypto.sign(null, Buffer.from(canonical(payload)), privateKey).toString('base64')
const approval = {
  schema: 'qiqi-standard-mapping-approval/v1',
  payload,
  signatureBase64: signature,
}

fs.writeFileSync(outputPath, `${JSON.stringify(approval, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ written: outputPath, mappingId: payload.mappingId, reviewerId, decision: payload.decision }, null, 2))
