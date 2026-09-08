import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { mathBookById, mathPrerequisitesForChapter, mathResearchSample } from '../content/curriculum/mathSample'
import { standardDocumentsForSubject } from '../content/curriculum/standards'

export default function MathResearchSample() {
  const [grade, setGrade] = useState(0)
  const [query, setQuery] = useState('')
  const mathStandard = standardDocumentsForSubject('math')[0] ?? null

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mathResearchSample.chapters.filter((chapter) => {
      if (grade && chapter.grade !== grade) return false
      if (!q) return true
      const prerequisites = mathPrerequisitesForChapter(chapter.id).map((item) => item.fromLabel).join(' ')
      return `${chapter.title} ${chapter.id} ${prerequisites}`.toLowerCase().includes(q)
    })
  }, [grade, query])

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">小学数学真实数据样板</h1>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">K12-KGraph / K12-Bench</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">非商业研究</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">本页只展示能够从 K12-KGraph 公开发布与 K12-Bench 公开提交中直接核验的小学数学章节和基础关系证据。未确认的前置章节 ID 保持为空，不做教材章节号推断。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/standards" className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 shadow">2022 课标证据</Link>
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">返回知识地图</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['小学册次范围', mathResearchSample.bookCoverage.length],
          ['样板目标章节', mathResearchSample.chapters.length],
          ['基础关系证据', mathResearchSample.prerequisiteEvidence.length],
          ['数学课标文档', mathStandard ? 1 : 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="text-xs font-black text-rose-700">数据许可</div>
          <div className="mt-1 text-sm font-black text-stone-900">{mathResearchSample.source.license}</div>
          <p className="mt-2 text-xs leading-5 text-rose-700">`NC` 表示当前样板不能作为商业正式数据直接再分发。系统因此强制保持 research_only / commercialUse=false。</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-black text-emerald-700">2022 数学课标</div>
          <div className="mt-1 text-sm font-black text-stone-900">{mathStandard?.title ?? '尚未登记'}</div>
          <p className="mt-2 text-xs leading-5 text-emerald-700">已登记教育部正式文档元数据；具体数学条款仍为 0，避免在未取得可核条款证据时自行补造。</p>
        </article>
      </section>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setGrade(0)} className={`rounded-full px-3 py-1.5 text-xs font-black ${grade === 0 ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-600'}`}>全部年级</button>
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <button key={value} type="button" onClick={() => setGrade(value)} className={`rounded-full px-3 py-1.5 text-xs font-black ${grade === value ? 'bg-sky-600 text-white' : 'bg-stone-100 text-stone-600'}`}>{value}年级</button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索章节或基础知识" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-sky-400 md:max-w-sm" />
      </div>

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        {chapters.map((chapter) => {
          const book = mathBookById(chapter.bookId)
          const prerequisites = mathPrerequisitesForChapter(chapter.id)
          return (
            <article key={chapter.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-sky-600">{chapter.grade}年级{chapter.semester === 1 ? '上册' : '下册'} · 第 {chapter.chapterNumber} 章</div>
                  <h2 className="mt-1 text-lg font-black text-stone-900">{chapter.title}</h2>
                </div>
                <code className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] text-stone-500">{chapter.id}</code>
              </div>
              <p className="mt-2 text-xs text-stone-400">{book?.publisher} · {book?.title}</p>

              <div className="mt-4 border-t border-stone-100 pt-4">
                <div className="flex items-center justify-between"><span className="text-xs font-black text-stone-500">K12-Bench 基础关系证据</span><span className="text-xs text-stone-400">{prerequisites.length} 条</span></div>
                <div className="mt-2 space-y-2">
                  {prerequisites.map((edge) => (
                    <div key={edge.id} className="rounded-2xl bg-sky-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-black text-sky-900"><span>{edge.fromLabel}</span><span className="text-sky-400">→</span><span>{chapter.title}</span></div>
                      <div className="mt-1 text-[11px] font-bold text-sky-700">{edge.relation} · {edge.sourceTaskId}</div>
                      <p className="mt-1 text-xs leading-5 text-sky-800/80">{edge.evidence}</p>
                      <p className="mt-1 text-[10px] text-rose-500">前置章节 external id：未核，不推断。</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
        {chapters.length === 0 ? <p className="col-span-full py-12 text-center text-sm text-stone-400">当前筛选没有样板章节</p> : null}
      </section>

      <section className="mt-5 rounded-3xl bg-stone-900 p-5 text-stone-100">
        <h2 className="font-black">来源与边界</h2>
        <p className="mt-2 text-xs leading-6 text-stone-300">{mathResearchSample.source.note}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-black">
          <a href={mathResearchSample.source.datasetUrl} target="_blank" rel="noreferrer" className="underline">Hugging Face 数据集 ↗</a>
          <a href={mathResearchSample.source.benchmarkCommitUrl} target="_blank" rel="noreferrer" className="underline">K12-Bench 证据提交 ↗</a>
          <a href={mathResearchSample.source.booksUrl} target="_blank" rel="noreferrer" className="underline">books.yaml ↗</a>
        </div>
      </section>
    </div>
  )
}
