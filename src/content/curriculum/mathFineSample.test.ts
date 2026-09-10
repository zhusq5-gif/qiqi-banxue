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
    expect(mathFineSample.themes.map((item) => item.id)).toEqual(['number_algebra', 'geometry', 'statistics_probability'])
    expect(mathFineNodesForTheme('number_algebra')).toHaveLength(29)
    expect(mathFineNodesForTheme('geometry')).toHaveLength(34)
    expect(mathFineNodesForTheme('statistics_probability')).toHaveLength(32)
    expect(mathFineEdgesForTheme('number_algebra')).toHaveLength(53)
    expect(mathFineEdgesForTheme('geometry')).toHaveLength(49)
    expect(mathFineEdgesForTheme('statistics_probability')).toHaveLength(46)
    expect(mathFineThemeById('number_algebra')?.chapterIds).toEqual(['math_3a_rjb_ch8', 'math_5b_rjb_ch4', 'math_6a_rjb_ch1', 'math_6a_rjb_ch3'])
  })

  it('contains distinct raw nodes including grade-2 coverage and the restored right-angle target', () => {
    expect(mathFineSample.nodes).toHaveLength(131)
    expect(mathFineNodesByLabel('Chapter')).toHaveLength(17)
    expect(mathFineNodesByLabel('Concept')).toHaveLength(61)
    expect(mathFineNodesByLabel('Skill')).toHaveLength(22)
    expect(mathFineNodesByLabel('Exercise')).toHaveLength(31)
    expect(unique(mathFineSample.nodes.map((item) => item.id))).toBe(true)
    expect(mathFineNodeById('math_2a_rjb_ch1')?.name).toBe('长度单位')
    expect(mathFineNodeById('math_2a_rjb_cpt12')?.name).toBe('直角')
  })

  it('keeps every excerpt edge resolvable inside the excerpt', () => {
    expect(mathFineSample.edges).toHaveLength(199)
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
        for (const anchorId of stage.anchorIds) expect(mathFineNodeById(anchorId), `${progression.id}:${anchorId}`).not.toBeNull()
      }
      for (const rawEdgeId of progression.formalRawEdgeIds) expect(mathFineEdgeById(rawEdgeId), `${progression.id}:${rawEdgeId}`).not.toBeNull()
    }
    expect(mathFineSample.edges.some((edge) => edge.type === ('research_sequence' as never))).toBe(false)
  })

  it('preserves raw prerequisite and assessment relation types', () => {
    expect(mathFineEdgesByType('prerequisites_for').length).toBeGreaterThanOrEqual(28)
    expect(mathFineEdgesByType('tests_concept').length).toBeGreaterThanOrEqual(28)
    expect(mathFineEdgesByType('tests_skill').length).toBeGreaterThanOrEqual(16)
    expect(mathFineEdgesByType('appears_in').length).toBeGreaterThanOrEqual(83)
    expect(mathFineEdgeById('fine-v3-e16')?.type).toBe('tests_concept')
    expect(mathFineEdgeById('fine-v4-e15')?.type).toBe('tests_skill')
  })

  it('restores the raw tests_concept edge for the grade-4 right-angle exercise', () => {
    const edge = mathFineEdgeById('fine-v4-wave2-e01')
    expect(edge?.source).toBe('math_4a_rjb_exe8')
    expect(edge?.target).toBe('math_2a_rjb_cpt12')
    expect(edge?.type).toBe('tests_concept')
    expect(edge?.sourceLocator).toBe('math.json L65814-L65822')
  })

  it('preserves grade-2 own chapter occurrences rather than relying on higher-grade reuse', () => {
    for (const rawId of ['math_2a_rjb_cpt1', 'math_2a_rjb_cpt2', 'math_2a_rjb_cpt3', 'math_2a_rjb_cpt4', 'math_2a_rjb_skl1', 'math_2a_rjb_skl2']) {
      expect(mathFineSample.edges.some((edge) => edge.source === rawId && edge.target === 'math_2a_rjb_ch1' && edge.type === 'appears_in'), rawId).toBe(true)
    }
  })

  it('preserves cross-grade raw relations instead of flattening them', () => {
    const rectangleToQuadrilateral = mathFineSample.edges.find((item) => item.id === 'fine-v2-e01')
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
