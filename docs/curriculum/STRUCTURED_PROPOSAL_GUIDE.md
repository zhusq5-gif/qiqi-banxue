# Structured Proposal 状态

完整操作指南已迁移到本文件历史版本；当前实现状态如下：

- 路由：`/knowledge-map/human-review/proposal`
- 输入：current-case decision v2 + `qiqi-curriculum-human-review-structured-proposal/v1`
- 支持：content_revision、concept_split、assessment_mapping、curriculum_relation、identity_split
- 校验：current case/evidence/endpoint binding
- 回归：seed/raw immutable、redirect/reference closure、relation endpoint pair、prerequisite cycle、Occurrence closure
- 输出：`qiqi-curriculum-structured-candidate-snapshot/v2`
- 下一门：`curriculum_content_approval_gate`

候选始终 `autoApply=false / humanVerified=false`。

当前真实 reviewer decision v2 = 0，humanVerified = 0；本系统不会自行生成真人审核结论。
