# UI-first 审核与 AI Discovery 增量计划

本文件对 `tasks.md` 的下一阶段优先级作增量调整；详细原则见 `docs/curriculum/UI_FIRST_AI_DISCOVERY_PLAN.md`。

## P0：UI-first 真人审核

- [x] 新增 `/knowledge-map/discovery` AI 候选审校台。
- [x] AI 候选支持学科、年级、置信度筛选、来源查看、精确重复提示、本地草稿和 unsigned 决策导出。
- [ ] 将 `/human-review`、`/human-review/current`、`/human-review/proposal` 收敛为统一 Review Center。
- [ ] structured proposal 改为 UI 表单，不要求教研人员编写 JSON。
- [ ] 增加审核进度、下一条、快捷键、决策历史、caseState 失效提醒。
- [ ] Markdown/JSON 只作为导出、审计和外部交换格式；正常审核通过 UI 完成。

## P0：AI 搜索扩库

- [x] 建立 `aiDiscovery.ts` candidate-only 数据契约。
- [x] 第一批 `ai-discovery-2026-09-09-wave01`：20 条（语文7、英语5、数学8）。
- [x] 来源分级：`official_standard_2022` / `publisher_current_resource` / `publisher_catalog_version_unknown`。
- [x] AI candidate 固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / nextGate=human_ui_review`。
- [x] exact normalized label duplicate check；不把它等同于 semantic duplicate。
- [ ] 建立按 `subject × grade × source tier` 的 search batch registry。
- [ ] 自动生成 coverage-gap candidates，并进入 UI review。
- [ ] 语文 G1–G6 按课标任务群/学段要求与出版社资源持续扩库。
- [ ] 英语 G3–G6 按 unit/theme/function/phonics/reading/writing 持续扩库。
- [ ] 数学 G1–G6 按 2022 课标领域 + K12-KGraph raw Concept/Skill/Exercise 双源扩库。

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
6. 所有候选按学科和年级进入真人 UI 核对与后续发布门禁。
