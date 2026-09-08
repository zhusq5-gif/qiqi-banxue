import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  mathFineEdgesForNode,
  mathFineNodeById,
  mathFineSample,
  type MathFineNodeLabel,
} from '../content/curriculum/mathFineSample'

const labelText: Record<MathFineNodeLabel, string> = {
  Chapter: '章节',
  Concept: '概念',
  Skill: '技能',
  Exercise: '练习',
}

const labelClass: Record<MathFineNodeLabel, string> = {
  Chapter: 'bg-stone-100 text-stone-700',
  Concept: 'bg-sky-100 text-sky-700',
  Skill: 'bg-emerald-100 text-emerald-700',
  Exercise: 'bg-amber-100 text-amber-700',
}

export default function MathFineGraphSample() {
  const firstNode = mathFineSample.nodes.find((item) => item.label === 'Concept') ?? mathFineSample.nodes[0]
  const [label, setLabel] = useState<'all' | MathFineNodeLabel>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(firstNode?.id ?? '')

  const visibleNodes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mathFineSample.nodes.filter((node) => {
      if (label !== 'all' && node.label !== label) return false
      if (!q) return true
      return `${node.name} ${node.id} ${JSON.stringify(node.properties)}`.toLowerCase().includes(q)
    })
  }, [label, query])

  const selected = mathFineNodeById(selectedId)
  const edges = selected ? mathFineEdgesForNode(selected.id) : []

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">小学数学细粒度原始子图</h1>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">Concept / Skill / Exercise</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">research_only</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{mathFineSample.scope}。本页直接截取 K12-KGraph `subject_specific_KG/math.json` 的可定位原始节点与关系，不经过 benchmark 关系转译。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/math-sample" className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 shadow">返回数学样板</Link>
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">知识地图</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          ['原始节点', mathFineSample.nodes.length],
          ['Concept', mathFineSample.nodes.filter((item) => item.label === 'Concept').length],
          ['Skill', mathFineSample.nodes.filter((item) => item.label === 'Skill').length],
          ['Exercise', mathFineSample.nodes.filter((item) => item.label === 'Exercise').length],
          ['Chapter', mathFineSample.nodes.filter((item) => item.label === 'Chapter').length],
          ['原始关系', mathFineSample.edges.length],
        ].map(([name, value]) => (
          <div key={name} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{name}</div>
          </div>
        ))}
      </section>

      <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
        数据许可：<strong>{mathFineSample.source.license}</strong>。当前不能作为商业正式知识库直接再分发；本页仅用于数据模型、关系类型和 UI 研究。
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="rounded-3xl bg-white p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'Concept', 'Skill', 'Exercise', 'Chapter'] as const).map((item) => (
                <button key={item} type="button" onClick={() => setLabel(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${label === item ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {item === 'all' ? '全部' : labelText[item]}
                </button>
              ))}
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索节点、ID 或属性" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-sky-400 md:max-w-sm" />
          </div>

          <div className="mt-3 text-xs font-bold text-stone-400">显示 {visibleNodes.length} / {mathFineSample.nodes.length} 个节点</div>
          <div className="mt-3 grid max-h-[720px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {visibleNodes.map((node) => (
              <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`rounded-2xl border p-4 text-left ${node.id === selectedId ? 'border-sky-300 bg-sky-50' : 'border-stone-100 bg-white hover:border-stone-200'}`} style={{ contentVisibility: 'auto' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-black leading-5 text-stone-900">{node.name}</div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${labelClass[node.label]}`}>{labelText[node.label]}</span>
                </div>
                <code className="mt-2 block break-all text-[10px] text-stone-400">{node.id}</code>
                <div className="mt-2 text-[10px] text-stone-400">{node.sourceLocator}</div>
              </button>
            ))}
          </div>
        </main>

        <aside className="rounded-3xl bg-white p-5 shadow lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${labelClass[selected.label]}`}>{labelText[selected.label]}</span>
                  <h2 className="mt-2 text-xl font-black leading-7 text-stone-900">{selected.name}</h2>
                  <code className="mt-1 block break-all text-[10px] text-stone-400">{selected.id}</code>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                <div className="text-xs font-black text-stone-400">原始属性摘录</div>
                <dl className="mt-2 space-y-2 text-xs leading-5 text-stone-700">
                  {Object.entries(selected.properties).map(([key, value]) => <div key={key}><dt className="font-black text-stone-500">{key}</dt><dd>{String(value)}</dd></div>)}
                  {Object.keys(selected.properties).length === 0 ? <div className="text-stone-400">该章节节点无额外属性摘录。</div> : null}
                </dl>
              </div>

              <section className="mt-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-stone-800">直接关系</h3><span className="text-xs font-bold text-stone-400">{edges.length}</span></div>
                <div className="mt-2 max-h-[430px] space-y-2 overflow-y-auto pr-1">
                  {edges.map((edge) => {
                    const outbound = edge.source === selected.id
                    const other = mathFineNodeById(outbound ? edge.target : edge.source)
                    return (
                      <button key={edge.id} type="button" onClick={() => other && setSelectedId(other.id)} className="block w-full rounded-2xl border border-violet-100 bg-violet-50/50 p-3 text-left">
                        <div className="text-[10px] font-black uppercase tracking-wide text-violet-600">{edge.type}</div>
                        <div className="mt-1 text-sm font-black text-stone-900">{outbound ? '→' : '←'} {other?.name ?? (outbound ? edge.target : edge.source)}</div>
                        <p className="mt-1 text-xs leading-5 text-violet-800/80">{edge.evidence}</p>
                        <div className="mt-1 text-[10px] text-stone-400">{edge.sourceLocator}</div>
                      </button>
                    )
                  })}
                  {edges.length === 0 ? <p className="py-6 text-center text-xs text-stone-400">当前摘录中没有直接关系</p> : null}
                </div>
              </section>

              <div className="mt-5 border-t border-stone-100 pt-4 text-[11px] leading-5 text-stone-400">
                <div>{selected.sourceLocator}</div>
                <div className="mt-1 font-bold text-rose-500">可定位原始图谱 ≠ 已完成教材版次核验或商业使用授权。</div>
              </div>
            </>
          ) : <p className="py-10 text-center text-sm text-stone-400">选择一个节点查看详情</p>}
        </aside>
      </section>

      <section className="mt-5 rounded-3xl bg-stone-900 p-5 text-stone-100">
        <h2 className="font-black">原始数据来源</h2>
        <p className="mt-2 text-xs leading-6 text-stone-300">{mathFineSample.source.note}</p>
        <a href={mathFineSample.source.browseUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-black underline">打开 K12-KGraph math.json ↗</a>
      </section>
    </div>
  )
}
