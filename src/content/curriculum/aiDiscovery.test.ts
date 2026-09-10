import { describe, expect, it } from 'vitest'
import {
  aiDiscoveryCandidates,
  aiDiscoverySummary,
  createAIDiscoveryDecision,
  exactExistingMatches,
} from './aiDiscovery'

describe('AI discovery candidate governance', () => {
  it('ships a balanced 20-item first discovery batch across Chinese, English and math', () => {
    expect(aiDiscoverySummary.total).toBe(20)
    expect(aiDiscoverySummary.chinese).toBe(7)
    expect(aiDiscoverySummary.english).toBe(5)
    expect(aiDiscoverySummary.math).toBe(8)
    expect(new Set(aiDiscoveryCandidates.map((item) => item.id)).size).toBe(aiDiscoveryCandidates.length)
  })

  it('keeps every AI result candidate-only and requires UI human review', () => {
    for (const candidate of aiDiscoveryCandidates) {
      expect(candidate.aiGenerated, candidate.id).toBe(true)
      expect(candidate.reviewStatus, candidate.id).toBe('ai_candidate')
      expect(candidate.autoApply, candidate.id).toBe(false)
      expect(candidate.nextGate, candidate.id).toBe('human_ui_review')
      expect(candidate.sourceRefs.length, candidate.id).toBeGreaterThan(0)
      expect(candidate.sourceRefs.every((ref) => ref.startsWith('https://')), candidate.id).toBe(true)
    }
  })

  it('only labels official 2022 curriculum-standard math anchors as high-confidence standard evidence', () => {
    const official = aiDiscoveryCandidates.filter((item) => item.sourceAuthority === 'official_standard_2022')
    expect(official.length).toBeGreaterThanOrEqual(7)
    expect(official.every((item) => item.subject === 'math')).toBe(true)
    expect(official.every((item) => item.confidence === 'high')).toBe(true)
    expect(aiDiscoveryCandidates.filter((item) => item.sourceAuthority === 'publisher_catalog_version_unknown').every((item) => item.confidence !== 'high')).toBe(true)
  })

  it('can detect exact normalized duplicates without treating them as semantic proof', () => {
    for (const candidate of aiDiscoveryCandidates) {
      const matches = exactExistingMatches(candidate)
      expect(Array.isArray(matches)).toBe(true)
      expect(matches.every((item) => item.subject === candidate.subject)).toBe(true)
    }
    expect(aiDiscoverySummary.exactDuplicateCandidateCount).toBeGreaterThanOrEqual(0)
  })

  it('exports only unsigned human UI decisions and requires current candidate evidence', () => {
    const candidate = aiDiscoveryCandidates.find((item) => item.id === 'ai-english-g3-greeting-function')!
    expect(candidate).toBeDefined()
    const result = createAIDiscoveryDecision(
      candidate.id,
      'promote_to_human_review',
      '审核人',
      '小学英语教研',
      '已查看人教社当前三年级公开资源，候选值得进入下一轮真人精细审校。',
      [candidate.sourceRefs[0]],
      '2026-09-09T13:45:00+08:00',
    )
    expect(result.status).toBe('unsigned_ai_candidate_review')
    expect(result.autoApply).toBe(false)
    expect(result.humanVerified).toBe(false)
    expect(result.nextGate).toBe('human_review_case_creation')
    expect(() => createAIDiscoveryDecision(candidate.id, 'promote_to_human_review', 'a', 'b', 'c', ['https://example.com'])).toThrow()
  })
})
