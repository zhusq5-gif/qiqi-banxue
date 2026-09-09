import { describe, expect, it } from 'vitest'
import {
  mathWave2ResolvedExcerptGaps,
  mathWave2SourceAudit,
  mathWave2SourceAuditRecord,
  mathWave2SourceUnlinkedCandidates,
} from './mathWave2SourceAudit'

describe('wave 2 math raw source audit registry', () => {
  it('records the repaired excerpt gap with exact raw tests locator', () => {
    const record = mathWave2SourceAuditRecord('math_4a_rjb_exe8')
    expect(record?.status).toBe('excerpt_gap_repaired')
    expect(record?.rawTestsLocator).toBe('math.json L65814-L65822')
    expect(record?.resolution).toContain('fine-v4-wave2-e01')
    expect(mathWave2ResolvedExcerptGaps).toHaveLength(1)
  })

  it('keeps exe20 as source-unlinked candidate rather than synthesizing a binding', () => {
    const record = mathWave2SourceAuditRecord('math_4a_rjb_exe20')
    expect(record?.status).toBe('source_unlinked_candidate')
    expect(record?.inspectedTestsRange).toBe('math.json L65769-L66025')
    expect(record?.resolution).toBeNull()
    expect(mathWave2SourceUnlinkedCandidates).toHaveLength(1)
    expect(mathWave2SourceAudit.rule).toContain('不得凭题意合成')
  })
})
