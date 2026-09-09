# Tasks

## 已完成基础能力

- [x] `/knowledge-map`：459 条语英种子数据、20 册教材卡、教材/知识/关系三视图
- [x] `/knowledge-map/review`：7 条已知问题的 draft-only 修订工作台
- [x] `/knowledge-map/verification`：16 个必核年级单元 + item-level verification ledger；当前使用 Wave 2 workspace
- [x] `/knowledge-map/human-review`：真人审核 case、核对清单、本地草稿与 unsigned decision v1 导出
- [x] `/knowledge-map/human-review/ingest`：v1 decision ingestion、当前 case/evidence 校验、二次回归与 candidate snapshot
- [x] `/knowledge-map/human-review/current`：当前 case 绑定 decision v2、caseState 对比与 v2 ingestion
- [x] 2022 课标证据层：语/英/数 3 份标准文档元数据、语英 26 条证据、60 条 candidate mapping
- [x] Ed25519 外部签名 + SHA-256 内容绑定 + CI 验签门禁；真实 reviewer 仍为 0
- [x] K12-KGraph 数学 raw 图谱、跨年级 progression view 与 Math/Curriculum 规范化层
- [x] `React.lazy` 路由级拆包，课程数据/审核页不进入主应用首屏

## 强制任务：逐科、逐年级、逐知识点核对

### 核对矩阵与发布门禁

- [x] 16 个必核年级：语文 G1–G6、英语 G3–G6、数学 G1–G6
- [x] 语文/英语 459 条现有节点全部进入 item-level verification ledger
- [x] 数学按 `KnowledgeNode × grade Occurrence` 进入逐条台账；同一知识多年级出现时保留一个 KnowledgeNode、多条 Occurrence
- [x] 固定流程：覆盖检查 → 自动来源/结构检查 → 内容/关系核对 → 修补 → recheck → 真人学科核对 → decision ingestion → 二次回归 → 后续正式门禁
- [x] machine-screened / candidate patch / recheck_pending / audit_findings / unsigned_human_review / candidate snapshot / human verified 明确分离
- [x] 任一 coverage、repair/recheck、数学 blocking audit、人审或正式签名未满足时，正式发布保持阻断

### 当前数学基线

- [x] raw：**131 nodes / 199 edges**
- [x] raw 类型：17 Chapter / 61 Concept / 22 Skill / 31 Exercise
- [x] normalized：**83 provisional KnowledgeNode / 31 AssessmentTask**
- [x] Math G1–G6 当前研究样板均至少有一个本年级自身 Occurrence；这不代表全量数学覆盖
- [x] raw ID、edge type、sourceLocator、CC BY-NC-SA 4.0、commercialUse=false、provenance 全部保留
- [x] `research_sequence` 仅用于课程浏览，不生成 synthetic prerequisite

## Repair / Recheck 基础设施

- [x] 7 条已知问题全部有 `CurriculumRepairTask` + review-only `candidate_patch`，全部 `autoApply=false`
- [x] 修订草稿 v2 支持名称、学习要求、题型；兼容旧草稿
- [x] `curriculumRepairRecheck.ts`：只有预定义字段变化才能进入 `recheck_pending`
- [x] 超范围变化 → `manual_review_required`；`no_change` 不能绕过生命周期
- [x] `/knowledge-map/review` 可导出 `qiqi-curriculum-repair-recheck/v1`

## 真人核对与 decision ingestion

### Human review handoff

- [x] `humanReview.ts`：从 7 条内容问题和当前 Math Wave 2 audit task 自动生成真人审核 case
- [x] 每个 case 必须有 subject / grade / wave / sourceRefs / checklist / allowedDecisions / `autoApply=false`
- [x] `qiqi-curriculum-human-review-decision/v1`：人工输出固定为 `unsigned_human_review`、`humanVerified=false`
- [x] `/knowledge-map/human-review`：按学科/Wave 筛选 case，填写审核人、角色、理由、实际证据并导出 unsigned JSON
- [x] `docs/curriculum/HUMAN_REVIEW_GUIDE.md` + Wave1/Wave2 审核包 + v1/v2 decision 模板
- [x] F005 只允许 split/rename-and-reframe/retain/defer，不提供自动接受改名
- [x] Math Assessment 无 raw tests_* 时只允许 keep_unmapped / needs_source_evidence / propose_curated_mapping / defer；不能直接创建 raw edge
- [x] Math cross-grade relation review 不得把 raw `relates_to` 自动改为 prerequisite/progression

### Decision ingestion v1

