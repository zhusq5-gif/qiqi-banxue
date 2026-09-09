import type { AIDiscoveryCandidate } from './aiDiscovery'

const MOE_CHINESE_TASK_GROUPS = 'https://www.moe.gov.cn/fbh/live/2022/54382/zjwz/202204/t20220421_620107.html'
const MOE_MATH_2022 = 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf'
const PEP_EN_G4X = 'https://www.pep.com.cn/zslth/yyptzy/xypep/4x/'
const PEP_EN_G5S = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'
const PEP_EN_G6S = 'https://www.pep.com.cn/zslth/yyptzy/xypep/6s/'

function candidate(input: Omit<AIDiscoveryCandidate, 'aiGenerated' | 'reviewStatus' | 'autoApply' | 'nextGate'>): AIDiscoveryCandidate {
  return {
    ...input,
    aiGenerated: true,
    reviewStatus: 'ai_candidate',
    autoApply: false,
    nextGate: 'human_ui_review',
  }
}

export const aiDiscoveryExpansion03Batch = {
  schema: 'qiqi-curriculum-ai-discovery-batch/v1' as const,
  batchId: 'ai-discovery-2026-09-09-wave03-domain-gaps',
  generatedAt: '2026-09-09T15:03:00+08:00',
  note: '第三批由“每年级最低候选量”转向领域/任务群缺口。语文使用教育部2022课标发布解读中的六学习任务群；数学补“综合与实践”；英语仅从人教社当前数字资源可见的活动结构提取能力候选。',
}

const allPrimaryGrades = [1, 2, 3, 4, 5, 6]

