import { aiDiscoveryCandidates, type AIDiscoverySourceAuthority } from './aiDiscovery'
import { type CurriculumSubject } from './curriculum'

export type AIDiscoveryCoverageStatus = 'search_required' | 'expand_search' | 'candidate_review_ready'

export interface AIDiscoveryCoverageUnit {
  id: string
  subject: CurriculumSubject
  grade: number
  candidateCount: number
  highConfidenceCount: number
  mediumConfidenceCount: number
  lowConfidenceCount: number
  sourceAuthorities: AIDiscoverySourceAuthority[]
  status: AIDiscoveryCoverageStatus
  note: string
}

const requiredUnits: Array<{ subject: CurriculumSubject; grade: number }> = [
  ...[1, 2, 3, 4, 5, 6].map((grade) => ({ subject: 'chinese' as const, grade })),
  ...[3, 4, 5, 6].map((grade) => ({ subject: 'english' as const, grade })),
  ...[1, 2, 3, 4, 5, 6].map((grade) => ({ subject: 'math' as const, grade })),
]

export const aiDiscoveryCoverageUnits: AIDiscoveryCoverageUnit[] = requiredUnits.map(({ subject, grade }) => {
  const candidates = aiDiscoveryCandidates.filter((item) => item.subject === subject && item.grades.includes(grade))
  const candidateCount = candidates.length
  const sourceAuthorities = Array.from(new Set(candidates.map((item) => item.sourceAuthority)))
  const status: AIDiscoveryCoverageStatus = candidateCount === 0
    ? 'search_required'
    : candidateCount < 3
      ? 'expand_search'
      : 'candidate_review_ready'
  const note = status === 'search_required'
    ? '当前 AI candidate batch 未覆盖该学科年级；需要下一批 source-qualified 搜索。'
    : status === 'expand_search'
      ? '已有少量候选，但不足以代表年级知识覆盖；继续扩充不同领域/来源。'
      : '已有至少3条候选，可先进入 UI 审校；仍不代表该年级知识完整。'
  return {
    id: `ai-coverage:${subject}:g${grade}`,
    subject,
    grade,
    candidateCount,
    highConfidenceCount: candidates.filter((item) => item.confidence === 'high').length,
    mediumConfidenceCount: candidates.filter((item) => item.confidence === 'medium').length,
    lowConfidenceCount: candidates.filter((item) => item.confidence === 'low').length,
    sourceAuthorities,
    status,
    note,
  }
})

export const aiDiscoveryNextSearchQueue = aiDiscoveryCoverageUnits
  .filter((item) => item.status !== 'candidate_review_ready')
  .slice()
  .sort((a, b) => {
    const priority = (status: AIDiscoveryCoverageStatus) => status === 'search_required' ? 0 : 1
    return priority(a.status) - priority(b.status) || a.candidateCount - b.candidateCount || a.subject.localeCompare(b.subject) || a.grade - b.grade
  })

export const aiDiscoveryCoverageSummary = {
  requiredUnitCount: aiDiscoveryCoverageUnits.length,
  searchRequiredCount: aiDiscoveryCoverageUnits.filter((item) => item.status === 'search_required').length,
  expandSearchCount: aiDiscoveryCoverageUnits.filter((item) => item.status === 'expand_search').length,
  reviewReadyCount: aiDiscoveryCoverageUnits.filter((item) => item.status === 'candidate_review_ready').length,
  note: '这是 AI candidate 搜索覆盖矩阵，不是正式课程知识覆盖率。',
}

export function aiDiscoveryCoverageFor(subject: CurriculumSubject, grade: number) {
  return aiDiscoveryCoverageUnits.find((item) => item.subject === subject && item.grade === grade) ?? null
}
