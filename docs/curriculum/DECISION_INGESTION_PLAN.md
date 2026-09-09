# 真人审核决定接收流程

当前链路：

`human-review case → decision v1/v2 → ingestion → structured proposal → secondary regression → curriculum content approval gate（下一阶段）`

页面入口：
- `/knowledge-map/human-review`
- `/knowledge-map/human-review/ingest`
- `/knowledge-map/human-review/current`
- `/knowledge-map/human-review/proposal`

已完成：
- v1 decision 兼容接收/复测；由于不绑定 caseState，只能生成非正式 candidate。
- v2 decision 保存当前 caseState；当前 case 任一关键字段变化时，旧 decision 必须重新核对。
- structured proposal 支持 content revision、concept split、Assessment curated mapping、Curriculum relation、identity split。
- secondary regression 检查字段范围、source/reference closure、raw provenance、reviewed relation endpoint pair、prerequisite cycle、Occurrence 完整重分配。
- 所有 candidate 均 `autoApply=false / humanVerified=false`。

下一阶段 `curriculum content approval gate` 必须：
- 与 standards mapping gate 分离；
- 绑定 candidate snapshot v2、审核对象版本、实际证据和 reviewer identity；
- 内容/证据变化后使旧审批失效；
- 真实签名只来自线下核验的学科 reviewer；仓库不保存私钥。

只有 content、standards、textbook-version、rights 等门禁全部满足，才允许正式发布。

强制边界：
- 旧审核 JSON 不直接进入正式发布。
- 不自动修改种子数据。
- 无原始证据不得生成 K12-KGraph raw relation。
- curated mapping/relation 与 raw provenance 必须分层。
- 二次回归通过仍不等于正式发布。