- [x] 新增 `humanReviewIngestion.ts`
- [x] v1 导入校验：case 存在、decision 仍允许、reviewer/rationale/evidenceRefs 有效、至少一条证据与当前 case sourceRefs 完全一致
- [x] v1 导入始终保持 `autoApply=false`，不会改 seed/CloudBase
- [x] `accept_candidate` 会重新运行 `curriculumRepairRecheck`；只有当前候选仍是 `recheck_pending` 才生成 content candidate snapshot
- [x] F005 split/rename、curated mapping、Curriculum relation、identity split 等必须进入 `structured_proposal_required`，不会凭一个 decision 字段自动生成结构化数据
- [x] `needs_source_evidence` / `defer` 不生成 candidate snapshot
- [x] v1 candidate snapshot 固定 `formalApprovalEligible=false`，因为 v1 未绑定 caseState

### Current-case decision v2

- [x] 新增 `humanReviewDecisionV2.ts`：decision v2 直接嵌入审核时的 `sourceTaskId / title / reviewType / sourceRefs / allowedDecisions`
- [x] 新增 `humanReviewIngestionV2.ts`：逐字段对比 decision.caseState 与当前 caseState
- [x] caseState 任一变化 → `CURRENT_CASE_STATE_MISMATCH`，必须重新核对，旧 decision 不得继续
- [x] caseState 一致 + 基础 ingestion 通过 + 二次回归通过 → candidate snapshot v2
- [x] v2 candidate snapshot 可标 `formalApprovalEligible=true` / `readyForApprovalGate=true`，但仍 `humanVerified=false`、`autoApply=false`
- [x] `/knowledge-map/human-review/current`：选择当前 case、填写真人决定、生成 v2 JSON并即时运行 v2 ingestion
- [x] `HUMAN_REVIEW_DECISION_V2_TEMPLATE.json` 可用于外部审校系统对接

## Wave 1 — 已完成机器首筛，等待真人核对

- [x] 语文 G1：F001/F002 candidate patch → `recheck_pending`
- [x] 语文 G2：F003/F004 candidate patch → `recheck_pending`
- [x] 英语 G3：来源/年级/结构逐条首筛
- [x] 数学 G3：Occurrence / 来源 / Assessment 端点 / 年级绑定首筛
- [ ] F001–F004 按 `WAVE1_CHINESE_REVIEW.md` 完成真人学科核对
- [ ] 真人 decision v2 ingestion 后执行二次回归；未经确认不写回正式种子

## Wave 2 — 已完成机器审计，等待真人核对/局部数据治理

### 语文 / 英语

- [x] F005：`记叙文长话短说（缩句）` → `manual_review_required`，不自动拆分/改名
- [x] F006：只删除异常题型 `口算` → `recheck_pending`
- [x] F007：只修 `回。答 → 回答` → `recheck_pending`
- [ ] F005–F007 按 `WAVE2_LANGUAGE_REVIEW.md` 完成人工 decision v2
- [ ] 语文 G4、英语 G4/G6 继续逐知识点语义/教材适配核对

### 数学 G4 / G5

- [x] `mathGradeAudit.ts`：检查 Assessment 绑定、跨年级 semantic relation、低年级知识复用、future-origin occurrence、relation evidence
- [x] `blocking` 与 `review` 分离：数据绑定/证据缺口阻断；有 raw evidence 的教学语义关系进入 review
- [x] G4/G5 relation evidence 缺失 = 0；future-origin occurrence = 0
- [x] `fine-v3-e67` 保持 raw `relates_to`（G5 折线统计图 → G4 条形统计图），不自动转换为 prerequisite
- [x] G2 `角` 在 G4“角的度量”复用只记录 occurrence review
- [x] `math_4a_rjb_exe8` 回查确认 raw `tests_concept → math_2a_rjb_cpt12（直角）`，判定 excerpt 漏边并补回，假阳性 blocker 消失
- [x] `math_4a_rjb_exe20` 已检查四上连续 `tests_*` 区段 `math.json L65769-L66025`；记录从 exe19 跳到 exe26，未发现 exe20 tests 记录
- [x] `exe20` 状态收紧为 `source_unlinked_in_grade_tests_block`；保持明确未映射，不生成 synthetic raw edge
- [ ] `exe20` 真人可选择 keep_unmapped / needs_source_evidence / propose_curated_mapping / defer；curated proposal 不改写 K12-KGraph raw edge
- [ ] Math G4/G5 按 `WAVE2_MATH_REVIEW.md` 逐条确认 cross-grade relation 与 occurrence reuse

## Wave 3 — 全面收口

