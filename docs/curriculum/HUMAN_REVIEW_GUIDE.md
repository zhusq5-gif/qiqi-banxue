# 小学课程知识体系：真人核对指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 状态：研究/审校流程文件，不代表正式专家审核结果。

## 1. 谁来核对

建议由对应学科的小学教师、教研员或具有该学科课程教学经验的审核者执行。数据整理/开发人员可以准备证据，但不应同时把自己的机器结论直接标成“专家已核”。

当前系统中 `human verified = 0`。任何人工填写结果先作为 `unsigned_human_review`，之后还需进入系统复测与正式审核/签名流程。

## 2. 固定核对步骤

每个 case 都按以下顺序执行：

1. **看原始来源**：先打开 case 中的 `sourceRefs`，核对原始 JSON Pointer / raw `sourceLocator`，不要只看系统候选文字。
2. **确认年级和教材情境**：判断该知识、技能、题型、关系或练习确实属于当前年级/章节情境。
3. **核教学语义**：检查知识名称与学习要求是否一致；题型是否适合该学科；关系类型是否与 evidence 一致。
4. **只在证据范围内决策**：没有原始证据时可以“保持未映射/需要更多证据/提出 curated mapping 候选”，不能伪造 raw edge。
5. **填写理由和证据**：至少记录审核人姓名、角色、决策、理由、实际查阅的证据引用和时间。
6. **导出 unsigned decision**：人工决定不直接改 seed，不直接产生 `expert_verified`。
7. **运行 decision ingestion**：进入 `/knowledge-map/human-review/ingest`，上传或粘贴审核 JSON；系统重新检查当前 case、allowedDecisions、evidenceRefs，并重新运行候选修补检查。
8. **当前 case 重新确认**：v1 decision 只用于预览/复测。正式向后流转时进入 `/knowledge-map/human-review/current`，重新基于当前 case 生成 decision v2。
9. **需要结构变化时提交 proposal**：`revise_candidate / split_nodes / rename_and_reframe / propose_curated_mapping / propose_curriculum_relation / split_identity_candidate` 进入 `/knowledge-map/human-review/proposal`。
10. **执行 structured secondary regression**：系统检查 source/reference closure、raw provenance、候选 prerequisite 环、Occurrence 分配等；通过后只生成 candidate snapshot v2。
11. **进入后续内容审批门禁**：候选快照仍为 `autoApply=false`、`humanVerified=false`，不能直接发布。

## 3. 决策边界

### 内容修补

- `accept_candidate`：候选修补与实际教材/来源一致。
- `revise_candidate`：方向正确但候选文字/分类需要人工修改；必须提交 `content_revision` structured proposal。
- `defer`：证据不足或需要更高层级教研判断。

### F005 概念边界

F005 不提供“接受自动改名”。必须区分：

- **长话短说/概括**：对篇章或事件信息进行压缩，保留主要内容与关键行动；
- **缩句**：句法操作，删除修饰限制成分后保留句子主干。

允许决定：`split_nodes`、`rename_and_reframe`、`retain_single_node`、`defer`。

`split_nodes` 必须进一步提交 `concept_split` proposal；系统会检查源节点、candidate IDs、Occurrence 继承和 redirect plan。

### 数学 Assessment 绑定

当 Exercise 有章节定位但没有 `tests_concept/tests_skill`：

- 先检查完整 K12-KGraph raw source；
- 如果只是本项目 excerpt 漏边，补回**可定位的原始边**；
- 如果 raw source 中没有对应边，保持 `keep_unmapped` 或 `needs_source_evidence`；
- 教研认为应该绑定时只能提交 `propose_curated_mapping` → `assessment_mapping` proposal，不得伪装成 K12-KGraph raw edge。

### 数学跨年级关系

原始 `relates_to / prerequisites_for / is_a` 原样保留。人工可决定是否只保留 raw relation，或提出新的 Curriculum relation 候选；但原始 `relates_to` 不能因为“看起来像进阶”就自动改为 prerequisite。

`curriculum_relation` proposal 必须引用当前 case 的 raw evidence，并保持同一对 KnowledgeNode；如果提出 `prerequisite_for`，还必须通过有向图环检测。

### 同一知识跨年级复用

先判断是否仍是同一概念身份，再比较不同年级 Occurrence 的学习要求。默认不要因为年级变化就复制 KnowledgeNode。

只有当真人选择 `split_identity_candidate`，且 source KnowledgeNode 至少有两个可定位 Occurrence，才可以提交 `identity_split` proposal；所有 Occurrence 必须且只能分配一次。

## 4. 本轮审核包与页面

审核文件：

