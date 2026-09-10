import { curriculumSeed, type CurriculumSubject } from './curriculum'
import { mathNormalizedDataset } from './mathNormalized'

export type AIDiscoveryCandidateKind =
  | 'knowledge_domain'
  | 'knowledge_node'
  | 'communication_function'
  | 'textbook_theme'

export type AIDiscoverySourceAuthority =
  | 'official_standard_2022'
  | 'publisher_current_resource'
  | 'publisher_teaching_research'
  | 'publisher_catalog_version_unknown'

export type AIDiscoveryConfidence = 'high' | 'medium' | 'low'
export type AIDiscoveryDecision = 'promote_to_human_review' | 'revise_candidate' | 'reject_candidate' | 'defer'

export interface AIDiscoveryCandidate {
  id: string
  subject: CurriculumSubject
  grades: number[]
  candidateKind: AIDiscoveryCandidateKind
  label: string
  learningDemand: string
  evidenceSummary: string
  sourceRefs: string[]
  sourceAuthority: AIDiscoverySourceAuthority
  sourceNote: string
  confidence: AIDiscoveryConfidence
  aiGenerated: true
  reviewStatus: 'ai_candidate'
  autoApply: false
  nextGate: 'human_ui_review'
}

export interface AIDiscoveryDecisionRecord {
  schema: 'qiqi-curriculum-ai-discovery-decision/v1'
  candidateId: string
  decision: AIDiscoveryDecision
  reviewerName: string
  reviewerRole: string
  rationale: string
  evidenceRefs: string[]
  reviewedAt: string
  status: 'unsigned_ai_candidate_review'
  autoApply: false
  humanVerified: false
  nextGate: 'human_review_case_creation' | 'candidate_revision' | 'none'
}

const MOE_2022 = 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf'
const PEP_MATH_INTRO = 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/xx/202409/t20240920_1995566.html'
const PEP_CHINESE_G1S = 'https://www.pep.com.cn/products/jc/jks/201608/t20160823_1369629.shtml'
const PEP_CHINESE_G4X = 'https://www.pep.com.cn/products/zhytu/gjshnj/csxp/tbzc/202306/t20230628_1984167.shtml'
const PEP_ENGLISH_G3S = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/3s/'
const PEP_ENGLISH_G3X = 'https://www.pep.com.cn/zslth/yyptzy/xypep/3x/'
const PEP_ENGLISH_INTRO = 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/xx/202409/t20240920_1995564.html'
const PEP_ENGLISH_G6S = 'https://www.pep.com.cn/zslth/yyptzy/xypep/6s/'

export const aiDiscoveryBatch = {
  schema: 'qiqi-curriculum-ai-discovery-batch/v1' as const,
  batchId: 'ai-discovery-2026-09-09-wave01',
  generatedAt: '2026-09-09T13:38:00+08:00',
  note: 'AI 搜索仅生成候选。高置信主要来自教育部2022数学课标；出版社资源页用于教材主题/功能候选，不自动推断教材版次或正式知识点。',
}

