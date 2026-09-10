import type { AIDiscoveryCandidate } from './aiDiscovery'

const PEP_CN_GARDEN = 'https://www.pep.com.cn/bks/xxyw/jzjd/202505/W020250531424725664829.pdf'
const PEP_CN_REVISION = 'https://www.pep.com.cn/bks/xxyw/jzjd/202507/W020250716532280620290.pdf'
const PEP_EN_G3X = 'https://www.pep.com.cn/zslth/yyptzy/xypep/3x/'
const PEP_EN_G5S = 'https://www.pep.com.cn/zslth/yyptypzj/xypep/5s/'
const PEP_EN_G5X = 'https://www.pep.com.cn/zslth/yyptzy/xypep/5x/'
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

export const aiDiscoveryExpansion05Batch = {
  schema: 'qiqi-curriculum-ai-discovery-batch/v1' as const,
  batchId: 'ai-discovery-2026-09-09-wave05-domain-depth',
  generatedAt: '2026-09-09T17:28:00+08:00',
  note: 'Wave05 根据领域深度矩阵补具体能力候选。语文证据来自人教社《小学语文》对统编教科书语文园地与修订教材的栏目/语文要素分析；英语证据来自人教社当前PEP数字资源的 Pronunciation / Read and write / Let’s spell / Revision 活动。候选不等于正式教材知识点。',
}

