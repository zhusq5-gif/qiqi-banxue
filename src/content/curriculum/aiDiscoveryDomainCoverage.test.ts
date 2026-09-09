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

  it('classifies current English read/write and phonics candidates for search planning only', () => {
    const phonics = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai3-english-g5-phonics-spelling')!
    const readWrite = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai3-english-g5-read-write')!
    expect(aiDiscoveryDomainIdsForCandidate(phonics)).toEqual(expect.arrayContaining(['en-phonics', 'en-language-knowledge']))
    expect(aiDiscoveryDomainIdsForCandidate(readWrite)).toEqual(expect.arrayContaining(['en-reading', 'en-writing']))
    expect(aiDiscoveryDomainCoverageCells.some((cell) => cell.domainId === 'en-culture' && cell.status === 'search_required')).toBe(true)
  })
})
