import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AI_PROMOTED_REVIEW_STORAGE_KEY,
  type AIDiscoveryHumanReviewCaseDraft,
} from '../content/curriculum/aiDiscoveryPromotion'
import {
  activateAIDiscoveryHumanReviewCaseDraft,
  createAIHumanReviewDecisionV2,
  type AIHumanReviewActivationResult,
  type AIHumanReviewDecision,
  type AIHumanReviewDecisionV2,
} from '../content/curriculum/aiHumanReviewActivation'
import {
  runAINewKnowledgeSecondaryRegression,
  type AINewKnowledgeProposal,
  type AINewKnowledgeRegressionResult,
  type AISemanticDuplicateDisposition,
} from '../content/curriculum/aiNewKnowledgeProposal'
import {
  aiDiscoveryCandidateAllById,
  exactExistingMatches,
} from '../content/curriculum/aiDiscoveryRegistry'
import {
  CONTENT_APPROVAL_HANDOFF_STORAGE_KEY,
  createContentApprovalHandoff,
} from '../content/curriculum/contentApprovalHandoff'
import { subjectLabels, type CurriculumSubject } from '../content/curriculum/curriculum'

function readQueue(): AIDiscoveryHumanReviewCaseDraft[] {
  try {
    const raw = window.localStorage.getItem(AI_PROMOTED_REVIEW_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AIDiscoveryHumanReviewCaseDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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

function parseLines(value: string) {
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
}

function parseGrades(value: string) {
  return Array.from(new Set(value.split(/[，,\s]+/).map((item) => Number(item.trim())).filter((item) => Number.isInteger(item)))).sort((a, b) => a - b)
}

const decisionLabels: Record<AIHumanReviewDecision, string> = {
  accept_candidate: '接受为结构化候选',
  revise_candidate: '人工修订后进入候选',
  defer: '暂缓',
}

export default function CurriculumAIHumanReviewQueue() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState<AIDiscoveryHumanReviewCaseDraft[]>(() => readQueue())
  const [subject, setSubject] = useState<'all' | CurriculumSubject>('all')
  const [selectedId, setSelectedId] = useState(queue[0]?.id ?? '')

  const [activatorName, setActivatorName] = useState('')
  const [activatorRole, setActivatorRole] = useState('')
  const [activationEvidence, setActivationEvidence] = useState('')
  const [activation, setActivation] = useState<AIHumanReviewActivationResult | null>(null)

  const [decision, setDecision] = useState<AIHumanReviewDecision | ''>('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerRole, setReviewerRole] = useState('')
  const [decisionRationale, setDecisionRationale] = useState('')
  const [decisionEvidence, setDecisionEvidence] = useState('')
  const [decisionV2, setDecisionV2] = useState<AIHumanReviewDecisionV2 | null>(null)

  const [canonicalLabel, setCanonicalLabel] = useState('')
  const [learningDemand, setLearningDemand] = useState('')
  const [gradeScope, setGradeScope] = useState('')
  const [aliases, setAliases] = useState('')
  const [proposalRationale, setProposalRationale] = useState('')
  const [semanticDisposition, setSemanticDisposition] = useState<AISemanticDuplicateDisposition>('no_obvious_duplicate')
  const [semanticNote, setSemanticNote] = useState('')
  const [possibleExistingIds, setPossibleExistingIds] = useState('')
  const [regression, setRegression] = useState<AINewKnowledgeRegressionResult | null>(null)
  const [message, setMessage] = useState('')

  const visible = useMemo(() => queue.filter((item) => subject === 'all' || item.subject === subject), [queue, subject])
  const selected = queue.find((item) => item.id === selectedId) ?? visible[0] ?? null
  const selectedVisibleIndex = selected ? visible.findIndex((item) => item.id === selected.id) : -1
  const currentCandidate = selected ? aiDiscoveryCandidateAllById(selected.candidateId) : null
  const exactMatches = currentCandidate ? exactExistingMatches(currentCandidate) : []

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(1)
      }
      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(-1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, selectedId])

  function resetWorkflow(next: AIDiscoveryHumanReviewCaseDraft | null) {
    setActivation(null)
    setDecision('')
    setDecisionV2(null)
    setRegression(null)
    setMessage('')
    setActivationEvidence(next?.sourceRefs.join('\n') ?? '')
    setDecisionEvidence(next?.sourceRefs.join('\n') ?? '')
    setCanonicalLabel(next?.candidateState.label ?? '')
    setLearningDemand(next?.candidateState.learningDemand ?? '')
    setGradeScope(next?.grades.join(',') ?? '')
    setAliases('')
    setProposalRationale('')
    setSemanticDisposition('no_obvious_duplicate')
    setSemanticNote('')
    setPossibleExistingIds('')
  }

  function chooseDraft(id: string) {
    setSelectedId(id)
    resetWorkflow(queue.find((item) => item.id === id) ?? null)
  }

  function moveSelection(delta: number) {
    if (!visible.length) return
    const currentIndex = selectedVisibleIndex >= 0 ? selectedVisibleIndex : 0
    const nextIndex = Math.min(visible.length - 1, Math.max(0, currentIndex + delta))
    if (nextIndex !== currentIndex || selectedId !== visible[nextIndex].id) chooseDraft(visible[nextIndex].id)
  }

  function removeDraft(id: string) {
    const next = queue.filter((item) => item.id !== id)
    setQueue(next)
    window.localStorage.setItem(AI_PROMOTED_REVIEW_STORAGE_KEY, JSON.stringify(next))
    const nextSelected = next[0] ?? null
    setSelectedId(nextSelected?.id ?? '')
    resetWorkflow(nextSelected)
  }

  function activateCurrentDraft() {
    if (!selected) return
    const result = activateAIDiscoveryHumanReviewCaseDraft(
      selected,
      { name: activatorName, role: activatorRole },
      parseLines(activationEvidence),
    )
    setActivation(result)
    setDecisionV2(null)
    setRegression(null)
    setMessage(result.accepted ? 'Current candidateState 已重新核对，case 激活成功。' : result.errors.join(' · '))
  }

  function recordDecisionV2() {
    if (!activation?.activatedCase || !decision) {
      setMessage('请先激活 current case 并选择精审决定。')
      return
    }
    try {
      const next = createAIHumanReviewDecisionV2(
        activation.activatedCase,
        decision,
        decisionRationale,
        { name: reviewerName, role: reviewerRole },
        parseLines(decisionEvidence),
      )
      setDecisionV2(next)
      setRegression(null)
      setMessage(next.decision === 'defer' ? '已记录暂缓 decision v2；不会生成新知识 proposal。' : 'decision v2 已绑定 current AI case，可进入新知识候选表单。')
    } catch (error) {
      setDecisionV2(null)
      setRegression(null)
      setMessage(error instanceof Error ? error.message : 'decision v2 生成失败')
    }
  }

  function runNewKnowledgeProposal() {
    if (!selected || !currentCandidate || !decisionV2 || decisionV2.decision === 'defer') {
      setMessage('当前没有可进入 new_knowledge_candidate 的 decision v2。')
      return
    }
    const proposedGrades = parseGrades(gradeScope)
    const proposal: AINewKnowledgeProposal = {
      schema: 'qiqi-curriculum-ai-new-knowledge-proposal/v1',
      caseId: decisionV2.caseId,
      candidateId: selected.candidateId,
      kind: 'new_knowledge_candidate',
      status: 'structured_proposal_candidate',
      autoApply: false,
      rationale: proposalRationale,
      evidenceRefs: parseLines(decisionEvidence),
      proposed: {
        temporaryId: `candidate:new:${selected.candidateId}`,
        subject: selected.subject,
        gradeScope: proposedGrades,
        entityRole: currentCandidate.candidateKind === 'knowledge_domain' ? 'framework_anchor' : 'knowledge_node',
        canonicalLabel,
        learningDemand,
        aliases: parseLines(aliases),
        provenance: 'ai_discovery_human_curated',
        sourceRefs: currentCandidate.sourceRefs.slice(),
        duplicateAnalysis: {
          exactExistingIds: exactMatches.map((item) => item.id).sort(),
          semanticDisposition,
          semanticReviewNote: semanticNote,
          possibleExistingIds: parseLines(possibleExistingIds),
        },
      },
    }
    const result = runAINewKnowledgeSecondaryRegression(decisionV2, proposal)
    setRegression(result)
    setMessage(result.accepted ? '二次回归通过：只生成 candidate snapshot，下一门是 content approval gate。' : result.errors.join(' · '))
  }

  function handoffToContentApproval() {
    if (!selected || !regression?.accepted || !regression.candidateSnapshot) {
      setMessage('只有 secondary regression 通过的 candidate snapshot 才能交接到 Content Approval。')
      return
    }
    try {
      const handoff = createContentApprovalHandoff({
        candidateId: `content:${selected.candidateId}`,
        subject: selected.subject,
        snapshot: regression.candidateSnapshot,
        evidenceRefs: parseLines(decisionEvidence),
        source: 'ai_human_review',
      })
      window.localStorage.setItem(CONTENT_APPROVAL_HANDOFF_STORAGE_KEY, JSON.stringify(handoff))
      navigate('/knowledge-map/content-approval')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Content Approval handoff 失败')
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 pb-20 pt-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">AI 候选真人精审工作流</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">一页完成 case draft → current candidate 重核 → decision v2 → new_knowledge_candidate → secondary regression。即使全部通过，也只到候选快照，不会自动进入正式库。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/knowledge-map/discovery" className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">返回 AI 候选池</Link>
          <Link to="/knowledge-map/discovery/domains" className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">领域搜索矩阵</Link>
          <Link to="/knowledge-map/review-center" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">Review Center</Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['精审草稿', queue.length],
          ['语文', queue.filter((item) => item.subject === 'chinese').length],
          ['英语', queue.filter((item) => item.subject === 'english').length],
          ['数学', queue.filter((item) => item.subject === 'math').length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="text-2xl font-black text-stone-900">{value}</div><div className="text-xs font-bold text-stone-400">{label}</div></div>)}
      </section>

      <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-6 text-violet-800">
        <strong>正式状态：</strong>本流程中的 case activation、decision v2、regression passed 都是治理中间态；固定 `autoApply=false / humanVerified=false`。真正批准还需要独立 curriculum content approval gate。
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <select value={subject} onChange={(event) => setSubject(event.target.value as 'all' | CurriculumSubject)} className="h-10 rounded-xl border border-stone-200 px-3 text-sm"><option value="all">全部学科</option><option value="chinese">语文</option><option value="english">英语</option><option value="math">数学</option></select>
        <button type="button" onClick={() => moveSelection(-1)} disabled={selectedVisibleIndex <= 0} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-600 disabled:opacity-40">↑ / K 上一条</button>
        <button type="button" onClick={() => moveSelection(1)} disabled={selectedVisibleIndex < 0 || selectedVisibleIndex >= visible.length - 1} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-600 disabled:opacity-40">↓ / J 下一条</button>
        <span className="text-xs font-bold text-stone-400">{selectedVisibleIndex >= 0 ? `${selectedVisibleIndex + 1}/${visible.length}` : `0/${visible.length}`} · 输入框聚焦时快捷键停用</span>
      </div>

      {queue.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white py-20 text-center text-sm text-stone-400">还没有候选进入真人精审。请先在 AI 候选审校台核对来源并选择“进入真人精审”。</div>
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="rounded-3xl bg-stone-50 p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
            <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
              {visible.map((item) => <button key={item.id} type="button" onClick={() => chooseDraft(item.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-violet-200 bg-violet-50' : 'border-transparent bg-white'}`}><div className="text-[10px] font-black text-violet-700">{subjectLabels[item.subject]} · G{item.grades.join('/')}</div><div className="mt-1 text-sm font-black leading-5 text-stone-900">{item.candidateState.label}</div><div className="mt-1 text-[10px] text-stone-400">{item.candidateState.confidence} · {item.candidateState.sourceAuthority}</div></button>)}
            </div>
          </aside>

          <main className="space-y-4">
            {selected && currentCandidate ? <>
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black text-violet-700">{subjectLabels[selected.subject]} · {selected.grades.map((grade) => `${grade}年级`).join(' / ')}</div><h2 className="mt-1 text-xl font-black text-stone-900">{selected.candidateState.label}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{selected.candidateState.learningDemand}</p></div><div className="text-right text-xs text-stone-500">{selected.candidateState.candidateKind}<br />humanVerified=false</div></div>
                <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-violet-50 p-4"><div className="text-xs font-black text-violet-700">第一次促进入队</div><p className="mt-2 text-xs leading-6 text-stone-700">{selected.promotionRationale}</p><p className="mt-2 text-[10px] text-stone-400">{selected.promotedBy.name} · {selected.promotedBy.role}</p></div><div className="rounded-2xl bg-stone-50 p-4"><div className="text-xs font-black text-stone-500">当前来源</div><div className="mt-2 space-y-2">{currentCandidate.sourceRefs.map((ref) => <a key={ref} href={ref} target="_blank" rel="noreferrer" className="block break-all rounded-xl bg-white px-3 py-2 text-[11px] leading-5 text-blue-700 hover:underline">{ref}</a>)}</div></div></div>
                {exactMatches.length ? <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs leading-6 text-rose-700"><strong>精确重复 blocker：</strong>{exactMatches.map((item) => `${item.id} · ${item.label}`).join('；')}。new_knowledge_candidate 将被拒绝，应转为合并/现有节点修订流程。</div> : null}
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="font-black text-stone-900">1. 激活 Current Case</h3><p className="mt-1 text-xs text-stone-400">重新检查当前 registry 中的 candidateState 与来源。候选内容发生变化时旧 draft 会失效。</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={activatorName} onChange={(event) => setActivatorName(event.target.value)} placeholder="激活人姓名" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /><input value={activatorRole} onChange={(event) => setActivatorRole(event.target.value)} placeholder="角色/学科资质" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /></div>
                <textarea value={activationEvidence} onChange={(event) => setActivationEvidence(event.target.value)} rows={3} placeholder={selected.sourceRefs.join('\n')} className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-5" />
                <button type="button" onClick={activateCurrentDraft} className="mt-3 rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white">重新核验并激活</button>
                {activation ? <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${activation.accepted ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{activation.accepted ? 'current candidateState matches · activated' : activation.errors.join(' · ')}</div> : null}
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="font-black text-stone-900">2. 真人 Decision v2</h3>
                <select value={decision} onChange={(event) => setDecision(event.target.value as AIHumanReviewDecision | '')} disabled={!activation?.accepted} className="mt-4 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm disabled:bg-stone-100"><option value="">请选择</option>{(Object.keys(decisionLabels) as AIHumanReviewDecision[]).map((item) => <option key={item} value={item}>{decisionLabels[item]}</option>)}</select>
                <div className="mt-3 grid gap-3 md:grid-cols-2"><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="精审人姓名" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /><input value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)} placeholder="角色/学科资质" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /></div>
                <textarea value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} rows={3} placeholder="教学语义与知识颗粒度判断理由" className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-sm leading-6" />
                <textarea value={decisionEvidence} onChange={(event) => setDecisionEvidence(event.target.value)} rows={3} placeholder={selected.sourceRefs.join('\n')} className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-5" />
                <button type="button" onClick={recordDecisionV2} disabled={!activation?.accepted} className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white disabled:bg-stone-300">记录 decision v2</button>
              </section>

              {decisionV2 && decisionV2.decision !== 'defer' ? <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="font-black text-stone-900">3. New Knowledge Candidate</h3><p className="mt-1 text-xs leading-5 text-stone-400">knowledge_domain 自动限定为 framework_anchor；其他候选才可成为 provisional knowledge_node。人工可缩小年级范围，但不能扩大 AI 来源声明范围。</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={canonicalLabel} onChange={(event) => setCanonicalLabel(event.target.value)} placeholder="Canonical label" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /><input value={gradeScope} onChange={(event) => setGradeScope(event.target.value)} placeholder="年级范围，如 5 或 5,6" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" /></div>
                <textarea value={learningDemand} onChange={(event) => setLearningDemand(event.target.value)} rows={3} placeholder="Learning demand / definition" className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-sm leading-6" />
                <textarea value={aliases} onChange={(event) => setAliases(event.target.value)} rows={2} placeholder="别名，每行一条（可空）" className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-sm" />
                <textarea value={proposalRationale} onChange={(event) => setProposalRationale(event.target.value)} rows={3} placeholder="为什么应创建新的 framework anchor / KnowledgeNode 候选" className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-sm leading-6" />
                <div className="mt-3 rounded-2xl bg-amber-50 p-4"><div className="text-xs font-black text-amber-700">语义重复人工检查（必填）</div><select value={semanticDisposition} onChange={(event) => setSemanticDisposition(event.target.value as AISemanticDuplicateDisposition)} className="mt-2 h-10 w-full rounded-xl border border-amber-100 bg-white px-3 text-sm"><option value="no_obvious_duplicate">未发现明显语义重复</option><option value="possible_duplicate_reviewed">存在可能重复，已记录关联节点</option></select><textarea value={semanticNote} onChange={(event) => setSemanticNote(event.target.value)} rows={3} placeholder="说明检查过哪些相近概念，以及为什么仍应新建/继续候选" className="mt-2 w-full rounded-xl border border-amber-100 bg-white p-3 text-sm leading-6" />{semanticDisposition === 'possible_duplicate_reviewed' ? <textarea value={possibleExistingIds} onChange={(event) => setPossibleExistingIds(event.target.value)} rows={2} placeholder="可能重复的 existing ID，每行一条" className="mt-2 w-full rounded-xl border border-amber-100 bg-white p-3 font-mono text-xs" /> : null}</div>
                <button type="button" onClick={runNewKnowledgeProposal} className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white">运行 proposal + secondary regression</button>
                {regression ? <div className={`mt-4 rounded-2xl p-4 text-xs leading-6 ${regression.accepted ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}><div className="font-black">{regression.accepted ? '二次回归通过 · readyForApprovalGate' : '候选被阻断'}</div>{regression.checks.map((check) => <div key={check.id}>{check.passed ? '✓' : '✕'} {check.id} · {check.detail}</div>)}{regression.errors.map((error) => <div key={error}>• {error}</div>)}{regression.candidateSnapshot ? <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => downloadJson(`ai-new-knowledge-${selected.candidateId}.json`, regression.candidateSnapshot)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700">导出 candidate snapshot 审计副本</button><button type="button" onClick={handoffToContentApproval} className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">带入 Content Approval →</button></div> : null}</div> : null}
              </section> : null}

              <section className="flex flex-wrap items-center gap-2 rounded-3xl bg-white p-5 shadow-sm"><button type="button" onClick={() => downloadJson(`ai-human-review-case-${selected.candidateId}.json`, selected)} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-600">导出 case draft</button><button type="button" onClick={() => removeDraft(selected.id)} className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">从本地队列移除</button>{message ? <span className="text-xs font-bold text-stone-500">{message}</span> : null}</section>
            </> : null}
          </main>
        </section>
      )}
    </div>
  )
}
