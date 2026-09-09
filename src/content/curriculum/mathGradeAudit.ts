import { mathNormalizedDataset, mathNormalizedNodeById } from './mathNormalized'
import { mathWave2SourceAuditRecord } from './mathWave2SourceAudit'

export type MathGradeAuditTaskKind =
  | 'assessment_without_target'
  | 'source_unlinked_assessment_candidate'
  | 'cross_grade_relation_review'
  | 'reused_prior_grade_occurrence_review'
  | 'future_origin_occurrence'
  | 'relation_evidence_missing'

export interface MathCrossGradeRelationAudit {
  relationId: string
  rawEdgeId: string
  relationType: 'prerequisites_for' | 'relates_to' | 'is_a'
  fromKnowledgeNodeId: string
  toKnowledgeNodeId: string
  fromName: string
  toName: string
  fromRawGrade: number
  toRawGrade: number
  evidence: string
  sourceLocator: string
}

export interface MathOccurrenceReuseAudit {
  occurrenceId: string
  knowledgeNodeId: string
  name: string
  rawOriginGrade: number
  occurrenceGrade: number
  chapterId: string
  chapterName: string
  sourceLocator: string
}

export interface MathGradeAuditTask {
  id: string
  grade: number
  kind: MathGradeAuditTaskKind
  severity: 'review' | 'blocking'
  title: string
  detail: string
  sourceRefs: string[]
  autoApply: false
}

export interface MathGradeAudit {
  grade: number
  knowledgeNodeCount: number
  occurrenceCount: number
  assessmentCount: number
  linkedAssessmentCount: number
  unlinkedAssessmentCount: number
  unresolvedAssessmentTargetCount: number
  semanticRelationCount: number
  relationEvidenceMissingCount: number
  crossGradeSemanticRelationCount: number
  crossGradePrerequisiteCount: number
  reusedPriorGradeOccurrenceCount: number
  futureOriginOccurrenceCount: number
  crossGradeRelations: MathCrossGradeRelationAudit[]
  reusedPriorGradeOccurrences: MathOccurrenceReuseAudit[]
  tasks: MathGradeAuditTask[]
}

function rawGrade(rawId: string) {
  const match = /^math_(\d+)[ab]_rjb_/.exec(rawId)
  return match ? Number(match[1]) : null
}

function chapterGrade(chapterId: string) {
  const match = /^math_(\d+)[ab]_rjb_ch/.exec(chapterId)
  return match ? Number(match[1]) : null
}

function relationAuditForGrade(grade: number) {
  const relations: MathCrossGradeRelationAudit[] = []
  let semanticRelationCount = 0
  let relationEvidenceMissingCount = 0

  for (const relation of mathNormalizedDataset.relations) {
    const fromNode = mathNormalizedNodeById(relation.fromKnowledgeNodeId)
    const toNode = mathNormalizedNodeById(relation.toKnowledgeNodeId)
    if (!fromNode || !toNode) continue

    const fromGrade = rawGrade(fromNode.source.rawId)
    const toGrade = rawGrade(toNode.source.rawId)
    if (fromGrade === null || toGrade === null) continue
    if (fromGrade !== grade && toGrade !== grade) continue

    semanticRelationCount += 1
    if (!relation.evidence.trim() || !relation.source.sourceLocator.trim()) relationEvidenceMissingCount += 1
    if (fromGrade === toGrade) continue

    relations.push({
      relationId: relation.id,
      rawEdgeId: relation.rawEdgeId,
      relationType: relation.relationType,
      fromKnowledgeNodeId: relation.fromKnowledgeNodeId,
      toKnowledgeNodeId: relation.toKnowledgeNodeId,
      fromName: fromNode.canonicalName,
      toName: toNode.canonicalName,
      fromRawGrade: fromGrade,
      toRawGrade: toGrade,
      evidence: relation.evidence,
      sourceLocator: relation.source.sourceLocator,
    })
  }

  return { relations, semanticRelationCount, relationEvidenceMissingCount }
}

