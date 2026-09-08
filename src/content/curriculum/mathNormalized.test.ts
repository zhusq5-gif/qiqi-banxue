import { describe, expect, it } from 'vitest'
import {
  mathFineEdgeById,
  mathFineNodeById,
  mathFineSample,
  mathFineThemesForNode,
} from './mathFineSample'
import {
  mathAssessmentTasks,
  mathKnowledgeNodes,
  mathNormalizedDataset,
  mathNormalizedNodeById,
  mathNormalizedNodeByRawId,
  mathNormalizedRelations,
  mathOccurrences,
  mathOccurrencesForNode,
} from './mathNormalized'

function unique(values: string[]) {
  return new Set(values).size === values.length
}

describe('normalized primary math curriculum layer', () => {
  it('maps only raw Concept and Skill nodes into provisional KnowledgeNode identities', () => {
    expect(mathKnowledgeNodes).toHaveLength(76)
    expect(mathKnowledgeNodes.filter((item) => item.kind === 'concept')).toHaveLength(56)
    expect(mathKnowledgeNodes.filter((item) => item.kind === 'skill')).toHaveLength(20)
    expect(unique(mathKnowledgeNodes.map((item) => item.id))).toBe(true)
    expect(mathKnowledgeNodes.every((item) => item.canonicalStatus === 'provisional')).toBe(true)
    expect(mathKnowledgeNodes.every((item) => item.source.license === 'CC BY-NC-SA 4.0')).toBe(true)
    expect(mathKnowledgeNodes.every((item) => item.source.commercialUse === false)).toBe(true)
    expect(mathKnowledgeNodes.some((item) => item.source.rawId.includes('_exe'))).toBe(false)
    expect(mathKnowledgeNodes.some((item) => item.source.rawId.includes('_ch'))).toBe(false)
  })

  it('derives Occurrence from raw appears_in without duplicating knowledge identity', () => {
    const rawKnowledgeIds = new Set(mathFineSample.nodes.filter((node) => node.label === 'Concept' || node.label === 'Skill').map((node) => node.id))
    const expected = mathFineSample.edges.filter(
      (edge) => edge.type === 'appears_in' && rawKnowledgeIds.has(edge.source) && mathFineNodeById(edge.target)?.label === 'Chapter',
    ).length
    expect(mathOccurrences).toHaveLength(expected)
    expect(unique(mathOccurrences.map((item) => item.id))).toBe(true)
    for (const occurrence of mathOccurrences) {
      expect(mathNormalizedNodeById(occurrence.knowledgeNodeId), occurrence.id).not.toBeNull()
      expect(mathFineNodeById(occurrence.chapterId)?.label, occurrence.id).toBe('Chapter')
      expect(occurrence.grade).toBeGreaterThanOrEqual(1)
      expect(occurrence.grade).toBeLessThanOrEqual(6)
      expect([1, 2]).toContain(occurrence.semester)
      expect(occurrence.source.sourceLocator.startsWith('math.json L')).toBe(true)
    }

    const lineChart = mathNormalizedNodeByRawId('math_5b_rjb_cpt38')!
    const lineOccurrences = mathOccurrencesForNode(lineChart.id)
    expect(lineOccurrences.some((item) => item.chapterId === 'math_5b_rjb_ch7' && item.grade === 5 && item.semester === 2)).toBe(true)
    expect(lineOccurrences.some((item) => item.chapterId === 'math_6a_rjb_ch7' && item.grade === 6 && item.semester === 1)).toBe(true)
  })

  it('maps raw Exercise plus tests edges into AssessmentTask references', () => {
    expect(mathAssessmentTasks).toHaveLength(29)
    expect(unique(mathAssessmentTasks.map((item) => item.id))).toBe(true)
    for (const task of mathAssessmentTasks) {
      for (const targetId of task.assessedKnowledgeNodeIds) {
        expect(mathNormalizedNodeById(targetId), `${task.id}:${targetId}`).not.toBeNull()
      }
      expect(task.source.rawId).toBe(task.rawExerciseId)
      expect(task.source.sourceLocator.startsWith('math.json L')).toBe(true)
    }

    const populationTrend = mathAssessmentTasks.find((item) => item.rawExerciseId === 'math_5b_rjb_exe16')!
    expect(populationTrend.assessedKnowledgeNodeIds).toContain('math:kg:math_5b_rjb_cpt38')
    expect(populationTrend.assessedKnowledgeNodeIds).toContain('math:kg:math_5b_rjb_skl12')
    expect(populationTrend.chapterIds).toContain('math_5b_rjb_ch7')
  })

  it('preserves only raw semantic knowledge edges as normalized relations', () => {
    const semanticTypes = new Set(['prerequisites_for', 'relates_to', 'is_a'])
    const rawKnowledgeIds = new Set(mathKnowledgeNodes.map((item) => item.source.rawId))
    const expected = mathFineSample.edges.filter(
      (edge) => semanticTypes.has(edge.type) && rawKnowledgeIds.has(edge.source) && rawKnowledgeIds.has(edge.target),
    ).length
    expect(mathNormalizedRelations).toHaveLength(expected)
    expect(unique(mathNormalizedRelations.map((item) => item.id))).toBe(true)
    for (const relation of mathNormalizedRelations) {
      const raw = mathFineEdgeById(relation.rawEdgeId)
      expect(raw, relation.id).not.toBeNull()
      expect(raw?.type).toBe(relation.relationType)
      expect(mathNormalizedNodeById(relation.fromKnowledgeNodeId), relation.id).not.toBeNull()
      expect(mathNormalizedNodeById(relation.toKnowledgeNodeId), relation.id).not.toBeNull()
    }
    expect(mathNormalizedRelations.some((item) => item.relationType === ('research_sequence' as never))).toBe(false)
  })

  it('assigns reviewed browsing domains without guessing unclassified raw nodes', () => {
    const fraction = mathNormalizedNodeByRawId('math_6a_rjb_cpt2')!
    expect(fraction.domains).toContain('number_algebra')
    const circle = mathNormalizedNodeByRawId('math_6a_rjb_cpt21')!
    expect(circle.domains).toContain('geometry')
    const pie = mathNormalizedNodeByRawId('math_6a_rjb_cpt31')!
    expect(pie.domains).toContain('statistics_probability')

    const earlyCounting = mathNormalizedNodeByRawId('math_1a_rjb_cpt1')!
    expect(mathFineThemesForNode(earlyCounting.source.rawId)).toHaveLength(0)
    expect(earlyCounting.domains).toEqual(['unclassified'])
  })

  it('keeps progression metadata as research sequence rather than synthesizing normalized edges', () => {
    for (const progression of mathFineSample.progressions) {
      expect(progression.status).toBe('research_sequence')
      for (const stage of progression.stages) {
        expect(mathFineNodeById(stage.chapterId), stage.chapterId).not.toBeNull()
        for (const anchorId of stage.anchorIds) expect(mathFineNodeById(anchorId), anchorId).not.toBeNull()
      }
      for (const edgeId of progression.formalRawEdgeIds) expect(mathFineEdgeById(edgeId), edgeId).not.toBeNull()
    }
    expect(mathNormalizedDataset.schemaNote).toContain('research_sequence 不会转换为 prerequisite')
  })
})
