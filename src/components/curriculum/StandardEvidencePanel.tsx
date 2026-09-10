import { Link } from 'react-router-dom'
import { standardClauseById, standardDocumentById, standardMappingsForEntry } from '../../content/curriculum/standards'

export default function StandardEvidencePanel({ entryId }: { entryId: string }) {
  const mappings = standardMappingsForEntry(entryId)

  return (
    <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-emerald-700">2022 课标证据</span>
        <Link to="/knowledge-map/standards" className="text-[11px] font-black text-emerald-700 underline">证据库</Link>
      </div>
      {mappings.length ? (
        <div className="mt-3 space-y-2">
          {mappings.map((mapping) => {
            const clause = standardClauseById(mapping.clauseId)
            const document = clause ? standardDocumentById(clause.documentId) : null
            if (!clause) return null
            return (
              <article key={mapping.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black text-stone-800">{clause.title}</div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">映射待审 · {Math.round(mapping.confidence * 100)}%</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-stone-600">{clause.evidenceSummary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="text-emerald-700">官方证据已核</span>
                  <span className="text-violet-700">关系：{mapping.relation}</span>
                  <span className="text-stone-400">{document?.title ?? clause.documentId}</span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-rose-600">{mapping.rationale}</p>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-stone-400">当前节点尚未建立课标条款级样板映射。缺失证据时保持为空，不自动补造。</p>
      )}
    </section>
  )
}
