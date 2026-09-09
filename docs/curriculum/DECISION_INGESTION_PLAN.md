# 真人审核决定接收流程

当前链路：
`human-review case → decision v1/v2 → ingestion → structured proposal → secondary regression → curriculum content approval gate（下一阶段）`

页面：`/knowledge-map/human-review`、`/knowledge-map/human-review/ingest`、`/knowledge-map/human-review/current`、`/knowledge-map/human-review/proposal`。

已完成：v1 兼容接收、v2 current-case 绑定、五类 structured proposal、字段/source/reference closure/raw provenance/relation endpoint pair/prerequisite cycle/Occurrence closure 回归。所有 candidate 均 `autoApply=false / humanVerified=false`。

下一阶段：独立 curriculum content approval gate，绑定 candidate snapshot v2、审核对象版本、证据、reviewer identity/public key；内容变化后旧 approval 失效。真实签名只来自线下核验 reviewer，仓库不保存私钥。

只有 content、standards、textbook-version、rights 等门禁全部满足才允许正式发布。
