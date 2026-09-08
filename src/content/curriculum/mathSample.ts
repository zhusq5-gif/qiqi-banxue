import rawSample from './math-research-sample-v01.json'

export interface MathSampleBook {
  externalId: string
  grade: number
  semester: 1 | 2
  title: string
  publisher: string
}

export interface MathSampleChapter {
  id: string
  bookId: string
  grade: number
  semester: 1 | 2
  chapterNumber: number
  title: string
}

export interface MathPrerequisiteEvidence {
  id: string
  targetChapterId: string
  fromLabel: string
  fromExternalId: string | null
  relation: 'benchmark_prerequisite'
  sourceTaskId: string
  evidence: string
}

export interface MathResearchSample {
  datasetVersion: string
  status: 'research_only'
  subject: 'math'
  title: string
  source: {
    dataset: string
    datasetUrl: string
    benchmarkCommitUrl: string
    booksUrl: string
    license: 'CC BY-NC-SA 4.0'
    commercialUse: false
    note: string
  }
  bookCoverage: MathSampleBook[]
  chapters: MathSampleChapter[]
  prerequisiteEvidence: MathPrerequisiteEvidence[]
}

export const mathResearchSample = rawSample as MathResearchSample

const chapterIndex = new Map(mathResearchSample.chapters.map((chapter) => [chapter.id, chapter]))
const bookIndex = new Map(mathResearchSample.bookCoverage.map((book) => [book.externalId, book]))

export function mathChapterById(id: string) {
  return chapterIndex.get(id) ?? null
}

export function mathBookById(id: string) {
  return bookIndex.get(id) ?? null
}

export function mathPrerequisitesForChapter(id: string) {
  return mathResearchSample.prerequisiteEvidence.filter((item) => item.targetChapterId === id)
}
