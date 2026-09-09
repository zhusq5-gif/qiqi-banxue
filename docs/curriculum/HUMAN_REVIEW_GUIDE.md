# 小学课程知识体系：真人核对指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 状态：研究/审校流程文件，不代表正式专家审核结果。

## 1. 谁来核对

建议由对应学科的小学教师、教研员或具有该学科课程教学经验的审核者执行。数据整理/开发人员可以准备证据，但不应同时把自己的机器结论直接标成“专家已核”。

当前系统中 `human verified = 0`。任何人工填写结果先作为 `unsigned_human_review`，之后还需进入系统复测与正式审核/签名流程。

## 2. 固定核对步骤

1. **看原始来源**：先打开 case 中的 `sourceRefs`，核对原始 JSON Pointer / raw `sourceLocator`。
2. **确认年级和教材情境**：判断知识、技能、题型、关系或练习确实属于当前年级/章节情境。
3. **核教学语义**：检查知识名称与学习要求是否一致；题型是否适合该学科；关系类型是否与 evidence 一致。
4. **只在证据范围内决策**：没有原始证据时可以保持未映射/需要更多证据/提出 curated mapping，不得伪造 raw edge。
5. **填写理由和证据**：记录审核人姓名、角色、决策、理由、实际查阅的证据和时间。
6. **导出 unsigned decision**：人工决定不直接改 seed，不直接产生 `expert_verified`。
7. **运行 decision ingestion**：`/knowledge-map/human-review/ingest` 重新检查当前 case、allowedDecisions、evidenceRefs 和候选修补。
8. **当前 case 重新确认**：正式向后流转时进入 `/knowledge-map/human-review/current`，生成绑定当前 caseState 的 decision v2。
9. **需要结构变化时提交 proposal**：进入 `/knowledge-map/human-review/proposal`。
10. **执行 secondary regression**：检查 source/reference closure、raw provenance、relation endpoint pair、candidate prerequisite 环和 Occurrence 分配。
11. **进入后续内容审批门禁**：候选仍为 `autoApply=false / humanVerified=false`。

## 3. 关键决策边界

### F005 概念边界

必须区分：
- **长话短说/概括**：篇章或事件信息压缩，保留主要内容与关键行动；
- **缩句**：句法操作，删除修饰限制成分后保留句子主干。

允许：`split_nodes`、`rename_and_reframe`、`retain_single_node`、`defer`。不提供自动 accept。

### 数学 Assessment 绑定

Exercise 无 `tests_concept/tests_skill` 时必须先检查完整 raw source：
- excerpt 漏边 → 只补回可定位 raw edge；
- raw source 无边 → `keep_unmapped / needs_source_evidence`；
- 真人认为应建立课程映射 → `propose_curated_mapping`，走 `assessment_mapping` proposal，provenance 固定为 curated 层。

### 数学跨年级关系

raw `relates_to / prerequisites_for / is_a` 原样保留。若提出 Curriculum relation：
- raw evidence 必须来自当前 case；
- 必须保持同一对 KnowledgeNode；
- 不覆盖 raw relation；
- `prerequisite_for` candidate 必须通过 cycle check。

### 同一知识跨年级复用

默认一个 KnowledgeNode + 多 Occurrence。只有选择 `split_identity_candidate` 且有至少两个可定位 Occurrence 时，才能提交 identity split；所有 Occurrence 必须且只能分配一次。

## 4. 文件与页面

审核文件：
- `review-packets/WAVE1_CHINESE_REVIEW.md`
- `review-packets/WAVE2_LANGUAGE_REVIEW.md`
- `review-packets/WAVE2_MATH_REVIEW.md`
- `review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`
- `review-packets/HUMAN_REVIEW_DECISION_V2_TEMPLATE.json`
- `STRUCTURED_PROPOSAL_GUIDE.md`：五类 proposal 的字段、约束、二次回归和结果解释

页面：
- `/knowledge-map/human-review`
- `/knowledge-map/human-review/ingest`
- `/knowledge-map/human-review/current`
- `/knowledge-map/human-review/proposal`

## 5. v1 / v2 decision

### v1

`qiqi-curriculum-human-review-decision/v1` 不绑定 caseState，因此只用于兼容、预览和复测。其 candidate 固定：
- `formalApprovalEligible=false`
- `humanVerified=false`
- `autoApply=false`

### v2

`qiqi-curriculum-human-review-decision/v2` 保存：
- `sourceTaskId`
- `title`
- `reviewType`
- `sourceRefs`
- `allowedDecisions`

v2 ingestion 与当前 caseState 逐字段比对。任一变化 → `CURRENT_CASE_STATE_MISMATCH`，必须重新核对。

## 6. Structured Proposal

以下决定必须进一步结构化：
- `revise_candidate` → `content_revision`
- `split_nodes` → `concept_split`
- `rename_and_reframe` → `content_revision`
- `propose_curated_mapping` → `assessment_mapping`
- `propose_curriculum_relation` → `curriculum_relation`
- `split_identity_candidate` → `identity_split`

系统运行：

`structured proposal validation → reference closure → secondary regression`

通过后生成：

`qiqi-curriculum-structured-candidate-snapshot/v2`

并进入：

`curriculum_content_approval_gate`

但仍固定：
- `autoApply=false`
- `humanVerified=false`

详细字段和错误处理见 `STRUCTURED_PROPOSAL_GUIDE.md`。

## 7. 进入后续审批门禁的最低条件

- 原始证据可定位；
- 审核者身份/角色已填写；
- decision 属于当前 case 允许集合；
- rationale/evidenceRefs 完整；
- decision v2 caseState 与当前 case 一致；
- structured proposal（如需要）通过 validation；
- secondary regression 通过；
- `autoApply=false / humanVerified=false` 保持不变。

正式发布还需要内容签名、教材版本、权利、课标映射等门禁，不因一次人工核对或 `readyForApprovalGate=true` 自动开放。
