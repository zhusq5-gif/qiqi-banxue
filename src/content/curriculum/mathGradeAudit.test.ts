import { describe, expect, it } from 'vitest'
import { mathGradeAudit, mathGradeAudits, mathWave2AuditTasks, mathWave2GradeAudits } from './mathGradeAudit'

describe('grade-level math evidence audit', () => {
  it('audits all primary grades and keeps wave 2 focused on grades 4 and 5', () => {
    expect(mathGradeAudits.map((item) => item.grade)).toEqual([1, 2, 3, 4, 5, 6])
    expect(mathWave2GradeAudits.map((item) => item.grade)).toEqual([4, 5])
    expect(mathGradeAudits.every((item) => item.occurrenceCount > 0)).toBe(true)
  })

  it('removes the false-positive exe8 gap after restoring its raw tests edge', () => {
    const grade4 = mathGradeAudit(4)!
    expect(grade4.unresolvedAssessmentTargetCount).toBe(0)
    expect(grade4.unlinkedAssessmentCount).toBe(1)
    expect(mathWave2AuditTasks.some((task) => task.id === 'math-audit:g4:assessment:math_4a_rjb_exe8')).toBe(false)
  })

  it('classifies the remaining exe20 gap as a source-unlinked candidate after raw-source audit', () => {
    const task = mathWave2AuditTasks.find((item) => item.id === 'math-audit:g4:assessment:math_4a_rjb_exe20')
    expect(task?.kind).toBe('source_unlinked_assessment_candidate')
    expect(task?.severity).toBe('blocking')
    expect(task?.sourceRefs).toContain('math.json L36529-L36533')
    expect(task?.sourceRefs).toContain('math.json L65769-L66025')
    expect(task?.autoApply).toBe(false)
  })

  it('keeps the known grade-5 to grade-4 statistics relation as relates_to with evidence', () => {
    const grade4 = mathGradeAudit(4)!
    const grade5 = mathGradeAudit(5)!
    const relation4 = grade4.crossGradeRelations.find((item) => item.rawEdgeId === 'fine-v3-e67')
    const relation5 = grade5.crossGradeRelations.find((item) => item.rawEdgeId === 'fine-v3-e67')
    for (const relation of [relation4, relation5]) {
      expect(relation).toBeTruthy()
      expect(relation?.relationType).toBe('relates_to')
      expect(relation?.fromRawGrade).toBe(5)
      expect(relation?.toRawGrade).toBe(4)
      expect(relation?.evidence.length).toBeGreaterThan(0)
      expect(relation?.sourceLocator.startsWith('math.json L')).toBe(true)
    }
  })

  it('records prior-grade concept reuse as occurrence review rather than a synthetic prerequisite', () => {
    const grade4 = mathGradeAudit(4)!
    const angleReuse = grade4.reusedPriorGradeOccurrences.find((item) => item.knowledgeNodeId === 'math:kg:math_2a_rjb_cpt9')
    expect(angleReuse?.rawOriginGrade).toBe(2)
    expect(angleReuse?.occurrenceGrade).toBe(4)
    expect(angleReuse?.chapterId).toBe('math_4a_rjb_ch3')
    expect(mathWave2AuditTasks.some((task) => task.id === `math-audit:g4:reuse:${angleReuse?.occurrenceId}` && task.severity === 'review')).toBe(true)
  })

  it('requires evidence for semantic relations and keeps source gaps separate from review relations', () => {
    for (const audit of mathWave2GradeAudits) {
      expect(audit.relationEvidenceMissingCount).toBe(0)
      expect(audit.futureOriginOccurrenceCount).toBe(0)
    }
    expect(mathWave2AuditTasks.every((task) => task.autoApply === false)).toBe(true)
    expect(mathWave2AuditTasks.filter((task) => task.kind === 'cross_grade_relation_review').every((task) => task.severity === 'review')).toBe(true)
    expect(mathWave2AuditTasks.filter((task) => task.kind === 'source_unlinked_assessment_candidate')).toHaveLength(1)
    expect(mathWave2AuditTasks.filter((task) => task.kind === 'assessment_without_target')).toHaveLength(0)
  })
})
