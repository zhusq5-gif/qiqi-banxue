export const AI_REVIEW_HISTORY_STORAGE_KEY = 'qiqi.curriculum-ai-review-history.v1'

export type AIReviewHistoryEventType =
  | 'case_activated'
  | 'decision_v2_recorded'
  | 'regression_passed'
  | 'regression_blocked'
  | 'content_approval_handoff_prepared'
  | 'deferred'

export interface AIReviewHistoryEvent {
  schema: 'qiqi-curriculum-ai-review-history-event/v1'
  id: string
  caseId: string
  candidateId: string
  eventType: AIReviewHistoryEventType
  actorLabel: string
  detail: string
  at: string
  autoApply: false
  humanVerified: false
}

export interface AIReviewHistoryStore {
  schema: 'qiqi-curriculum-ai-review-history-store/v1'
  events: AIReviewHistoryEvent[]
}

function safeId(value: string) {
  return value.replace(/[^A-Za-z0-9._:-]+/g, '-')
}

export function createAIReviewHistoryEvent(input: {
  caseId: string
  candidateId: string
  eventType: AIReviewHistoryEventType
  actorLabel: string
  detail: string
  at?: string
}): AIReviewHistoryEvent {
  const at = input.at ?? new Date().toISOString()
  if (!input.caseId.trim() || !input.candidateId.trim()) throw new Error('History caseId/candidateId are required')
  if (!input.actorLabel.trim()) throw new Error('History actorLabel is required')
  if (!input.detail.trim()) throw new Error('History detail is required')
  if (Number.isNaN(Date.parse(at))) throw new Error('History at must be a valid date/time')
  return {
    schema: 'qiqi-curriculum-ai-review-history-event/v1',
    id: `history:${safeId(input.candidateId)}:${input.eventType}:${Date.parse(at)}`,
    caseId: input.caseId.trim(),
    candidateId: input.candidateId.trim(),
    eventType: input.eventType,
    actorLabel: input.actorLabel.trim(),
    detail: input.detail.trim(),
    at,
    autoApply: false,
    humanVerified: false,
  }
}

export function appendAIReviewHistoryEvent(
  existing: AIReviewHistoryEvent[],
  event: AIReviewHistoryEvent,
  maxEvents = 500,
) {
  const deduped = existing.filter((item) => item.id !== event.id)
  return [...deduped, event]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(-Math.max(1, maxEvents))
}

export function aiReviewHistoryForCandidate(events: AIReviewHistoryEvent[], candidateId: string) {
  return events
    .filter((item) => item.candidateId === candidateId)
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

export function parseAIReviewHistoryStore(raw: string | null): AIReviewHistoryStore {
  if (!raw) return { schema: 'qiqi-curriculum-ai-review-history-store/v1', events: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<AIReviewHistoryStore>
    if (parsed.schema !== 'qiqi-curriculum-ai-review-history-store/v1' || !Array.isArray(parsed.events)) {
      return { schema: 'qiqi-curriculum-ai-review-history-store/v1', events: [] }
    }
    const safeEvents = parsed.events.filter((event): event is AIReviewHistoryEvent =>
      event?.schema === 'qiqi-curriculum-ai-review-history-event/v1'
      && typeof event.id === 'string'
      && typeof event.caseId === 'string'
      && typeof event.candidateId === 'string'
      && typeof event.actorLabel === 'string'
      && typeof event.detail === 'string'
      && typeof event.at === 'string'
      && event.autoApply === false
      && event.humanVerified === false,
    )
    return { schema: 'qiqi-curriculum-ai-review-history-store/v1', events: safeEvents }
  } catch {
    return { schema: 'qiqi-curriculum-ai-review-history-store/v1', events: [] }
  }
}

export function serializeAIReviewHistoryStore(events: AIReviewHistoryEvent[]) {
  const store: AIReviewHistoryStore = {
    schema: 'qiqi-curriculum-ai-review-history-store/v1',
    events: events.slice(),
  }
  return JSON.stringify(store)
}
