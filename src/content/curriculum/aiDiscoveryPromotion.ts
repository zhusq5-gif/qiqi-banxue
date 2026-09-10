import type { AIDiscoveryDecisionRecord } from './aiDiscovery'
import { aiDiscoveryCandidateAllById } from './aiDiscoveryRegistry'
import type { CurriculumSubject } from './curriculum'

export const AI_PROMOTED_REVIEW_STORAGE_KEY = 'qiqi.curriculum-ai-promoted-review-cases.v1'

export interface AIDiscoveryHumanReviewCaseDraft {
  schema: 'qiqi-curriculum-ai-human-review-case-draft/v1'
  id: string
  candidateId: string
  subject: CurriculumSubject
  grades: number[]
  title: string
  reviewType: 'ai_candidate_content'
  priority: 'review'
  status: 'human_review_case_draft'
  candidateState: {
    candidateKind: string
    label: string
    learningDemand: string
    sourceAuthority: string
    confidence: string
    sourceRefs: string[]
  }
  sourceRefs: string[]
  checklist: string[]
  promotedBy: {
    name: string
    role: string
  }
  promotionRationale: string
  evidenceRefs: string[]
  promotedAt: string
  allowedDecisions: ['accept_candidate', 'revise_candidate', 'defer']
  nextGate: 'human_review_case_activation'
  autoApply: false
  humanVerified: false
}

const checklist = [
  '重新打开候选 sourceRefs，不能只依赖AI evidenceSummary。',
  '确认候选的学科、年级范围和知识颗粒度是否适合进入课程知识体系。',
  '检查与现有 KnowledgeNode 的语义重复；exact label 不重复不代表语义不重复。',
  '出版社目录/活动栏目只能支持其明确范围，不能补推未展示的句型、语法、篇目要求或教材版次。',
  '如接受，也只进入候选变更与后续 approval gate，不直接成为 expert_verified。',
]

export function createAIDiscoveryHumanReviewCaseDraft(decision: AIDiscoveryDecisionRecord): AIDiscoveryHumanReviewCaseDraft {
  if (decision.decision !== 'promote_to_human_review' || decision.nextGate !== 'human_review_case_creation') {
    throw new Error('Only promote_to_human_review decisions can create a human-review case draft')
  }
  if (decision.status !== 'unsigned_ai_candidate_review' || decision.autoApply !== false || decision.humanVerified !== false) {
    throw new Error('AI discovery decision is not in a safe unsigned state')
  }
  const candidate = aiDiscoveryCandidateAllById(decision.candidateId)
  if (!candidate) throw new Error(`AI discovery candidate not found: ${decision.candidateId}`)
  if (!decision.evidenceRefs.some((ref) => candidate.sourceRefs.includes(ref))) {
    throw new Error('Promotion must retain at least one source reference from the current AI candidate')
  }
  return {
    schema: 'qiqi-curriculum-ai-human-review-case-draft/v1',
    id: `human-review-ai:${candidate.id}`,
    candidateId: candidate.id,
    subject: candidate.subject,
    grades: candidate.grades.slice(),
    title: `AI候选精审 · ${candidate.label}`,
    reviewType: 'ai_candidate_content',
    priority: 'review',
    status: 'human_review_case_draft',
    candidateState: {
      candidateKind: candidate.candidateKind,
      label: candidate.label,
      learningDemand: candidate.learningDemand,
      sourceAuthority: candidate.sourceAuthority,
      confidence: candidate.confidence,
      sourceRefs: candidate.sourceRefs.slice(),
    },
    sourceRefs: candidate.sourceRefs.slice(),
    checklist: checklist.slice(),
    promotedBy: { name: decision.reviewerName, role: decision.reviewerRole },
    promotionRationale: decision.rationale,
    evidenceRefs: decision.evidenceRefs.slice(),
    promotedAt: decision.reviewedAt,
    allowedDecisions: ['accept_candidate', 'revise_candidate', 'defer'],
    nextGate: 'human_review_case_activation',
    autoApply: false,
    humanVerified: false,
  }
}

export function mergeAIDiscoveryHumanReviewCaseDrafts(
  existing: AIDiscoveryHumanReviewCaseDraft[],
  draft: AIDiscoveryHumanReviewCaseDraft,
) {
  const others = existing.filter((item) => item.id !== draft.id)
  return [...others, draft].sort((a, b) => a.id.localeCompare(b.id))
}