export const aiDiscoveryExpansion03: AIDiscoveryCandidate[] = [
  candidate({
    id: 'ai3-chinese-task-language-accumulation',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '语言文字积累与梳理（任务群锚点）',
    learningDemand: '把字词、语言材料的积累与梳理组织为跨学段任务群入口，具体年级内容仍需按学段和教材拆解。',
    evidenceSummary: '教育部2022课标发布解读明确列出“语言文字积累与梳理”等六个语文学习任务群，并说明按学段呈现学习内容。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '官方任务群框架锚点，不等同于1—6年级每个年级都具有相同具体知识要求。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-chinese-task-practical-reading',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '实用性阅读与交流（任务群锚点）',
    learningDemand: '围绕真实生活中的实用文本阅读、信息获取和交流表达建立任务群入口。',
    evidenceSummary: '教育部2022课标发布解读将“实用性阅读与交流”列为六个语文学习任务群之一。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '框架级候选；各年级文本类型和学习要求必须继续查课标分学段证据。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-chinese-task-literary-reading',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '文学阅读与创意表达（任务群锚点）',
    learningDemand: '把文学作品阅读、审美体验与创意表达组织为跨学段学习任务群入口。',
    evidenceSummary: '教育部2022课标发布解读将“文学阅读与创意表达”列为六个语文学习任务群之一。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '任务群框架不是单一KnowledgeNode；后续需拆到年级、文本类型和能力要求。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-chinese-task-critical-reading',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '思辨性阅读与表达（任务群锚点）',
    learningDemand: '围绕提问、比较、判断、论证等思维活动建立阅读与表达的任务群入口。',
    evidenceSummary: '教育部2022课标发布解读将“思辨性阅读与表达”列为六个语文学习任务群之一。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '具体小学年级的思辨要求必须另查分学段课标证据，不能由任务群名称直接推断。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-chinese-task-whole-book',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '整本书阅读（任务群锚点）',
    learningDemand: '建立持续阅读、阅读方法、阅读交流与阅读成果表达的任务群入口。',
    evidenceSummary: '教育部2022课标发布解读将“整本书阅读”列为六个语文学习任务群之一。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '框架级候选；具体书目、年级和阅读策略不由AI自动补齐。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-chinese-task-interdisciplinary',
    subject: 'chinese', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '跨学科学习（任务群锚点）',
    learningDemand: '在真实问题与综合活动中运用语文能力，并与其他学科知识和实践活动发生联系。',
    evidenceSummary: '教育部2022课标发布解读将“跨学科学习”列为六个语文学习任务群之一。',
    sourceRefs: [MOE_CHINESE_TASK_GROUPS], sourceAuthority: 'official_standard_2022',
    sourceNote: '用于搜索规划和课程框架，不自动产生跨学科知识关系。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-math-integrated-practice',
    subject: 'math', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '综合与实践',
    learningDemand: '在真实情境和真实问题中综合运用数学及其他学科知识，经历发现、提出、分析和解决问题的过程。',
    evidenceSummary: '义务教育数学课程标准（2022年版）明确“综合与实践”是小学数学重要领域，主要包括主题活动和项目学习。',
    sourceRefs: [MOE_MATH_2022], sourceAuthority: 'official_standard_2022',
    sourceNote: '官方学习领域锚点。具体主题活动和项目不能由AI按常识生成。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-math-theme-project-learning',
    subject: 'math', grades: allPrimaryGrades, candidateKind: 'knowledge_domain',
    label: '数学主题活动与项目学习',
    learningDemand: '围绕现实问题开展主题式学习；在适合的高年级情境中逐步接触项目式学习，综合应用数学知识解决问题。',
    evidenceSummary: '2022数学课标说明综合与实践主要包括主题活动和项目学习，第一、第二、第三学段主要采用主题式学习，第三学段可适当采用项目式学习。',
    sourceRefs: [MOE_MATH_2022], sourceAuthority: 'official_standard_2022',
    sourceNote: '跨学段教学组织候选；不是某一具体教材项目名称。', confidence: 'high',
  }),
  candidate({
    id: 'ai3-english-g4-integrated-rules-literacy',
    subject: 'english', grades: [4], candidateKind: 'communication_function',
    label: '规则主题中的听说读写整合（四年级候选）',
    learningDemand: '在班级规则、家庭规则等主题中通过talk、listen/repeat、read/write等活动理解并表达规则。',
    evidenceSummary: '人教社当前四年级下册数字资源的Class rules、Family rules单元同时呈现Let’s talk、听读和Read and write类活动。',
    sourceRefs: [PEP_EN_G4X], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可确认活动结构与主题存在；具体句型、语法和词汇边界仍需打开教材内容后真人核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai3-english-g5-phonics-spelling',
    subject: 'english', grades: [5], candidateKind: 'knowledge_node',
    label: '语音拼读与拼写活动（五年级候选）',
    learningDemand: '通过Let’s spell及听写类活动关注字母/字母组合与发音、拼写之间的对应。',
    evidenceSummary: '人教社五年级上册当前配套资源在Unit 1、Unit 2等单元设置Let’s spell，并配有listen/write活动。',
    sourceRefs: [PEP_EN_G5S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '页面结构支持“存在语音拼写活动”，但具体发音规则需要进入资源内容后另行提取。', confidence: 'medium',
  }),
  candidate({
    id: 'ai3-english-g5-read-write',
    subject: 'english', grades: [5], candidateKind: 'knowledge_node',
    label: '短文阅读与基础书面表达（五年级候选）',
    learningDemand: '在单元主题中完成短文本理解，并通过Read and write活动形成基础书面表达。',
    evidenceSummary: '人教社五年级上册当前资源在多个单元固定设置Read and write活动。',
    sourceRefs: [PEP_EN_G5S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '活动结构可核；具体阅读策略与写作要求不能仅根据栏目名推断。', confidence: 'medium',
  }),
  candidate({
    id: 'ai3-english-g6-theme-read-write',
    subject: 'english', grades: [6], candidateKind: 'knowledge_node',
    label: '主题阅读与书面表达（六年级候选）',
    learningDemand: '围绕地点、交往、健康、能源与自然等主题完成Read and write活动，形成较高年级的主题阅读与书面表达入口。',
    evidenceSummary: '人教社当前六年级上册数字资源在Amazing places、Getting together、Healthy life、Energy, nature and us等单元均设置Read and write。',
    sourceRefs: [PEP_EN_G6S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '主题与活动栏目是当前资源事实；具体语言知识和写作质量要求仍需真人深入核对。', confidence: 'medium',
  }),
]
