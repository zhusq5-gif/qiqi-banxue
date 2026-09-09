# UI-first 审核与 AI Discovery 增量计划

本文件对 `tasks.md` 的下一阶段优先级作增量调整；详细原则见 `docs/curriculum/UI_FIRST_AI_DISCOVERY_PLAN.md`。

## P0：UI-first 真人审核

- [x] `/knowledge-map/discovery` AI 候选审校台。
- [x] AI 候选支持学科、年级、置信度筛选、来源查看、精确重复提示、本地草稿和 unsigned 决策导出。
- [x] `/knowledge-map/review-center` Review Center v1：统一显示 AI 候选、真人 case、年级核对、current-case 与 structured proposal 入口/计数。
- [ ] 将 `/human-review`、`/human-review/current`、`/human-review/proposal` 的核心动作进一步收敛为连续单页工作流。
- [ ] structured proposal 改为可视化表单，不要求教研人员编写 JSON。
- [ ] 增加审核进度、上一条/下一条、快捷键、决策历史、caseState 失效提醒。
- [ ] AI candidate 的 `promote_to_human_review` 在 UI 中直接创建下一阶段 case 草稿。
- [ ] Markdown/JSON 只作为导出、审计和外部交换格式；正常审核通过 UI 完成。

## P0：AI 搜索扩库

- [x] `aiDiscovery.ts` candidate-only 数据契约。
- [x] Wave 01：20 条（语文7、英语5、数学8）。
- [x] Wave 02：21 条，专门填补/加深第一批空白与浅覆盖年级。
- [x] `aiDiscoveryRegistry.ts` 聚合两批共 **41 条**（语文20、英语12、数学9）。
- [x] 来源分级：`official_standard_2022` / `publisher_current_resource` / `publisher_catalog_version_unknown`。
- [x] AI candidate 固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / nextGate=human_ui_review`。
- [x] exact normalized label duplicate check；不把它等同于 semantic duplicate。
- [x] 16 个 `subject × grade` 搜索覆盖单元；两批后均达到“至少3条候选可供UI审校”的最低门槛。
- [x] 明确 `candidate_review_ready != curriculum_complete`，AI 搜索覆盖矩阵不能作为正式课程覆盖率。
- [ ] 建立 `subject × grade × domain/task-group × source tier` 的深度 search batch registry。
- [ ] 自动生成“领域覆盖不足”AI 搜索任务，而不是继续按总节点数量优化。
- [ ] 语文 G1–G6 按识字写字/阅读鉴赏/表达交流/梳理探究/六任务群持续深化。
- [ ] 英语 G3–G6 按 phonics/语言知识/交际功能/听说/阅读/写作/文化持续深化。
- [ ] 数学 G1–G6 按四领域 + 2022课标 + K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation 持续深化。

## P1：内容审批

- [ ] AI candidate 经 UI 人审后才能创建 human-review case / decision v2。
- [ ] 需要结构变化时继续走 structured proposal + secondary regression。
- [ ] 建立独立 `curriculum_content_approval_gate`；不得复用 standards gate 假装内容已审批。

## 质量边界

1. AI 搜索不是专家审核。
2. 出版社目录标题推断必须降低置信度。
3. 版次未知来源不得更新 current-edition 状态。
4. 无 sourceRefs 的 AI 结果不得进入候选池。
5. AI 候选不得自动写入 seed/raw/curated master/CloudBase。
6. “每年级至少3条AI候选”只是最低候选池启动条件，不是知识完整性指标。
7. 所有候选按学科、年级和领域进入真人 UI 核对与后续发布门禁。
