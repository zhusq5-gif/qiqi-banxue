import { describe, expect, it } from 'vitest'
import {
  curriculumVerificationPolicyWave2,
  curriculumVerificationSummaryWave2,
  mathWave2AuditTasks,
  verificationItemsForGradeWave2,
  verificationRowsForSubjectWave2,
} from './curriculumVerificationWave2'

describe('wave 2 math verification', () => {
  it('surfaces grade 4 and 5 audit findings after raw binding repair', () => {
    const rows = verificationRowsForSubjectWave2('math')
    const grade4 = rows.find((row) => row.grade === 4)!
    const grade5 = rows.find((row) => row.grade === 5)!
    expect(grade4.contentStatus).toBe('audit_findings')
    expect(grade5.contentStatus).toBe('audit_findings')
    expect(grade4.unlinkedAssessmentCount).toBe(1)
    expect(grade4.crossGradeSemanticRelationCount).toBeGreaterThanOrEqual(1)
    expect(grade4.reusedPriorGradeOccurrenceCount).toBeGreaterThanOrEqual(1)
    expect(grade4.relationEvidenceMissingCount).toBe(0)
    expect(grade5.crossGradeSemanticRelationCount).toBeGreaterThanOrEqual(1)
    expect(grade5.relationEvidenceMissingCount).toBe(0)
  })

  it('keeps math item screening separate from blocking and review audit tasks', () => {
    expect(verificationItemsForGradeWave2('math', 4).every((item) => item.status === 'automated_screened')).toBe(true)
    expect(verificationItemsForGradeWave2('math', 5).every((item) => item.status === 'automated_screened')).toBe(true)
    expect(mathWave2AuditTasks.filter((task) => task.kind === 'assessment_without_target')).toHaveLength(1)
    expect(mathWave2AuditTasks.some((task) => task.id === 'math-audit:g4:assessment:math_4a_rjb_exe20' && task.severity === 'blocking')).toBe(true)
    expect(mathWave2AuditTasks.some((task) => task.kind === 'cross_grade_relation_review' && task.severity === 'review')).toBe(true)
  })

  it('keeps assessment binding and human review in the release gate', () => {
    expect(curriculumVerificationPolicyWave2.requiredChecks).toContain('测评任务知识点绑定')
    expect(curriculumVerificationSummaryWave2.mathWave2AuditTaskCount).toBe(mathWave2AuditTasks.length)
    expect(curriculumVerificationSummaryWave2.mathWave2BlockingTaskCount).toBe(1)
    expect(curriculumVerificationSummaryWave2.gradeVerificationReadyForOfficialRelease).toBe(false)
  })
})
