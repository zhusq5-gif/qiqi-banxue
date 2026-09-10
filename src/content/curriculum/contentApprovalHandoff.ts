import type { CurriculumSubject } from './curriculum'

export const CONTENT_APPROVAL_HANDOFF_STORAGE_KEY = 'qiqi.curriculum-content-approval-handoff.v1'

export type ApprovalReadySnapshot = {
  schema: 'qiqi-curriculum-structured-candidate-snapshot/v2' | 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2'
  readyForApprovalGate: true
  autoApply: false
  humanVerified: false
  [key: string]: unknown
}

export interface ContentApprovalHandoff {
  schema: 'qiqi-curriculum-content-approval-handoff/v1'
  candidateId: string
  subject: CurriculumSubject
  snapshot: ApprovalReadySnapshot
  evidenceRefs: string[]
  source: 'ai_human_review' | 'existing_structured_proposal'
  createdAt: string
  status: 'browser_handoff_only'
  autoApply: false
  humanVerified: false
}

const acceptedSchemas = new Set([
  'qiqi-curriculum-structured-candidate-snapshot/v2',
  'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2',
])

function validateSnapshot(value: unknown): asserts value is ApprovalReadySnapshot {
  if (!value || typeof value !== 'object') throw new Error('Content approval handoff snapshot is required')
  const snapshot = value as Record<string, unknown>
  if (!acceptedSchemas.has(String(snapshot.schema))) throw new Error(`Unsupported approval handoff snapshot schema: ${String(snapshot.schema)}`)
  if (snapshot.readyForApprovalGate !== true) throw new Error('Handoff snapshot is not readyForApprovalGate')
  if (snapshot.autoApply !== false || snapshot.humanVerified !== false) throw new Error('Handoff snapshot safety flags are invalid')
}

export function createContentApprovalHandoff(input: {
  candidateId: string
  subject: CurriculumSubject
  snapshot: unknown
  evidenceRefs: string[]
  source: ContentApprovalHandoff['source']
  createdAt?: string
}): ContentApprovalHandoff {
  validateSnapshot(input.snapshot)
  if (!input.candidateId.trim()) throw new Error('Handoff candidateId is required')
  if (!['chinese', 'english', 'math'].includes(input.subject)) throw new Error('Handoff subject is invalid')
  const evidenceRefs = input.evidenceRefs.map((item) => item.trim()).filter(Boolean)
  if (evidenceRefs.length === 0) throw new Error('Handoff requires at least one evidence reference')
  if (new Set(evidenceRefs).size !== evidenceRefs.length) throw new Error('Handoff evidence references must be unique')
  const createdAt = input.createdAt ?? new Date().toISOString()
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('Handoff createdAt is invalid')

  return {
    schema: 'qiqi-curriculum-content-approval-handoff/v1',
    candidateId: input.candidateId.trim(),
    subject: input.subject,
    snapshot: input.snapshot,
    evidenceRefs,
    source: input.source,
    createdAt,
    status: 'browser_handoff_only',
    autoApply: false,
    humanVerified: false,
  }
}

export function parseContentApprovalHandoff(raw: string): ContentApprovalHandoff {
  const parsed = JSON.parse(raw) as Partial<ContentApprovalHandoff>
  if (parsed.schema !== 'qiqi-curriculum-content-approval-handoff/v1') throw new Error('Unsupported content approval handoff schema')
  if (parsed.status !== 'browser_handoff_only' || parsed.autoApply !== false || parsed.humanVerified !== false) throw new Error('Unsafe content approval handoff state')
  if (parsed.source !== 'ai_human_review' && parsed.source !== 'existing_structured_proposal') throw new Error('Unsupported content approval handoff source')
  return createContentApprovalHandoff({
    candidateId: parsed.candidateId ?? '',
    subject: parsed.subject as CurriculumSubject,
    snapshot: parsed.snapshot,
    evidenceRefs: parsed.evidenceRefs ?? [],
    source: parsed.source,
    createdAt: parsed.createdAt,
  })
}
