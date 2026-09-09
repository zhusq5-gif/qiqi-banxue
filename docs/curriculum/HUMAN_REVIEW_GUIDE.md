# 小学课程知识体系：真人核对指南

流程：`原始证据 → 年级/教材语境 → 教学语义 → unsigned decision → decision v2/current-case reconfirmation → structured proposal（如需） → secondary regression → content approval gate`。

当前 `humanVerified = 0`。

页面：
- `/knowledge-map/human-review`
- `/knowledge-map/human-review/ingest`
- `/knowledge-map/human-review/current`
- `/knowledge-map/human-review/proposal`

文件：
- `review-packets/WAVE1_CHINESE_REVIEW.md`
- `review-packets/WAVE2_LANGUAGE_REVIEW.md`
- `review-packets/WAVE2_MATH_REVIEW.md`
- `review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`
- `review-packets/HUMAN_REVIEW_DECISION_V2_TEMPLATE.json`
- `STRUCTURED_PROPOSAL_GUIDE.md`

边界：F005 无自动 accept；Math 无 raw tests_* 不造 raw edge；raw relation 保持原类型；curated relation 必须绑定同一 reviewed endpoint pair；candidate prerequisite 必须无环；identity split 必须满足 Occurrence reference closure。

v1 不绑定 caseState，只用于兼容/复测。v2 保存 `sourceTaskId / title / reviewType / sourceRefs / allowedDecisions`，current case 任一变化都必须重新核对。

structured proposal 支持：content_revision、concept_split、assessment_mapping、curriculum_relation、identity_split。系统执行 proposal validation → reference closure → secondary regression。通过后只生成 candidate snapshot v2，仍 `autoApply=false / humanVerified=false`，下一门是 `curriculum_content_approval_gate`。

正式发布还需要 content approval、教材版本、权利、课标映射等全部门禁。完整字段见 `STRUCTURED_PROPOSAL_GUIDE.md`。
