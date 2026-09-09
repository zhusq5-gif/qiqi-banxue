import { describe, expect, it } from 'vitest'
import {
  mathWave2ConfirmedUnlinkedInGradeBlock,
  mathWave2ResolvedExcerptGaps,
  mathWave2SourceAudit,
  mathWave2SourceAuditRecord,
} from './mathWave2SourceAudit'

describe('wave 2 math raw source audit registry', () => {
  it('records the repaired excerpt gap with exact raw tests locator', () => {
    const record = mathWave2SourceAuditRecord('math_4a_rjb_exe8')
    expect(record?.status).toBe('excerpt_gap_repaired')
    expect(record?.rawTestsLocator).toBe('math.json L65814-L65822')
    expect(record?.resolution).toContain('fine-v4-wave2-e01')
    expect(mathWave2ResolvedExcerptGaps).toHaveLength(1)
  })

  it('keeps exe20 explicitly unmapped after auditing the contiguous grade-4 tests block', () => {
    const record = mathWave2SourceAuditRecord('math_4a_rjb_exe20')
    expect(record?.status).toBe('source_unlinked_in_grade_tests_block')
    expect(record?.inspectedTestsRange).toBe('math.json L65769-L66025')
    expect(record?.resolution).toBeNull()
    expect(record?.note).toContain('exe19')
    expect(record?.note).toContain('exe26')
    expect(record?.note).toContain('curated mapping proposal')
    expect(mathWave2ConfirmedUnlinkedInGradeBlock).toHaveLength(1)
    expect(mathWave2SourceAudit.rule).toContain('不得凭题意合成')
  })
})
