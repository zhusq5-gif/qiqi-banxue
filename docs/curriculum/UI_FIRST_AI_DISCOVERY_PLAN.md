# 课程知识体系 v0.3+：UI-first 真人审核 + AI Discovery 开发计划

状态：2026-09-10 更新。  
适用分支：`feat/curriculum-knowledge-v03`。

## 一、核心原则

正常审核流程统一通过应用 UI 完成。Markdown/JSON 只保留为外部交接、备份、审计和交换格式，不再作为默认业务流程。

当前主要 UI：

- `/knowledge-map/review-center`：审核中枢；
- `/knowledge-map/discovery`：AI 搜索候选真人初审；
- `/knowledge-map/discovery/domains`：学科 × 年级 × 领域搜索矩阵；
- `/knowledge-map/human-review/ai`：AI 候选真人精审完整链路；
- `/knowledge-map/verification`：学科 × 年级核对矩阵；
- `/knowledge-map/human-review`：现有内容/数学 audit 真人核对；
- `/knowledge-map/human-review/current`：当前 case decision v2；
- `/knowledge-map/human-review/proposal`：结构化提案与二次回归；
- `/knowledge-map/content-approval`：内容审批登记准备；
- `/knowledge-map/human-review/ingest`：历史/外部 v1 JSON 兼容入口。

AI 数据流：

```text
AI / Search
  ↓
source-qualified candidate
  ↓
domain coverage / duplicate check
  ↓
UI 初审
  ↓ promote_to_human_review
Human Review Case Draft
  ↓ current candidate/evidence recheck
Activated AI Human Review Case
  ↓ decision v2
new_knowledge_candidate
  ↓ secondary regression
candidate snapshot v2
  ↓ browser-local safe handoff
content approval preparation
  ↓
registration request
  ↓
repository candidate registration
  ↓
offline-vetted reviewer Ed25519 signature
  ↓
curriculum content gate
  ↓
curated release（仍需 standards / textbook / rights 等门禁）
```

所有 AI 与中间候选状态固定 `autoApply=false / humanVerified=false`，不会直接修改 seed/raw/curated master/CloudBase。

## 二、AI 搜索源优先级

### Tier A：官方课程标准/教育行政来源

用于学习领域、任务群、课程目标、学业要求和课标证据。官方框架/学段候选可以是 `high` confidence，但仍需 UI 人审。

### Tier B：出版社当前教材/数字资源

`publisher_current_resource`。用于网页当前明确展示的单元主题、活动栏目、交际功能和教材结构。只允许提取网页明确展示的信息，不得由栏目名补推未展示的语法、句型、词汇清单或评价标准。

### Tier C：出版社教研研究

`publisher_teaching_research`。用于出版社网站公开的教学研究、项目化学习案例和教研方案，只能作为能力/教学实践候选发现证据；**不得冒充教材正文、课标原文或当前教材版次事实**。

### Tier D：出版社历史目录/版次未知配套资源

`publisher_catalog_version_unknown`。仅用于候选发现和版本差异检查，不得更新 current-edition 状态。

### Tier E：开放许可知识图谱/数据集

例如 K12-KGraph。必须保留 raw ID、sourceLocator、原始 relation type、license 和 provenance；AI解释层与 raw evidence 分开。

## 三、AI Discovery 当前基线

已完成六批：

- Wave01：20 条；
- Wave02：21 条；
- Wave03：12 条领域缺口候选；
- Wave04：8 条领域深度候选；
- Wave05：13 条具体能力候选；
- Wave06：8 条整本书阅读/高年级英语深度候选。

聚合 registry：**82 条 AI candidate**：

- 语文 41；
- 英语 30；
- 数学 11。

Wave06 新增：

- 语文 G5：民间故事整本书阅读与改编表达、古典名著人物深读与多角度解读；
- 语文 G6：成长类整本书人物成长轨迹、世界名著地点信息梳理与导览表达；
- 英语 G6：主题 Read and write、pronunciation patterns；
- 英语 G5/G6：Proverbs 文化候选。

其中 4 条语文整本书候选使用 `publisher_teaching_research`，只表示出版社教研研究支持这些能力候选，**不代表教材强制要求这些项目成果形式**。

16 个必核学科年级均已有最低候选池；该指标只表示“已有候选可审”，不是课程覆盖率。

## 四、领域深度矩阵

使用 **112 个 `subject × grade × domain/task-group` 搜索规划单元**：

- 语文：60；
- 英语：28；
- 数学：24。

状态：

- `search_required`：0 条候选；
- `shallow_candidates`：仅 1 条；
- `review_pool_ready`：至少 2 条。

Wave05/06 已持续减少真实搜索空白。英语 `culture` 四个年级当前均达到 `review_pool_ready`，但这只表示候选池具备审校深度；**整个 112 单元矩阵仍不完整**，后续仍由全局 search queue 驱动扩库。

## 五、Review Center v2 / UI-first 审核

### 已完成

- [x] AI Discovery Inbox；
- [x] AI 领域深度搜索矩阵；
- [x] AI candidate → 本地 Human Review Case Draft；
- [x] current candidate/evidence activation；
- [x] decision v2；
- [x] new-knowledge 可视化表单；
- [x] exact duplicate blocker + semantic duplicate 真人 disposition；
- [x] secondary regression；
- [x] ↑/↓、K/J 连续上一条/下一条与进度；输入控件聚焦时快捷键停用；
- [x] candidateState 变化后旧 decision v2 明确标记 stale，并禁止继续 proposal/handoff；
- [x] regression-passed AI snapshot 一键安全 handoff 到 Content Approval；
- [x] 本地 `AIReviewHistory`：记录 activation、decision v2、defer、regression pass/block、Content Approval handoff；
- [x] 历史事件固定 `autoApply=false / humanVerified=false`，localStorage 解析会丢弃不安全状态；
- [x] 页面显示最近审校历史，明确标记 `local audit only`；
- [x] 文件/JSON 只做审计副本，不是正常流程必经步骤。

