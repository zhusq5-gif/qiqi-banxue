import { describe, expect, it } from 'vitest'
import { entryById } from './curriculum'
import { curriculumStandards, standardClauseById, standardDocumentById } from './standards'

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe('2022 curriculum standards evidence scaffold', () => {
  it('keeps the initial verified evidence baseline stable', () => {
    expect(curriculumStandards.status).toBe('research_only')
    expect(curriculumStandards.documents).toHaveLength(2)
    expect(curriculumStandards.clauses).toHaveLength(8)
    expect(curriculumStandards.mappings).toHaveLength(6)
  })

  it('keeps standard entity ids unique and references resolvable', () => {
    expectUnique(curriculumStandards.documents.map((item) => item.id))
    expectUnique(curriculumStandards.clauses.map((item) => item.id))
    expectUnique(curriculumStandards.mappings.map((item) => item.id))

    for (const clause of curriculumStandards.clauses) {
      const document = standardDocumentById(clause.documentId)
      expect(document, clause.id).not.toBeNull()
      expect(document?.subject).toBe(clause.subject)
      expect(clause.evidenceStatus).toBe('official_source_verified')
      expect(clause.sourceUrl.startsWith('https://www.moe.gov.cn/')).toBe(true)
    }
  })

  it('keeps official evidence verification separate from mapping approval', () => {
    for (const mapping of curriculumStandards.mappings) {
      const entry = entryById(mapping.entryId)
      const clause = standardClauseById(mapping.clauseId)
      expect(entry, mapping.id).not.toBeNull()
      expect(clause, mapping.id).not.toBeNull()
      expect(entry?.subject).toBe(clause?.subject)
      expect(mapping.status).toBe('candidate_review')
      expect(mapping.confidence).toBeGreaterThan(0)
      expect(mapping.confidence).toBeLessThanOrEqual(1)
    }
    expect(curriculumStandards.mappings.some((item) => item.status !== 'candidate_review')).toBe(false)
  })

  it('does not map entries outside the stated grade scope', () => {
    for (const mapping of curriculumStandards.mappings) {
      const entry = entryById(mapping.entryId)
      const clause = standardClauseById(mapping.clauseId)
      expect(entry, mapping.id).not.toBeNull()
      expect(clause, mapping.id).not.toBeNull()
      expect(clause?.grades.includes(entry!.grade), mapping.id).toBe(true)
    }
  })

  it('keeps the source documents explicitly effective from the 2022 school year', () => {
    for (const document of curriculumStandards.documents) {
      expect(document.authority).toBe('中华人民共和国教育部')
      expect(document.versionYear).toBe(2022)
      expect(document.effectiveFrom).toBe('2022-09')
      expect(document.verificationStatus).toBe('official_source_verified')
    }
  })
})