- `review-packets/WAVE1_CHINESE_REVIEW.md`：F001–F004
- `review-packets/WAVE2_LANGUAGE_REVIEW.md`：F005–F007
- `review-packets/WAVE2_MATH_REVIEW.md`：数学 G4/G5 Assessment / relation / occurrence 专项
- `review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`：v1 人工决定模板
- `review-packets/HUMAN_REVIEW_DECISION_V2_TEMPLATE.json`：绑定当前 caseState 的 v2 模板
- `STRUCTURED_PROPOSAL_GUIDE.md`：五类 structured proposal 的字段、约束、二次回归和结果解释

系统页面入口：

- `/knowledge-map/human-review`：查看 case、填写并导出 v1 真人审核决定。
- `/knowledge-map/human-review/ingest`：导入 v1 决定、运行接收校验与二次回归、导出候选快照。
- `/knowledge-map/human-review/current`：基于当前 case 重新确认并生成 decision v2；页面会立即运行 v2 ingestion。
- `/knowledge-map/human-review/proposal`：导入 decision v2 + structured proposal，运行 proposal validation、reference closure 和 secondary regression。

## 5. v1 与 v2 的区别

### v1

`qiqi-curriculum-human-review-decision/v1` 可以进入 ingestion，但 **没有绑定审核时的 caseState**。因此 v1 candidate snapshot 固定：

- `formalApprovalEligible=false`
- `humanVerified=false`
- `autoApply=false`

v1 适合做复测、发现冲突和准备候选内容，但不能直接进入后续正式审批门禁。

### v2

`qiqi-curriculum-human-review-decision/v2` 会保存审核时的：

- `sourceTaskId`
- `title`
- `reviewType`
- `sourceRefs`
- `allowedDecisions`

v2 ingestion 会把这些字段与当前 caseState **逐项、按顺序比对**。任何一项变化都会返回 `CURRENT_CASE_STATE_MISMATCH`，要求重新核对当前 case。

caseState 一致、基础 ingestion 通过且安全候选重新通过二次回归后，才会得到 candidate snapshot v2，并出现 `readyForApprovalGate=true`。

这仍然**不是** `humanVerified`，也不代表可以正式发布。

## 6. ingestion 接受条件

一个 decision 只有满足以下条件，才会被 ingestion 接受：

- case 在当前数据中仍存在；
- decision 属于当前 case 的 `allowedDecisions`；
- `status=unsigned_human_review`；
- `autoApply=false`、`humanVerified=false`；
- 审核者姓名和角色非空；
- rationale 非空；
- evidenceRefs 非空，并且至少一条与当前 case 的 sourceRefs 完全一致；
- reviewedAt 是有效日期时间。

`accept_candidate` 还必须重新通过 `curriculumRepairRecheck` 才会生成 content candidate snapshot。

## 7. structured proposal 与二次回归

以下决定必须提供结构化 proposal：

- `revise_candidate` → `content_revision`
- `split_nodes` → `concept_split`
- `rename_and_reframe` → `content_revision`
- `propose_curated_mapping` → `assessment_mapping`
- `propose_curriculum_relation` → `curriculum_relation`
- `split_identity_candidate` → `identity_split`

系统先运行 `qiqi-curriculum-human-review-structured-proposal-validation/v1`，再运行 `qiqi-curriculum-human-review-structured-regression/v1`。

重点检查包括：

- proposal 和当前 decision v2/case 完全绑定；
- F005 不能把拆分决定套到其他节点；
- Assessment case 不能映射另一个 Exercise；
- curated mapping 保持 `qiqi_curated_review` provenance，raw edge immutable；
- Curriculum relation 的 raw evidence 必须对应同一对 KnowledgeNode；
- `prerequisite_for` 候选必须无环；
- identity split 必须有足够 Occurrence，且 reference closure 完整；
- seed/raw/source node 在候选阶段保持 immutable。

全部通过后生成：

`qiqi-curriculum-structured-candidate-snapshot/v2`

并进入：

`curriculum_content_approval_gate`

但仍固定：

- `autoApply=false`
- `humanVerified=false`

详细字段见 `STRUCTURED_PROPOSAL_GUIDE.md`。

## 8. 通过条件

一个 case 要进入后续内容审批门禁，至少需要：

- 原始证据可定位；
- 审核者身份/角色已填写；
- decision 属于当前 case 允许集合；
- rationale 与 evidenceRefs 完整；
- decision v2 的 caseState 与当前 case 一致；
- 如需结构变更，structured proposal validation 通过；
- secondary regression 通过；
- `autoApply=false`、`humanVerified=false` 仍保持不变。

正式发布还需要后续内容签名、教材版本、权利、课标映射等门禁，不因一次人工核对、一次 ingestion 或 `readyForApprovalGate=true` 自动开放。
