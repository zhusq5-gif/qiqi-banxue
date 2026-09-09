import { describe, expect, it } from 'vitest'
import {
  mathFineEdgeById,
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

  it('expands the raw excerpt into three cross-grade primary math themes', () => {
    expect(mathFineSample.themes).toHaveLength(3)
    expect(mathFineSample.themes.map((item) => item.id)).toEqual([
      'number_algebra',
      'geometry',
      'statistics_probability',
    ])
    expect(mathFineNodesForTheme('number_algebra')).toHaveLength(29)
    expect(mathFineNodesForTheme('geometry')).toHaveLength(34)
    expect(mathFineNodesForTheme('statistics_probability')).toHaveLength(32)
    expect(mathFineEdgesForTheme('number_algebra')).toHaveLength(53)
    expect(mathFineEdgesForTheme('geometry')).toHaveLength(49)
    expect(mathFineEdgesForTheme('statistics_probability')).toHaveLength(46)
    expect(mathFineThemeById('number_algebra')?.chapterIds).toEqual([
      'math_3a_rjb_ch8',
      'math_5b_rjb_ch4',
      'math_6a_rjb_ch1',
      'math_6a_rjb_ch3',
    ])
  })

  it('contains distinct Concept Skill Exercise and Chapter nodes', () => {
    expect(mathFineSample.nodes).toHaveLength(121)
    expect(mathFineNodesByLabel('Chapter')).toHaveLength(16)
    expect(mathFineNodesByLabel('Concept')).toHaveLength(56)
    expect(mathFineNodesByLabel('Skill')).toHaveLength(20)
    expect(mathFineNodesByLabel('Exercise')).toHaveLength(29)
    expect(unique(mathFineSample.nodes.map((item) => item.id))).toBe(true)
  })

  it('keeps every excerpt edge resolvable inside the excerpt', () => {
    expect(mathFineSample.edges).toHaveLength(179)
    expect(unique(mathFineSample.edges.map((item) => item.id))).toBe(true)
    for (const edge of mathFineSample.edges) {
      expect(mathFineNodeById(edge.source), edge.id).not.toBeNull()
      expect(mathFineNodeById(edge.target), edge.id).not.toBeNull()
      expect(edge.sourceLocator.startsWith('math.json L'), edge.id).toBe(true)
    }
  })

  it('keeps research sequence separate from raw prerequisite semantics', () => {
    expect(mathFineSample.progressions).toHaveLength(3)
    for (const progression of mathFineSample.progressions) {
      expect(progression.status).toBe('research_sequence')
      expect(progression.stages.length).toBeGreaterThanOrEqual(4)
      for (const stage of progression.stages) {
        expect(mathFineNodeById(stage.chapterId), `${progression.id}:${stage.chapterId}`).not.toBeNull()
        for (const anchorId of stage.anchorIds) {
          expect(mathFineNodeById(anchorId), `${progression.id}:${anchorId}`).not.toBeNull()
        }
      }
      for (const rawEdgeId of progression.formalRawEdgeIds) {
        expect(mathFineEdgeById(rawEdgeId), `${progression.id}:${rawEdgeId}`).not.toBeNull()
      }
    }
    expect(mathFineSample.edges.some((edge) => edge.type === ('research_sequence' as never))).toBe(false)
  })

  it('preserves raw prerequisite and assessment relation types', () => {
    expect(mathFineEdgesByType('prerequisites_for').length).toBeGreaterThanOrEqual(25)
    expect(mathFineEdgesByType('tests_concept').length).toBeGreaterThanOrEqual(24)
    expect(mathFineEdgesByType('tests_skill').length).toBeGreaterThanOrEqual(14)
    expect(mathFineEdgesByType('appears_in').length).toBeGreaterThanOrEqual(75)

    const fractionAssessment = mathFineSample.edges.find((item) => item.id === 'fine-v3-e16')
    expect(fractionAssessment?.source).toBe('math_6a_rjb_exe2')
    expect(fractionAssessment?.target).toBe('math_6a_rjb_cpt2')
    expect(fractionAssessment?.type).toBe('tests_concept')

    const statisticsProgression = mathFineSample.edges.find((item) => item.id === 'fine-v3-e67')
    expect(statisticsProgression?.source).toBe('math_5b_rjb_cpt38')
    expect(statisticsProgression?.target).toBe('math_4a_rjb_cpt35')
    expect(statisticsProgression?.type).toBe('relates_to')
  })

  it('preserves cross-grade raw relations instead of flattening them', () => {
    const rectangleToQuadrilateral = mathFineSample.edges.find((item) => item.id === 'fine-v2-e01')
    expect(rectangleToQuadrilateral?.source).toBe('math_1b_rjb_cpt2')
    expect(rectangleToQuadrilateral?.target).toBe('math_3a_rjb_cpt23')
    expect(rectangleToQuadrilateral?.type).toBe('is_a')

    const lineToBar = mathFineSample.edges.find((item) => item.id === 'fine-v3-e67')
    expect(lineToBar?.source).toBe('math_5b_rjb_cpt38')
    expect(lineToBar?.target).toBe('math_4a_rjb_cpt35')
    expect(lineToBar?.type).toBe('relates_to')
  })

  it('does not relabel raw graph edges as benchmark evidence', () => {
    expect(mathFineSample.edges.some((item) => item.type === ('benchmark_prerequisite' as never))).toBe(false)
    expect(mathFineSample.nodes.every((item) => item.sourceLocator.length > 0)).toBe(true)
  })
})
