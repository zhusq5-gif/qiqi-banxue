import { describe, expect, it } from 'vitest'
import {
  aiReviewHistoryForCandidate,
  appendAIReviewHistoryEvent,
  createAIReviewHistoryEvent,
  parseAIReviewHistoryStore,
  serializeAIReviewHistoryStore,
} from './aiReviewHistory'

describe('AI review local history ledger', () => {
  it('records governance events without elevating them to verified status', () => {
    const event = createAIReviewHistoryEvent({
      caseId: 'human-review-ai:ai6-english-g6-pronunciation-patterns',
      candidateId: 'ai6-english-g6-pronunciation-patterns',
      eventType: 'decision_v2_recorded',
      actorLabel: '小学英语教师',
      detail: 'recorded unsigned decision v2',
      at: '2026-09-10T12:10:00+08:00',
    })
    expect(event.autoApply).toBe(false)
    expect(event.humanVerified).toBe(false)
    expect(event.schema).toBe('qiqi-curriculum-ai-review-history-event/v1')
  })

  it('deduplicates same event id and bounds retained history', () => {
    const first = createAIReviewHistoryEvent({
      caseId: 'case:a', candidateId: 'candidate:a', eventType: 'case_activated', actorLabel: 'reviewer', detail: 'activated', at: '2026-09-10T00:00:00Z',
    })
    const second = createAIReviewHistoryEvent({
      caseId: 'case:a', candidateId: 'candidate:a', eventType: 'regression_passed', actorLabel: 'reviewer', detail: 'passed', at: '2026-09-10T00:01:00Z',
    })
    let events = appendAIReviewHistoryEvent([], first, 2)
    events = appendAIReviewHistoryEvent(events, first, 2)
    events = appendAIReviewHistoryEvent(events, second, 2)
    expect(events).toHaveLength(2)
    expect(events[1].eventType).toBe('regression_passed')
  })

  it('filters history by candidate newest-first', () => {
    const older = createAIReviewHistoryEvent({
      caseId: 'case:a', candidateId: 'candidate:a', eventType: 'case_activated', actorLabel: 'reviewer', detail: 'activated', at: '2026-09-10T00:00:00Z',
    })
    const newer = createAIReviewHistoryEvent({
      caseId: 'case:a', candidateId: 'candidate:a', eventType: 'decision_v2_recorded', actorLabel: 'reviewer', detail: 'decision', at: '2026-09-10T00:05:00Z',
    })
    const other = createAIReviewHistoryEvent({
      caseId: 'case:b', candidateId: 'candidate:b', eventType: 'deferred', actorLabel: 'reviewer', detail: 'deferred', at: '2026-09-10T00:03:00Z',
    })
    expect(aiReviewHistoryForCandidate([older, other, newer], 'candidate:a').map((item) => item.eventType)).toEqual(['decision_v2_recorded', 'case_activated'])
  })

  it('round-trips safe stores and rejects unsafe flags from malformed local storage', () => {
    const event = createAIReviewHistoryEvent({
      caseId: 'case:a', candidateId: 'candidate:a', eventType: 'regression_blocked', actorLabel: 'reviewer', detail: 'blocked', at: '2026-09-10T00:00:00Z',
    })
    const parsed = parseAIReviewHistoryStore(serializeAIReviewHistoryStore([event]))
    expect(parsed.events).toHaveLength(1)

    const unsafe = JSON.stringify({
      schema: 'qiqi-curriculum-ai-review-history-store/v1',
      events: [{ ...event, humanVerified: true }],
    })
    expect(parseAIReviewHistoryStore(unsafe).events).toHaveLength(0)
  })
})
