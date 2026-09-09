import { aiDiscoveryCandidatesAll, type AIDiscoveryCandidate } from './aiDiscoveryRegistry'
import type { CurriculumSubject } from './curriculum'

export type AIDiscoveryDomainStatus = 'search_required' | 'shallow_candidates' | 'review_pool_ready'

export interface AIDiscoveryDomainDefinition {
  id: string
  subject: CurriculumSubject
  label: string
  group: 'curriculum_area' | 'task_group' | 'language_dimension'
}

export interface AIDiscoveryDomainCoverageCell {
  id: string
  subject: CurriculumSubject
  grade: number
  domainId: string
  domainLabel: string
  candidateIds: string[]
  candidateCount: number
  highConfidenceCount: number
  status: AIDiscoveryDomainStatus
  note: string
}

export const aiDiscoveryDomains: AIDiscoveryDomainDefinition[] = [
  { id: 'cn-literacy-writing', subject: 'chinese', label: '识字与写字', group: 'curriculum_area' },
  { id: 'cn-reading-appreciation', subject: 'chinese', label: '阅读与鉴赏', group: 'curriculum_area' },
  { id: 'cn-expression-communication', subject: 'chinese', label: '表达与交流', group: 'curriculum_area' },
  { id: 'cn-organization-inquiry', subject: 'chinese', label: '梳理与探究', group: 'curriculum_area' },
  { id: 'cn-task-language-accumulation', subject: 'chinese', label: '语言文字积累与梳理', group: 'task_group' },
  { id: 'cn-task-practical-reading', subject: 'chinese', label: '实用性阅读与交流', group: 'task_group' },
  { id: 'cn-task-literary-reading', subject: 'chinese', label: '文学阅读与创意表达', group: 'task_group' },
  { id: 'cn-task-critical-reading', subject: 'chinese', label: '思辨性阅读与表达', group: 'task_group' },
  { id: 'cn-task-whole-book', subject: 'chinese', label: '整本书阅读', group: 'task_group' },
  { id: 'cn-task-interdisciplinary', subject: 'chinese', label: '跨学科学习', group: 'task_group' },
  { id: 'en-phonics', subject: 'english', label: '语音与拼读', group: 'language_dimension' },
  { id: 'en-language-knowledge', subject: 'english', label: '语言知识', group: 'language_dimension' },
  { id: 'en-communication', subject: 'english', label: '交际功能', group: 'language_dimension' },
  { id: 'en-listening-speaking', subject: 'english', label: '听说', group: 'language_dimension' },
  { id: 'en-reading', subject: 'english', label: '阅读', group: 'language_dimension' },
  { id: 'en-writing', subject: 'english', label: '写作', group: 'language_dimension' },
  { id: 'en-culture', subject: 'english', label: '文化意识', group: 'language_dimension' },
  { id: 'math-number-algebra', subject: 'math', label: '数与代数', group: 'curriculum_area' },
  { id: 'math-geometry', subject: 'math', label: '图形与几何', group: 'curriculum_area' },
  { id: 'math-statistics-probability', subject: 'math', label: '统计与概率', group: 'curriculum_area' },
  { id: 'math-integrated-practice', subject: 'math', label: '综合与实践', group: 'curriculum_area' },
]

const explicitDomainByCandidateId: Record<string, string[]> = {
  'ai3-chinese-task-language-accumulation': ['cn-task-language-accumulation'],
  'ai3-chinese-task-practical-reading': ['cn-task-practical-reading'],
  'ai3-chinese-task-literary-reading': ['cn-task-literary-reading'],
  'ai3-chinese-task-critical-reading': ['cn-task-critical-reading'],
  'ai3-chinese-task-whole-book': ['cn-task-whole-book'],
  'ai3-chinese-task-interdisciplinary': ['cn-task-interdisciplinary'],
  'ai3-math-integrated-practice': ['math-integrated-practice'],
  'ai3-math-theme-project-learning': ['math-integrated-practice'],
  'ai3-english-g4-integrated-rules-literacy': ['en-communication', 'en-listening-speaking', 'en-reading', 'en-writing'],
  'ai3-english-g5-phonics-spelling': ['en-phonics', 'en-language-knowledge'],
  'ai3-english-g5-read-write': ['en-reading', 'en-writing'],
  'ai3-english-g6-theme-read-write': ['en-reading', 'en-writing'],
}