export const aiDiscoveryCandidates: AIDiscoveryCandidate[] = [
  {
    id: 'ai-math-g1-2-number-operation',
    subject: 'math',
    grades: [1, 2],
    candidateKind: 'knowledge_domain',
    label: '数与运算',
    learningDemand: '在第一学段建立数概念与基本运算的学习主线，并作为后续具体知识节点的领域锚点。',
    evidenceSummary: '教育部2022数学课标明确小学数与代数包含“数与运算”和“数量关系”两个主题。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点，不等同于某一教材单元。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g1-2-quantity-relation',
    subject: 'math',
    grades: [1, 2],
    candidateKind: 'knowledge_domain',
    label: '数量关系',
    learningDemand: '在具体情境中理解数量之间的基本关系，为解决简单实际问题建立结构化入口。',
    evidenceSummary: '教育部2022数学课标将“数量关系”列为小学数与代数主题之一。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g1-2-shape-measurement',
    subject: 'math',
    grades: [1, 2],
    candidateKind: 'knowledge_domain',
    label: '图形的认识与测量',
    learningDemand: '认识常见图形并形成初步测量经验，为后续图形性质和测量方法学习提供领域入口。',
    evidenceSummary: '教育部2022数学课标在第一学段图形与几何中列出“图形的认识与测量”。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g1-2-data-classification',
    subject: 'math',
    grades: [1, 2],
    candidateKind: 'knowledge_domain',
    label: '数据分类',
    learningDemand: '按给定标准对数据或对象进行分类，形成初步数据意识。',
    evidenceSummary: '教育部2022数学课标在第一学段统计与概率中列出“数据分类”。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g3-4-position-motion',
    subject: 'math',
    grades: [3, 4],
    candidateKind: 'knowledge_domain',
    label: '图形的位置与运动',
    learningDemand: '在第二学段发展位置描述、图形运动和空间想象相关学习主线。',
    evidenceSummary: '教育部2022数学课标在小学图形与几何领域包含“图形的位置与运动”主题。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g3-4-data-collection-expression',
    subject: 'math',
    grades: [3, 4],
    candidateKind: 'knowledge_domain',
    label: '数据的收集、整理与表达',
    learningDemand: '围绕真实问题经历数据收集、整理与表达过程，发展数据意识。',
    evidenceSummary: '教育部2022数学课标将“数据的收集、整理与表达”作为小学统计与概率的重要主题。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-g5-6-random-possibility',
    subject: 'math',
    grades: [5, 6],
    candidateKind: 'knowledge_domain',
    label: '随机现象发生的可能性',
    learningDemand: '在高年级结合具体情境描述随机现象发生的可能性，为后续概率学习建立定性认识。',
    evidenceSummary: '教育部2022数学课标小学统计与概率领域包含随机现象发生可能性的学习内容。',
    sourceRefs: [MOE_2022],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程标准领域锚点，不自动推断具体概率计算要求。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-math-primary-project-learning',
    subject: 'math',
    grades: [1, 2, 3, 4, 5, 6],
    candidateKind: 'knowledge_domain',
    label: '综合与实践',
    learningDemand: '在真实或综合情境中综合运用数学知识与方法解决问题，形成跨领域实践经验。',
    evidenceSummary: '2022数学课标将“综合与实践”作为义务教育数学课程内容领域之一；人教社新教材介绍也强调主题活动、项目学习等实践形态。',
    sourceRefs: [MOE_2022, PEP_MATH_INTRO],
    sourceAuthority: 'official_standard_2022',
    sourceNote: '课程领域锚点；具体项目任务需依据年级与教材另行建立候选。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-pinyin-start',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '汉语拼音起步与音节拼读',
    learningDemand: '在一年级起步阶段建立声韵调与音节拼读意识，为识字、正音和自主阅读提供工具支持。',
    evidenceSummary: '人教社公开的一年级语文教材介绍强调入学阶段安排汉语拼音并服务识字阅读。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '出版社公开教材介绍，网页较早；只能作为候选发现和历史结构证据，不能认定当前版次。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-context-literacy',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '语境识字与生活识字',
    learningDemand: '在课文、图文和生活情境中建立汉字音形义联系，发展初步自主识字意识。',
    evidenceSummary: '人教社一年级教材介绍强调识字与阅读结合并关注学生已有生活经验。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '历史教材介绍层候选，需用当前教材和课标进一步核验。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-picture-speaking',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '借助图画进行口头表达',
    learningDemand: '观察图画和生活情境，用完整、连贯的简单语句表达所见所想。',
    evidenceSummary: '人教社一年级教材介绍呈现图文结合、口语交际等起步学习安排。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '只生成低置信/中置信候选，不据历史介绍推断当前教材具体单元。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-reading-habit',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '初步阅读习惯与朗读体验',
    learningDemand: '在教师指导下形成基本阅读习惯，通过朗读和图文阅读建立阅读兴趣。',
    evidenceSummary: '人教社教材介绍强调一年级学生阅读兴趣、朗读和阅读习惯培养。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '历史资源候选；应与2022课标学段要求和当前教材共同核验。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-basic-writing-posture',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '写字姿势与基本书写规范',
    learningDemand: '建立正确执笔、坐姿和基础汉字书写规范意识。',
    evidenceSummary: '一年级教材介绍和小学语文起步教学均将规范书写作为基础学习内容；当前仅作为待课标/教材双证据核对候选。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '候选需要进一步绑定2022课标具体学段证据。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g4-science-reading-support',
    subject: 'chinese',
    grades: [4],
    candidateKind: 'knowledge_node',
    label: '科普阅读中的信息提取与问题梳理',
    learningDemand: '在科普类阅读中围绕问题筛选、提取和组织信息。',
    evidenceSummary: '人教社四年级配套资源页面提供与科普、词句理解相关的辅助学习材料。',
    sourceRefs: [PEP_CHINESE_G4X],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '配套资源目录只能支持主题级候选；需要回到教材和课标核查实际学习要求。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g4-context-word-meaning',
    subject: 'chinese',
    grades: [4],
    candidateKind: 'knowledge_node',
    label: '结合语境理解词语含义',
    learningDemand: '结合上下文和具体语境理解词语在文本中的意义与表达作用。',
    evidenceSummary: '人教社四年级语文配套字词资源强调词语理解与积累，可作为进一步核验的候选入口。',
    sourceRefs: [PEP_CHINESE_G4X],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '不是当前教材条款级证据，需要真人核对具体篇目和课标要求。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-greeting-function',
    subject: 'english',
    grades: [3],
    candidateKind: 'communication_function',
    label: '问候、介绍与基本社交交流',
    learningDemand: '在真实或模拟情境中使用英语完成基本问候、自我介绍和同伴交流。',
    evidenceSummary: '人教社当前三年级资源设置面向起步交际的单元与Lets talk等活动。',
    sourceRefs: [PEP_ENGLISH_G3S],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '当前出版社资源可确认活动与主题存在；具体句型和词汇范围需进一步打开资源核验。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-read-write-entry',
    subject: 'english',
    grades: [3],
    candidateKind: 'knowledge_node',
    label: '英语起步阅读与书写活动',
    learningDemand: '通过单元中的阅读、听辨和基础书写活动建立音形义联系与简单读写经验。',
    evidenceSummary: '人教社当前三年级上/下册数字资源包含Read and write、Start to read等活动结构。',
    sourceRefs: [PEP_ENGLISH_G3S, PEP_ENGLISH_G3X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '栏目级证据，不自动推断具体词汇、语法或篇章长度。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-listening-speaking',
    subject: 'english',
    grades: [3],
    candidateKind: 'knowledge_node',
    label: '听辨与模仿表达',
    learningDemand: '通过听、说、模仿和简单应答建立英语语音感知和基本口头表达经验。',
    evidenceSummary: '三年级当前数字资源以Lets talk、listen/repeat等活动组织大量听说练习。',
    sourceRefs: [PEP_ENGLISH_G3S, PEP_ENGLISH_G3X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '活动结构候选，不代表具体语音规则已经核验。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-primary-core-literacy',
    subject: 'english',
    grades: [3, 4, 5, 6],
    candidateKind: 'knowledge_domain',
    label: '英语核心素养综合发展',
    learningDemand: '围绕语言能力、文化意识、思维品质和学习能力发展小学英语综合学习。',
    evidenceSummary: '人教社新教材介绍依据2022英语课标强调核心素养导向和主题语境中的综合语言实践。',
    sourceRefs: [PEP_ENGLISH_INTRO],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '课程框架候选，不应转成单一KnowledgeNode。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g6-theme-function',
    subject: 'english',
    grades: [6],
    candidateKind: 'textbook_theme',
    label: '六年级主题语境综合交流',
    learningDemand: '围绕地点、交往、健康、金钱、太空、能源等主题开展听说读写综合语言实践。',
    evidenceSummary: '人教社当前六年级上册数字资源展示Amazing places、Getting together、Healthy life等单元主题。',
    sourceRefs: [PEP_ENGLISH_G6S],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '只确认当前资源页面展示的主题层级，不推断具体语法点。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
]

function normalizeLabel(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

export function exactExistingMatches(candidate: AIDiscoveryCandidate) {
  const key = normalizeLabel(candidate.label)
  const seedMatches = curriculumSeed.entries.filter((entry) => normalizeLabel(entry.label) === key)
  const mathMatches = mathNormalizedDataset.knowledgeNodes.filter((node) => normalizeLabel(node.label) === key)
  return [
    ...seedMatches.map((entry) => ({ id: entry.id, subject: entry.subject, grade: entry.grade, label: entry.label, source: 'curriculum_seed' as const })),
    ...mathMatches.map((node) => ({ id: node.id, subject: 'math' as const, grade: null, label: node.label, source: 'math_normalized' as const })),
  ]
}

export const aiDiscoverySummary = {
  total: aiDiscoveryCandidates.length,
  chinese: aiDiscoveryCandidates.filter((item) => item.subject === 'chinese').length,
  english: aiDiscoveryCandidates.filter((item) => item.subject === 'english').length,
  math: aiDiscoveryCandidates.filter((item) => item.subject === 'math').length,
  highConfidence: aiDiscoveryCandidates.filter((item) => item.confidence === 'high').length,
  exactDuplicateCandidateCount: aiDiscoveryCandidates.filter((item) => exactExistingMatches(item).length > 0).length,
}

export function aiDiscoveryCandidateById(id: string) {
  return aiDiscoveryCandidates.find((item) => item.id === id) ?? null
}

export function createAIDiscoveryDecision(
  candidateId: string,
  decision: AIDiscoveryDecision,
  reviewerName: string,
  reviewerRole: string,
  rationale: string,
  evidenceRefs: string[],
  reviewedAt = new Date().toISOString(),
): AIDiscoveryDecisionRecord {
  const candidate = aiDiscoveryCandidateById(candidateId)
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
