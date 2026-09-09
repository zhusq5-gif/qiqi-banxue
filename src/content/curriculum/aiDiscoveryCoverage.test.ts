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

  it('keeps all 16 units at minimum candidate-review readiness without claiming curriculum completeness', () => {
    expect(aiDiscoveryCoverageSummary.searchRequiredCount).toBe(0)
    expect(aiDiscoveryCoverageSummary.expandSearchCount).toBe(0)
    expect(aiDiscoveryCoverageSummary.reviewReadyCount).toBe(16)
    expect(aiDiscoveryNextSearchQueue).toHaveLength(0)
    expect(aiDiscoveryCoverageSummary.note).toContain('不是正式课程知识覆盖率')
  })

  it('gives every required subject-grade at least three candidates for UI review', () => {
    expect(aiDiscoveryCoverageUnits.every((item) => item.candidateCount >= 3)).toBe(true)
    expect(aiDiscoveryCoverageUnits.every((item) => item.status === 'candidate_review_ready')).toBe(true)
  })

  it('reflects wave05 depth additions without mistaking them for knowledge completeness', () => {
    expect(aiDiscoveryCoverageFor('chinese', 1)?.candidateCount).toBe(12)
    expect(aiDiscoveryCoverageFor('chinese', 2)?.candidateCount).toBe(11)
    expect(aiDiscoveryCoverageFor('chinese', 6)?.candidateCount).toBe(10)
    expect(aiDiscoveryCoverageFor('english', 3)?.candidateCount).toBe(8)
    expect(aiDiscoveryCoverageFor('english', 4)?.candidateCount).toBe(7)
    expect(aiDiscoveryCoverageFor('english', 5)?.candidateCount).toBe(8)
    expect(aiDiscoveryCoverageFor('english', 6)?.candidateCount).toBe(6)
    expect(aiDiscoveryCoverageFor('math', 1)?.candidateCount).toBe(7)
    expect(aiDiscoveryCoverageFor('math', 4)?.candidateCount).toBe(5)
    expect(aiDiscoveryCoverageFor('math', 6)?.candidateCount).toBe(5)
  })
})
