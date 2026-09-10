import { Link } from 'react-router-dom'
import { aiDiscoveryRegistrySummary } from '../content/curriculum/aiDiscoveryRegistry'
import { aiDiscoveryCoverageSummary } from '../content/curriculum/aiDiscoveryCoverage'
import { aiDiscoveryDomainCoverageSummary } from '../content/curriculum/aiDiscoveryDomainCoverage'
import { contentApprovalRepositoryStatus } from '../content/curriculum/contentApprovalPreparation'
import { curriculumHumanReviewSummary } from '../content/curriculum/humanReview'
import { curriculumSeed } from '../content/curriculum/curriculum'

const lanes = [
  {
    title: 'AI 候选审校',
    description: '查看 AI 搜索生成的带来源候选，检查置信度与重复命中，再决定进入真人精审、修订、拒绝或暂缓。',
    href: '/knowledge-map/discovery',
    metric: `${aiDiscoveryRegistrySummary.total} 条`,
    action: '进入 AI 候选池',
  },
  {
    title: '领域深度搜索矩阵',
    description: '按学科 × 年级 × 领域/任务群查看真正的搜索空白，下一批 AI 搜索优先补 search_required 和 shallow candidates。',
    href: '/knowledge-map/discovery/domains',
    metric: `${aiDiscoveryDomainCoverageSummary.searchRequiredCount} 个空白`,
    action: '查看领域矩阵',
  },
  {
    title: 'AI 候选真人精审队列',
    description: 'AI候选点击“进入真人精审”后直接进入本地 case draft 队列，不再依赖人工导出/导入 JSON。',
    href: '/knowledge-map/human-review/ai',
    metric: 'UI队列',
    action: '进入AI精审队列',
  },
  {
    title: '已登记问题真人核对',
    description: '处理 F001–F007 与 Math Wave 2 audit case。所有决定先记录为 unsigned human review。',
    href: '/knowledge-map/human-review',
    metric: `${curriculumHumanReviewSummary.caseCount} 个 case`,
    action: '进入真人核对',
  },
  {
    title: '逐学科 / 逐年级核对',
    description: '按语文 G1–G6、英语 G3–G6、数学 G1–G6 查看核对矩阵、覆盖缺口与 blocking task。',
    href: '/knowledge-map/verification',
    metric: '16 个年级单元',
    action: '查看核对矩阵',
  },
  {
    title: '当前 Case 复核',
    description: '基于当前 caseState 生成 decision v2。来源、标题、允许决定变化时旧决定会失效。',
    href: '/knowledge-map/human-review/current',
    metric: 'decision v2',
    action: '进入当前复核',
  },
  {
    title: '结构化提案与二次回归',
    description: '为拆分、人工改写、curated assessment mapping、Curriculum relation、identity split 运行 reference closure 与 regression。',
    href: '/knowledge-map/human-review/proposal',
    metric: '5 类 proposal',
    action: '进入提案工作台',
  },
  {
    title: '内容审批准备',
    description: '把 regression-passed candidate snapshot 转成仓库登记准备包；浏览器不注册正式 candidate、不持有私钥、不生成签名。',
    href: '/knowledge-map/content-approval',
    metric: `${contentApprovalRepositoryStatus.blockers.length} 个门禁 blocker`,
    action: '准备内容审批',
  },
  {
    title: '旧 v1 决定兼容导入',
    description: '仅用于历史/外部 decision v1 的兼容接收与冲突检查。v1 不能进入正式审批。',
    href: '/knowledge-map/human-review/ingest',
    metric: '兼容入口',
    action: '导入 v1 JSON',
  },
]

export default function CurriculumReviewCenter() {
  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">课程知识 Review Center</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">真人审核以 UI 为主流程。文件和 JSON 只负责交换、备份与审计；AI 可以持续扩充候选，但不能跳过这里进入正式知识库。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">返回知识地图</Link>
          <Link to="/knowledge-map/standards/review" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">课标映射审核</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          ['现有语英种子', curriculumSeed.entries.length],
          ['AI候选', aiDiscoveryRegistrySummary.total],
          ['AI搜索最低覆盖', `${aiDiscoveryCoverageSummary.reviewReadyCount}/16`],
          ['领域搜索空白', aiDiscoveryDomainCoverageSummary.searchRequiredCount],
          ['真人case', curriculumHumanReviewSummary.caseCount],
          ['正式真人已核', curriculumHumanReviewSummary.humanVerifiedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-black text-stone-900">{value}</div>
            <div className="text-xs font-bold text-stone-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        <strong>当前正式状态：</strong>humanVerified = 0；content approval repository 当前 {contentApprovalRepositoryStatus.registeredCandidates} 个登记候选、{contentApprovalRepositoryStatus.registeredContentReviewers} 个可信 reviewer。AI“16/16最低覆盖”只表示已有候选可供 UI 审校，不能称为知识库完整。
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lanes.map((lane) => (
          <article key={lane.href} className="flex min-h-56 flex-col rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black text-stone-900">{lane.title}</h2>
              <span className="text-xs font-black text-stone-400">{lane.metric}</span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-6 text-stone-500">{lane.description}</p>
            <Link to={lane.href} className="mt-5 inline-flex w-fit rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">{lane.action}</Link>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-3xl bg-stone-950 p-5 text-stone-100">
        <h2 className="font-black">推荐审核顺序</h2>
        <div className="mt-3 grid gap-2 text-xs leading-6 text-stone-300 md:grid-cols-2 xl:grid-cols-6">
          <div>1. 领域矩阵：找搜索空白</div>
          <div>2. AI 候选池：核来源与重复</div>
          <div>3. AI精审队列/真人核对</div>
          <div>4. 当前 Case：decision v2</div>
          <div>5. 结构化提案/回归</div>
          <div>6. 内容审批准备 → 仓库登记/签名</div>
        </div>
      </section>
    </div>
  )
}
