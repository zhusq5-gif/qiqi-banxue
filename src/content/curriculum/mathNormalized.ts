import {
  mathFineNodeById,
  mathFineSample,
  mathFineThemesForNode,
  type MathFineEdgeType,
  type MathFineNode,
  type MathFineThemeId,
} from './mathFineSample'

export type MathKnowledgeKind = 'concept' | 'skill'
export type MathDomain = MathFineThemeId | 'unclassified'
export type MathNormalizedRelationType = Extract<MathFineEdgeType, 'prerequisites_for' | 'relates_to' | 'is_a'>

export interface MathRawProvenance {
  dataset: 'K12-KGraph'
  rawId: string
  sourceLocator: string
  license: 'CC BY-NC-SA 4.0'
  commercialUse: false
  provenanceKind: 'raw_subject_specific_graph_excerpt'
}

export interface MathKnowledgeNode {
  id: string
  subject: 'math'
  canonicalName: string
  kind: MathKnowledgeKind
  domains: MathDomain[]
  canonicalStatus: 'provisional'
  definition: string | null
  description: string | null
  formula: string | null
  rawProperties: Record<string, string | number>
  source: MathRawProvenance
}

export interface MathOccurrence {
  id: string
  knowledgeNodeId: string
  grade: number
  semester: 1 | 2
  bookId: string
  chapterId: string
  chapterName: string
  rawAppearsInEdgeId: string
  source: MathRawProvenance
}

export interface MathAssessmentTask {
  id: string
  subject: 'math'
  title: string
  stem: string | null
  answer: string | null
  difficulty: number | null
  questionType: string | null
  rawExerciseId: string
  chapterIds: string[]
  assessedKnowledgeNodeIds: string[]
  unresolvedRawTargetIds: string[]
  source: MathRawProvenance
}

export interface MathNormalizedRelation {
  id: string
  subject: 'math'
  relationType: MathNormalizedRelationType
  fromKnowledgeNodeId: string
  toKnowledgeNodeId: string
  rawEdgeId: string
  evidence: string
  source: MathRawProvenance
}

export interface MathNormalizedDataset {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  schemaNote: string
  knowledgeNodes: MathKnowledgeNode[]
  occurrences: MathOccurrence[]
  assessmentTasks: MathAssessmentTask[]
  relations: MathNormalizedRelation[]
}

function sourceFor(rawId: string, sourceLocator: string): MathRawProvenance {
  return {
    dataset: 'K12-KGraph',
    rawId,
    sourceLocator,
    license: mathFineSample.source.license,
    commercialUse: false,
    provenanceKind: mathFineSample.source.provenanceKind,
  }
}

function normalizedId(rawId: string) {
  return `math:kg:${rawId}`
}

function domainsForRawNode(rawId: string): MathDomain[] {
  const domains = mathFineThemesForNode(rawId).map((theme) => theme.id)
  return domains.length ? Array.from(new Set(domains)) : ['unclassified']
}

function asText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function makeKnowledgeNode(raw: MathFineNode): MathKnowledgeNode | null {
  if (raw.label !== 'Concept' && raw.label !== 'Skill') return null
  return {
    id: normalizedId(raw.id),
    subject: 'math',
    canonicalName: raw.name,
    kind: raw.label === 'Concept' ? 'concept' : 'skill',
    domains: domainsForRawNode(raw.id),
    canonicalStatus: 'provisional',
    definition: asText(raw.properties.definition),
    description: asText(raw.properties.description),
    formula: asText(raw.properties.formula),
    rawProperties: raw.properties,
    source: sourceFor(raw.id, raw.sourceLocator),
  }
}

function parseChapterContext(chapterId: string) {
  const match = /^math_(\d+)([ab])_rjb_ch/.exec(chapterId)
  if (!match) return null
  return {
    grade: Number(match[1]),
    semester: (match[2] === 'a' ? 1 : 2) as 1 | 2,
    bookId: `math_${match[1]}${match[2]}_rjb`,
  }
}

export const mathKnowledgeNodes = mathFineSample.nodes
  .map(makeKnowledgeNode)
  .filter((item): item is MathKnowledgeNode => item !== null)

const knowledgeIndex = new Map(mathKnowledgeNodes.map((item) => [item.id, item]))
const rawKnowledgeIndex = new Map(mathKnowledgeNodes.map((item) => [item.source.rawId, item]))

