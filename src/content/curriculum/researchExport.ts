import type {
  CurriculumCandidate,
  CurriculumEntry,
  CurriculumSubject,
  CurriculumTextbook,
  CurriculumView,
} from './curriculum'

export interface ResearchSnapshot {
  schema: 'qiqi-curriculum-research-snapshot/v1'
  status: 'research_only'
  datasetVersion: string
  exportedAt: string
  filters: {
    subject: CurriculumSubject
    grade: number | null
    view: CurriculumView
    query: string
    textbookId: string | null
  }
  textbook: CurriculumTextbook | null
  entries: CurriculumEntry[]
  candidates: CurriculumCandidate[]
  warning: string
}

export function createResearchSnapshot(input: {
  datasetVersion: string
  subject: CurriculumSubject
  grade: number | null
  view: CurriculumView
  query: string
  textbook: CurriculumTextbook | null
  entries: CurriculumEntry[]
  candidates: CurriculumCandidate[]
  exportedAt?: string
}): ResearchSnapshot {
  return {
    schema: 'qiqi-curriculum-research-snapshot/v1',
    status: 'research_only',
    datasetVersion: input.datasetVersion,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    filters: {
      subject: input.subject,
      grade: input.grade,
      view: input.view,
      query: input.query,
      textbookId: input.textbook?.id ?? null,
    },
    textbook: input.textbook,
    entries: input.entries,
    candidates: input.candidates,
    warning: '研究快照不是正式课程发布物；教材版次、课标条款、内容权利和专家审核仍需按发布门禁核验。',
  }
}

function safeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function buildResearchHtml(snapshot: ResearchSnapshot) {
  const embedded = safeJsonForHtml(snapshot)
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>小学知识地图研究快照</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#292524;background:#fafaf9}*{box-sizing:border-box}body{margin:0}main{max-width:1100px;margin:auto;padding:24px}.head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}.badge{background:#fef3c7;color:#b45309;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800}.warn{margin:16px 0;padding:12px 14px;border-radius:14px;background:#fff1f2;color:#be123c;font-size:13px;line-height:1.6}input{width:100%;height:44px;border:1px solid #e7e5e4;border-radius:14px;padding:0 14px;font-size:14px;background:white}.meta{color:#78716c;font-size:12px;margin:12px 0}.list{display:grid;gap:10px}.row{background:white;border:1px solid #f5f5f4;border-radius:16px;padding:14px}.row h3{margin:0 0 6px;font-size:15px}.row p{margin:0;color:#57534e;font-size:13px;line-height:1.65}.sub{margin-top:8px;color:#a8a29e;font-size:11px}.rel{background:#f5f3ff;border-color:#ede9fe}.empty{text-align:center;color:#a8a29e;padding:40px}</style>
</head>
<body>
<main>
<div class="head"><div><h1>小学知识地图研究快照</h1><div id="summary" class="meta"></div></div><span class="badge">研究版 · research_only</span></div>
<div class="warn" id="warning"></div>
<input id="search" placeholder="在此离线快照中搜索" />
<div id="count" class="meta"></div>
<div id="list" class="list"></div>
</main>
<script id="snapshot" type="application/json">${embedded}</script>
<script>
const data=JSON.parse(document.getElementById('snapshot').textContent);const search=document.getElementById('search');const list=document.getElementById('list');const count=document.getElementById('count');document.getElementById('warning').textContent=data.warning;document.getElementById('summary').textContent='数据版本 '+data.datasetVersion+' · 导出时间 '+data.exportedAt;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){const q=search.value.trim().toLowerCase();const entries=(data.entries||[]).filter(x=>!q||(x.label+' '+x.learningDemand+' '+x.book+' '+x.unit).toLowerCase().includes(q));const rels=(data.candidates||[]).filter(x=>!q||(x.fromName+' '+x.toName+' '+x.reason).toLowerCase().includes(q));count.textContent='知识点 '+entries.length+' 条 · 关系候选 '+rels.length+' 对';list.innerHTML=[...entries.map(x=>'<article class="row"><h3>'+esc(x.label)+'</h3><p>'+esc(x.learningDemand)+'</p><div class="sub">'+esc(x.book)+' · '+esc(x.unit)+' · '+esc(x.reviewStatus)+'</div></article>'),...rels.map(x=>'<article class="row rel"><h3>'+esc(x.fromName)+' ↔ '+esc(x.toName)+'</h3><p>相似标签候选 '+Math.round(x.similarity*100)+'% · 非正式先修关系</p></article>')].join('')||'<div class="empty">没有匹配结果</div>'}
search.addEventListener('input',render);render();
</script>
</body>
</html>`
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
