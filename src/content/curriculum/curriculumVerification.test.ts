import { describe, expect, it } from 'vitest'
import { curriculumSeed } from './curriculum'
import { mathNormalizedDataset } from './mathNormalized'
import {
  curriculumCoverageTasks,
  curriculumGradeVerificationRows,
  curriculumKnowledgeVerificationItems,
  curriculumRepairTasks,
  curriculumVerificationPolicy,
  curriculumVerificationSummary,
  repairTasksForGrade,
  verificationItemsForGrade,
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

  it('creates one item-level verification record for every text entry and every math occurrence', () => {
    expect(curriculumVerificationSummary.textItemCount).toBe(459)
    expect(curriculumVerificationSummary.mathOccurrenceItemCount).toBe(mathNormalizedDataset.occurrences.length)
    expect(curriculumVerificationSummary.itemCount).toBe(459 + mathNormalizedDataset.occurrences.length)
    expect(curriculumKnowledgeVerificationItems).toHaveLength(curriculumVerificationSummary.itemCount)
    expect(new Set(curriculumKnowledgeVerificationItems.map((item) => item.id)).size).toBe(curriculumKnowledgeVerificationItems.length)
    expect(curriculumKnowledgeVerificationItems.every((item) => item.sourcePresent && item.gradeBound)).toBe(true)
  })

  it('matches each grade aggregate occurrence count to its item-level ledger', () => {
    for (const row of curriculumGradeVerificationRows) {
      expect(verificationItemsForGrade(row.subject, row.grade).length, row.id).toBe(row.occurrenceCount)
    }
  })

  it('runs automated structural/provenance checks for all grade buckets but never calls them human verified', () => {
    expect(curriculumVerificationSummary.automatedCheckedRows).toBe(16)
    expect(curriculumGradeVerificationRows.every((row) => ['passed', 'passed_with_findings'].includes(row.automatedStatus))).toBe(true)
    expect(curriculumGradeVerificationRows.every((row) => row.humanStatus === 'not_started')).toBe(true)
    expect(curriculumKnowledgeVerificationItems.every((item) => item.humanStatus === 'not_started')).toBe(true)
    expect(curriculumVerificationSummary.humanVerifiedRows).toBe(0)
    expect(curriculumVerificationSummary.humanVerifiedItems).toBe(0)
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
    expect(verificationItemsForGrade('english', 3).every((item) => item.status === 'automated_screened')).toBe(true)
    expect(verificationItemsForGrade('math', 3).every((item) => item.status === 'automated_screened')).toBe(true)
  })

  it('marks only issue-linked wave-1 text items as needs_patch', () => {
    const wave1ChineseItems = [
      ...verificationItemsForGrade('chinese', 1),
      ...verificationItemsForGrade('chinese', 2),
    ]
    const needsPatch = wave1ChineseItems.filter((item) => item.status === 'needs_patch')
    expect(needsPatch).toHaveLength(4)
    expect(new Set(needsPatch.flatMap((item) => item.registeredIssueIds))).toEqual(new Set(['F001', 'F002', 'F003', 'F004']))
  })

  it('turns all seven registered issues into explicit non-auto-applied repair tasks', () => {
    expect(curriculumRepairTasks).toHaveLength(7)
    expect(new Set(curriculumRepairTasks.map((task) => task.issueId))).toEqual(new Set(curriculumSeed.issues.map((issue) => issue.id)))
    expect(curriculumRepairTasks.every((task) => task.autoApply === false)).toBe(true)
    expect(repairTasksForGrade('chinese', 1)).toHaveLength(2)
    expect(repairTasksForGrade('chinese', 2)).toHaveLength(2)
    expect(curriculumRepairTasks.filter((task) => task.status === 'patch_proposed')).toHaveLength(4)
  })

  it('keeps missing grade coverage explicit instead of pretending reused concepts are coverage', () => {
    const mathRows = verificationRowsForSubject('math')
    const gaps = mathRows.filter((row) => row.coverageStatus === 'gap')
    expect(gaps.map((row) => row.grade)).toEqual([2])
    expect(gaps[0]?.occurrenceCount).toBe(0)
    expect(gaps[0]?.contentStatus).toBe('coverage_gap')
    expect(curriculumCoverageTasks).toHaveLength(1)
    expect(curriculumCoverageTasks[0]?.id).toBe('coverage:math:2')
    expect(curriculumCoverageTasks[0]?.blocking).toBe(true)
    expect(curriculumVerificationSummary.coverageGapCount).toBe(1)
    expect(curriculumVerificationSummary.repairTaskCount).toBe(8)

    const coveredRows = mathRows.filter((row) => row.coverageStatus === 'present')
    expect(coveredRows.every((row) => row.occurrenceCount > 0)).toBe(true)
    expect(coveredRows.every((row) => row.missingSourceCount === 0)).toBe(true)
    expect(coveredRows.every((row) => row.unresolvedAssessmentTargetCount === 0)).toBe(true)
  })

  it('requires coverage, content, relation, standards, rights and human review checks in the policy', () => {
    expect(curriculumVerificationPolicy.requiredChecks).toContain('覆盖完整性')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('知识名称与学习要求一致性')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('跨年级关系证据')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('课标映射证据')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('许可证/权利状态')
    expect(curriculumVerificationPolicy.requiredChecks).toContain('真人学科复核')
  })
})
