import rawAudit from './math-wave2-source-audit-v01.json'

export type MathWave2SourceAuditStatus = 'excerpt_gap_repaired' | 'source_unlinked_candidate'

export interface MathWave2SourceAuditRecord {
  rawExerciseId: string
  status: MathWave2SourceAuditStatus
  rawNodeLocator: string
  rawAppearsInLocator: string
  rawTestsLocator?: string
  inspectedTestsRange?: string
  resolution: string | null
  note: string
}

export const mathWave2SourceAudit = rawAudit as {
  schemaVersion: string
  checkedDate: string
  source: { name: string; rawUrl: string }
  rule: string
  records: MathWave2SourceAuditRecord[]
}

export function mathWave2SourceAuditRecord(rawExerciseId: string) {
  return mathWave2SourceAudit.records.find((item) => item.rawExerciseId === rawExerciseId) ?? null
}

export const mathWave2ResolvedExcerptGaps = mathWave2SourceAudit.records.filter((item) => item.status === 'excerpt_gap_repaired')
export const mathWave2SourceUnlinkedCandidates = mathWave2SourceAudit.records.filter((item) => item.status === 'source_unlinked_candidate')
