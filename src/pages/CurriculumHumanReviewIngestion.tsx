import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ingestHumanReviewDecision,
  type HumanReviewIngestionResult,
} from '../content/curriculum/humanReviewIngestion'

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function CurriculumHumanReviewIngestion() {
  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState<HumanReviewIngestionResult | null>(null)
  const [message, setMessage] = useState('')

  async function loadFile(file: File | null) {
    if (!file) return
    try {
      const text = await file.text()
      setRawText(text)
      setResult(null)
      setMessage(`已加载 ${file.name}`)
    } catch {
      setMessage('文件读取失败')
    }
  }

  function runIngestion() {
    try {
      const parsed = JSON.parse(rawText) as unknown
      const next = ingestHumanReviewDecision(parsed)
      setResult(next)
      setMessage(next.accepted ? '导入校验完成' : '导入被拒绝，未生成候选快照')
    } catch {
      setResult(null)
      setMessage('JSON 解析失败，请检查文件格式')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">真人审核决定接收与二次回归</h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">local-only</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">导入真人审核 JSON，校验当前 case、允许决定、证据引用并重新运行候选修补检查。不会写入 CloudBase、种子 JSON 或正式审核状态。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/human-review" className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">返回真人核对台</Link>
          <Link to="/knowledge-map/verification" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">逐年级矩阵</Link>
        </div>
      </header>

      <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
        <strong>当前格式边界：</strong>现有 `qiqi-curriculum-human-review-decision/v1` 可以进入 ingestion 与二次回归，但因为 v1 未绑定 case 版本，生成的候选快照固定 `formalApprovalEligible=false`。正式流程前需要在当前 case 上重新确认。
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-black text-stone-900">1. 导入审核 JSON</h2><p className="mt-1 text-xs text-stone-400">支持上传文件或直接粘贴。</p></div>
            <label className="cursor-pointer rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700">
              选择 JSON
              <input type="file" accept="application/json,.json" className="hidden" onChange={(event) => loadFile(event.target.files?.[0] ?? null)} />
            </label>
          </div>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={22} placeholder="粘贴 qiqi-curriculum-human-review-decision/v1 JSON" className="mt-4 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 font-mono text-xs leading-5 outline-none focus:border-violet-300" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={runIngestion} disabled={!rawText.trim()} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">运行 ingestion + recheck</button>
            {message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-black text-stone-900">2. 校验结果</h2>
          {!result ? <div className="mt-8 rounded-2xl bg-stone-50 px-4 py-10 text-center text-sm text-stone-400">尚未执行 ingestion</div> : (
            <div className="mt-4 space-y-4">
              <div className={`rounded-2xl p-4 ${result.accepted ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                <div className={`text-sm font-black ${result.accepted ? 'text-emerald-700' : 'text-rose-700'}`}>{result.accepted ? '已接受进入治理流程' : '导入被拒绝'}</div>
                <div className="mt-1 break-all text-xs text-stone-500">{result.caseId ?? 'case unavailable'} · {result.status}</div>
                <p className="mt-2 text-xs leading-5 text-stone-600">{result.note}</p>
              </div>

              {result.errors.length > 0 ? <div className="rounded-2xl border border-rose-100 p-4"><div className="text-xs font-black text-rose-700">拒绝原因</div><ul className="mt-2 space-y-2 text-xs leading-5 text-stone-600">{result.errors.map((error) => <li key={`${error.code}-${error.message}`}><strong>{error.code}</strong> · {error.message}</li>)}</ul></div> : null}

              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-xs font-black text-stone-500">二次回归</div>
                <div className="mt-2 text-lg font-black text-stone-900">{result.secondaryRegression.status}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(result.secondaryRegression.checks).map(([key, value]) => <div key={key} className="rounded-xl bg-stone-50 px-3 py-2"><div className="truncate font-bold text-stone-500">{key}</div><div className="mt-1 font-black text-stone-900">{String(value)}</div></div>)}
                </div>
              </div>

              <div className="rounded-2xl bg-violet-50 p-4"><div className="text-xs font-black text-violet-700">下一道门</div><div className="mt-1 text-sm font-black text-stone-900">{result.nextGate}</div></div>

              {result.candidateSnapshot ? <div className="rounded-2xl border border-violet-100 p-4"><div className="flex items-center justify-between gap-2"><div><div className="text-xs font-black text-violet-700">候选快照已生成</div><div className="mt-1 text-xs text-stone-400">formalApprovalEligible=false</div></div><button type="button" onClick={() => downloadJson(`candidate-${result.candidateSnapshot!.caseId.replace(/[:/]/g, '-')}.json`, result.candidateSnapshot)} className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black text-white">导出候选快照</button></div><pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-stone-950 p-3 text-[10px] leading-5 text-stone-100">{JSON.stringify(result.candidateSnapshot, null, 2)}</pre></div> : null}

              <button type="button" onClick={() => downloadJson('human-review-ingestion-result.json', result)} className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">导出 ingestion 结果</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
