# UI-first 审核与 AI Discovery 增量计划

本文件对 `tasks.md` 的下一阶段优先级作增量调整；详细原则见 `docs/curriculum/UI_FIRST_AI_DISCOVERY_PLAN.md`。

## P0：UI-first 真人审核

- [x] `/knowledge-map/discovery` AI 候选审校台。
- [x] `/knowledge-map/review-center` Review Center v1。
- [x] `/knowledge-map/discovery/domains` 学科 × 年级 × 领域搜索矩阵。
- [x] `promote_to_human_review` 通过 UI 直接生成本地 `Human Review Case Draft`，不再要求手工 JSON 中转。
- [x] `/knowledge-map/human-review/ai`：case draft → current candidate 重核 → decision v2 → `new_knowledge_candidate` → secondary regression 一页完成。
- [x] AI case activation 会重新比对 candidateState/evidence；候选变化后旧 draft 不能静默继续。
- [x] `new_knowledge_candidate` 支持 canonical label、learning demand、grade scope、aliases、semantic duplicate disposition 与 possible existing IDs。
- [x] exact duplicate 直接阻断 new node；semantic duplicate 仍由真人决定 merge/revise/no-obvious-duplicate。
- [x] JSON/Markdown 降级为审计副本和外部交换格式。
- [x] `/knowledge-map/content-approval`：secondary-regression-passed snapshot 的内容审批登记准备 UI。
- [ ] Review Center v2：把导航页进一步收敛成连续单页队列/证据/决定/提案/审批准备工作流。
- [ ] 增加审核进度、上一条/下一条、快捷键、决策历史和 caseState 失效提醒。

## P0：AI 搜索扩库

- [x] Wave 01：20 条（语文7、英语5、数学8）。
- [x] Wave 02：21 条，补齐第一批学科×年级空白与浅覆盖。
- [x] Wave 03：12 条领域缺口候选——语文六任务群、数学综合与实践/主题活动与项目学习、英语听说读写/拼读活动候选。
- [x] Wave 04：8 条领域深度候选——语文分学段书写能力、英语 G3/G4 phonics/reading/writing、英语文化意识。
- [x] 聚合 registry：**61 条**（语文29、英语21、数学11）。
- [x] 来源分级：`official_standard_2022` / `publisher_current_resource` / `publisher_catalog_version_unknown`。
- [x] AI candidate 固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / nextGate=human_ui_review`。
- [x] 16 个 `subject × grade` 单元均达到最低候选池启动门槛；明确这不是课程完整率。
- [x] **112 个 `subject × grade × domain/task-group` 搜索规划单元**：语文60、英语28、数学24。
- [x] domain coverage 状态分 `search_required / shallow_candidates / review_pool_ready`，并保留真实搜索空白。
- [ ] 根据 domain search queue 自动生成 Wave 05 搜索任务与候选；优先补 `search_required`，其次 `shallow_candidates`。
- [ ] 语文继续补分学段具体阅读/表达/梳理探究证据，不让任务群框架锚点冒充年级知识点。
- [ ] 英语继续补 culture / phonics / reading / writing 的年级颗粒度，并严格区分当前资源与版次未知资源。
- [ ] 数学继续把 K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation 纳入四领域深度矩阵，并补2022课标具体条款。

## P1：独立 Curriculum Content Approval Gate

- [x] `scripts/curriculum-content-gate.mjs`：与 standards gate 完全独立的 Ed25519 内容审批门禁。
- [x] gate 自测覆盖签名有效、篡改拒绝、candidate 内容/证据变化使旧 approval digest 失效。
- [x] `config/curriculum-content-reviewers.json`：可信 content reviewer 公钥注册表；当前故意为空。
- [x] `approvals/curriculum-content-candidates.json` / `curriculum-content-approvals.json`：正式 candidate/approval 存储；当前均为空。
- [x] `register-curriculum-content-candidate.mjs`：只有 secondary-regression-passed snapshot 才可显式登记。
- [x] `sign-curriculum-content-review.mjs`：真实 reviewer 在线下本地 Ed25519 私钥签名；仓库不保存私钥。
- [x] `/knowledge-map/content-approval`：UI 检查 snapshot/evidence/datasetVersion/sourceCommit 并导出 `browser_preparation_only` registration request。
- [x] CI 同时运行 standards gate 与 content gate；当前 content gate 因 0 candidate + 0 trusted reviewer 正确 blocked。
- [ ] 使用一个真实 secondary-regression-passed candidate 做**登记演练**；可以登记候选，但不得伪造 reviewer 或签名。
- [ ] 完成首个线下核验 content reviewer 公钥登记后，再执行真实签名审批。
- [ ] whole-system release 仍需联合 standards / content / textbook-version / rights 等门禁。

## P1：统一课程出口

- [ ] normalized Math 接入统一三科 Curriculum 数据出口与离线 HTML。
- [ ] AI-approved candidate 接入同一 candidate ChangeSet / curated snapshot，而不是另建孤立正式库。
- [ ] 离线 HTML 只导出明确 scope 的 reviewed/research 数据。

## 工程/质量边界

1. AI 搜索不是专家审核；AI confidence 不是教育学正确率。
2. 出版社目录标题推断必须降低置信度；版次未知来源不得更新 current-edition 状态。
3. 无 sourceRefs 的 AI 结果不得进入候选池。
4. AI 候选、Human Review Case Draft、candidate snapshot、registration request 均不得自动写入 seed/raw/curated master/CloudBase。
5. `candidate_review_ready` 和 `review_pool_ready` 都不是知识完整性指标。
6. 任务群/领域锚点不等于具体年级知识点。
7. content gate 与 standards gate 独立；任何一个通过都不能替代另一个。
8. 浏览器不保存 reviewer 私钥、不产生正式签名。
9. 当前真实 `humanVerified=0`、trusted content reviewer=0、registered formal content candidate=0；正式发布必须继续 blocked。

## 当前自动验收基线

- Node 24 / `npm run build` ✅
- **29 test files / 151 tests passed** ✅
- AI discovery / domain coverage / promotion / activation / new-knowledge regression ✅
- content approval preparation ✅
- standards Ed25519 gate self-test + tamper rejection ✅
- independent content Ed25519 gate self-test + candidate-change invalidation ✅
- standards gate 60 mappings blocked as expected ✅
- content gate 0 candidates / 0 trusted reviewer blocked as expected ✅
