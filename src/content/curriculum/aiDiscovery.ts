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
    learningDemand: '描述图形位置并认识基本运动变化，为更高年级空间观念学习建立领域入口。',
    evidenceSummary: '教育部2022数学课标在第二、第三学段图形与几何中列出“图形的位置与运动”。',
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
    id: 'ai-math-g3-4-data-collect-express',
    subject: 'math',
    grades: [3, 4],
    candidateKind: 'knowledge_domain',
    label: '数据的收集、整理与表达',
    learningDemand: '经历数据收集、整理和表达的过程，理解用数据描述现实问题的基本方法。',
    evidenceSummary: '教育部2022数学课标在第二学段统计与概率中列出“数据的收集、整理与表达”。',
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
    learningDemand: '在具体随机现象中比较和描述事件发生的可能性，为概率学习建立直观基础。',
    evidenceSummary: '教育部2022数学课标在第三学段统计与概率中列出“随机现象发生的可能性”。',
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
    id: 'ai-math-structure-unit-section-kp',
    subject: 'math',
    grades: [1, 2, 3, 4, 5, 6],
    candidateKind: 'knowledge_domain',
    label: '单元—小节—知识点层级',
    learningDemand: '把教材目录结构与知识节点身份分离：教材单元/小节记录出现位置，知识点保持可跨年级复用。',
    evidenceSummary: '人教社2024新教材简介说明每册以单元划分知识群，单元中按知识序列分小节，小节下再分知识点。',
    sourceRefs: [PEP_MATH_INTRO],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '用于数据模型/教材结构候选，不是数学知识内容本身。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-pinyin-vowels',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '汉语拼音：单韵母 a、o、e、i、u、ü',
    learningDemand: '认读并正确发音基础单韵母，建立后续拼读学习的语音基础。',
    evidenceSummary: '人教社一年级上册产品目录列出 a o e、i u ü 等拼音内容。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '该产品页说明依据2011课标，不能据此认定为2026当前版次；仅作候选发现。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-pinyin-initials',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '汉语拼音：基础声母认读与拼读',
    learningDemand: '认读常见声母，并与韵母组合进行基础音节拼读。',
    evidenceSummary: '人教社一年级上册目录连续列出 b p m f、d t n l、g k h、j q x 等声母学习内容。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '目录级证据；知识边界和当前版次都需语文教师复核。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-pinyin-compound-nasal',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '复韵母与鼻韵母拼读',
    learningDemand: '认读常见复韵母和前后鼻韵母，并在音节中完成准确拼读。',
    evidenceSummary: '人教社一年级上册目录列出 ai ei ui、ao ou iu、ie ue er、an en in un ün、ang eng ing ong。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '目录级证据；具体拆分粒度需真人审校。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-basic-strokes-radicals',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '常用笔画与偏旁的识认',
    learningDemand: '识认常用笔画和偏旁名称，并用于初步分析汉字字形。',
    evidenceSummary: '人教社一年级上册目录包含“常用笔画名称表”“常用偏旁名称表”。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '目录/附表级证据，需与2022课标和当前教材版次再次核对。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g1-oral-follow-instruction',
    subject: 'chinese',
    grades: [1],
    candidateKind: 'knowledge_node',
    label: '口语交际：听清指令并作出回应',
    learningDemand: '在口语交际活动中听清基本指令，并按要求完成动作或口头回应。',
    evidenceSummary: '人教社一年级上册目录包含口语交际“我说你做”。',
    sourceRefs: [PEP_CHINESE_G1S],
    sourceAuthority: 'publisher_catalog_version_unknown',
    sourceNote: '由活动标题推断学习功能，置信度较低，必须真人确认。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g4-poetry-reading',
    subject: 'chinese',
    grades: [4],
    candidateKind: 'textbook_theme',
    label: '古诗词阅读与诵读',
    learningDemand: '在古诗词学习中结合朗读、想象和语境理解诗句与情感。',
    evidenceSummary: '人教社四年级下册同步字词学习手册目录含“古诗词三首”“短诗三首”“古诗三首”等多组诗歌内容。',
    sourceRefs: [PEP_CHINESE_G4X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '当前出版社配套资源支持主题存在，但具体知识点和学业要求需教师细化。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-chinese-g4-science-expository-reading',
    subject: 'chinese',
    grades: [4],
    candidateKind: 'textbook_theme',
    label: '科普与说明性文本的信息提取',
    learningDemand: '阅读科普/说明性文本时提取关键信息，梳理说明对象与主要信息。',
    evidenceSummary: '人教社四年级下册第二单元集中出现《琥珀》《飞向蓝天的恐龙》《纳米技术就在我们身边》《千年梦圆在今朝》。',
    sourceRefs: [PEP_CHINESE_G4X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '由单元选文主题推断阅读能力候选，属于AI解释，必须真人确认。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-greeting-politeness',
    subject: 'english',
    grades: [3],
    candidateKind: 'communication_function',
    label: '初次见面问候与礼貌表达',
    learningDemand: '在结识新朋友的情境中使用基本问候语，并用礼貌表达完成初步交流。',
    evidenceSummary: '人教社2024新教材简介以三下 Unit 1 为例，明确提出如何认识新朋友、如何问候、如何表现礼貌等引导问题。',
    sourceRefs: [PEP_ENGLISH_INTRO, PEP_ENGLISH_G3X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '出版社当前新教材介绍直接支持交际功能方向，具体句型仍需教材页证据。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-origin-country',
    subject: 'english',
    grades: [3],
    candidateKind: 'communication_function',
    label: '询问并表达来自哪里',
    learningDemand: '在初次见面情境中询问他人来自哪里，并表达自己的国家或地区来源。',
    evidenceSummary: '人教社三年级下册 Unit 1 页面公开对话包含询问来自哪个国家以及回答来自英国/中国等内容。',
    sourceRefs: [PEP_ENGLISH_G3X],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '有公开对话证据；候选仍需英语教师核对语言范围和年级适配。',
    confidence: 'high',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g3-making-friends-theme',
    subject: 'english',
    grades: [3],
    candidateKind: 'textbook_theme',
    label: '结识朋友与基本个人信息交流',
    learningDemand: '围绕结识朋友的主题完成问候、简单个人信息交换和基础互动。',
    evidenceSummary: '人教社小学英语三年级上册当前资源页列出 Unit 1 Making friends。',
    sourceRefs: [PEP_ENGLISH_G3S],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '仅由单元主题与活动结构推断，具体知识点需人工细化。',
    confidence: 'medium',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g6-places-travel-theme',
    subject: 'english',
    grades: [6],
    candidateKind: 'textbook_theme',
    label: '地点与出行主题表达',
    learningDemand: '围绕地点和出行情境理解并表达基本信息，作为后续具体词汇/句型候选的主题入口。',
    evidenceSummary: '人教社六年级上册当前资源页列出 Unit 1 Amazing places。',
    sourceRefs: [PEP_ENGLISH_G6S],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '由单元标题推断主题入口，置信度较低，不直接生成句型知识点。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
  {
    id: 'ai-english-g6-healthy-life-theme',
    subject: 'english',
    grades: [6],
    candidateKind: 'textbook_theme',
    label: '健康生活主题表达',
    learningDemand: '围绕健康生活主题理解和交流常见生活方式、习惯或建议。',
    evidenceSummary: '人教社六年级上册当前资源页列出 Unit 3 Healthy life。',
    sourceRefs: [PEP_ENGLISH_G6S],
    sourceAuthority: 'publisher_current_resource',
    sourceNote: '由单元标题推断主题入口，具体语言功能需要真人查看教材后确认。',
    confidence: 'low',
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  },
]

function normalizedLabel(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

const existingLabels = [
  ...curriculumSeed.entries.map((entry) => ({ id: entry.id, subject: entry.subject, label: entry.label })),
  ...mathNormalizedDataset.knowledgeNodes.map((node) => ({ id: node.id, subject: 'math' as const, label: node.canonicalName })),
]

export function exactExistingMatches(candidate: AIDiscoveryCandidate) {
  const key = normalizedLabel(candidate.label)
  return existingLabels.filter((item) => item.subject === candidate.subject && normalizedLabel(item.label) === key)
}

export const aiDiscoverySummary = {
  batchId: aiDiscoveryBatch.batchId,
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
