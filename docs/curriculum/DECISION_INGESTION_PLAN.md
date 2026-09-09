# 真人审核决定接收流程

当前链路已经实现到：

`真人审核 case → decision v1/v2 → ingestion → structured proposal → secondary regression → curriculum content approval gate（下一阶段）`

页面入口：
- `/knowledge-map/human-review`
- `/knowledge-map/human-review/ingest`
- `/knowledge-map/human-review/current`
- `/knowledge-map/human-review/proposal`

已实现：
- v1 decision 兼容接收与二次复测；由于不绑定 caseState，只能生成非正式 candidate。
- v2 decision 保存当前 caseState；旧 case decision 与当前 case 不一致时必须重新核对。
- structured proposal 支持 content revision、concept split、Assessment curated mapping、Curriculum relation、identity split。
- secondary regression 检查字段范围、source/reference closure、raw provenance、relation endpoint pair、prerequisite cycle、Occurrence 完整重分配。
- 所有 candidate 均 `autoApply=false / humanVerified=false`。

下一阶段：
- 独立 curriculum content approval gate。
- 真实 reviewer 身份/公钥登记。
- 通过审批后生成可回滚 ChangeSet / curated release。
- 与 standards mapping、textbook version、rights gate 联合后才允许正式发布。

强制边界：
- 旧审核 JSON 不直接进入正式发布。
- 不自动修改种子数据。
- 无原始证据不得生成 K12-KGraph raw relation。
- curated mapping/relation 与 raw provenance 必须分层。
- 二次回归通过仍不等于正式发布。