export const aiDiscoveryExpansion05: AIDiscoveryCandidate[] = [
  candidate({
    id: 'ai5-chinese-g2-word-accumulation-categorization',
    subject: 'chinese', grades: [2], candidateKind: 'knowledge_node',
    label: '课内外词句积累与分类（二年级候选）',
    learningDemand: '从课内外阅读中积累词语、成语和名言警句，并能按语义或表达用途进行简单分类整理。',
    evidenceSummary: '人教社关于统编教材修订的文章举例说明：二年级语文园地通过词句卡片引导从词语、成语、名言警句等角度积累，并通过描写心情的词语进行分类整理。',
    sourceRefs: [PEP_CN_REVISION], sourceAuthority: 'publisher_current_resource',
    sourceNote: '出版社教材修订分析，可支持“积累与分类”候选；具体册次、单元和评价要求仍需真人核教材。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g3-fresh-expression-reading',
    subject: 'chinese', grades: [3], candidateKind: 'knowledge_node',
    label: '阅读中关注有新鲜感的词句（三年级候选）',
    learningDemand: '阅读时主动发现有新鲜感的词语和句子，通过多读、摘抄等方式积累并加深理解。',
    evidenceSummary: '人教社《语文园地》教学分析明确举出三年级上册第一单元阅读语文要素“阅读时，关注有新鲜感的词语和句子”，交流平台提示多读并抄写。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可定位到三年级上册具体语文要素；仍需核对当前教材版次与源单元。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g3-fable-moral-comprehension',
    subject: 'chinese', grades: [3], candidateKind: 'knowledge_node',
    label: '寓言故事道理理解（三年级候选）',
    learningDemand: '阅读寓言故事时理解故事内容，并概括或说明其中蕴含的道理。',
    evidenceSummary: '人教社文章举出三年级下册第二单元阅读语文要素“读寓言故事，明白其中的道理”。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '教材语文要素级候选；具体寓言篇目与表达深度不得由AI补推。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g3-picture-content-clear-writing',
    subject: 'chinese', grades: [3], candidateKind: 'knowledge_node',
    label: '把图画内容写清楚（三年级候选）',
    learningDemand: '观察图画中的人物、事件和关键信息，按一定顺序把图画内容写清楚。',
    evidenceSummary: '人教社文章举出三年级下册第二单元写作要求“把图画的内容写清楚”。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '只支持“写清楚图画内容”这一教材要求，不自动推断字数、结构模板或评分标准。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g4-imagery-reading',
    subject: 'chinese', grades: [4], candidateKind: 'knowledge_node',
    label: '边读边想象画面并感受自然之美（四年级候选）',
    learningDemand: '阅读描写自然景物的文本时，根据语言文字想象画面，并结合画面感受景物特点与美感。',
    evidenceSummary: '人教社文章在跨年级读写案例中明确引用四年级上册第一单元语文要素“边读边想象画面，感受自然之美”。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可定位教材语文要素；具体文本类型与评价表现需继续核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g4-figurative-animal-word-use',
    subject: 'chinese', grades: [4], candidateKind: 'knowledge_node',
    label: '以物喻人词语的本义、比喻义与迁移运用（四年级候选）',
    learningDemand: '理解典型以物喻人词语的本义和比喻义，并能结合人物特点和生活情境恰当使用。',
    evidenceSummary: '人教社文章举出四年级下册第四单元“词句段运用”中的千里马、老黄牛、百灵鸟等词语，强调先理解本义和比喻义，再联系生活迁移运用。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '候选关注词义理解与语用迁移；具体词表应从教材原页核对，不在AI候选中扩写。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g5-static-dynamic-description',
    subject: 'chinese', grades: [5], candidateKind: 'knowledge_node',
    label: '体会静态描写和动态描写的表达效果（五年级候选）',
    learningDemand: '辨认文本中的静态描写与动态描写，结合具体语句体会不同描写方式形成的表达效果。',
    evidenceSummary: '人教社文章引用五年级下册第七单元语文要素“体会静态描写和动态描写的表达效果”，并用古诗读写结合案例说明。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '教材语文要素候选；不自动扩展为完整写景技法体系。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-chinese-g5-reading-speed-strategies',
    subject: 'chinese', grades: [5], candidateKind: 'knowledge_node',
    label: '提高阅读速度的方法（五年级候选）',
    learningDemand: '在阅读任务中尝试带着问题读、抓住关键词边读边思考、及时概括语句意思等方法，提高阅读速度和信息把握效率。',
    evidenceSummary: '人教社文章明确指出五年级上册第二单元语文要素之一是“学习提高阅读速度的方法”，交流平台总结带着问题读、抓住关键词边读边思考、及时概括语句意思等方法。',
    sourceRefs: [PEP_CN_GARDEN], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可支持具体阅读策略候选；“速度提高”仍需过程性评价，不把速度值或题型阈值写死。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-english-g3-pronunciation-intonation',
    subject: 'english', grades: [3], candidateKind: 'knowledge_node',
    label: '朗读中的语调感知（三年级候选）',
    learningDemand: '在听读与朗读活动中注意基本语调变化，尝试按照示范较自然地朗读词句和短文本。',
    evidenceSummary: '人教社当前三年级下册 Pronunciation 区域设置“Listen and read aloud. Notice the intonation.”。',
    sourceRefs: [PEP_EN_G3X], sourceAuthority: 'publisher_current_resource',
    sourceNote: '活动级证据；具体语调规则、句型范围需打开资源内容后核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-english-g3-read-write-discuss',
    subject: 'english', grades: [3], candidateKind: 'knowledge_node',
    label: '阅读、书写与讨论整合活动（三年级候选）',
    learningDemand: '在复习活动中结合阅读、填写或书写和同伴讨论，对单元语言进行综合运用。',
    evidenceSummary: '人教社当前三年级下册 Revision 设置“Read, write and discuss.”。',
    sourceRefs: [PEP_EN_G3X], sourceAuthority: 'publisher_current_resource',
    sourceNote: '只能确认综合活动形态，不能据栏目名自动推断篇幅、语法项目或独立写作要求。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-english-g5-phonics-spelling',
    subject: 'english', grades: [5], candidateKind: 'knowledge_node',
    label: 'Let’s spell 语音拼读与拼写（五年级候选）',
    learningDemand: '通过听辨、朗读、归类和书写等 Let’s spell 活动继续发展音形对应和基础拼写能力。',
    evidenceSummary: '人教社五年级上册数字资源多个单元设置 Let’s spell，并配套 Listen, repeat/circle 与 Listen, write and say 等活动。',
    sourceRefs: [PEP_EN_G5S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可确认 phonics/spelling 活动持续存在；具体发音组合和目标词表需逐单元核对。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-english-g5-read-write',
    subject: 'english', grades: [5], candidateKind: 'knowledge_node',
    label: '主题阅读与书面表达（五年级候选）',
    learningDemand: '围绕单元主题完成 Read and write 等阅读理解与基础书面表达任务，逐步提高读写整合能力。',
    evidenceSummary: '人教社五年级上册和下册当前数字资源均在单元中设置 Read and write。',
    sourceRefs: [PEP_EN_G5S, PEP_EN_G5X], sourceAuthority: 'publisher_current_resource',
    sourceNote: '栏目级证据；具体文本类型、句数、评价标准仍需真人核资源。', confidence: 'medium',
  }),
  candidate({
    id: 'ai5-english-g6-listen-retell',
    subject: 'english', grades: [6], candidateKind: 'knowledge_node',
    label: '听后复述与小组表达（六年级候选）',
    learningDemand: '在听取主题材料后提取关键信息，并借助提示在小组中复述或表达主要内容。',
    evidenceSummary: '人教社当前六年级上册 Revision “Learning in museums”设置“Listen and fill in the blanks. Then retell your favourite part in your group.”。',
    sourceRefs: [PEP_EN_G6S], sourceAuthority: 'publisher_current_resource',
    sourceNote: '可确认听后复述活动存在；不自动推断复述长度、评价维度或固定语言结构。', confidence: 'medium',
  }),
]
