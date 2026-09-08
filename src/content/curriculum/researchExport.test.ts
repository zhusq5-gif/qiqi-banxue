import { describe, expect, it } from 'vitest'
import { curriculumSeed } from './curriculum'
import { buildResearchHtml, createResearchSnapshot } from './researchExport'

describe('curriculum research export', () => {
  it('marks every export as research-only and preserves the active filters', () => {
    const snapshot = createResearchSnapshot({
      datasetVersion: curriculumSeed.datasetVersion,
      subject: 'chinese',
      grade: 1,
      view: 'knowledge',
      query: '拼音',
      textbook: null,
      entries: curriculumSeed.entries.slice(0, 3),
      candidates: [],
      exportedAt: '2026-09-08T00:00:00.000Z',
    })

    expect(snapshot.status).toBe('research_only')
    expect(snapshot.schema).toBe('qiqi-curriculum-research-snapshot/v1')
    expect(snapshot.filters).toEqual({
      subject: 'chinese',
      grade: 1,
      view: 'knowledge',
      query: '拼音',
      textbookId: null,
    })
    expect(snapshot.entries).toHaveLength(3)
  })

  it('builds a self-contained searchable html snapshot without remote scripts', () => {
    const snapshot = createResearchSnapshot({
      datasetVersion: curriculumSeed.datasetVersion,
      subject: 'english',
      grade: null,
      view: 'relations',
      query: '',
      textbook: null,
      entries: [],
      candidates: curriculumSeed.candidates.slice(0, 2),
      exportedAt: '2026-09-08T00:00:00.000Z',
    })
    const html = buildResearchHtml(snapshot)
    expect(html).toContain('小学知识地图研究快照')
    expect(html).toContain('research_only')
    expect(html).toContain('在此离线快照中搜索')
    expect(html).not.toContain('<script src=')
  })

  it('escapes script-closing text inside embedded snapshot data', () => {
    const poisoned = {
      ...curriculumSeed.entries[0],
      label: '</script><script>alert(1)</script>',
    }
    const snapshot = createResearchSnapshot({
      datasetVersion: curriculumSeed.datasetVersion,
      subject: 'chinese',
      grade: 1,
      view: 'knowledge',
      query: '',
      textbook: null,
      entries: [poisoned],
      candidates: [],
      exportedAt: '2026-09-08T00:00:00.000Z',
    })
    const html = buildResearchHtml(snapshot)
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('\\u003c/script\\u003e')
  })
})
