import fs from 'node:fs'

function arg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function allArgs(name) {
  const values = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1])
  }
  return values
}

function resolveSubject(snapshot) {
  const direct = snapshot?.proposed?.subject ?? snapshot?.proposal?.proposed?.subject ?? snapshot?.derivedCandidate?.subject ?? null
  if (direct) return direct
  if (snapshot?.derivedCandidate?.kind === 'curated_assessment_mapping_candidate'
    || snapshot?.derivedCandidate?.kind === 'curriculum_relation_candidate'
    || snapshot?.derivedCandidate?.kind === 'knowledge_identity_split_candidate') return 'math'

  const seed = JSON.parse(fs.readFileSync('src/content/curriculum/curriculum-seed-v02.json', 'utf8'))
  const sourceNodeId = snapshot?.derivedCandidate?.sourceNodeId ?? null
  if (sourceNodeId) {
    const entry = seed.entries.find((item) => item.id === sourceNodeId)
    if (entry?.subject) return entry.subject
  }
  const issueMatch = /^human-review:(F\d{3})$/.exec(snapshot?.caseId ?? '')
  if (issueMatch) {
    const issue = seed.issues.find((item) => item.id === issueMatch[1])
    if (issue?.subject) return issue.subject
  }
  return null
}

const snapshotPath = arg('--snapshot')
const candidateId = arg('--candidate-id')
const datasetVersion = arg('--dataset-version')
const sourceCommit = arg('--source-commit')
const outputPath = arg('--output')
const evidenceRefs = allArgs('--evidence')
const registeredBy = arg('--registered-by') ?? 'manual-registration'
const confirmed = process.argv.includes('--confirm-registration')

if (!snapshotPath || !candidateId || !datasetVersion || !sourceCommit || !outputPath || !confirmed) {
  console.error('Usage: node scripts/register-curriculum-content-candidate.mjs --snapshot snapshot.json --candidate-id <id> --dataset-version <version> --source-commit <sha> --evidence <ref> [--evidence <ref> ...] --output candidate.json --confirm-registration [--registered-by label]')
  process.exit(2)
}
if (evidenceRefs.length === 0 || evidenceRefs.some((item) => !item.trim())) throw new Error('At least one --evidence reference is required')
if (!/^[A-Za-z0-9._:-]+$/.test(candidateId)) throw new Error('candidate-id contains unsupported characters')

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
const acceptedSchemas = new Set([
  'qiqi-curriculum-structured-candidate-snapshot/v2',
  'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2',
])
if (!acceptedSchemas.has(snapshot.schema)) throw new Error(`Unsupported snapshot schema: ${snapshot.schema}`)
if (snapshot.readyForApprovalGate !== true) throw new Error('Snapshot is not readyForApprovalGate')
if (snapshot.autoApply !== false || snapshot.humanVerified !== false) throw new Error('Snapshot safety flags are invalid')

const subject = resolveSubject(snapshot)
if (!subject || !['chinese', 'english', 'math'].includes(subject)) throw new Error('Could not safely resolve a supported curriculum subject from the snapshot/current seed')

const candidate = {
  schema: 'qiqi-curriculum-content-candidate/v1',
  id: candidateId,
  subject,
  snapshot,
  evidenceRefs: evidenceRefs.map((item) => item.trim()),
  currentVersion: {
    datasetVersion: datasetVersion.trim(),
    sourceCommit: sourceCommit.trim(),
  },
  registeredAt: new Date().toISOString(),
  registeredBy: registeredBy.trim(),
}

fs.writeFileSync(outputPath, `${JSON.stringify(candidate, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ written: outputPath, candidateId, snapshotSchema: snapshot.schema, subject }, null, 2))
