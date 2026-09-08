import rawFineSample from './math-fine-sample-v01.json'
import rawFineExpansion from './math-fine-sample-expansion-v02.json'

export type MathFineNodeLabel = 'Chapter' | 'Concept' | 'Skill' | 'Exercise'
export type MathFineEdgeType = 'relates_to' | 'prerequisites_for' | 'is_a' | 'appears_in' | 'tests_concept' | 'tests_skill'
export type MathFineThemeId = 'number_algebra' | 'geometry' | 'statistics_probability'

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
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}

type MathFineBase = Omit<MathFineSample, 'themes'>
type MathFineExpansion = {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  scopeNote: string
  themes: MathFineTheme[]
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}

const base = rawFineSample as MathFineBase
const expansion = rawFineExpansion as MathFineExpansion

export const mathFineSample: MathFineSample = {
  ...base,
  datasetVersion: `${base.datasetVersion}+${expansion.datasetVersion}`,
  scope: `${base.scope}；${expansion.scopeNote}`,
  themes: expansion.themes,
  nodes: [...base.nodes, ...expansion.nodes],
  edges: [...base.edges, ...expansion.edges],
}

const nodeIndex = new Map(mathFineSample.nodes.map((node) => [node.id, node]))
const themeIndex = new Map(mathFineSample.themes.map((theme) => [theme.id, theme]))

export function mathFineNodeById(id: string) {
  return nodeIndex.get(id) ?? null
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
