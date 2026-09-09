import { describe, expect, it } from 'vitest'
import {
  aiDiscoveryBatches,
  aiDiscoveryCandidatesAll,
  aiDiscoveryRegistrySummary,
  createAIDiscoveryDecisionAll,
} from './aiDiscoveryRegistry'

describe('aggregated AI discovery registry', () => {
  it('combines three source-qualified batches without duplicate candidate IDs', () => {
    expect(aiDiscoveryBatches).toHaveLength(3)
    expect(aiDiscoveryRegistrySummary.total).toBe(53)
    expect(aiDiscoveryRegistrySummary.chinese).toBe(26)
    expect(aiDiscoveryRegistrySummary.english).toBe(16)
    expect(aiDiscoveryRegistrySummary.math).toBe(11)
    expect(new Set(aiDiscoveryCandidatesAll.map((item) => item.id)).size).toBe(aiDiscoveryCandidatesAll.length)
  })

  it('preserves candidate-only governance for every batch', () => {
    for (const candidate of aiDiscoveryCandidatesAll) {
      expect(candidate.aiGenerated, candidate.id).toBe(true)
      expect(candidate.reviewStatus, candidate.id).toBe('ai_candidate')
      expect(candidate.autoApply, candidate.id).toBe(false)
      expect(candidate.nextGate, candidate.id).toBe('human_ui_review')
      expect(candidate.sourceRefs.length, candidate.id).toBeGreaterThan(0)
    }
  })

  it('keeps publisher version-unknown Chinese candidates out of high-confidence status', () => {
    const versionUnknown = aiDiscoveryCandidatesAll.filter((item) => item.sourceAuthority === 'publisher_catalog_version_unknown')
    expect(versionUnknown.length).toBeGreaterThan(0)
    expect(versionUnknown.every((item) => item.confidence !== 'high')).toBe(true)
  })

  it('adds official task-group/integrated-practice anchors without presenting them as precise textbook nodes', () => {
    const taskGroups = aiDiscoveryCandidatesAll.filter((item) => item.id.startsWith('ai3-chinese-task-'))
    expect(taskGroups).toHaveLength(6)
    expect(taskGroups.every((item) => item.sourceAuthority === 'official_standard_2022' && item.candidateKind === 'knowledge_domain')).toBe(true)
    expect(aiDiscoveryCandidatesAll.find((item) => item.id === 'ai3-math-integrated-practice')?.sourceAuthority).toBe('official_standard_2022')
  })

  it('supports UI decision export for expansion candidates without auto-application', () => {
    const candidate = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai2-english-g5-person-description')!
    const decision = createAIDiscoveryDecisionAll(
      candidate.id,
      'promote_to_human_review',
      '审核人',
      '小学英语教师',
      '已核对人教社当前五年级上册 Unit 1 资源，建议进入真人精审以确认具体句型和词汇范围。',
      [candidate.sourceRefs[0]],
      '2026-09-09T14:15:00+08:00',
    )
    expect(decision.status).toBe('unsigned_ai_candidate_review')
    expect(decision.autoApply).toBe(false)
    expect(decision.humanVerified).toBe(false)
    expect(decision.nextGate).toBe('human_review_case_creation')
  })
})
