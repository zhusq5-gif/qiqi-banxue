import { curriculumSeed, entryById } from './curriculum'

export interface CurriculumRepairProposal {
  issueId: string
  nodeId: string
  status: 'candidate_patch'
  autoApply: false
  proposedLabel: string
  proposedLearningDemand: string
  proposedQuestionTypes: string[]
  rationale: string
}

const labelOverrides: Record<string, string> = {
  F002: 'AABB式词语积累',
  F003: '动物相关四字成语归类',
  F004: 'ABAB式与AABB式重叠词的语态描写',
}

function questionTypesFor(issueId: string, questionTypes: string[]) {
  if (issueId === 'F001' || issueId === 'F006') {
    return questionTypes.filter((item) => item !== '口算')
  }
  return questionTypes.slice()
}

function learningDemandFor(issueId: string, learningDemand: string) {
  if (issueId === 'F007') return learningDemand.split('回。答').join('回答')
  return learningDemand
}

function rationaleFor(issueId: string) {
  switch (issueId) {
    case 'F001':
      return '候选 patch 只移除语文题型中的“口算”异常标签；替代题型仍需语文教研确认。'
    case 'F002':
      return '原例词为 AABB 结构，先提供“AABB式词语积累”作为候选标题，需回看教材/来源后确认。'
    case 'F003':
      return '原例词是四字表达而非“八字成语”，候选标题改为中性的“动物相关四字成语归类”。'
    case 'F004':
      return '原例词覆盖 ABAB/AABB，候选标题显式写出两类；仍需教研确认是否应拆成两个知识点。'
    case 'F005':
      return '“长话短说/概括”与句法“缩句”可能需要拆分；不自动提供改名，保留原文等待教研判断。'
    case 'F006':
      return '候选 patch 只移除英语题型中的“口算”异常标签；替代题型仍需英语教研确认。'
    case 'F007':
      return '仅修复可直接识别的“回。答”标点损坏，不改变其他语义。'
    default:
      return '候选修补仅供教研工作台使用，不自动写回种子数据。'
  }
}

export const curriculumRepairProposals: CurriculumRepairProposal[] = curriculumSeed.issues.map((issue) => {
  const entry = entryById(issue.nodeId)
  if (!entry) throw new Error(`Repair proposal endpoint missing for ${issue.id}`)
  return {
    issueId: issue.id,
    nodeId: entry.id,
    status: 'candidate_patch',
    autoApply: false,
    proposedLabel: labelOverrides[issue.id] ?? entry.label,
    proposedLearningDemand: learningDemandFor(issue.id, entry.learningDemand),
    proposedQuestionTypes: questionTypesFor(issue.id, entry.questionTypes),
    rationale: rationaleFor(issue.id),
  }
})

export function repairProposalForIssue(issueId: string) {
  return curriculumRepairProposals.find((item) => item.issueId === issueId) ?? null
}
