import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  contentApprovalRepositoryStatus,
  prepareContentRegistrationRequest,
  type ContentRegistrationRequest,
} from '../content/curriculum/contentApprovalPreparation'
import type { CurriculumSubject } from '../content/curriculum/curriculum'

function parseLines(value: string) {
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function CurriculumContentApproval() {
  const [snapshotText, setSnapshotText] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [subject, setSubject] = useState<CurriculumSubject>('chinese')
  const [evidenceText, setEvidenceText] = useState('')
  const [datasetVersion, setDatasetVersion] = useState('0.3-research')
  const [sourceCommit, setSourceCommit] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [request, setRequest] = useState<ContentRegistrationRequest | null>(null)
  const [message, setMessage] = useState('')

  function prepare() {
    try {
      const snapshot = JSON.parse(snapshotText)
      const next = prepareContentRegistrationRequest({
        candidateId,
        subject,
        snapshot,
        evidenceRefs: parseLines(evidenceText),
        datasetVersion,
        sourceCommit,
        preparedBy,
      })
      setRequest(next)
      setMessage('登记准备包已生成；仍需仓库维护者显式执行 register script。')
    } catch (error) {
      setRequest(null)
      setMessage(error instanceof Error ? error.message : '准备失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Content Approval Preparation</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">把 secondary-regression-passed candidate snapshot 转成仓库登记准备包。浏览器不注册正式 candidate、不持有私钥、不生成签名。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/human-review/ai" className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">AI精审工作流</Link>
          <Link to="/knowledge-map/human-review/proposal" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">结构化提案</Link>
          <Link to="/knowledge-map/review-center" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">Review Center</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['已登记 Candidate', contentApprovalRepositoryStatus.registeredCandidates],
          ['可信 Content Reviewer', contentApprovalRepositoryStatus.registeredContentReviewers],
          ['签名记录', contentApprovalRepositoryStatus.approvalRecords],
          ['当前 Blocker', contentApprovalRepositoryStatus.blockers.length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="text-2xl font-black text-stone-900">{value}</div><div className="text-xs font-bold text-stone-400">{label}</div></div>)}
      </section>

      <section className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
        <strong>仓库当前门禁：</strong>{contentApprovalRepositoryStatus.blockers.length ? contentApprovalRepositoryStatus.blockers.join(' · ') : 'UI 镜像未发现基础 blocker'}。权威判断仍由 CI 中的 <code>scripts/curriculum-content-gate.mjs</code> 给出。
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-black text-stone-900">1. 准备仓库登记请求</h2>
          <label className="mt-4 block text-xs font-black text-stone-500">Candidate Snapshot JSON</label>
          <textarea value={snapshotText} onChange={(event) => setSnapshotText(event.target.value)} rows={14} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-950 p-3 font-mono text-xs leading-5 text-stone-100" placeholder="粘贴 qiqi-curriculum-structured-candidate-snapshot/v2 或 qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2" />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div><label className="block text-xs font-black text-stone-500">candidateId</label><input value={candidateId} onChange={(event) => setCandidateId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
            <div><label className="block text-xs font-black text-stone-500">学科</label><select value={subject} onChange={(event) => setSubject(event.target.value as CurriculumSubject)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm"><option value="chinese">语文</option><option value="english">英语</option><option value="math">数学</option></select></div>
            <div><label className="block text-xs font-black text-stone-500">datasetVersion</label><input value={datasetVersion} onChange={(event) => setDatasetVersion(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
            <div><label className="block text-xs font-black text-stone-500">sourceCommit</label><input value={sourceCommit} onChange={(event) => setSourceCommit(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" /></div>
          </div>

          <label className="mt-4 block text-xs font-black text-stone-500">实际证据（每行一条）</label>
          <textarea value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-stone-200 p-3 font-mono text-xs leading-5" />
          <label className="mt-4 block text-xs font-black text-stone-500">准备人</label>
          <input value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" />
          <div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={prepare} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">生成登记准备包</button>{message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}</div>
        </main>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-stone-950 p-5 text-stone-100">
            <h2 className="font-black">正式链路</h2>
            <ol className="mt-3 space-y-2 text-xs leading-6 text-stone-300"><li>1. UI secondary regression 通过</li><li>2. 本页生成 registration request</li><li>3. 维护者执行 register script</li><li>4. 线下核验 reviewer 公钥登记</li><li>5. reviewer 本地私钥签名</li><li>6. CI content gate 验签</li></ol>
          </section>
          {request ? <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><h2 className="font-black text-stone-900">登记准备包</h2><button type="button" onClick={() => downloadJson(`content-registration-request-${request.candidateId.replace(/[:/]/g, '-')}.json`, request)} className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black text-white">导出 JSON</button></div><div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">browser_preparation_only · humanVerified=false · autoApply=false</div><pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-stone-950 p-3 text-[10px] leading-5 text-stone-100">{JSON.stringify(request, null, 2)}</pre></section> : null}
        </aside>
      </section>
    </div>
  )
}