function includeByText(candidate: AIDiscoveryCandidate, domainIds: Set<string>) {
  const text = `${candidate.label} ${candidate.learningDemand}`.toLowerCase()
  if (candidate.subject === 'chinese') {
    if (/拼音|声母|韵母|字词|汉字|笔画|偏旁|书写|实词|虚词/.test(text)) {
      domainIds.add('cn-literacy-writing')
      domainIds.add('cn-task-language-accumulation')
    }
    if (/阅读|读书|古诗|诗词|文言|表达效果|文本/.test(text)) domainIds.add('cn-reading-appreciation')
    if (/表达|交流|写作|习作|口语/.test(text)) domainIds.add('cn-expression-communication')
    if (/辨析|梳理|归纳|探究|研究/.test(text)) domainIds.add('cn-organization-inquiry')
    if (/整本书|读书方法|阅读经验/.test(text)) domainIds.add('cn-task-whole-book')
    if (/古诗|诗词|文学|童话|故事/.test(text)) domainIds.add('cn-task-literary-reading')
  }
  if (candidate.subject === 'english') {
    if (/phonics|pronunciation|语音|拼读|拼写|spell/.test(text)) {
      domainIds.add('en-phonics')
      domainIds.add('en-language-knowledge')
    }
    if (candidate.candidateKind === 'communication_function' || /交流|交际|talk|规则|购物|时间|人物|饮食|主题/.test(text)) {
      domainIds.add('en-communication')
      domainIds.add('en-listening-speaking')
    }
    if (/read|阅读|短文/.test(text)) domainIds.add('en-reading')
    if (/write|写作|书面|拼写/.test(text)) domainIds.add('en-writing')
    if (/文化|谚语|proverb|中外/.test(text)) domainIds.add('en-culture')
    if (/词汇|句型|语言知识|语法/.test(text)) domainIds.add('en-language-knowledge')
  }
  if (candidate.subject === 'math') {
    if (/数与运算|数量关系|数与代数|分数|运算|数量/.test(text)) domainIds.add('math-number-algebra')
    if (/图形|位置|运动|测量|几何/.test(text)) domainIds.add('math-geometry')
    if (/数据|统计|概率|可能性|随机/.test(text)) domainIds.add('math-statistics-probability')
    if (/综合与实践|项目学习|主题活动|真实问题/.test(text)) domainIds.add('math-integrated-practice')
  }
}

export function aiDiscoveryDomainIdsForCandidate(candidate: AIDiscoveryCandidate) {
  const domainIds = new Set(explicitDomainByCandidateId[candidate.id] ?? [])
  includeByText(candidate, domainIds)
  return Array.from(domainIds)
}

function gradesForSubject(subject: CurriculumSubject) {
  return subject === 'english' ? [3, 4, 5, 6] : [1, 2, 3, 4, 5, 6]
}

export const aiDiscoveryDomainCoverageCells: AIDiscoveryDomainCoverageCell[] = aiDiscoveryDomains.flatMap((domain) =>
  gradesForSubject(domain.subject).map((grade) => {
    const candidates = aiDiscoveryCandidatesAll.filter((candidate) =>
      candidate.subject === domain.subject
      && candidate.grades.includes(grade)
      && aiDiscoveryDomainIdsForCandidate(candidate).includes(domain.id),
    )
    const candidateCount = candidates.length
    const status: AIDiscoveryDomainStatus = candidateCount === 0
      ? 'search_required'
      : candidateCount === 1
        ? 'shallow_candidates'
        : 'review_pool_ready'
    return {
      id: `ai-domain-coverage:${domain.subject}:g${grade}:${domain.id}`,
      subject: domain.subject,
      grade,
      domainId: domain.id,
      domainLabel: domain.label,
      candidateIds: candidates.map((item) => item.id),
      candidateCount,
      highConfidenceCount: candidates.filter((item) => item.confidence === 'high').length,
      status,
      note: status === 'search_required'
        ? '该领域当前没有AI候选；优先生成下一批source-qualified搜索任务。'
        : status === 'shallow_candidates'
          ? '仅有1条候选；继续搜索不同来源或不同知识颗粒度。'
          : '已有至少2条候选可进入UI审校；这仍不是课程完整性结论。',
    }
  }),
)

export const aiDiscoveryDomainSearchQueue = aiDiscoveryDomainCoverageCells
  .filter((cell) => cell.status !== 'review_pool_ready')
  .slice()
  .sort((a, b) => {
    const rank = (status: AIDiscoveryDomainStatus) => status === 'search_required' ? 0 : 1
    return rank(a.status) - rank(b.status) || a.candidateCount - b.candidateCount || a.subject.localeCompare(b.subject) || a.grade - b.grade || a.domainLabel.localeCompare(b.domainLabel)
  })

export const aiDiscoveryDomainCoverageSummary = {
  cellCount: aiDiscoveryDomainCoverageCells.length,
  searchRequiredCount: aiDiscoveryDomainCoverageCells.filter((cell) => cell.status === 'search_required').length,
  shallowCount: aiDiscoveryDomainCoverageCells.filter((cell) => cell.status === 'shallow_candidates').length,
  reviewPoolReadyCount: aiDiscoveryDomainCoverageCells.filter((cell) => cell.status === 'review_pool_ready').length,
  note: '领域矩阵只用于AI搜索规划与UI审校排队，不是正式课程覆盖率或知识完整率。',
}
