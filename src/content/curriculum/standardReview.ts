import { entryById } from './curriculum'
import {
  standardClauseById,
  standardDocumentById,
  standardMappingById,
  type CurriculumStandardMapping,
} from './standards'

export type StandardReviewDecision = 'pending' | 'approve' | 'reject' | 'needs_revision'

export interface StandardMappingReviewDraft {
  mappingId: string
  decision: StandardReviewDecision
  reviewerLabel: string
  reviewerRole: 'subject_reviewer'
  note: string
  textbookEvidenceChecked: boolean
  standardEvidenceChecked: boolean
  updatedAt: string
}

export interface UnsignedStandardReviewBundle {
  schema: 'qiqi-standard-mapping-review/v1'
  status: 'unsigned_review_bundle'
  warning: string
  mappingId: string
  mappingContentSha256: string
  payload: {
    mapping: CurriculumStandardMapping
    entry: {
      id: string
      subject: string
      grade: number
      book: string
      unit: string
      label: string
      learningDemand: string
      sourcePath: string
      sourcePointer: string
    }
    clause: {
      id: string
      subject: string
      title: string
      stage: string
      grades: number[]
      evidenceSummary: string
      sourceUrl: string
      sourceLocator: string
    }
    document: {
      id: string
      title: string
      authority: string
      versionYear: number
    }
    review: StandardMappingReviewDraft
  }
}

export function emptyMappingReview(mappingId: string): StandardMappingReviewDraft {
  return {
    mappingId,
    decision: 'pending',
    reviewerLabel: '',
    reviewerRole: 'subject_reviewer',
    note: '',
    textbookEvidenceChecked: false,
    standardEvidenceChecked: false,
    updatedAt: '',
  }
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('')
}

export function reviewPayloadForMapping(mappingId: string, review: StandardMappingReviewDraft) {
  const mapping = standardMappingById(mappingId)
  if (!mapping) throw new Error(`Unknown mapping: ${mappingId}`)
  const entry = entryById(mapping.entryId)
  const clause = standardClauseById(mapping.clauseId)
  const document = clause ? standardDocumentById(clause.documentId) : null
  if (!entry || !clause || !document) throw new Error(`Unresolvable mapping evidence: ${mappingId}`)

  return {
    mapping,
    entry: {
      id: entry.id,
      subject: entry.subject,
      grade: entry.grade,
      book: entry.book,
      unit: entry.unit,
      label: entry.label,
      learningDemand: entry.learningDemand,
      sourcePath: entry.sourcePath,
      sourcePointer: entry.sourcePointer,
    },
    clause: {
      id: clause.id,
      subject: clause.subject,
      title: clause.title,
      stage: clause.stage,
      grades: clause.grades,
      evidenceSummary: clause.evidenceSummary,
      sourceUrl: clause.sourceUrl,
      sourceLocator: clause.sourceLocator,
    },
    document: {
      id: document.id,
      title: document.title,
      authority: document.authority,
      versionYear: document.versionYear,
    },
    review,
  }
}

export async function createUnsignedStandardReviewBundle(review: StandardMappingReviewDraft): Promise<UnsignedStandardReviewBundle> {
  const payload = reviewPayloadForMapping(review.mappingId, review)
  const mappingContentSha256 = await sha256Hex(canonical({ mapping: payload.mapping, entry: payload.entry, clause: payload.clause }))
  return {
    schema: 'qiqi-standard-mapping-review/v1',
    status: 'unsigned_review_bundle',
    warning: '此文件只记录人工审核草稿，不是密码学签名，不得将映射状态升级为 expert_verified。',
    mappingId: review.mappingId,
    mappingContentSha256,
    payload,
  }
}
