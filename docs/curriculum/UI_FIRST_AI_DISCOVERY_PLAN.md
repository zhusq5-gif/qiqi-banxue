# 课程知识体系 v0.3+：UI-first 真人审核 + AI Discovery 开发计划

状态：2026-09-09 更新。  
适用分支：`feat/curriculum-knowledge-v03`。

## 一、核心原则

正常审核流程统一通过应用 UI 完成。Markdown/JSON 只保留为外部交接、备份、审计和交换格式，不再作为默认业务流程。

当前 UI 入口：

- `/knowledge-map/review-center`：审核中枢；
- `/knowledge-map/discovery`：AI 搜索候选真人审校；
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
subject-grade-domain coverage / duplicate check
  ↓
UI decision
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
content registration request（UI准备包）
  ↓
repository candidate registration
  ↓
offline-vetted reviewer Ed25519 signature
  ↓
curriculum content gate
  ↓
curated release（仍需 standards / textbook / rights 等门禁）
```

所有 AI 和中间候选状态都固定 `autoApply=false / humanVerified=false`，不会直接修改 seed/raw/curated master/CloudBase。

## 二、AI 搜索源优先级

### Tier A：官方课程标准/教育行政来源

用于学习领域、任务群、课程目标、学业要求和课标证据。官方框架/学段候选可以是 `high` confidence，但仍需 UI 人审。

### Tier B：出版社当前教材/数字资源

用于当前可见的单元主题、活动栏目、交际功能和教材结构。只允许提取网页明确展示的信息，不得从栏目名补推未展示的语法、句型、词汇清单或评价标准。

### Tier C：出版社历史目录/版次未知配套资源

仅用于候选发现和版本差异检查；必须标 `publisher_catalog_version_unknown`，不得更新 current-edition 状态。

### Tier D：开放许可知识图谱/数据集

例如 K12-KGraph。必须保留 raw ID、sourceLocator、原始 relation type、license 和 provenance；AI解释层与 raw evidence 分开。

## 三、AI Discovery 当前基线

已完成五批：

- Wave01：20 条；
- Wave02：21 条；
- Wave03：12 条领域缺口候选；
- Wave04：8 条领域深度候选，重点补语文分学段书写能力、英语 G3/G4 phonics/reading/writing 与文化意识；
- Wave05：13 条具体能力候选，重点补语文 G2–G5 的词句积累、阅读策略、表达与梳理，以及英语 G3/G5/G6 的语音、读写和听后复述活动。

聚合 registry：**74 条 AI candidate**：

- 语文 37；
- 英语 26；
- 数学 11。

16 个必核学科年级均已有最低候选池；该指标只表示“已有候选可审”，不是课程覆盖率。

## 四、领域深度矩阵

当前使用 **112 个 `subject × grade × domain/task-group` 搜索规划单元**：

- 语文：10 个领域/任务群 × 6 年级 = 60；
- 英语：7 个语言维度 × 4 年级 = 28；
- 数学：4 个领域 × 6 年级 = 24。

状态：

- `search_required`：0 条候选；
- `shallow_candidates`：仅 1 条；
- `review_pool_ready`：至少 2 条。

Wave05 已把一批语文阅读/表达/梳理和英语语音/读写/听说候选映射进领域矩阵，但矩阵仍保留真实空白。下一批继续优先 `search_required`，其次补 `shallow_candidates`，不按总节点数优化。

## 五、UI-first 审核现状

### 已完成

- [x] AI Discovery Inbox；
- [x] Review Center v1；
- [x] AI 领域深度搜索矩阵；
- [x] AI candidate `promote_to_human_review` 直接生成本地 Human Review Case Draft；
- [x] `/knowledge-map/human-review/ai`：case activation、decision v2、new-knowledge可视化表单、duplicate disposition、secondary regression；
- [x] current candidate/evidence 变化会使旧 case draft 失效；
- [x] exact duplicate 阻断新增节点，semantic duplicate 继续交真人判断；
- [x] AI 精审队列支持上一条/下一条、J/K 与方向键快捷导航，并显示当前进度；输入控件聚焦时快捷键自动停用；
- [x] regression-passed AI candidate 可通过 browser-local safe handoff 一键带入 `/knowledge-map/content-approval`；
- [x] Content Approval 自动预填 snapshot / candidateId / subject / evidence；仍需人工补 datasetVersion / sourceCommit / preparedBy；
- [x] handoff 只接受 `readyForApprovalGate=true / autoApply=false / humanVerified=false` 的 snapshot，并可安全清除；
- [x] 文件/JSON 降级为审计副本，不是正常流程必经步骤。

### 下一步

- [ ] Review Center v2 继续收敛：审核历史、待办进度、caseState 失效可视化提醒；
- [ ] Existing structured proposal 也接同一 Content Approval handoff，不只支持 AI new knowledge；
- [ ] 增加可恢复的本地 decision/history ledger，页面刷新后仍能看到审校轨迹；
- [ ] 批量只允许筛选/分派，禁止批量审核通过。

## 六、独立 Curriculum Content Approval Gate

内容审批已经与 standards mapping gate 分离。

已实现：

- `scripts/curriculum-content-gate.mjs`；
- `scripts/register-curriculum-content-candidate.mjs`；
- `scripts/sign-curriculum-content-review.mjs`；
- `config/curriculum-content-reviewers.json`；
- `approvals/curriculum-content-candidates.json`；
- `approvals/curriculum-content-approvals.json`；
- `/knowledge-map/content-approval` UI 登记准备页；
- `contentApprovalHandoff.ts` 浏览器本地安全交接协议。

规则：

1. 只有 `readyForApprovalGate=true / autoApply=false / humanVerified=false` 的 regression-passed snapshot 才可准备登记；
2. 浏览器 handoff 与 UI 都不会注册正式 candidate，也不会生成签名；
3. UI 只生成 `qiqi-curriculum-content-registration-request/v1`，状态固定 `browser_preparation_only`；
4. 正式 candidate 必须由维护者显式执行 register script；
5. reviewer 必须线下核验，仓库只登记 Ed25519 公钥；私钥永不进入仓库或浏览器；
6. approval 绑定 formal candidate 的 canonical SHA-256；candidate 内容、证据或版本变化后旧 approval 自动失效；
7. content gate 与 standards gate 独立，任一通过都不能替代另一个。

当前真实状态故意保持：

- registered formal content candidate = 0；
- trusted content reviewer = 0；
- signed content approval = 0；
- `readyForCuratedContentRelease=false`。

## 七、下一阶段优先级

### P0 — Wave06 领域缺口搜索

- 根据当前 domain search queue 继续补 `search_required / shallow_candidates`；
- 语文：继续补实用性阅读、思辨阅读、整本书、跨学科学习等年级颗粒度证据，避免只靠任务群框架锚点；
- 英语：继续补 culture / phonics / reading / writing 的具体年级证据，尤其区分活动存在与具体语言项目；
- 数学：优先扩大 K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation，并把2022课标具体条款接入四领域深度矩阵；
- 每批仍先进入 AI candidate pool，再走 UI 真人审校。

### P0 — Review Center v2

- decision/history ledger；
- caseState 失效提示；
- existing structured proposal → Content Approval handoff；
- 统一待办数量/完成度显示；
- 不增加“批量审核通过”。

### P1 — 第一次真实候选登记演练

- 使用一个**真实 UI 审核并 secondary-regression-passed**的候选；
- 通过 handoff 生成 registration request；
- 维护者执行 register script；
- 可以登记 formal candidate，但不得伪造 reviewer、公钥或签名。

### P1 — 首个真实签名审批

- 线下核验真实语文/英语/数学 reviewer；
- 仓库只登记公钥；
- reviewer 在本地私钥签名；
- CI content gate 验证通过后才产生 signed approval。

### P1 — 统一课程出口

- normalized Math 接入统一三科 Curriculum；
- reviewed AI candidate 接入同一 ChangeSet/curated snapshot；
- 离线 HTML 明确 research/reviewed scope。

## 八、自动验收基线

当前最新 CI：

- Node 24 / production build ✅
- **30 test files / 156 tests passed** ✅
- AI discovery / Wave05 registry / subject-grade coverage / domain coverage ✅
- AI promotion / activation / new knowledge regression ✅
- Content Approval preparation + browser handoff safety ✅
- standards Ed25519 gate self-test + tamper rejection ✅
- content Ed25519 gate self-test + tamper rejection + candidate-change invalidation ✅
- standards gate 60 mappings blocked as expected ✅
- content gate 0 candidate / 0 trusted reviewer blocked as expected ✅

## 九、不可改变的边界

- AI 不是学科审核者；
- AI 搜索结果不是教材事实；
- confidence 不是教育学正确率；
- `candidate_review_ready / review_pool_ready` 不是课程完整率；
- 任务群/领域锚点不能冒充具体年级知识点；
- 出版社旧目录/配套手册不能冒充当前教材版次；
- exact duplicate=0 不代表没有语义重复；
- content gate 与 standards gate 不能互相替代；
- 浏览器不保存 reviewer 私钥；
- 当前 `humanVerified=0`；
- 未经真人 UI 核对和正式门禁，任何 AI candidate 都不能进入正式发布数据。
