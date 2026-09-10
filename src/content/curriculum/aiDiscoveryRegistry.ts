import {
  aiDiscoveryBatch,
  aiDiscoveryCandidates as baseCandidates,
  exactExistingMatches,
  type AIDiscoveryCandidate,
  type AIDiscoveryDecision,
  type AIDiscoveryDecisionRecord,
} from './aiDiscovery'
import { aiDiscoveryExpansion02, aiDiscoveryExpansion02Batch } from './aiDiscoveryExpansion02'
import { aiDiscoveryExpansion03, aiDiscoveryExpansion03Batch } from './aiDiscoveryExpansion03'
import { aiDiscoveryExpansion04, aiDiscoveryExpansion04Batch } from './aiDiscoveryExpansion04'
import { aiDiscoveryExpansion05, aiDiscoveryExpansion05Batch } from './aiDiscoveryExpansion05'
import { aiDiscoveryExpansion06, aiDiscoveryExpansion06Batch } from './aiDiscoveryExpansion06'

export const aiDiscoveryBatches = [
  aiDiscoveryBatch,
  aiDiscoveryExpansion02Batch,
  aiDiscoveryExpansion03Batch,
  aiDiscoveryExpansion04Batch,
  aiDiscoveryExpansion05Batch,
  aiDiscoveryExpansion06Batch,
]
export const aiDiscoveryCandidatesAll: AIDiscoveryCandidate[] = [
  ...baseCandidates,
  ...aiDiscoveryExpansion02,
  ...aiDiscoveryExpansion03,
  ...aiDiscoveryExpansion04,
  ...aiDiscoveryExpansion05,
  ...aiDiscoveryExpansion06,
]

export const aiDiscoveryRegistrySummary = {
  batchCount: aiDiscoveryBatches.length,
  total: aiDiscoveryCandidatesAll.length,
  chinese: aiDiscoveryCandidatesAll.filter((item) => item.subject === 'chinese').length,
  english: aiDiscoveryCandidatesAll.filter((item) => item.subject === 'english').length,
  math: aiDiscoveryCandidatesAll.filter((item) => item.subject === 'math').length,
  highConfidence: aiDiscoveryCandidatesAll.filter((item) => item.confidence === 'high').length,
  exactDuplicateCandidateCount: aiDiscoveryCandidatesAll.filter((item) => exactExistingMatches(item).length > 0).length,
}

export function aiDiscoveryCandidateAllById(id: string) {
  return aiDiscoveryCandidatesAll.find((item) => item.id === id) ?? null
}

export function createAIDiscoveryDecisionAll(
  candidateId: string,
  decision: AIDiscoveryDecision,
  reviewerName: string,
  reviewerRole: string,
  rationale: string,
  evidenceRefs: string[],
  reviewedAt = new Date().toISOString(),
): AIDiscoveryDecisionRecord {
  const candidate = aiDiscoveryCandidateAllById(candidateId)
  if (!candidate) throw new Error(`AI discovery candidate not found: ${candidateId}`)
  if (!reviewerName.trim() || !reviewerRole.trim()) throw new Error('审核人姓名与角色不能为空')
  if (!rationale.trim()) throw new Error('审核理由不能为空')
  if (evidenceRefs.length === 0 || evidenceRefs.some((item) => !item.trim())) throw new Error('至少需要一条实际查看过的证据')
  if (!evidenceRefs.some((ref) => candidate.sourceRefs.includes(ref))) throw new Error('至少一条证据必须来自当前候选 sourceRefs')
  return {
    schema: 'qiqi-curriculum-ai-discovery-decision/v1',
    candidateId,
    decision,
    reviewerName: reviewerName.trim(),
    reviewerRole: reviewerRole.trim(),
    rationale: rationale.trim(),
    evidenceRefs: evidenceRefs.map((item) => item.trim()),
    reviewedAt,
    status: 'unsigned_ai_candidate_review',
    autoApply: false,
    humanVerified: false,
    nextGate: decision === 'promote_to_human_review'
      ? 'human_review_case_creation'
      : decision === 'revise_candidate'
        ? 'candidate_revision'
        : 'none',
  }
}

export { exactExistingMatches }
export type { AIDiscoveryCandidate, AIDiscoveryConfidence, AIDiscoveryDecision } from './aiDiscovery'
