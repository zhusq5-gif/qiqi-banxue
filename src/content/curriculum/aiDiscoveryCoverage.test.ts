import { describe, expect, it } from 'vitest'
import {
  aiDiscoveryCoverageFor,
  aiDiscoveryCoverageSummary,
  aiDiscoveryCoverageUnits,
  aiDiscoveryNextSearchQueue,
} from './aiDiscoveryCoverage'

describe('AI discovery subject-grade search coverage', () => {
  it('keeps the same 16 required primary subject-grade units as curriculum verification', () => {
    expect(aiDiscoveryCoverageSummary.requiredUnitCount).toBe(16)
    expect(aiDiscoveryCoverageUnits.filter((item) => item.subject === 'chinese')).toHaveLength(6)
    expect(aiDiscoveryCoverageUnits.filter((item) => item.subject === 'english')).toHaveLength(4)
    expect(aiDiscoveryCoverageUnits.filter((item) => item.subject === 'math')).toHaveLength(6)
  })

  it('identifies zero-candidate and low-candidate grades without calling them knowledge gaps', () => {
    expect(aiDiscoveryCoverageSummary.searchRequiredCount).toBe(6)
    expect(aiDiscoveryCoverageSummary.expandSearchCount).toBe(4)
    expect(aiDiscoveryCoverageSummary.reviewReadyCount).toBe(6)
    expect(aiDiscoveryCoverageSummary.note).toContain('不是正式课程知识覆盖率')
  })

  it('prioritizes completely uncovered AI-search units before shallowly covered units', () => {
    const zeroCount = aiDiscoveryNextSearchQueue.filter((item) => item.status === 'search_required').length
    expect(zeroCount).toBe(6)
    expect(aiDiscoveryNextSearchQueue.slice(0, zeroCount).every((item) => item.candidateCount === 0)).toBe(true)
  })

  it('reflects the first batch distribution accurately', () => {
    expect(aiDiscoveryCoverageFor('chinese', 1)?.candidateCount).toBe(5)
    expect(aiDiscoveryCoverageFor('chinese', 4)?.candidateCount).toBe(2)
    expect(aiDiscoveryCoverageFor('english', 3)?.candidateCount).toBe(3)
    expect(aiDiscoveryCoverageFor('english', 6)?.candidateCount).toBe(2)
    expect(aiDiscoveryCoverageFor('math', 1)?.candidateCount).toBe(5)
    expect(aiDiscoveryCoverageFor('math', 4)?.candidateCount).toBe(3)
    expect(aiDiscoveryCoverageFor('math', 6)?.candidateCount).toBe(2)
  })
})
