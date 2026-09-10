import { describe, expect, it } from 'vitest'
import { mathBookById, mathChapterById, mathResearchSample } from './mathSample'

describe('K12-KGraph primary math research sample', () => {
  it('keeps the declared non-commercial research boundary', () => {
    expect(mathResearchSample.status).toBe('research_only')
    expect(mathResearchSample.subject).toBe('math')
    expect(mathResearchSample.source.license).toBe('CC BY-NC-SA 4.0')
    expect(mathResearchSample.source.commercialUse).toBe(false)
  })

  it('covers all twelve primary PEP math book slots without claiming edition verification', () => {
    expect(mathResearchSample.bookCoverage).toHaveLength(12)
    expect(new Set(mathResearchSample.bookCoverage.map((item) => item.externalId)).size).toBe(12)
    expect(mathResearchSample.bookCoverage[0]?.externalId).toBe('math_1a_rjb')
    expect(mathResearchSample.bookCoverage[mathResearchSample.bookCoverage.length - 1]?.externalId).toBe('math_6b_rjb')
  })

  it('keeps every sample chapter attached to a declared book', () => {
    expect(mathResearchSample.chapters).toHaveLength(8)
    for (const chapter of mathResearchSample.chapters) {
      const book = mathBookById(chapter.bookId)
      expect(book, chapter.id).not.toBeNull()
      expect(book?.grade).toBe(chapter.grade)
      expect(book?.semester).toBe(chapter.semester)
    }
  })

  it('keeps benchmark prerequisite evidence resolvable and distinct from raw graph edges', () => {
    expect(mathResearchSample.prerequisiteEvidence).toHaveLength(10)
    for (const edge of mathResearchSample.prerequisiteEvidence) {
      expect(mathChapterById(edge.targetChapterId), edge.id).not.toBeNull()
      expect(edge.relation).toBe('benchmark_prerequisite')
      expect(edge.sourceTaskId).toMatch(/^task5::subtask2::math_/)
      expect(edge.fromLabel.length).toBeGreaterThan(0)
    }
  })

  it('does not invent external ids for prerequisite chapters that were not verified', () => {
    expect(mathResearchSample.prerequisiteEvidence.every((item) => item.fromExternalId === null)).toBe(true)
  })
})