export function auditMathGrade(grade: number): MathGradeAudit {
  const occurrences = mathNormalizedDataset.occurrences.filter((item) => item.grade === grade)
  const knowledgeNodeIds = Array.from(new Set(occurrences.map((item) => item.knowledgeNodeId)))
  const assessments = mathNormalizedDataset.assessmentTasks.filter((task) => task.chapterIds.some((id) => chapterGrade(id) === grade))
  const linkedAssessments = assessments.filter((task) => task.assessedKnowledgeNodeIds.length > 0)
  const unlinkedAssessments = assessments.filter((task) => task.assessedKnowledgeNodeIds.length === 0 && task.unresolvedRawTargetIds.length === 0)
  const unresolvedAssessmentTargetCount = assessments.reduce((sum, task) => sum + task.unresolvedRawTargetIds.length, 0)

  const reusedPriorGradeOccurrences: MathOccurrenceReuseAudit[] = []
  const futureOriginOccurrences: MathOccurrenceReuseAudit[] = []
  for (const occurrence of occurrences) {
    const node = mathNormalizedNodeById(occurrence.knowledgeNodeId)
    if (!node) continue
    const originGrade = rawGrade(node.source.rawId)
    if (originGrade === null || originGrade === occurrence.grade) continue
    const audit: MathOccurrenceReuseAudit = {
      occurrenceId: occurrence.id,
      knowledgeNodeId: occurrence.knowledgeNodeId,
      name: node.canonicalName,
      rawOriginGrade: originGrade,
      occurrenceGrade: occurrence.grade,
      chapterId: occurrence.chapterId,
      chapterName: occurrence.chapterName,
      sourceLocator: occurrence.source.sourceLocator,
    }
    if (originGrade < occurrence.grade) reusedPriorGradeOccurrences.push(audit)
    if (originGrade > occurrence.grade) futureOriginOccurrences.push(audit)
  }

  const relationAudit = relationAuditForGrade(grade)
  const tasks: MathGradeAuditTask[] = []

  for (const task of unlinkedAssessments) {
    const sourceAudit = mathWave2SourceAuditRecord(task.rawExerciseId)
    const sourceUnlinkedCandidate = sourceAudit?.status === 'source_unlinked_candidate'
    tasks.push({
      id: `math-audit:g${grade}:assessment:${task.rawExerciseId}`,
      grade,
      kind: sourceUnlinkedCandidate ? 'source_unlinked_assessment_candidate' : 'assessment_without_target',
      severity: 'blocking',
      title: sourceUnlinkedCandidate ? `原始源疑似未绑定知识点：${task.title}` : `测评未绑定知识点：${task.title}`,
      detail: sourceUnlinkedCandidate
        ? '完整 raw source 回查当前只确认本 Exercise 的 appears_in，未定位到 tests_concept/tests_skill。保持阻断候选；禁止依据题意自动补边，需继续源数据/教研确认。'
        : '该 Exercise 有本年级章节定位，但当前 excerpt 没有 tests_concept/tests_skill 目标，也没有悬空目标记录。必须先回查完整 raw source，再决定补摘录还是登记源数据缺口。',
      sourceRefs: sourceAudit
        ? [task.source.rawId, sourceAudit.rawNodeLocator, sourceAudit.rawAppearsInLocator, sourceAudit.inspectedTestsRange ?? sourceAudit.rawTestsLocator ?? '', ...task.chapterIds].filter(Boolean)
        : [task.source.rawId, task.source.sourceLocator, ...task.chapterIds],
      autoApply: false,
    })
  }

  for (const relation of relationAudit.relations) {
    tasks.push({
      id: `math-audit:g${grade}:relation:${relation.rawEdgeId}`,
      grade,
      kind: 'cross_grade_relation_review',
      severity: 'review',
      title: `跨年级关系待核：${relation.fromName} → ${relation.toName}`,
      detail: `${relation.relationType}；raw 年级 ${relation.fromRawGrade} → ${relation.toRawGrade}。保留原始 evidence，但不得自动升级为正式进阶关系。`,
      sourceRefs: [relation.rawEdgeId, relation.sourceLocator],
      autoApply: false,
    })
  }

  for (const occurrence of reusedPriorGradeOccurrences) {
    tasks.push({
      id: `math-audit:g${grade}:reuse:${occurrence.occurrenceId}`,
      grade,
      kind: 'reused_prior_grade_occurrence_review',
      severity: 'review',
      title: `低年级知识在本年级复用：${occurrence.name}`,
      detail: `知识原始 ID 属于 ${occurrence.rawOriginGrade} 年级，但 raw appears_in 将其定位到 ${occurrence.occurrenceGrade} 年级章节“${occurrence.chapterName}”。保留同一 KnowledgeNode + 多 Occurrence，需教研确认复现要求。`,
      sourceRefs: [occurrence.knowledgeNodeId, occurrence.occurrenceId, occurrence.sourceLocator],
      autoApply: false,
    })
  }

  for (const occurrence of futureOriginOccurrences) {
    tasks.push({
      id: `math-audit:g${grade}:future:${occurrence.occurrenceId}`,
      grade,
      kind: 'future_origin_occurrence',
      severity: 'blocking',
      title: `高年级来源知识出现在低年级章节：${occurrence.name}`,
      detail: `知识原始 ID 属于 ${occurrence.rawOriginGrade} 年级，但 Occurrence 位于 ${occurrence.occurrenceGrade} 年级；需核验是否来源/年级标注错误。`,
      sourceRefs: [occurrence.knowledgeNodeId, occurrence.occurrenceId, occurrence.sourceLocator],
      autoApply: false,
    })
  }

  if (relationAudit.relationEvidenceMissingCount > 0) {
    tasks.push({
      id: `math-audit:g${grade}:relation-evidence-missing`,
      grade,
      kind: 'relation_evidence_missing',
      severity: 'blocking',
      title: '语义关系缺少 evidence/sourceLocator',
      detail: `本年级相关 normalized semantic relation 中有 ${relationAudit.relationEvidenceMissingCount} 条缺少 evidence 或可定位 sourceLocator。`,
      sourceRefs: [],
      autoApply: false,
    })
  }

  return {
    grade,
    knowledgeNodeCount: knowledgeNodeIds.length,
    occurrenceCount: occurrences.length,
    assessmentCount: assessments.length,
    linkedAssessmentCount: linkedAssessments.length,
    unlinkedAssessmentCount: unlinkedAssessments.length,
    unresolvedAssessmentTargetCount,
    semanticRelationCount: relationAudit.semanticRelationCount,
    relationEvidenceMissingCount: relationAudit.relationEvidenceMissingCount,
    crossGradeSemanticRelationCount: relationAudit.relations.length,
    crossGradePrerequisiteCount: relationAudit.relations.filter((item) => item.relationType === 'prerequisites_for').length,
    reusedPriorGradeOccurrenceCount: reusedPriorGradeOccurrences.length,
    futureOriginOccurrenceCount: futureOriginOccurrences.length,
    crossGradeRelations: relationAudit.relations,
    reusedPriorGradeOccurrences,
    tasks,
  }
}

export const mathGradeAudits = [1, 2, 3, 4, 5, 6].map(auditMathGrade)
export const mathWave2GradeAudits = mathGradeAudits.filter((audit) => audit.grade === 4 || audit.grade === 5)
export const mathWave2AuditTasks = mathWave2GradeAudits.flatMap((audit) => audit.tasks)

export function mathGradeAudit(grade: number) {
  return mathGradeAudits.find((audit) => audit.grade === grade) ?? null
}
