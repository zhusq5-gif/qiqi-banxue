import type { AIDiscoveryCandidate } from './aiDiscovery'

const MOE_CHINESE_WRITING = 'https://www.moe.gov.cn/jyb_xxgk/xxgk_jyta/jyta_jiaocaiju/202501/t20250113_1175495.html'
const MOE_ENGLISH_CULTURE = 'https://www.moe.gov.cn/jyb_xxgk/xxgk_jyta/jyta_jiaocaiju/202209/t20220923_664174.html'
const PEP_EN_G3S = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/3s/'
const PEP_EN_G3X = 'https://www.pep.com.cn/zslth/yyptzy/xypep/3x/'
const PEP_EN_G4S = 'https://www.pep.com.cn/zslth/yyptzy/xypep/4s/'

function candidate(input: Omit<AIDiscoveryCandidate, 'aiGenerated' | 'reviewStatus' | 'autoApply' | 'nextGate'>): AIDiscoveryCandidate {
  return {
    ...input,
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  }
}

export const aiDiscoveryExpansion04Batch = {
  schema: 'qiqi-curriculum-ai-discovery-batch/v1' as const,
  batchId: 'ai-discovery-2026-09-09-wave04-domain-depth',
  generatedAt: '2026-09-09T15:35:00+08:00',
  note: 'Wave04 按领域深度矩阵补证据：语文使用教育部官方答复中对2022语文课标书写要求的分学段概述；英语使用人教社当前G3/G4数字资源的语音/阅读/书写活动结构，以及教育部对外语核心素养和跨文化沟通的官方说明。',
}

export const aiDiscoveryExpansion04: AIDiscoveryCandidate[] = [
  candidate({
    id: 'ai4-chinese-g1-2-basic-character-writing',
    subject: 'chinese', grades: [1, 2], candidateKind: 'knowledge_node',
    label: '基本汉字规范书写（1—2年级候选）',
    learningDemand: '在低年级写字教学中形成基本汉字规范书写意识和基础书写能力。',
    evidenceSummary: '教育部2024年答复在说明《义务教育语文课程标准（2022年版）》书法教育要求时明确概述：1—2年级要求学生写基本字。',
    sourceRefs: [MOE_CHINESE_WRITING], sourceAuthority: 'official_standard_2022',
    sourceNote: '教育部官方答复对2022课标要求的概述；仍需结合课标原文和教材把“基本字”拆成可操作的具体知识/技能节点。', confidence: 'high',
  }),
  candidate({
    id: 'ai4-chinese-g3-4-regular-script-writing',
    subject: 'chinese', grades: [3, 4], candidateKind: 'knowledge_node',
    label: '硬笔正楷熟练书写与毛笔临摹（3—4年级候选）',
    learningDemand: '逐步熟练使用硬笔书写正楷字，并通过毛笔临摹正楷字帖形成规范书写和书法体验。',
    evidenceSummary: '教育部官方答复概述2022语文课标：3—4年级能用硬笔熟练书写正楷字，用毛笔临摹正楷字帖。',
    sourceRefs: [MOE_CHINESE_WRITING], sourceAuthority: 'official_standard_2022',
    sourceNote: '高置信学段能力候选；具体评价标准、字帖范围和教材出现位置需继续真人核对。', confidence: 'high',
  }),
  candidate({
    id: 'ai4-chinese-g5-6-regular-script-writing',
    subject: 'chinese', grades: [5, 6], candidateKind: 'knowledge_node',
    label: '硬笔楷书与毛笔楷书书写（5—6年级候选）',
    learningDemand: '使用硬笔书写楷书，并进一步发展毛笔楷书书写能力。',
    evidenceSummary: '教育部官方答复概述2022语文课标：5—6年级能用硬笔书写楷书，用毛笔书写楷书。',
    sourceRefs: [MOE_CHINESE_WRITING], sourceAuthority: 'official_standard_2022',
    sourceNote: '学段能力候选，不自动推断具体书法技法、字帖或单元。', confidence: 'high',
  }),
  candidate({
    id: 'ai4-english-g3-initial-sound-awareness',
    subject: 'english', grades: [3], candidateKind: 'knowledge_node',
    label: '单词首音辨识与初步语音意识（三年级候选）',
    learningDemand: '通过听辨、重复和圈选首音等活动，建立英语单词开头声音的初步辨识意识。',
    evidenceSummary: '人教社当前三年级上册资源在多个单元设置Listen, repeat and chant以及Listen and circle the first sound。',
    sourceRefs: [PEP_EN_G3S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可确认活动类型存在；具体音素、字母组合和发音规则需要进入资源内容后另行核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai4-english-g3-start-reading-writing',
    subject: 'english', grades: [3], candidateKind: 'knowledge_node',
    label: '起步阅读与基础书写活动（三年级候选）',
    learningDemand: '从Start to read、Read and write等活动进入短文本/词句识读与基础书写。',
    evidenceSummary: '人教社当前三年级上册多个单元设置Start to read；三年级下册当前资源设置Read and write以及Listen, circle and write。',
    sourceRefs: [PEP_EN_G3S, PEP_EN_G3X], sourceAuthority: 'publisher_current_resource',
    sourceNote: '只支持“存在起步阅读/书写活动”的候选；不据栏目名推断具体阅读策略、写作长度或语法要求。', confidence: 'medium',
  }),
  candidate({
    id: 'ai4-english-g4-phonics-spelling',
    subject: 'english', grades: [4], candidateKind: 'knowledge_node',
    label: '语音拼读与拼写活动（四年级候选）',
    learningDemand: '通过Let’s spell中的听、读、辨、写活动继续发展音形对应和基础拼写能力。',
    evidenceSummary: '人教社当前四年级上册多个单元明确设置Let’s spell，并包含Listen and repeat、Read/listen/circle或number、Look/listen/write等活动。',
    sourceRefs: [PEP_EN_G4S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可确认语音拼写活动链存在；具体发音规律与单词范围必须打开对应资源后核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai4-english-g4-read-write',
    subject: 'english', grades: [4], candidateKind: 'knowledge_node',
    label: '单元主题阅读与基础书面表达（四年级候选）',
    learningDemand: '在单元主题中通过Read and write活动完成基础阅读理解与书面表达任务。',
    evidenceSummary: '人教社当前四年级上册多个单元固定设置Read and write。',
    sourceRefs: [PEP_EN_G4S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '栏目级证据；具体文本类型、阅读策略和写作质量要求仍需真人打开内容核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai4-english-culture-cross-cultural',
    subject: 'english', grades: [3, 4, 5, 6], candidateKind: 'knowledge_domain',
    label: '文化意识、中国情怀与跨文化沟通（小学英语框架候选）',
    learningDemand: '在英语学习中发展文化意识，形成中国情怀、国际视野，并逐步具备用英语开展跨文化沟通的意识与能力。',
    evidenceSummary: '教育部官方答复明确说明外语课程有助于发展语言能力、文化意识、思维品质、学习能力等核心素养，并培养学生中国情怀、国际视野和跨文化沟通能力。',
    sourceRefs: [MOE_ENGLISH_CULTURE], sourceAuthority: 'official_standard_2022',
    sourceNote: '官方课程育人框架锚点；不是某一具体年级文化知识清单，也不能由此自动生成国家/节日等具体知识节点。', confidence: 'high',
  }),
]
