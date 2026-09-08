import rawFineSample from './math-fine-sample-v01.json'

export type MathFineNodeLabel = 'Chapter' | 'Concept' | 'Skill' | 'Exercise'
export type MathFineEdgeType = 'relates_to' | 'prerequisites_for' | 'is_a' | 'appears_in' | 'tests_concept' | 'tests_skill'

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
  nodes: MathFineNode[]
  edges: MathFineEdge[]
}

export const mathFineSample = rawFineSample as MathFineSample

const nodeIndex = new Map(mathFineSample.nodes.map((node) => [node.id, node]))

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
