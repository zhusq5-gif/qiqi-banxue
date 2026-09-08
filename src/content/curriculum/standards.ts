import rawStandards from './curriculum-standards-v2022.json'
import type { CurriculumSubject } from './curriculum'

export type StandardEvidenceStatus = 'official_source_verified'
export type StandardMappingStatus = 'candidate_review'
export type StandardMappingRelation = 'supports' | 'contextual' | 'direct'

export interface CurriculumStandardDocument {
  id: string
  subject: CurriculumSubject
  title: string
  authority: string
  versionYear: number
  effectiveFrom: string
  verificationStatus: StandardEvidenceStatus
  sourceUrl: string
  sourceNote: string
}

export interface CurriculumStandardClause {
  id: string
  documentId: string
  subject: CurriculumSubject
  kind: string
  title: string
  stage: string
  grades: number[]
  evidenceSummary: string
  sourceUrl: string
  sourceLocator: string
  evidenceStatus: StandardEvidenceStatus
  mappingPolicy: string
}

export interface CurriculumStandardMapping {
  id: string
  entryId: string
  clauseId: string
  relation: StandardMappingRelation
  confidence: number
  status: StandardMappingStatus
  rationale: string
}

export interface CurriculumStandardsDataset {
  datasetVersion: string
  status: 'research_only'
  scopeNote: string
  documents: CurriculumStandardDocument[]
  clauses: CurriculumStandardClause[]
  mappings: CurriculumStandardMapping[]
}

export const curriculumStandards = rawStandards as CurriculumStandardsDataset

export function standardDocumentById(id: string) {
  return curriculumStandards.documents.find((item) => item.id === id) ?? null
}

export function standardClauseById(id: string) {
  return curriculumStandards.clauses.find((item) => item.id === id) ?? null
}

export function standardClausesForSubject(subject: CurriculumSubject) {
  return curriculumStandards.clauses.filter((item) => item.subject === subject)
}

export function standardMappingsForEntry(entryId: string) {
  return curriculumStandards.mappings.filter((item) => item.entryId === entryId)
}

export function standardMappingsForClause(clauseId: string) {
  return curriculumStandards.mappings.filter((item) => item.clauseId === clauseId)
}
