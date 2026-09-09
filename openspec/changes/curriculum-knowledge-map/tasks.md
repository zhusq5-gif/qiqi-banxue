# Tasks

> 主任务计划已演进为“UI-first 真人审核 + source-qualified AI Discovery + 正式审批门禁”。详细 UI/AI 增量见 `ui-ai-plan.md`，数据/审核原则见 `docs/curriculum/UI_FIRST_AI_DISCOVERY_PLAN.md`。

## 已完成基础能力

- [x] `/knowledge-map`：459 条语英种子数据、20 册教材卡、教材/知识/关系三视图
- [x] `/knowledge-map/review`：7 条已知问题 draft-only 修订工作台
- [x] `/knowledge-map/verification`：16 个必核学科×年级单元 + item-level ledger
- [x] `/knowledge-map/review-center`：UI-first 审核中枢
- [x] `/knowledge-map/human-review`：已登记问题/数学 audit 真人核对
- [x] `/knowledge-map/human-review/current`：current-case decision v2
- [x] `/knowledge-map/human-review/proposal`：structured proposal + secondary regression
- [x] `/knowledge-map/discovery`：AI candidate UI 审校
- [x] `/knowledge-map/discovery/domains`：112 个学科×年级×领域搜索规划单元
- [x] `/knowledge-map/human-review/ai`：AI候选 UI 促进入队后的本地真人精审 case draft 队列
- [x] 2022 课标证据层与 standards mapping gate
- [x] K12-KGraph 数学 raw/normalized 研究样板

## 当前数据基线

### 语文 / 英语种子

- [x] 459 条：语文 299 / 英语 160
- [x] 20 册教材卡、142 个单元/复习分组
- [x] 7 条已登记问题、29 对 `similar_label_candidate`
- [ ] 教材版次/ISBN/出版社证据仍需逐册核验

### 数学研究样板

- [x] K12-KGraph raw：131 nodes / 199 edges
- [x] 17 Chapter / 61 Concept / 22 Skill / 31 Exercise
- [x] normalized：83 provisional KnowledgeNode / 31 AssessmentTask
- [x] Math G1–G6 当前样板均至少有一个本年级自身 Occurrence；不代表全量覆盖

### AI Discovery

- [x] Wave01：20 条
- [x] Wave02：21 条
- [x] Wave03 domain gaps：12 条
- [x] 聚合 **53 条 AI candidate**：语文26 / 英语16 / 数学11
- [x] 所有 AI candidate 固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / nextGate=human_ui_review`
- [x] 16 个学科×年级均达到最低候选池启动门槛（>=3），但该指标不是课程覆盖率
- [x] 112 个领域深度规划单元：语文60 / 英语28 / 数学24
- [x] `search_required / shallow_candidates / review_pool_ready` 保留真实领域搜索空白

## UI-first 真人审核

- [x] 正常审核以 UI 为主；Markdown/JSON 仅作备份、审计、外部交换
- [x] AI candidate 的 `promote_to_human_review` 在 UI 内直接生成绑定 candidateState + sourceRefs 的 Human Review Case Draft
- [x] 本地精审队列支持查看来源、促进入队理由、核对清单和审计副本导出
- [ ] AI Human Review Case Draft 激活为统一 current HumanReviewCase
- [ ] activation 时重新比对 current candidateState / evidence，候选变化则旧 draft 失效
- [ ] Review Center 增加连续上一条/下一条、快捷键、进度、决策历史

## Repair / Recheck / Existing Human Review

- [x] F001–F007 repair task + candidate patch，均 `autoApply=false`
- [x] F001–F004 → recheck_pending
- [x] F005 → manual_review_required
- [x] F006/F007 → recheck_pending
- [x] Math G4/G5 audit 区分 excerpt gap、source-unlinked、relation review、occurrence reuse
- [x] decision v1/v2 ingestion、caseState mismatch 拒绝、secondary regression
- [x] structured proposal 支持 content_revision / concept_split / assessment_mapping / curriculum_relation / identity_split
- [ ] F001–F007 与 Math G4/G5 等待真实教师/教研 decision；当前 `humanVerified=0`

## 下一工程阶段 P0

### AI Case Activation + New Knowledge Proposal

- [ ] 定义 AI case activation record：绑定 case draft、current candidateState、reviewer、evidence、decision
- [ ] activation 只能由 UI 完成；旧/变更 candidateState 必须拒绝
- [ ] 新增 `new_knowledge_candidate` structured proposal，承接被真人接受的 AI 新知识候选
- [ ] 新知识 proposal 必须有 subject / grade scope / canonical label / definition or learning demand / source evidence / duplicate analysis / provenance
- [ ] new knowledge proposal 通过 reference closure 与 duplicate/relation checks 后才生成 candidate snapshot
- [ ] 不得直接修改 seed/raw/CloudBase

### AI Wave04 — 领域深度

- [ ] 根据 `aiDiscoveryDomainSearchQueue` 自动排优先级
- [ ] 语文：补六任务群的分学段具体证据，避免框架锚点冒充具体年级知识
- [ ] 英语：优先补 culture / phonics / language knowledge / reading / writing 空白
- [ ] 数学：四领域结合 K12-KGraph raw Concept/Skill/Exercise/Assessment/Relation 深化
- [ ] 每批候选继续进入 UI 人审，不直接进入 curated master

## 下一工程阶段 P1

### Curriculum Content Approval Gate

- [ ] 与 standards mapping gate 分离
- [ ] 绑定 candidate snapshot / current version / evidence / reviewer identity/public key
- [ ] 内容或证据变化后旧 approval 失效
- [ ] 真实签名只来自线下核验 reviewer；仓库不保存私钥
- [ ] content / standards / textbook-version / rights 全部满足后才允许正式发布

### Unified Curriculum Export

- [ ] normalized Math 接入统一三科 Curriculum
- [ ] 人审后的 AI candidate 使用同一 candidate ChangeSet/release 模型
- [ ] 离线 HTML 明确 research/reviewed scope

## Wave 3 真人内容核对

- [ ] 语文 G3/G5/G6：内容、课标证据、跨年级关系逐条复核
- [ ] 英语 G5：语言知识、交际功能、听说读写、文化逐条复核
- [ ] 数学 G1/G2/G6：来源、概念/技能、测评、关系逐条复核

## 工程治理

- [ ] 移动端真机 / EdgeOne
- [ ] 主包约 949 KB 继续拆分
- [ ] npm audit 9 个依赖问题做非破坏性升级评估；禁止 `--force`
- [ ] 10k 节点性能测试

## 最新验收基线

1. 当前功能 HEAD：Node 24 / `npm ci` / TypeScript / Vite 全通过。
2. **26 test files / 139 tests passed**。
3. Ed25519 self-test 与 tamper rejection 通过。
4. standards gate 仍看到 60 条 candidate mapping，真实 reviewer=0，正式导出按设计 blocked。
5. 53 条 AI candidate 不能自动写入正式库。
6. 112 个领域矩阵单元只是 AI 搜索规划，不是课程完整率。
7. AI Human Review Case Draft 仍 `autoApply=false / humanVerified=false`。
8. 当前真实 `humanVerified=0`，不得伪造真人审核完成状态。
