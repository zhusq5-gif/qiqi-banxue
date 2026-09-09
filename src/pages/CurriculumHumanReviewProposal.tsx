import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { HumanReviewDecisionV2 } from '../content/curriculum/humanReviewDecisionV2'
import {
  type HumanReviewStructuredProposal,
  validateHumanReviewStructuredProposal,
  type StructuredProposalValidationResult,
} from '../content/curriculum/humanReviewStructuredProposal'
import {
  runHumanReviewStructuredRegression,
  type StructuredRegressionResult,
} from '../content/curriculum/humanReviewStructuredRegression'

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function readFile(file: File | null, setter: (value: string) => void) {
  if (!file) return
  setter(await file.text())
}

export default function CurriculumHumanReviewProposal() {
  const [decisionText, setDecisionText] = useState('')
  const [proposalText, setProposalText] = useState('')
  const [validation, setValidation] = useState<StructuredProposalValidationResult | null>(null)
  const [regression, setRegression] = useState<StructuredRegressionResult | null>(null)
  const [message, setMessage] = useState('')

  function run() {
    try {
      const decision = JSON.parse(decisionText) as HumanReviewDecisionV2
      const proposal = JSON.parse(proposalText) as HumanReviewStructuredProposal
      const nextValidation = validateHumanReviewStructuredProposal(decision, proposal)
      setValidation(nextValidation)
      const nextRegression = runHumanReviewStructuredRegression(decision, proposal)
      setRegression(nextRegression)
      setMessage(nextRegression.accepted ? '结构化提案已通过二次回归' : '提案仍需修订，未进入内容审批门禁')
    } catch (error) {
      setValidation(null)
      setRegression(null)
      setMessage(error instanceof Error ? `解析/校验失败：${error.message}` : '解析/校验失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">结构化提案与二次回归</h1>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">candidate-only</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">用于处理 revise、拆分知识、curated Assessment mapping、Curriculum relation 和 identity split。只接受当前 case 的 decision v2；通过后仍只生成候选快照。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/human-review/current" className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">当前 Case 复核</Link>
          <Link to="/knowledge-map/human-review" className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">真人核对台</Link>
          <Link to="/knowledge-map/verification" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">核对矩阵</Link>
        </div>
      </header>

      <section className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs leading-6 text-sky-800">
        <strong>强制边界：</strong>proposal 必须与 decision v2 的当前 case 匹配；`autoApply=false`。Assessment curated mapping 不会写成 K12-KGraph raw edge；Curriculum relation 不覆盖 raw relation；prerequisite 候选必须通过环检测；split 必须通过 reference closure。
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-black text-stone-900">1. Decision v2</h2><p className="mt-1 text-xs text-stone-400">从“当前 Case 真人复核台”导出的 JSON。</p></div>
            <label className="cursor-pointer rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">选择 JSON<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => readFile(event.target.files?.[0] ?? null, setDecisionText)} /></label>
          </div>
          <textarea value={decisionText} onChange={(event) => setDecisionText(event.target.value)} rows={20} placeholder="粘贴 qiqi-curriculum-human-review-decision/v2" className="mt-4 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 font-mono text-xs leading-5 outline-none focus:border-emerald-300" />
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-black text-stone-900">2. Structured proposal</h2><p className="mt-1 text-xs text-stone-400">schema: qiqi-curriculum-human-review-structured-proposal/v1</p></div>
            <label className="cursor-pointer rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">选择 JSON<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => readFile(event.target.files?.[0] ?? null, setProposalText)} /></label>
          </div>
          <textarea value={proposalText} onChange={(event) => setProposalText(event.target.value)} rows={20} placeholder="粘贴 content_revision / concept_split / assessment_mapping / curriculum_relation / identity_split proposal" className="mt-4 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 font-mono text-xs leading-5 outline-none focus:border-sky-300" />
        </article>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={!decisionText.trim() || !proposalText.trim()} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">运行 validation + secondary regression</button>
        {message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}
      </div>

      {(validation || regression) ? <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2"><h2 className="font-black text-stone-900">3. Proposal validation</h2>{validation ? <span className={`rounded-full px-3 py-1 text-xs font-black ${validation.accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{validation.accepted ? 'accepted' : 'rejected'}</span> : null}</div>
          {validation ? <><div className="mt-3 text-xs text-stone-500">case current: <strong>{String(validation.decisionCaseMatches)}</strong> · next: <strong>{validation.nextGate}</strong></div>{validation.errors.length ? <ul className="mt-3 space-y-2 rounded-2xl bg-rose-50 p-4 text-xs leading-5 text-rose-700">{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-700">结构、case 绑定、evidence 和 proposal 专项约束通过。</div>}</> : null}
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2"><h2 className="font-black text-stone-900">4. Secondary regression</h2>{regression ? <span className={`rounded-full px-3 py-1 text-xs font-black ${regression.accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{regression.accepted ? 'passed' : 'blocked'}</span> : null}</div>
          {regression ? <><div className="mt-3 text-xs text-stone-500">next: <strong>{regression.nextGate}</strong></div><div className="mt-3 space-y-2">{regression.checks.map((item) => <div key={item.id} className={`rounded-xl px-3 py-2 text-xs ${item.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><div className="font-black">{item.passed ? '✓' : '✕'} {item.id}</div><div className="mt-1 leading-5 opacity-80">{item.detail}</div></div>)}</div>{regression.errors.length ? <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{regression.errors.join(' · ')}</div> : null}</> : null}
        </article>
      </section> : null}

      {regression?.candidateSnapshot ? <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black text-stone-900">5. Candidate snapshot v2</h2><p className="mt-1 text-xs text-stone-400">readyForApprovalGate=true · humanVerified=false · autoApply=false</p></div><button type="button" onClick={() => downloadJson(`structured-candidate-${regression.caseId.replace(/[:/]/g, '-')}.json`, regression.candidateSnapshot)} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-black text-white">导出候选快照</button></div><pre className="mt-4 max-h-[460px] overflow-auto rounded-2xl bg-stone-950 p-4 text-[10px] leading-5 text-stone-100">{JSON.stringify(regression.candidateSnapshot, null, 2)}</pre></section> : null}
    </div>
  )
}
