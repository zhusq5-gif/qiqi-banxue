# 小学课程知识体系：真人核对指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 状态：研究/审校流程文件，不代表正式专家审核结果。

## 固定核对流程

`原始证据 → 年级/教材语境 → 教学语义 → unsigned decision → v2 current-case reconfirmation → structured proposal（如需） → secondary regression → content approval gate`

当前 `humanVerified = 0`，任何中间状态都不能冒充正式专家审核。

## 页面入口

- `/knowledge-map/human-review`：查看真人审核 case。
- `/knowledge-map/human-review/ingest`：接收 v1 decision、做兼容复测。
- `/knowledge-map/human-review/current`：在当前 case 上生成 decision v2。
- `/knowledge-map/human-review/proposal`：接收 decision v2 + structured proposal，运行 validation/reference closure/secondary regression。

## 审核文件

- `review-packets/WAVE1_CHINESE_REVIEW.md`
- `review-packets/WAVE2_LANGUAGE_REVIEW.md`
- `review-packets/WAVE2_MATH_REVIEW.md`
- `review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`
- `review-packets/HUMAN_REVIEW_DECISION_V2_TEMPLATE.json`
- `STRUCTURED_PROPOSAL_GUIDE.md`

## 决策边界

### F005

必须区分“长话短说/概括”和句法“缩句”。允许 `split_nodes / rename_and_reframe / retain_single_node / defer`，不提供自动 accept。

### Math Assessment

raw source 无 `tests_concept/tests_skill` 时，不得凭题意造 raw edge。可以 keep_unmapped / needs_source_evidence；如真人提出课程映射，只能走 `assessment_mapping`，provenance=`qiqi_curated_review`。

### Math relation

raw `relates_to / prerequisites_for / is_a` 保留原类型。Curriculum relation proposal 必须引用当前 case 的 raw evidence，保持同一对 KnowledgeNode；prerequisite candidate 还要通过 cycle check。

### Identity reuse

默认一个 KnowledgeNode + 多 Occurrence。只有 source 至少有两个可定位 Occurrence，且能完整唯一重分配时，才允许 identity split candidate。

## v1 / v2 decision

v1 不绑定 caseState，只用于兼容/预览/复测，candidate 固定 `formalApprovalEligible=false`。

v2 保存 `sourceTaskId / title / reviewType / sourceRefs / allowedDecisions`。任何字段与当前 case 不一致 → `CURRENT_CASE_STATE_MISMATCH`，必须重新核对。

## Structured Proposal

以下决定必须进一步结构化：

- `revise_candidate` → `content_revision`
- `split_nodes` → `concept_split`
- `rename_and_reframe` → `content_revision`
- `propose_curated_mapping` → `assessment_mapping`
- `propose_curriculum_relation` → `curriculum_relation`
- `split_identity_candidate` → `identity_split`

系统执行：

`proposal validation → reference closure → secondary regression`

重点检查：当前 decision/case/evidence 绑定、content 字段范围、split redirect/Occurrence 计划、Assessment curated provenance/raw immutable、relation endpoint pair/raw relation immutable、candidate prerequisite cycle、identity split Occurrence closure。

全部通过后只生成 `qiqi-curriculum-structured-candidate-snapshot/v2`，并进入 `curriculum_content_approval_gate`。

候选仍固定：`autoApply=false / humanVerified=false`。

正式发布还需要 content approval、教材版本、权利、课标映射等门禁全部通过。详细操作见 `STRUCTURED_PROPOSAL_GUIDE.md`。