- [ ] 语文 G3/G5/G6：内容、课标证据、跨年级关系逐条复核
- [ ] 英语 G5：内容、交际功能、语言知识、课标证据逐条复核
- [ ] 数学 G1/G2/G6：来源、概念/技能、测评、跨年级关系逐条复核
- [ ] Wave 1–3 所有人审结果完成 v2 ingestion + 二次回归后，才进入正式 reviewer 签名/发布阶段

## 下一阶段：structured proposal ingestion

- [ ] 为 `revise_candidate` 定义结构化内容 patch payload，并重跑字段范围/seed mutation 检查
- [ ] 为 F005 `split_nodes / rename_and_reframe` 定义 ChangeSet 草案：拆分目标、旧 ID redirect、Occurrence 迁移、证据与回滚信息
- [ ] 为 `propose_curated_mapping` 定义 Assessment → KnowledgeNode curated mapping schema；必须与 raw edge provenance 分离
- [ ] 为 `propose_curriculum_relation` 定义 Curriculum relation proposal schema；必须保留 raw relation/evidence 且不能覆写原始关系类型
- [ ] 为 `split_identity_candidate` 定义 KnowledgeNode split proposal + occurrence reassignment schema
- [ ] 所有 structured proposal 必须生成 candidate snapshot v2、通过 reference closure 与二次回归后才能进入内容审批门禁
- [ ] 内容层正式签名门禁必须继续与 standards mapping gate 分离，仓库不保存审核者私钥

## 每个年级强制核对项

- [ ] 本年级覆盖完整性（不得由其他年级复用替代）
- [ ] 来源文件 / JSON Pointer / raw sourceLocator 完整
- [ ] 学科、年级、册次归属正确
- [ ] 知识名称与学习要求一致
- [ ] 题型与学科适配
- [ ] 重复、近义、拆分/合并候选复核
- [ ] AssessmentTask 区分：已绑定 / excerpt 漏边 / raw 未绑定 / 悬空端点
- [ ] 跨年级关系有 evidence；教材顺序不得冒充 prerequisite
- [ ] 课标映射有可定位证据；无证据保持 candidate/unmapped
- [ ] 来源许可与公开分发权利状态明确
- [ ] 人工 decision 有审核人、角色、理由、实际 evidenceRefs
- [ ] 修补/映射后回归测试通过
- [ ] 正式真人签名门禁完成后方可标记 verified

## 其他后续任务

- [ ] 获取数学 2022 课标具体条款证据，并接入 candidate_review → signed approval
- [ ] 将 normalized Math 接入统一三科 Curriculum 数据出口与离线 HTML
- [ ] 继续补语文/英语具体学段目标、课程内容、学业质量证据
- [ ] 完成真实学科 reviewer 公钥登记与第一条真实签名审批
- [ ] 完成移动端真机 / EdgeOne 部署验证
- [ ] 继续拆分约 948 KB 主应用 chunk
- [ ] 对 npm audit 9 个依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 与完整 Vitest 通过；当前最新 CI 为 **18 files / 101 tests passed**。
2. 16 个必核年级单元持续存在，不能删除缺数据年级来让覆盖率变好看。
3. 459 条语英节点和全部 normalized Math Occurrence 必须进入对应逐条台账。
4. 所有 7 条内容问题和 Math Wave 2 audit task 必须各有 exactly one human-review case。
5. 每个 human-review case 必须有来源、核对清单、允许决策；`autoApply=false`。
6. v1/v2 decision 都必须有 reviewer、rationale、evidenceRefs；仍 `humanVerified=false`。
7. v1 只能进入预览/复测 candidate snapshot，`formalApprovalEligible=false`。
8. v2 必须逐字段匹配当前 caseState；不匹配必须拒绝旧 decision。
9. `accept_candidate` 必须重新通过 `curriculumRepairRecheck` 才能产生 content snapshot。
10. structured decision 在 payload schema 未提供前必须停在 `structured_proposal_required`。
11. F005 不得提供自动 accept candidate；`exe20` 不得提供直接创建 raw edge 的决策。
12. Assessment 无目标时必须先回查完整 raw source；excerpt 漏边与 raw 未绑定不得混为一类。
13. 源数据没有 tests_* 证据时不得依据题意生成 synthetic assessment binding。
14. 跨年级 raw relation 保留原类型/evidence/sourceLocator；review 不等于正式 progression。
15. 当前数学 raw 基线保持 **131 nodes / 199 edges**；normalized **83 KnowledgeNode / 31 AssessmentTask**。
16. standards mapping 在可信学科审核者签名前保持 candidate_review；仓库不得保存审核者私钥。
17. 所有研究/核对/修订/真人审核/ingestion 页面不得修改儿童云端数据。
