import rawFineSample from './math-fine-sample-v01.json'
import rawFineExpansion from './math-fine-sample-expansion-v02.json'
import rawFineProgression from './math-fine-progression-v03.json'
import rawFineFractions from './math-fine-fractions-v03.json'
import rawFineGeometry from './math-fine-geometry-v03.json'
import rawFineStatistics from './math-fine-statistics-v03.json'
import rawFineGrade2Coverage from './math-fine-grade2-coverage-v04.json'

export type MathFineNodeLabel = 'Chapter' | 'Concept' | 'Skill' | 'Exercise'
export type MathFineEdgeType = 'relates_to' | 'prerequisites_for' | 'is_a' | 'appears_in' | 'tests_concept' | 'tests_skill'
export type MathFineThemeId = 'number_algebra' | 'geometry' | 'statistics_probability'
export type MathFineProgressionStatus = 'research_sequence'

export interface MathFineNode {
  id: string
  label: MathFineNodeLabel
  name: string
  properties: Record<string, string | number>
  sourceLocator: string
}

export interface MathFineEdge {
  id: string
  source: string
  target: string
  type: MathFineEdgeType
  evidence: string
  sourceLocator: string
}

export interface MathFineTheme {
  id: MathFineThemeId
  label: string
  grade: number
  semester: 1 | 2
  bookId: string
  bookLabel: string
  chapterIds: string[]
  description: string
}

export interface MathFineProgressionStage {
  grade: number
  semester: 1 | 2
  bookId: string
  chapterId: string
  label: string
  anchorIds: string[]
}

export interface MathFineProgression {
  id: string
  themeId: MathFineThemeId
  label: string
  status: MathFineProgressionStatus
  note: string
  stages: MathFineProgressionStage[]
  formalRawEdgeIds: string[]
}

export interface MathFineSample {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  scope: string
  source: {
    name: string
    rawUrl: string
    browseUrl: string
    license: 'CC BY-NC-SA 4.0'
    commercialUse: false
    provenanceKind: 'raw_subject_specific_graph_excerpt'
    note: string
  }
  themes: MathFineTheme[]
  progressions: MathFineProgression[]
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}

type MathFineBase = Omit<MathFineSample, 'themes' | 'progressions'>
type MathFineExpansion = {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  scopeNote: string
  themes: MathFineTheme[]
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}
type MathFineProgressionExpansion = {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  scopeNote: string
  themes: MathFineTheme[]
  progressions: MathFineProgression[]
}
type MathFineRawExpansion = {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}

const base = rawFineSample as MathFineBase
const expansion = rawFineExpansion as MathFineExpansion
const progression = rawFineProgression as MathFineProgressionExpansion
const fractionExpansion = rawFineFractions as MathFineRawExpansion
const geometryExpansion = rawFineGeometry as MathFineRawExpansion
const statisticsExpansion = rawFineStatistics as MathFineRawExpansion
const grade2Coverage = rawFineGrade2Coverage as MathFineRawExpansion

export const mathFineSample: MathFineSample = {
  ...base,
  datasetVersion: `${base.datasetVersion}+${expansion.datasetVersion}+${progression.datasetVersion}+${grade2Coverage.datasetVersion}`,
  scope: `${base.scope}；${expansion.scopeNote}；${progression.scopeNote}；补充二年级上册“长度单位”本年级 Occurrence 样板`,
  themes: progression.themes,
  progressions: progression.progressions,
  nodes: [
    ...base.nodes,
    ...expansion.nodes,
    ...fractionExpansion.nodes,
    ...geometryExpansion.nodes,
    ...statisticsExpansion.nodes,
    ...grade2Coverage.nodes,
  ],
  edges: [
    ...base.edges,
    ...expansion.edges,
    ...fractionExpansion.edges,
    ...geometryExpansion.edges,
    ...statisticsExpansion.edges,
    ...grade2Coverage.edges,
  ],
}

const nodeIndex = new Map(mathFineSample.nodes.map((node) => [node.id, node]))
const edgeIndex = new Map(mathFineSample.edges.map((edge) => [edge.id, edge]))
const themeIndex = new Map(mathFineSample.themes.map((theme) => [theme.id, theme]))
const progressionIndex = new Map(mathFineSample.progressions.map((item) => [item.id, item]))

export function mathFineNodeById(id: string) {
  return nodeIndex.get(id) ?? null
}

export function mathFineEdgeById(id: string) {
  return edgeIndex.get(id) ?? null
}

export function mathFineNodesByLabel(label: MathFineNodeLabel) {
  return mathFineSample.nodes.filter((node) => node.label === label)
}

export function mathFineEdgesForNode(id: string) {
  return mathFineSample.edges.filter((edge) => edge.source === id || edge.target === id)
}

export function mathFineEdgesByType(type: MathFineEdgeType) {
  return mathFineSample.edges.filter((edge) => edge.type === type)
}

export function mathFineThemeById(id: MathFineThemeId) {
  return themeIndex.get(id) ?? null
}

export function mathFineProgressionById(id: string) {
  return progressionIndex.get(id) ?? null
}

export function mathFineProgressionsForTheme(id: MathFineThemeId) {
  return mathFineSample.progressions.filter((item) => item.themeId === id)
}

export function mathFineNodesForTheme(id: MathFineThemeId) {
  const theme = mathFineThemeById(id)
  if (!theme) return []
  const chapterIds = new Set(theme.chapterIds)
  const nodeIds = new Set(theme.chapterIds)
  for (const edge of mathFineSample.edges) {
    if (edge.type === 'appears_in' && chapterIds.has(edge.target)) nodeIds.add(edge.source)
  }
  return mathFineSample.nodes.filter((node) => nodeIds.has(node.id))
}

export function mathFineEdgesForTheme(id: MathFineThemeId) {
  const nodeIds = new Set(mathFineNodesForTheme(id).map((node) => node.id))
  return mathFineSample.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
}

export function mathFineThemesForNode(id: string) {
  return mathFineSample.themes.filter((theme) => mathFineNodesForTheme(theme.id).some((node) => node.id === id))
}