export const mathOccurrences: MathOccurrence[] = mathFineSample.edges.flatMap((edge) => {
  if (edge.type !== 'appears_in') return []
  const knowledge = rawKnowledgeIndex.get(edge.source)
  const chapter = mathFineNodeById(edge.target)
  const context = parseChapterContext(edge.target)
  if (!knowledge || !chapter || chapter.label !== 'Chapter' || !context) return []
  return [{
    id: `math:occ:${edge.id}`,
    knowledgeNodeId: knowledge.id,
    grade: context.grade,
    semester: context.semester,
    bookId: context.bookId,
    chapterId: chapter.id,
    chapterName: chapter.name,
    rawAppearsInEdgeId: edge.id,
    source: sourceFor(edge.id, edge.sourceLocator),
  }]
})

export const mathAssessmentTasks: MathAssessmentTask[] = mathFineSample.nodes
  .filter((node) => node.label === 'Exercise')
  .map((exercise) => {
    const assessmentEdges = mathFineSample.edges.filter(
      (edge) => edge.source === exercise.id && (edge.type === 'tests_concept' || edge.type === 'tests_skill'),
    )
    const chapterIds = mathFineSample.edges
      .filter((edge) => edge.source === exercise.id && edge.type === 'appears_in' && mathFineNodeById(edge.target)?.label === 'Chapter')
      .map((edge) => edge.target)
    const resolved = assessmentEdges
      .map((edge) => rawKnowledgeIndex.get(edge.target)?.id ?? null)
      .filter((id): id is string => id !== null)
    const unresolved = assessmentEdges
      .filter((edge) => !rawKnowledgeIndex.has(edge.target))
      .map((edge) => edge.target)
    return {
      id: `math:assessment:${exercise.id}`,
      subject: 'math' as const,
      title: exercise.name,
      stem: asText(exercise.properties.stem),
      answer: asText(exercise.properties.answer),
      difficulty: typeof exercise.properties.difficulty === 'number' ? exercise.properties.difficulty : null,
      questionType: asText(exercise.properties.type),
      rawExerciseId: exercise.id,
      chapterIds: Array.from(new Set(chapterIds)),
      assessedKnowledgeNodeIds: Array.from(new Set(resolved)),
      unresolvedRawTargetIds: Array.from(new Set(unresolved)),
      source: sourceFor(exercise.id, exercise.sourceLocator),
    }
  })

export const mathNormalizedRelations: MathNormalizedRelation[] = mathFineSample.edges.flatMap((edge) => {
  if (edge.type !== 'prerequisites_for' && edge.type !== 'relates_to' && edge.type !== 'is_a') return []
  const source = rawKnowledgeIndex.get(edge.source)
  const target = rawKnowledgeIndex.get(edge.target)
  if (!source || !target) return []
  return [{
    id: `math:rel:${edge.id}`,
    subject: 'math' as const,
    relationType: edge.type,
    fromKnowledgeNodeId: source.id,
    toKnowledgeNodeId: target.id,
    rawEdgeId: edge.id,
    evidence: edge.evidence,
    source: sourceFor(edge.id, edge.sourceLocator),
  }]
})

export const mathNormalizedDataset: MathNormalizedDataset = {
  datasetVersion: `normalized:${mathFineSample.datasetVersion}`,
  status: 'research_only',
  subject: 'math',
  schemaNote: 'Raw Concept/Skill → provisional KnowledgeNode；appears_in → Occurrence；Exercise + tests_* → AssessmentTask；raw semantic edge → Relation。research_sequence 不会转换为 prerequisite。',
  knowledgeNodes: mathKnowledgeNodes,
  occurrences: mathOccurrences,
  assessmentTasks: mathAssessmentTasks,
  relations: mathNormalizedRelations,
}

export function mathNormalizedNodeById(id: string) {
  return knowledgeIndex.get(id) ?? null
}

export function mathNormalizedNodeByRawId(rawId: string) {
  return rawKnowledgeIndex.get(rawId) ?? null
}

export function mathOccurrencesForNode(id: string) {
  return mathOccurrences.filter((item) => item.knowledgeNodeId === id)
}

export function mathAssessmentsForNode(id: string) {
  return mathAssessmentTasks.filter((item) => item.assessedKnowledgeNodeIds.includes(id))
}

export function mathRelationsForNode(id: string) {
  return mathNormalizedRelations.filter((item) => item.fromKnowledgeNodeId === id || item.toKnowledgeNodeId === id)
}