### 下一步

- [ ] Review Center 首页汇总待办/已审/阻断/历史数量；
- [ ] Existing structured proposal 接入同一 Content Approval handoff；
- [ ] 提供跨候选 history 查询和本地备份/恢复；
- [ ] 批量只允许筛选/分派，禁止批量审核通过。

## 六、独立 Curriculum Content Approval Gate

内容审批与 standards mapping gate 分离。

已实现：

- `scripts/curriculum-content-gate.mjs`；
- `scripts/register-curriculum-content-candidate.mjs`；
- `scripts/sign-curriculum-content-review.mjs`；
- `config/curriculum-content-reviewers.json`；
- `approvals/curriculum-content-candidates.json`；
- `approvals/curriculum-content-approvals.json`；
- `/knowledge-map/content-approval`；
- `contentApprovalHandoff.ts`。

规则：

1. 只有 `readyForApprovalGate=true / autoApply=false / humanVerified=false` 的 regression-passed snapshot 才可准备登记；
2. 浏览器 handoff/UI 不注册正式 candidate、不生成签名；
3. UI 只生成 `qiqi-curriculum-content-registration-request/v1`；
4. 正式 candidate 必须由维护者显式执行 register script；
5. reviewer 必须线下核验，仓库只登记 Ed25519 公钥；
6. approval 绑定 formal candidate canonical SHA-256；内容、证据或版本改变后旧 approval 失效；
7. content gate 与 standards gate 不能互相替代。

当前真实状态：

- formal content candidate = 0；
- trusted content reviewer = 0；
- signed content approval = 0；
- `readyForCuratedContentRelease=false`。

## 七、主线同步 / 工程状态

2026-09-10 已把 `main` 最近 7 个提交安全合入 feature 历史：

- 保留 main 的 Login / CloudBase / Parent / Vite / P1 tasks / `.gitignore` / `AGENTS.md` 更新；
- `.edgeone` 按 main 清理结果删除；
- `App.tsx` 合并 main 的 Today/Parent lazy loading 与课程知识路由 lazy loading；
- 使用双父 merge commit，未 force push、未修改 main；
- PR 已恢复 `mergeable=true`。

页面级拆包后，最新验证构建主 JS chunk 约 **932.6 KB**（之前约953KB）；Today 与 Parent 已成为独立 lazy chunks。主包仍偏大，继续保留性能优化任务。

## 八、下一阶段优先级

### P0 — Wave07 真实领域空白

- 从当前 `domain search queue` 继续补全局 `search_required`，再补 `shallow_candidates`；
- 数学优先：K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation + 2022具体条款双源深挖；
- 语文优先：实用性阅读、思辨阅读、跨学科学习的**具体年级**证据；
- 英语优先：仍薄弱的 language knowledge / phonics / reading / writing 具体年级颗粒度；
- 不按总候选数量优化。

### P0 — Review Center v2 收口

- 首页统一进度与历史摘要；
- existing structured proposal → Content Approval handoff；
- history 备份/恢复；
- 不增加“批量审核通过”。

### P1 — 第一个真实 formal candidate 登记

- 必须来自**真实 UI 审核 + secondary regression passed**候选；
- 通过 handoff 生成 registration request；
- 维护者显式 register；
- 可以登记 formal candidate，但不得伪造 reviewer、公钥或签名。

### P1 — 首个真实签名审批

- 线下核验真实 reviewer；
- 仓库只登记公钥；
- reviewer 用本地私钥签名；
- CI content gate 验签后才产生 signed approval。

### P1 — 统一课程出口

- normalized Math 接入统一三科 Curriculum；
- reviewed AI candidate 接入同一 ChangeSet/curated snapshot；
- 离线 HTML 明确 research/reviewed scope。

## 九、自动验收基线

2026-09-10 Wave06 + Review Center v2 + main-sync 最终 CI：

- Node 24 / production build ✅
- **31 test files / 161 tests passed** ✅
- 82 AI candidates / 6 discovery batches ✅
- Wave06 source-authority boundary ✅
- subject-grade / 112-cell domain coverage ✅
- AI promotion / activation / stale decision / new-knowledge regression ✅
- local AI review history safety ✅
- Content Approval preparation + handoff safety ✅
- standards Ed25519 self-test + tamper rejection ✅
- content Ed25519 self-test + tamper rejection + candidate-change invalidation ✅
- standards gate 60 mappings blocked as expected ✅
- content gate 0 candidate / 0 trusted reviewer blocked as expected ✅

## 十、不可改变的边界

- AI 不是学科审核者；
- AI 搜索结果不是教材事实；
- confidence 不是教育学正确率；
- `candidate_review_ready / review_pool_ready` 不是课程完整率；
- 任务群/领域锚点不能冒充具体年级知识点；
- `publisher_teaching_research` 不能冒充教材正文或课标原文；
- 出版社旧目录/配套手册不能冒充当前教材版次；
- exact duplicate=0 不代表没有语义重复；
- content gate 与 standards gate 不能互相替代；
- 浏览器/仓库不保存 reviewer 私钥；
- 当前 `humanVerified=0`；
- 未经真人 UI 核对和正式门禁，任何 AI candidate 都不能进入正式发布数据。
