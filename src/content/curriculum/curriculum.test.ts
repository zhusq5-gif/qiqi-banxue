import { describe, expect, it } from 'vitest'
import {
  curriculumSeed,
  entriesForTextbook,
  entryById,
  textbookById,
  textbooksForSubject,
  unitById,
  unitsForTextbook,
} from './curriculum'

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe('curriculum seed v0.2 invariants', () => {
  it('keeps the audited baseline counts stable', () => {
    expect(curriculumSeed.stats).toEqual({
      total: 459,
      chinese: 299,
      english: 160,
      textbooks: 20,
      units: 142,
      issues: 7,
      candidates: 29,
    })
    expect(curriculumSeed.entries).toHaveLength(459)
    expect(curriculumSeed.textbooks).toHaveLength(20)
    expect(curriculumSeed.units).toHaveLength(142)
    expect(curriculumSeed.issues).toHaveLength(7)
    expect(curriculumSeed.candidates).toHaveLength(29)
  })

  it('keeps ids unique across each entity collection', () => {
    expectUnique(curriculumSeed.entries.map((item) => item.id))
    expectUnique(curriculumSeed.textbooks.map((item) => item.id))
    expectUnique(curriculumSeed.units.map((item) => item.id))
    expectUnique(curriculumSeed.issues.map((item) => item.id))
    expectUnique(curriculumSeed.candidates.map((item) => item.id))
  })

  it('keeps every knowledge entry attached to a valid textbook and unit', () => {
    for (const entry of curriculumSeed.entries) {
      const book = textbookById(entry.textbookId)
      const unit = unitById(entry.unitId)
      expect(book, entry.id).not.toBeNull()
      expect(unit, entry.id).not.toBeNull()
      expect(book?.subject).toBe(entry.subject)
      expect(book?.grade).toBe(entry.grade)
      expect(book?.semester).toBe(entry.semester)
      expect(unit?.textbookId).toBe(entry.textbookId)
    }
  })

  it('keeps all registered issues resolvable and visibly unapproved', () => {
    for (const issue of curriculumSeed.issues) {
      const entry = entryById(issue.nodeId)
      expect(entry, issue.id).not.toBeNull()
      expect(entry?.issueId).toBe(issue.id)
      expect(entry?.reviewStatus).toBe('needs_review')
    }
  })

  it('keeps relationship records as candidates rather than official prerequisites', () => {
    for (const candidate of curriculumSeed.candidates) {
      const from = entryById(candidate.fromId)
      const to = entryById(candidate.toId)
      expect(from, candidate.id).not.toBeNull()
      expect(to, candidate.id).not.toBeNull()
      expect(candidate.type).toBe('similar_label_candidate')
      expect(from?.subject).toBe(candidate.subject)
      expect(to?.subject).toBe(candidate.subject)
      expect(candidate.similarity).toBeGreaterThan(0)
      expect(candidate.similarity).toBeLessThanOrEqual(1)
    }
  })

  it('keeps the audited textbook scope and conservative edition status', () => {
    expect(textbooksForSubject('chinese')).toHaveLength(12)
    expect(textbooksForSubject('english')).toHaveLength(8)
    expect(curriculumSeed.textbooks.filter((book) => book.editionStatus === 'verified')).toHaveLength(0)
    expect(curriculumSeed.textbooks.filter((book) => book.editionStatus === 'mismatch')).toHaveLength(1)
  })

  it('keeps every textbook populated with units and entries', () => {
    for (const book of curriculumSeed.textbooks) {
      expect(unitsForTextbook(book.id).length, book.id).toBeGreaterThan(0)
      expect(entriesForTextbook(book.id).length, book.id).toBeGreaterThan(0)
    }
  })
})
