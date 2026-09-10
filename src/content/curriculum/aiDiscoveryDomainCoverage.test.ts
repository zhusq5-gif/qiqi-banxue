import { describe, expect, it } from 'vitest'
import {
  aiDiscoveryDomainCoverageCells,
  aiDiscoveryDomainCoverageSummary,
  aiDiscoveryDomainIdsForCandidate,
  aiDiscoveryDomains,
  aiDiscoveryDomainSearchQueue,
} from './aiDiscoveryDomainCoverage'
import { aiDiscoveryCandidatesAll } from './aiDiscoveryRegistry'

describe('AI discovery subject-grade-domain planning', () => {
  it('builds 112 search-planning cells across Chinese, English and Math domains', () => {
    expect(aiDiscoveryDomains.filter((item) => item.subject === 'chinese')).toHaveLength(10)
    expect(aiDiscoveryDomains.filter((item) => item.subject === 'english')).toHaveLength(7)
    expect(aiDiscoveryDomains.filter((item) => item.subject === 'math')).toHaveLength(4)
    expect(aiDiscoveryDomainCoverageSummary.cellCount).toBe(112)
  })

  it('keeps domain coverage explicitly incomplete so AI search is driven by gaps rather than node counts', () => {
    expect(aiDiscoveryDomainCoverageSummary.searchRequiredCount).toBeGreaterThan(0)
    expect(aiDiscoveryDomainSearchQueue.length).toBeGreaterThan(0)
    expect(aiDiscoveryDomainCoverageSummary.note).toContain('不是正式课程覆盖率')
  })

  it('gives every primary grade an official Chinese task-group anchor after wave03', () => {
    const taskDomains = aiDiscoveryDomains.filter((item) => item.subject === 'chinese' && item.group === 'task_group')
    expect(taskDomains).toHaveLength(6)
    for (const domain of taskDomains) {
      const cells = aiDiscoveryDomainCoverageCells.filter((item) => item.domainId === domain.id)
      expect(cells).toHaveLength(6)
      expect(cells.every((cell) => cell.candidateCount >= 1), domain.id).toBe(true)
      expect(cells.every((cell) => cell.highConfidenceCount >= 1), domain.id).toBe(true)
    }
  })

  it('fills integrated-practice math planning while preserving other domain gaps for targeted search', () => {
    const integrated = aiDiscoveryDomainCoverageCells.filter((item) => item.domainId === 'math-integrated-practice')
    expect(integrated).toHaveLength(6)
    expect(integrated.every((cell) => cell.candidateCount >= 2)).toBe(true)
    expect(aiDiscoveryDomainCoverageCells.some((cell) => cell.subject === 'math' && cell.status === 'search_required')).toBe(true)
  })

  it('uses wave04+06 to seed English culture/phonics depth while preserving shallow culture cells for further review', () => {
    const phonics = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai4-english-g4-phonics-spelling')!
    const culture = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai4-english-culture-cross-cultural')!
    expect(aiDiscoveryDomainIdsForCandidate(phonics)).toEqual(expect.arrayContaining(['en-phonics', 'en-language-knowledge']))
    expect(aiDiscoveryDomainIdsForCandidate(culture)).toContain('en-culture')
    const cultureCells = aiDiscoveryDomainCoverageCells.filter((cell) => cell.domainId === 'en-culture')
    expect(cultureCells).toHaveLength(4)
    expect(cultureCells.every((cell) => cell.candidateCount >= 1)).toBe(true)
    expect(cultureCells.some((cell) => cell.status === 'shallow_candidates')).toBe(true)
  })

  it('uses wave05 concrete abilities to deepen Chinese reading/expression/inquiry and English phonics/read-write/listening', () => {
    const g3Writing = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-chinese-g3-picture-content-clear-writing')!
    const g4Lexical = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-chinese-g4-figurative-animal-word-use')!
    const g5Speed = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-chinese-g5-reading-speed-strategies')!
    const g5Phonics = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-english-g5-phonics-spelling')!
    const g6Retell = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-english-g6-listen-retell')!

    expect(aiDiscoveryDomainIdsForCandidate(g3Writing)).toContain('cn-expression-communication')
    expect(aiDiscoveryDomainIdsForCandidate(g4Lexical)).toEqual(expect.arrayContaining(['cn-expression-communication', 'cn-organization-inquiry']))
    expect(aiDiscoveryDomainIdsForCandidate(g5Speed)).toEqual(expect.arrayContaining(['cn-reading-appreciation', 'cn-organization-inquiry']))
    expect(aiDiscoveryDomainIdsForCandidate(g5Phonics)).toEqual(expect.arrayContaining(['en-phonics', 'en-language-knowledge']))
    expect(aiDiscoveryDomainIdsForCandidate(g6Retell)).toEqual(expect.arrayContaining(['en-communication', 'en-listening-speaking']))
  })

  it('uses wave06 to deepen whole-book reading and upper-grade English culture/phonics without reclassifying them as complete', () => {
    const g5Classic = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-chinese-g5-classic-character-deep-reading')!
    const g6WorldClassic = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-chinese-g6-world-classic-spatial-presentation')!
    const g6Pronunciation = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-english-g6-pronunciation-patterns')!
    const g5Proverbs = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-english-g5-proverbs-culture')!

    expect(aiDiscoveryDomainIdsForCandidate(g5Classic)).toEqual(expect.arrayContaining(['cn-reading-appreciation', 'cn-task-critical-reading', 'cn-task-whole-book']))
    expect(aiDiscoveryDomainIdsForCandidate(g6WorldClassic)).toEqual(expect.arrayContaining(['cn-reading-appreciation', 'cn-expression-communication', 'cn-task-whole-book']))
    expect(aiDiscoveryDomainIdsForCandidate(g6Pronunciation)).toEqual(expect.arrayContaining(['en-phonics', 'en-language-knowledge']))
    expect(aiDiscoveryDomainIdsForCandidate(g5Proverbs)).toContain('en-culture')
    expect(aiDiscoveryDomainCoverageSummary.reviewPoolReadyCount).toBeLessThan(aiDiscoveryDomainCoverageSummary.cellCount)
  })
})
