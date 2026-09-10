import { describe, expect, it } from 'vitest'
import {
  createContentApprovalHandoff,
  parseContentApprovalHandoff,
} from './contentApprovalHandoff'

const snapshot = {
  schema: 'qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2' as const,
  candidateId: 'ai5-chinese-g5-reading-speed-strategies',
  proposed: { subject: 'chinese', canonicalLabel: '提高阅读速度的方法' },
  regressionChecks: [],
  readyForApprovalGate: true as const,
  autoApply: false as const,
  humanVerified: false as const,
}

describe('content approval browser handoff', () => {
  it('creates a candidate-only handoff without formal approval state', () => {
    const handoff = createContentApprovalHandoff({
      candidateId: 'content:ai5-chinese-g5-reading-speed-strategies',
      subject: 'chinese',
      snapshot,
      evidenceRefs: ['https://www.pep.com.cn/source'],
      source: 'ai_human_review',
      createdAt: '2026-09-09T17:45:00+08:00',
    })
    expect(handoff.status).toBe('browser_handoff_only')
    expect(handoff.autoApply).toBe(false)
    expect(handoff.humanVerified).toBe(false)
  })

  it('round-trips through JSON while re-validating safety flags', () => {
    const handoff = createContentApprovalHandoff({
      candidateId: 'content:test',
      subject: 'english',
      snapshot,
      evidenceRefs: ['evidence://one'],
      source: 'existing_structured_proposal',
      createdAt: '2026-09-09T17:46:00+08:00',
    })
    expect(parseContentApprovalHandoff(JSON.stringify(handoff))).toEqual(handoff)
  })

  it('rejects snapshots that have not passed the approval readiness gate', () => {
    expect(() => createContentApprovalHandoff({
      candidateId: 'content:unsafe',
      subject: 'math',
      snapshot: { ...snapshot, readyForApprovalGate: false },
      evidenceRefs: ['evidence://one'],
      source: 'ai_human_review',
    })).toThrow('not readyForApprovalGate')
  })

  it('rejects empty evidence and tampered handoff state', () => {
    expect(() => createContentApprovalHandoff({
      candidateId: 'content:no-evidence',
      subject: 'chinese',
      snapshot,
      evidenceRefs: [],
      source: 'ai_human_review',
    })).toThrow('at least one evidence')

    const valid = createContentApprovalHandoff({
      candidateId: 'content:test',
      subject: 'chinese',
      snapshot,
      evidenceRefs: ['evidence://one'],
      source: 'ai_human_review',
    })
    expect(() => parseContentApprovalHandoff(JSON.stringify({ ...valid, autoApply: true }))).toThrow('Unsafe content approval handoff state')
  })
})
