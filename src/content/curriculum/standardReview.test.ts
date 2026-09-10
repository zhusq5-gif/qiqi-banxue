import { describe, expect, it } from 'vitest'
import { createUnsignedStandardReviewBundle, emptyMappingReview, reviewPayloadForMapping } from './standardReview'

describe('standard mapping review bundles', () => {
  it('builds a resolvable review payload without changing mapping status', () => {
    const review = emptyMappingReview('map2-cn-thinking-1')
    const payload = reviewPayloadForMapping(review.mappingId, review)
    expect(payload.mapping.status).toBe('candidate_review')
    expect(payload.entry.label).toBe('多角度尝试提问')
    expect(payload.clause.title).toBe('思维能力')
    expect(payload.document.authority).toBe('中华人民共和国教育部')
  })

  it('exports a content-addressed unsigned bundle rather than an approval', async () => {
    const review = {
      ...emptyMappingReview('map2-en-language-1'),
      decision: 'approve' as const,
      reviewerLabel: '测试审核者',
      textbookEvidenceChecked: true,
      standardEvidenceChecked: true,
      updatedAt: '2026-09-08T12:00:00.000Z',
    }
    const bundle = await createUnsignedStandardReviewBundle(review)
    expect(bundle.status).toBe('unsigned_review_bundle')
    expect(bundle.mappingContentSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(bundle.payload.mapping.status).toBe('candidate_review')
    expect(bundle.warning).toContain('不是密码学签名')
  })

  it('rejects an unknown mapping id', () => {
    expect(() => reviewPayloadForMapping('missing-mapping', emptyMappingReview('missing-mapping'))).toThrow(/Unknown mapping/)
  })
})
