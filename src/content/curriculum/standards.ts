import rawStandards from './curriculum-standards-v2022.json'
import rawExpansion from './curriculum-standards-expansion-v01.json'
import rawExpansion2 from './curriculum-standards-expansion-v02.json'
import rawMathDocument from './curriculum-standard-math-document-v01.json'
import type { CurriculumSubject } from './curriculum'

export type StandardEvidenceStatus = 'official_source_verified'
export type StandardMappingStatus = 'candidate_review'
export type StandardMappingRelation = 'supports' | 'contextual' | 'direct'
export type StandardEvidenceScope = 'standard_document' | 'official_interpretation' | 'pedagogical_principle'

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
  evidenceScope?: StandardEvidenceScope
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

type CurriculumStandardDocumentExpansion = {
  datasetVersion: string
  status: 'research_only'
  documents: CurriculumStandardDocument[]
}

const base = rawStandards as CurriculumStandardsDataset
const expansion = rawExpansion as CurriculumStandardsExpansion
const expansion2 = rawExpansion2 as CurriculumStandardsExpansion
const mathDocument = rawMathDocument as CurriculumStandardDocumentExpansion

export const curriculumStandards: CurriculumStandardsDataset = {
  datasetVersion: `${base.datasetVersion}+${expansion.datasetVersion}+${expansion2.datasetVersion}+${mathDocument.datasetVersion}`,
  status: 'research_only',
  scopeNote: `${base.scopeNote} ${expansion.scopeNote} ${expansion2.scopeNote} 数学当前只登记2022版标准文档元数据，具体条款尚待可核证据结构化。`,
  documents: [...base.documents, ...mathDocument.documents],
  clauses: [...base.clauses, ...expansion.clauses, ...expansion2.clauses],
  mappings: [...base.mappings, ...expansion.mappings, ...expansion2.mappings],
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

export function standardDocumentsForSubject(subject: CurriculumSubject) {
  return curriculumStandards.documents.filter((item) => item.subject === subject)
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
