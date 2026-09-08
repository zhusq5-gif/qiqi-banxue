import rawStandards from './curriculum-standards-v2022.json'
import rawExpansion from './curriculum-standards-expansion-v01.json'
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

type CurriculumStandardsExpansion = Pick<CurriculumStandardsDataset, 'status' | 'scopeNote' | 'clauses' | 'mappings'> & {
  datasetVersion: string
}

const base = rawStandards as CurriculumStandardsDataset
const expansion = rawExpansion as CurriculumStandardsExpansion

export const curriculumStandards: CurriculumStandardsDataset = {
  datasetVersion: `${base.datasetVersion}+${expansion.datasetVersion}`,
  status: 'research_only',
  scopeNote: `${base.scopeNote} ${expansion.scopeNote}`,
  documents: base.documents,
  clauses: [...base.clauses, ...expansion.clauses],
  mappings: [...base.mappings, ...expansion.mappings],
}

export function standardDocumentById(id: string) {
  return curriculumStandards.documents.find((item) => item.id === id) ?? null
}

export function standardClauseById(id: string) {
  return curriculumStandards.clauses.find((item) => item.id === id) ?? null
}

export function standardMappingById(id: string) {
  return curriculumStandards.mappings.find((item) => item.id === id) ?? null
}

export function standardClausesForSubject(subject: CurriculumSubject) {
  return curriculumStandards.clauses.filter((item) => item.subject === subject)
}

export function standardMappingsForSubject(subject: CurriculumSubject) {
  const clauseIds = new Set(standardClausesForSubject(subject).map((item) => item.id))
  return curriculumStandards.mappings.filter((item) => clauseIds.has(item.clauseId))
}

export function standardMappingsForEntry(entryId: string) {
  return curriculumStandards.mappings.filter((item) => item.entryId === entryId)
}

export function standardMappingsForClause(clauseId: string) {
  return curriculumStandards.mappings.filter((item) => item.clauseId === clauseId)
}
