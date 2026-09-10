import { describe, expect, it } from 'vitest'
import {
  aiDiscoveryBatches,
  aiDiscoveryCandidatesAll,
  aiDiscoveryRegistrySummary,
  createAIDiscoveryDecisionAll,
} from './aiDiscoveryRegistry'

describe('aggregated AI discovery registry', () => {
  it('combines six source-qualified batches without duplicate candidate IDs', () => {
    expect(aiDiscoveryBatches).toHaveLength(6)
    expect(aiDiscoveryRegistrySummary.total).toBe(82)
    expect(aiDiscoveryRegistrySummary.chinese).toBe(41)
    expect(aiDiscoveryRegistrySummary.english).toBe(30)
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

  it('keeps weaker publisher evidence out of high-confidence status', () => {
    const versionUnknown = aiDiscoveryCandidatesAll.filter((item) => item.sourceAuthority === 'publisher_catalog_version_unknown')
    const teachingResearch = aiDiscoveryCandidatesAll.filter((item) => item.sourceAuthority === 'publisher_teaching_research')
    expect(versionUnknown.length).toBeGreaterThan(0)
    expect(teachingResearch).toHaveLength(4)
    expect(versionUnknown.every((item) => item.confidence !== 'high')).toBe(true)
    expect(teachingResearch.every((item) => item.subject === 'chinese' && item.confidence === 'medium')).toBe(true)
  })

  it('keeps official framework, current publisher activities and teaching research distinct', () => {
    const taskGroups = aiDiscoveryCandidatesAll.filter((item) => item.id.startsWith('ai3-chinese-task-'))
    expect(taskGroups).toHaveLength(6)
    expect(taskGroups.every((item) => item.sourceAuthority === 'official_standard_2022' && item.candidateKind === 'knowledge_domain')).toBe(true)
    expect(aiDiscoveryCandidatesAll.find((item) => item.id === 'ai4-chinese-g3-4-regular-script-writing')?.sourceAuthority).toBe('official_standard_2022')
    expect(aiDiscoveryCandidatesAll.find((item) => item.id === 'ai5-english-g5-phonics-spelling')?.sourceAuthority).toBe('publisher_current_resource')
    expect(aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-chinese-g5-classic-character-deep-reading')?.sourceAuthority).toBe('publisher_teaching_research')
  })

  it('supports UI decision export for Wave06 candidates without auto-application', () => {
    const candidate = aiDiscoveryCandidatesAll.find((item) => item.id === 'ai6-english-g6-pronunciation-patterns')!
    const decision = createAIDiscoveryDecisionAll(
      candidate.id,
      'promote_to_human_review',
      '审核人',
      '小学英语教师',
      '已重新打开人教社六年级当前资源核对 pronunciation 栏目，建议进入真人精审确认具体音形规律和例词范围。',
      [candidate.sourceRefs[0]],
      '2026-09-10T11:55:00+08:00',
    )
    expect(decision.status).toBe('unsigned_ai_candidate_review')
    expect(decision.autoApply).toBe(false)
    expect(decision.humanVerified).toBe(false)
    expect(decision.nextGate).toBe('human_review_case_creation')
  })
})
