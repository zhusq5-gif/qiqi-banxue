import fs from 'node:fs'
import crypto from 'node:crypto'

const args = new Set(process.argv.slice(2))

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

function loadStandards() {
  const base = readJson('src/content/curriculum/curriculum-standards-v2022.json')
  const expansion = readJson('src/content/curriculum/curriculum-standards-expansion-v01.json')
  return {
    clauses: [...base.clauses, ...expansion.clauses],
    mappings: [...base.mappings, ...expansion.mappings],
  }
}

function mappingDigest(mapping, entry, clause) {
  const entryProjection = {
    id: entry.id,
    subject: entry.subject,
    grade: entry.grade,
    book: entry.book,
    unit: entry.unit,
    label: entry.label,
    learningDemand: entry.learningDemand,
    sourcePath: entry.sourcePath,
    sourcePointer: entry.sourcePointer,
  }
  const clauseProjection = {
    id: clause.id,
    subject: clause.subject,
    title: clause.title,
    stage: clause.stage,
    grades: clause.grades,
    evidenceSummary: clause.evidenceSummary,
    sourceUrl: clause.sourceUrl,
    sourceLocator: clause.sourceLocator,
  }
  return sha256Hex(canonical({ mapping, entry: entryProjection, clause: clauseProjection }))
}

function verifySignature(approval, reviewer) {
  try {
    const key = crypto.createPublicKey(reviewer.publicKeyPem)
    return crypto.verify(null, Buffer.from(canonical(approval.payload)), key, Buffer.from(approval.signatureBase64, 'base64'))
  } catch {
    return false
  }
}

function selfTest() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const payload = { mappingId: 'synthetic', decision: 'approve', content: 'self-test' }
  const signature = crypto.sign(null, Buffer.from(canonical(payload)), privateKey)
  const ok = crypto.verify(null, Buffer.from(canonical(payload)), publicKey, signature)
  const tampered = crypto.verify(null, Buffer.from(canonical({ ...payload, decision: 'reject' })), publicKey, signature)
  const report = { selfTest: true, signatureVerified: ok, tamperRejected: !tampered }
  console.log(JSON.stringify(report, null, 2))
  process.exit(ok && !tampered ? 0 : 2)
}

if (args.has('--self-test')) selfTest()

const seed = readJson('src/content/curriculum/curriculum-seed-v02.json')
const standards = loadStandards()
const registry = readJson('config/curriculum-reviewers.json')
const approvalStore = readJson('approvals/curriculum-standard-approvals.json')

const entries = new Map(seed.entries.map((item) => [item.id, item]))
const clauses = new Map(standards.clauses.map((item) => [item.id, item]))
const mappings = new Map(standards.mappings.map((item) => [item.id, item]))
const valid = []
const errors = []
const decisions = new Map()

for (const approval of approvalStore.approvals ?? []) {
  if (approval.schema !== 'qiqi-standard-mapping-approval/v1') {
    errors.push({ code: 'APPROVAL_SCHEMA', mappingId: approval?.payload?.mappingId ?? null })
    continue
  }
  const payload = approval.payload ?? {}
  const mapping = mappings.get(payload.mappingId)
  if (!mapping) {
    errors.push({ code: 'MAPPING_NOT_FOUND', mappingId: payload.mappingId })
    continue
  }
  const entry = entries.get(mapping.entryId)
  const clause = clauses.get(mapping.clauseId)
  if (!entry || !clause) {
    errors.push({ code: 'MAPPING_ENDPOINT_MISSING', mappingId: mapping.id })
    continue
  }
  const reviewer = registry.reviewers?.[payload.reviewerId]
  if (!reviewer || !Array.isArray(reviewer.roles) || !reviewer.roles.includes('subject_reviewer')) {
    errors.push({ code: 'UNTRUSTED_REVIEWER', mappingId: mapping.id, reviewerId: payload.reviewerId ?? null })
    continue
  }
  if (payload.role !== 'subject_reviewer') {
    errors.push({ code: 'ROLE_MISMATCH', mappingId: mapping.id })
    continue
  }
  if (!['approve', 'reject', 'needs_revision'].includes(payload.decision)) {
    errors.push({ code: 'INVALID_DECISION', mappingId: mapping.id })
    continue
  }
  const expectedDigest = mappingDigest(mapping, entry, clause)
  if (payload.mappingContentSha256 !== expectedDigest) {
    errors.push({ code: 'CONTENT_DIGEST_MISMATCH', mappingId: mapping.id })
    continue
  }
  if (!verifySignature(approval, reviewer)) {
    errors.push({ code: 'INVALID_SIGNATURE', mappingId: mapping.id })
    continue
  }
  const prior = decisions.get(mapping.id)
  if (prior && prior !== payload.decision) {
    errors.push({ code: 'CONFLICTING_SIGNED_DECISIONS', mappingId: mapping.id })
    continue
  }
  decisions.set(mapping.id, payload.decision)
  valid.push({ mappingId: mapping.id, decision: payload.decision, reviewerId: payload.reviewerId })
}

const approvedMappings = valid.filter((item) => item.decision === 'approve')
const blockers = []
if (!Object.keys(registry.reviewers ?? {}).length) blockers.push({ code: 'NO_TRUSTED_SUBJECT_REVIEWER', message: 'No vetted Ed25519 subject reviewer public key is registered.' })
if (!approvedMappings.length) blockers.push({ code: 'NO_SIGNED_STANDARD_MAPPING_APPROVAL', message: 'No candidate mapping has a valid signed approval.' })
if (errors.length) blockers.push({ code: 'INVALID_APPROVAL_RECORDS', message: `${errors.length} approval record(s) failed verification.` })

const report = {
  schema: 'qiqi-standard-mapping-gate-report/v1',
  readyForOfficialAlignmentExport: blockers.length === 0,
  candidateMappings: standards.mappings.length,
  signedDispositionCount: valid.length,
  signedApprovedCount: approvedMappings.length,
  trustedReviewerCount: Object.keys(registry.reviewers ?? {}).length,
  blockers,
  errors,
  note: 'This gate covers curriculum-standard mapping signatures only. Whole-system official release still requires textbook edition, rights and content-issue gates.',
}
console.log(JSON.stringify(report, null, 2))

if (args.has('--require-ready')) process.exit(report.readyForOfficialAlignmentExport ? 0 : 2)
if (args.has('--expect-blocked')) process.exit(report.readyForOfficialAlignmentExport ? 2 : 0)
