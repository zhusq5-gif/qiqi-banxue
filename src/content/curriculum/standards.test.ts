import { describe, expect, it } from 'vitest'
import { entryById } from './curriculum'
import { curriculumStandards, standardClauseById, standardDocumentById, standardDocumentsForSubject } from './standards'

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe('2022 curriculum standards evidence scaffold', () => {
  it('keeps the expanded verified evidence baseline stable', () => {
    expect(curriculumStandards.status).toBe('research_only')
    expect(curriculumStandards.documents).toHaveLength(3)
    expect(curriculumStandards.clauses).toHaveLength(17)
    expect(curriculumStandards.mappings).toHaveLength(24)
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
      expect(clause.sourceUrl.includes('moe.gov.cn/')).toBe(true)
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

  it('keeps all official source documents explicitly effective from the 2022 school year', () => {
    for (const document of curriculumStandards.documents) {
      expect(document.authority).toBe('中华人民共和国教育部')
      expect(document.versionYear).toBe(2022)
      expect(document.effectiveFrom).toBe('2022-09')
      expect(document.verificationStatus).toBe('official_source_verified')
      expect(document.sourceUrl.startsWith('https://www.moe.gov.cn/')).toBe(true)
    }
  })

  it('registers math standard metadata without inventing math clauses', () => {
    expect(standardDocumentsForSubject('math')).toHaveLength(1)
    expect(standardDocumentById('moe-math-2022')?.title).toContain('数学课程标准')
    expect(curriculumStandards.clauses.filter((item) => item.subject === 'math')).toHaveLength(0)
    expect(curriculumStandards.mappings.filter((item) => standardClauseById(item.clauseId)?.subject === 'math')).toHaveLength(0)
  })

  it('splits the four subject core competencies into reviewable clauses', () => {
    for (const id of [
      'cn-core-cultural-confidence',
      'cn-core-language-use',
      'cn-core-thinking-ability',
      'cn-core-aesthetic-creation',
      'en-core-language-ability',
      'en-core-cultural-awareness',
      'en-core-thinking-quality',
      'en-core-learning-ability',
    ]) {
      expect(standardClauseById(id), id).not.toBeNull()
    }
  })

  it('keeps low-confidence learning-ability inference explicitly contextual', () => {
    const mapping = curriculumStandards.mappings.find((item) => item.id === 'map2-en-learning-1')
    expect(mapping?.relation).toBe('contextual')
    expect(mapping?.confidence).toBeLessThan(0.7)
    expect(mapping?.status).toBe('candidate_review')
  })
})
