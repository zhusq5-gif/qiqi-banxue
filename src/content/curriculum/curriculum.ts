import rawSeed from './curriculum-seed-v02.json'

export type CurriculumSubject = 'chinese' | 'english'
export type CurriculumView = 'textbook' | 'knowledge' | 'relations'

export interface CurriculumEntry {
  id: string
  subject: CurriculumSubject
  grade: number
  semester: 1 | 2
  textbookId: string
  book: string
  unitId: string
  unitNumber: number
  unit: string
  label: string
  learningDemand: string
  difficulty: number
  questionTypes: string[]
  reviewStatus: 'unreviewed' | 'needs_review' | 'expert_verified' | string
  issueId: string | null
  sourcePath: string
  sourcePointer: string
}

export interface CurriculumTextbook {
  id: string
  subject: CurriculumSubject
  title: string
  grade: number
  semester: 1 | 2
  seriesClaim: string
  publisher: string | null
  editionYear: number | null
  isbn: string | null
  editionStatus: 'unknown' | 'mismatch' | 'verified' | string
  versionNote: string
}

export interface CurriculumUnit {
  id: string
  textbookId: string
  number: number
  title: string
}

export interface CurriculumIssue {
  id: string
  nodeId: string
  subject: CurriculumSubject
  grade: number
  term: '上' | '下'
  name: string
  code: string
  severity: string
  finding: string
  disposition: string
  sourceUrl: string
  sourcePointer: string
}

export interface CurriculumCandidate {
  id: string
  subject: CurriculumSubject
  fromId: string
  toId: string
  fromName: string
  toName: string
  fromGrade: number
  toGrade: number
  similarity: number
  type: 'similar_label_candidate'
  reviewStatus: string
  disposition: string
  reason: string
}

export interface CurriculumSeed {
  datasetVersion: string
  title: string
  scopeNote: string
  stats: {
    total: number
    chinese: number
    english: number
    textbooks: number
    units: number
    issues: number
    candidates: number
  }
  textbooks: CurriculumTextbook[]
  units: CurriculumUnit[]
  entries: CurriculumEntry[]
  issues: CurriculumIssue[]
  candidates: CurriculumCandidate[]
}

export const curriculumSeed = rawSeed as CurriculumSeed

export const subjectLabels: Record<CurriculumSubject, string> = {
  chinese: '语文',
  english: '英语',
}

export function semesterLabel(value: number) {
  return value === 1 ? '上册' : '下册'
}

export function entryById(id: string) {
  return curriculumSeed.entries.find((entry) => entry.id === id) ?? null
}
