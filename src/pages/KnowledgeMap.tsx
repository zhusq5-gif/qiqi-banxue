import { Link } from 'react-router-dom'

const stats = [
  ['语文知识点', '299'],
  ['英语知识点', '160'],
  ['教材册次', '20'],
  ['待教研问题', '7'],
]

const blockers = [
  '教材版次仍需逐册核验',
  '正式课标条款尚未逐条挂接',
  '当前正式专家审核记录为 0',
  '来源内容公开发布权利仍需确认',
]

export default function KnowledgeMap() {
  return (
    <div className="mx-auto min-h-full max-w-4xl px-4 pb-20 pt-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-600">课程知识体系 · 研究版</p>
          <h1 className="mt-1 text-2xl font-black text-stone-900">小学知识地图</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            当前接入已审计的统编语文与 PEP 英语种子数据。这里展示的是研究数据状态，不代表正式教研认证。
          </p>
        </div>
        <Link
          to="/parent"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow active:scale-95"
        >
          返回家长视图
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-3xl font-black text-stone-900">{value}</div>
            <div className="mt-1 text-xs font-bold text-stone-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-900">发布就绪度</h2>
            <p className="mt-1 text-sm text-stone-500">v0.2.1 新增自动发布就绪度检查。</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            研究版可用
          </span>
        </div>
        <div className="mt-4 rounded-2xl bg-rose-50 p-4">
          <div className="text-sm font-black text-rose-700">正式发布仍被阻断</div>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-rose-700/80">
            {blockers.map((item) => (
              <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-lg font-black">当前可做</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
            <li>• 按学科、年级和教材册次浏览知识节点</li>
            <li>• 对 7 条已知问题进入修订与审校流程</li>
            <li>• 生成研究快照并验证回滚</li>
            <li>• 继续扩充数学真实数据与课标映射</li>
          </ul>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-lg font-black">下一阶段</h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
            <li>1. 核验 20 册教材版本卡</li>
            <li>2. 建立课标条款级映射</li>
            <li>3. 引入学科审核者签名流程</li>
            <li>4. 将独立知识地图逐步迁移为 React 可复用模块</li>
          </ol>
        </article>
      </section>
    </div>
  )
}
