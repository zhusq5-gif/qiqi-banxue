# UI-first 审核与 AI Discovery 增量计划

本文件对 `tasks.md` 的下一阶段优先级作增量调整；详细原则见 `docs/curriculum/UI_FIRST_AI_DISCOVERY_PLAN.md`。

## P0：UI-first 真人审核

- [x] `/knowledge-map/discovery` AI 候选审校台。
- [x] `/knowledge-map/review-center` Review Center v1。
- [x] `/knowledge-map/discovery/domains` 学科 × 年级 × 领域搜索矩阵。
- [x] `promote_to_human_review` 通过 UI 直接生成本地 `Human Review Case Draft`，不再要求手工 JSON 中转。
- [x] `/knowledge-map/human-review/ai` 展示 AI 候选真人精审队列。
- [x] JSON/Markdown 降级为审计副本和外部交换格式。
- [ ] 将 AI case draft 激活为统一 current HumanReviewCase，并重新比对 candidateState/evidence。
- [ ] 为新增知识定义 `new_knowledge_candidate` structured proposal。
- [ ] structured proposal 改为可视化表单，不要求教研人员编写 JSON。
- [ ] Review Center 增加审核进度、上一条/下一条、快捷键、决策历史和 caseState 失效提醒。

## P0：AI 搜索扩库

- [x] Wave 01：20 条（语文7、英语5、数学8）。
- [x] Wave 02：21 条，补齐第一批学科×年级空白与浅覆盖。
- [x] Wave 03：12 条领域缺口候选——语文六任务群、数学综合与实践/主题活动与项目学习、英语当前数字资源中的听说读写/拼读活动候选。
- [x] 聚合 registry：**53 条**（语文26、英语16、数学11）。
- [x] 来源分级：`official_standard_2022` / `publisher_current_resource` / `publisher_catalog_version_unknown`。
- [x] AI candidate 固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / nextGate=human_ui_review`。
- [x] 16 个 `subject × grade` 单元均达到最低候选池启动门槛；明确这不是课程完整率。
- [x] 新增 **112 个 `subject × grade × domain/task-group` 搜索规划单元**：语文60、英语28、数学24。
- [x] domain coverage 状态分 `search_required / shallow_candidates / review_pool_ready`，并保留真实搜索空白。
- [x] 当前 GitHub Actions 基线：**26 test files / 139 tests passed**。
- [ ] 根据 domain search queue 自动生成 Wave 04 任务与候选。
- [ ] 语文优先补分学段具体课标内容，不让六任务群框架锚点冒充年级知识点。
- [ ] 英语优先补 culture / phonics / reading / writing 等领域空白，并持续区分当前资源与版次未知资源。
- [ ] 数学继续将 K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation 纳入四领域深度矩阵。

## P1：内容审批

- [ ] AI case draft 激活、真人 decision v2、new-knowledge structured proposal 与 secondary regression 完成后，才可进入独立 `curriculum_content_approval_gate`。
- [ ] Content gate 与 standards gate 分离；不得因为课标签名通过就把内容本体当成已批准。
- [ ] Approval 绑定 candidate snapshot / evidence / current version / reviewer public key；内容或证据变化后旧 approval 失效。

## 质量边界

1. AI 搜索不是专家审核。
2. 出版社目录标题推断必须降低置信度。
3. 版次未知来源不得更新 current-edition 状态。
4. 无 sourceRefs 的 AI 结果不得进入候选池。
5. AI 候选、Human Review Case Draft 均不得自动写入 seed/raw/curated master/CloudBase。
6. `candidate_review_ready` 和 `review_pool_ready` 都不是知识完整性指标。
7. 任务群/领域锚点不等于具体年级知识点。
8. 所有候选按学科、年级和领域进入真人 UI 核对与后续发布门禁。
