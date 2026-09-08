import { describe, expect, it } from 'vitest'
import {
  mathFineEdgesByType,
  mathFineEdgesForTheme,
  mathFineNodeById,
  mathFineNodesByLabel,
  mathFineNodesForTheme,
  mathFineSample,
  mathFineThemeById,
} from './mathFineSample'

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

  it('expands the raw excerpt across three primary math themes', () => {
    expect(mathFineSample.themes).toHaveLength(3)
    expect(mathFineSample.themes.map((item) => item.id)).toEqual([
      'number_algebra',
      'geometry',
      'statistics_probability',
    ])
    expect(mathFineNodesForTheme('number_algebra')).toHaveLength(12)
    expect(mathFineNodesForTheme('geometry')).toHaveLength(11)
    expect(mathFineNodesForTheme('statistics_probability')).toHaveLength(10)
    expect(mathFineEdgesForTheme('number_algebra')).toHaveLength(26)
    expect(mathFineEdgesForTheme('geometry')).toHaveLength(19)
    expect(mathFineEdgesForTheme('statistics_probability')).toHaveLength(17)
    expect(mathFineThemeById('geometry')?.chapterIds).toContain('math_3a_rjb_ch7')
  })

  it('contains distinct Concept Skill Exercise and Chapter nodes', () => {
    expect(mathFineSample.nodes).toHaveLength(59)
    expect(mathFineNodesByLabel('Chapter')).toHaveLength(6)
    expect(mathFineNodesByLabel('Concept')).toHaveLength(24)
    expect(mathFineNodesByLabel('Skill')).toHaveLength(11)
    expect(mathFineNodesByLabel('Exercise')).toHaveLength(18)
    expect(unique(mathFineSample.nodes.map((item) => item.id))).toBe(true)
  })

  it('keeps every excerpt edge resolvable inside the excerpt', () => {
    expect(mathFineSample.edges).toHaveLength(93)
    expect(unique(mathFineSample.edges.map((item) => item.id))).toBe(true)
    for (const edge of mathFineSample.edges) {
      expect(mathFineNodeById(edge.source), edge.id).not.toBeNull()
      expect(mathFineNodeById(edge.target), edge.id).not.toBeNull()
      expect(edge.sourceLocator.startsWith('math.json L'), edge.id).toBe(true)
    }
  })

  it('preserves raw prerequisite and assessment relation types', () => {
    expect(mathFineEdgesByType('prerequisites_for').length).toBeGreaterThanOrEqual(13)
    expect(mathFineEdgesByType('tests_concept').length).toBeGreaterThanOrEqual(17)
    expect(mathFineEdgesByType('tests_skill').length).toBeGreaterThanOrEqual(8)
    expect(mathFineEdgesByType('appears_in').length).toBeGreaterThanOrEqual(35)

    const exercise1Concept = mathFineSample.edges.find((item) => item.id === 'fine-e20')
    expect(exercise1Concept?.source).toBe('math_1a_rjb_exe1')
    expect(exercise1Concept?.target).toBe('math_1a_rjb_cpt2')
    expect(exercise1Concept?.type).toBe('tests_concept')

    const fractionAssessment = mathFineSample.edges.find((item) => item.id === 'fine-v2-e42')
    expect(fractionAssessment?.source).toBe('math_3a_rjb_exe20')
    expect(fractionAssessment?.target).toBe('math_3a_rjb_cpt29')
    expect(fractionAssessment?.type).toBe('tests_concept')

    const probabilityPrerequisite = mathFineSample.edges.find((item) => item.id === 'fine-v2-e50')
    expect(probabilityPrerequisite?.source).toBe('math_5a_rjb_cpt16')
    expect(probabilityPrerequisite?.target).toBe('math_5a_rjb_skl8')
    expect(probabilityPrerequisite?.type).toBe('prerequisites_for')
  })

  it('preserves a cross-grade geometry relation instead of flattening it', () => {
    const rectangleToQuadrilateral = mathFineSample.edges.find((item) => item.id === 'fine-v2-e01')
    expect(rectangleToQuadrilateral?.source).toBe('math_1b_rjb_cpt2')
    expect(rectangleToQuadrilateral?.target).toBe('math_3a_rjb_cpt23')
    expect(rectangleToQuadrilateral?.type).toBe('is_a')
    expect(mathFineNodeById('math_1b_rjb_cpt2')?.name).toBe('长方形')
    expect(mathFineNodeById('math_3a_rjb_cpt23')?.name).toBe('四边形')
  })

  it('does not relabel raw graph edges as benchmark evidence', () => {
    expect(mathFineSample.edges.some((item) => item.type === ('benchmark_prerequisite' as never))).toBe(false)
    expect(mathFineSample.nodes.every((item) => item.sourceLocator.length > 0)).toBe(true)
  })
})
