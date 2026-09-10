import { describe, expect, it } from 'vitest'
import {
  curriculumKnowledgeVerificationItemsWave2,
  curriculumRepairTasksWave2,
  curriculumVerificationSummaryWave2,
  verificationRowsForSubjectWave2,
  verificationRowsForWave2,
} from './curriculumVerificationWave2'

describe('wave 2 text verification', () => {
  it('executes the five planned wave-2 grade units', () => {
    expect(verificationRowsForWave2(2).map((row) => `${row.subject}:${row.grade}`)).toEqual([
      'chinese:4', 'english:4', 'english:6', 'math:4', 'math:5',
    ])
    expect(curriculumVerificationSummaryWave2.wave2ExecutedRows).toBe(5)
    expect(curriculumVerificationSummaryWave2.executedRows).toBe(9)
  })

  it('keeps F005 manual while F006/F007 enter recheck', () => {
    expect(verificationRowsForSubjectWave2('chinese').find((row) => row.grade === 4)?.contentStatus).toBe('manual_review_required')
    expect(verificationRowsForSubjectWave2('english').find((row) => row.grade === 4)?.contentStatus).toBe('recheck_pending')
    expect(verificationRowsForSubjectWave2('english').find((row) => row.grade === 6)?.contentStatus).toBe('recheck_pending')

    const tasks = new Map(curriculumRepairTasksWave2.map((task) => [task.issueId, task.status]))
    expect(tasks.get('F005')).toBe('manual_review_required')
    expect(tasks.get('F006')).toBe('recheck_pending')
    expect(tasks.get('F007')).toBe('recheck_pending')
    expect(curriculumVerificationSummaryWave2.recheckPendingRepairCount).toBe(6)
    expect(curriculumVerificationSummaryWave2.manualRepairCount).toBe(1)
  })

  it('never upgrades repair lifecycle into human verification', () => {
    for (const issueId of ['F005', 'F006', 'F007']) {
      const item = curriculumKnowledgeVerificationItemsWave2.find((candidate) => candidate.registeredIssueIds.includes(issueId))
      expect(item?.humanStatus).toBe('not_started')
    }
  })
})
