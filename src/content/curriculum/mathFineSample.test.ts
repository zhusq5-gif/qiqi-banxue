import { describe, expect, it } from 'vitest'
import { mathFineEdgesByType, mathFineNodeById, mathFineNodesByLabel, mathFineSample } from './mathFineSample'

function unique(values: string[]) {
  return new Set(values).size === values.length
}

describe('K12-KGraph fine-grained primary math excerpt', () => {
  it('keeps the raw-subgraph provenance and non-commercial boundary explicit', () => {
    expect(mathFineSample.status).toBe('research_only')
    expect(mathFineSample.source.provenanceKind).toBe('raw_subject_specific_graph_excerpt')
    expect(mathFineSample.source.license).toBe('CC BY-NC-SA 4.0')
    expect(mathFineSample.source.commercialUse).toBe(false)
    expect(mathFineSample.source.rawUrl).toContain('/subject_specific_KG/math.json')
  })

  it('contains distinct Concept Skill Exercise and Chapter nodes', () => {
    expect(mathFineSample.nodes).toHaveLength(26)
    expect(mathFineNodesByLabel('Chapter')).toHaveLength(3)
    expect(mathFineNodesByLabel('Concept')).toHaveLength(9)
    expect(mathFineNodesByLabel('Skill')).toHaveLength(5)
    expect(mathFineNodesByLabel('Exercise')).toHaveLength(9)
    expect(unique(mathFineSample.nodes.map((item) => item.id))).toBe(true)
  })

  it('keeps every excerpt edge resolvable inside the excerpt', () => {
    expect(mathFineSample.edges).toHaveLength(31)
    expect(unique(mathFineSample.edges.map((item) => item.id))).toBe(true)
    for (const edge of mathFineSample.edges) {
      expect(mathFineNodeById(edge.source), edge.id).not.toBeNull()
      expect(mathFineNodeById(edge.target), edge.id).not.toBeNull()
      expect(edge.sourceLocator.startsWith('math.json L'), edge.id).toBe(true)
    }
  })

  it('preserves raw prerequisite and assessment relation types', () => {
    expect(mathFineEdgesByType('prerequisites_for').length).toBeGreaterThanOrEqual(5)
    expect(mathFineEdgesByType('tests_concept').length).toBeGreaterThanOrEqual(7)
    expect(mathFineEdgesByType('tests_skill').length).toBeGreaterThanOrEqual(4)
    expect(mathFineEdgesByType('appears_in').length).toBeGreaterThanOrEqual(5)

    const exercise1Concept = mathFineSample.edges.find((item) => item.id === 'fine-e20')
    expect(exercise1Concept?.source).toBe('math_1a_rjb_exe1')
    expect(exercise1Concept?.target).toBe('math_1a_rjb_cpt2')
    expect(exercise1Concept?.type).toBe('tests_concept')

    const skillPrerequisite = mathFineSample.edges.find((item) => item.id === 'fine-e11')
    expect(skillPrerequisite?.source).toBe('math_1a_rjb_skl3')
    expect(skillPrerequisite?.target).toBe('math_1a_rjb_skl4')
    expect(skillPrerequisite?.type).toBe('prerequisites_for')
  })

  it('does not relabel raw graph edges as benchmark evidence', () => {
    expect(mathFineSample.edges.some((item) => item.type === ('benchmark_prerequisite' as never))).toBe(false)
    expect(mathFineSample.nodes.every((item) => item.sourceLocator.length > 0)).toBe(true)
  })
})
