import { describe, expect, it } from 'vitest'
import { curriculumSeed } from './curriculum'
import {
  curriculumGradeVerificationRows,
  curriculumRepairTasks,
  curriculumVerificationPolicy,
  curriculumVerificationSummary,
  repairTasksForGrade,
  verificationRowsForSubject,
  verificationRowsForWave,
} from './curriculumVerification'

describe('subject-grade curriculum verification matrix', () => {
  it('covers every required primary-school subject and grade exactly once', () => {
    expect(curriculumGradeVerificationRows).toHaveLength(16)
    expect(verificationRowsForSubject('chinese').map((row) => row.grade)).toEqual([1, 2, 3, 4, 5, 6])
    expect(verificationRowsForSubject('english').map((row) => row.grade)).toEqual([3, 4, 5, 6])
    expect(verificationRowsForSubject('math').map((row) => row.grade)).toEqual([1, 2, 3, 4, 5, 6])
    expect(new Set(curriculumGradeVerificationRows.map((row) => row.id)).size).toBe(16)
  })

  it('reconciles all 459 Chinese and English seed entries into grade buckets', () => {
    const chinese = verificationRowsForSubject('chinese').reduce((sum, row) => sum + row.knowledgePointCount, 0)
    const english = verificationRowsForSubject('english').reduce((sum, row) => sum + row.knowledgePointCount, 0)
    expect(chinese).toBe(299)
    expect(english).toBe(160)
    expect(chinese + english).toBe(curriculumSeed.entries.length)
    expect(chinese + english).toBe(459)
  })

  it('runs automated structural/provenance checks for all grade buckets but never calls them human verified', () => {
    expect(curriculumVerificationSummary.automatedCheckedRows).toBe(16)
    expect(curriculumGradeVerificationRows.every((row) => ['passed', 'passed_with_findings'].includes(row.automatedStatus))).toBe(true)
    expect(curriculumGradeVerificationRows.every((row) => row.humanStatus === 'not_started')).toBe(true)
    expect(curriculumVerificationSummary.humanVerifiedRows).toBe(0)
    expect(curriculumVerificationSummary.gradeVerificationReadyForOfficialRelease).toBe(false)
  })

  it('executes wave 1 on Chinese grades 1-2, English grade 3 and math grade 3', () => {
    expect(verificationRowsForWave(1).map((row) => `${row.subject}:${row.grade}`)).toEqual([
      'chinese:1',
      'chinese:2',
      'english:3',
      'math:3',
    ])
    expect(curriculumVerificationSummary.wave1ExecutedRows).toBe(4)
    expect(verificationRowsForSubject('chinese').find((row) => row.grade === 1)?.contentStatus).toBe('patch_proposed')
    expect(verificationRowsForSubject('chinese').find((row) => row.grade === 2)?.contentStatus).toBe('patch_proposed')
    expect(verificationRowsForSubject('english').find((row) => row.grade === 3)?.contentStatus).toBe('automated_screened')
    expect(verificationRowsForSubject('math').find((row) => row.grade === 3)?.contentStatus).toBe('automated_screened')
  })

  it('turns all seven registered issues into explicit non-auto-applied repair tasks', () => {
    expect(curriculumRepairTasks).toHaveLength(7)
    expect(new Set(curriculumRepairTasks.map((task) => task.issueId))).toEqual(new Set(curriculumSeed.issues.map((issue) => issue.id)))
    expect(curriculumRepairTasks.every((task) => task.autoApply === false)).toBe(true)
    expect(repairTasksForGrade('chinese', 1)).toHaveLength(2)
    expect(repairTasksForGrade('chinese', 2)).toHaveLength(2)
    expect(curriculumRepairTasks.filter((task) => task.status === 'patch_proposed')).toHaveLength(4)
  })

  it('keeps every existing math grade represented by provenance-backed occurrences', () => {
    const mathRows = verificationRowsForSubject('math')
    expect(mathRows.every((row) => row.occurrenceCount > 0)).toBe(true)
    expect(mathRows.every((row) => row.missingSourceCount === 0)).toBe(true)
    expect(mathRows.every((row) => row.unresolvedAssessmentTargetCount === 0)).toBe(true)
  })

  it('requires content, relation, standards, rights and human review checks in the policy', () => {
    expect(curriculumVerificationPolicy.requiredChecks).toContain('知识名称与学习要求一致性')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('跨年级关系证据')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('课标映射证据')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('许可证/权利状态')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('真人学科复核')
  })
})
