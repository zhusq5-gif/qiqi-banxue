# Tasks

## 已完成基础能力

- [x] `/knowledge-map`：459 条语英种子数据、20 册教材卡、教材/知识/关系三视图
- [x] `/knowledge-map/review`：7 条已知问题的 draft-only 修订工作台
- [x] `/knowledge-map/verification`：16 个必核年级单元 + item-level verification ledger；当前使用 Wave 2 workspace
- [x] `/knowledge-map/human-review`：真人审核 case、核对清单、本地草稿与 unsigned decision v1
- [x] `/knowledge-map/human-review/ingest`：v1 decision ingestion、当前 case/evidence 校验、二次回归与 candidate snapshot
- [x] `/knowledge-map/human-review/current`：当前 case 绑定 decision v2、caseState 对比与 v2 ingestion
- [x] `/knowledge-map/human-review/proposal`：structured proposal validation + reference closure + secondary regression
- [x] 2022 课标证据层：语/英/数 3 份标准文档元数据、语英 26 条证据、60 条 candidate mapping
- [x] Ed25519 外部签名 + SHA-256 内容绑定 + CI 验签门禁；真实 reviewer 仍为 0
- [x] K12-KGraph 数学 raw 图谱、跨年级 progression view 与 Math/Curriculum 规范化层
- [x] `React.lazy` 路由级拆包，课程数据/审核页不进入主应用首屏

## 逐科 / 逐年级 / 逐知识点核对门禁

- [x] 16 个必核年级：语文 G1–G6、英语 G3–G6、数学 G1–G6
- [x] 语文/英语 459 条节点全部进入 item-level verification ledger
- [x] 数学按 `KnowledgeNode × grade Occurrence` 进入逐条台账；同一知识多年级出现时保留一个 KnowledgeNode、多条 Occurrence
- [x] 固定流程：coverage → source/structure → content/relation review → repair → recheck → human review → decision ingestion → structured proposal / regression → approval gate
- [x] machine-screened / candidate patch / recheck_pending / audit_findings / unsigned_human_review / candidate snapshot / verified 严格分离
- [x] coverage、repair/recheck、数学 blocking audit、人审或正式签名任一未满足时，正式发布继续阻断

## 当前数据基线

### 语文 / 英语

- [x] 459 条种子：语文 299 / 英语 160
- [x] 20 册教材卡、142 个单元/复习分组
- [x] 7 条已登记问题、29 对 `similar_label_candidate`
- [ ] 教材版次/ISBN/出版社证据仍需逐册核验；未知状态不得自动标为当前最新版

### 数学研究样板

- [x] K12-KGraph raw：**131 nodes / 199 edges**
- [x] 17 Chapter / 61 Concept / 22 Skill / 31 Exercise
- [x] normalized：**83 provisional KnowledgeNode / 31 AssessmentTask**
- [x] Math G1–G6 当前样板均至少有本年级自身 Occurrence；这不代表全量数学覆盖
- [x] raw ID、edge type、sourceLocator、CC BY-NC-SA 4.0、commercialUse=false、provenance 全部保留
- [x] `research_sequence` 仅用于课程浏览，不生成 synthetic prerequisite

## Repair / Recheck

- [x] 7 条问题全部有 `CurriculumRepairTask` + review-only `candidate_patch`，均 `autoApply=false`
- [x] 修订草稿 v2 支持名称、学习要求、题型
- [x] `curriculumRepairRecheck.ts`：预定义字段范围之外的修改 → `manual_review_required`
- [x] `accept_candidate` 必须重新通过 repair recheck 才能产生候选快照
- [x] F001–F004 candidate patch → `recheck_pending`
- [x] F005 → `manual_review_required`
- [x] F006 仅移除异常 `口算` → `recheck_pending`
- [x] F007 仅修 `回。答 → 回答` → `recheck_pending`

## 真人核对与 decision ingestion

### Human review handoff

- [x] 7 条内容问题 + Math Wave 2 audit task 自动生成 human-review case
- [x] 每个 case 必须有 subject / grade / wave / sourceRefs / checklist / allowedDecisions / `autoApply=false`
- [x] `docs/curriculum/HUMAN_REVIEW_GUIDE.md`
- [x] `WAVE1_CHINESE_REVIEW.md`、`WAVE2_LANGUAGE_REVIEW.md`、`WAVE2_MATH_REVIEW.md`
- [x] v1/v2 decision JSON 模板
- [x] `docs/curriculum/STRUCTURED_PROPOSAL_GUIDE.md`

### Decision v1

- [x] `qiqi-curriculum-human-review-decision/v1`
- [x] ingestion 校验 case、allowedDecisions、reviewer、rationale、evidenceRefs、reviewedAt 与安全状态
- [x] 至少一条 evidenceRefs 必须精确命中当前 case sourceRefs
- [x] v1 candidate 固定 `formalApprovalEligible=false / humanVerified=false / autoApply=false`

### Decision v2

- [x] `qiqi-curriculum-human-review-decision/v2` 保存 `sourceTaskId / title / reviewType / sourceRefs / allowedDecisions`
- [x] v2 ingestion 逐字段比对当前 caseState
- [x] 任一 caseState 变化 → `CURRENT_CASE_STATE_MISMATCH`，旧 decision 不能继续
- [x] 当前 case 匹配 + 二次回归通过 → candidate snapshot v2；仍 `humanVerified=false / autoApply=false`

## Structured Proposal — 已完成

### 数据契约

- [x] `content_revision`：承接 `revise_candidate / rename_and_reframe`
- [x] `concept_split`：承接 F005 `split_nodes`
- [x] `assessment_mapping`：承接 `propose_curated_mapping`
- [x] `curriculum_relation`：承接 `propose_curriculum_relation`
- [x] `identity_split`：承接 `split_identity_candidate`
- [x] 所有 proposal 为 `qiqi-curriculum-human-review-structured-proposal/v1`，均 `autoApply=false`

### Proposal validation

- [x] proposal 必须绑定当前有效 decision v2 与当前 case
- [x] proposal.kind 必须与人工 decision 匹配
- [x] evidence 必须引用当前 case
- [x] F005 split 只能作用于 F005 源节点
- [x] Assessment mapping 只能作用于当前审核 case 的同一 Exercise
- [x] Curriculum relation 必须引用当前 relation case 的 raw evidence
- [x] Identity split 只能作用于当前 occurrence-reuse case 的 source KnowledgeNode
- [x] Identity split source 少于 2 个可定位 Occurrence 时拒绝

### Secondary regression / reference closure

- [x] `content_revision`：source identity 不变、seed immutable、生成 before/after candidate
- [x] `concept_split`：candidate ID 唯一、Occurrence 继承、redirect plan 完整；原节点不删除
- [x] `assessment_mapping`：Assessment/target 存在，`qiqi_curated_review` provenance，raw edge immutable
- [x] `curriculum_relation`：端点存在、raw relation 不覆盖、supporting raw relation 与候选必须是同一对 KnowledgeNode
- [x] `prerequisite_for` candidate 执行有向图 cycle check；算法用纯合成图单测，不向真实课程样本造边
- [x] `identity_split`：所有 source Occurrence 必须完整且唯一重分配，reference closure 通过
- [x] regression 通过才生成 `qiqi-curriculum-structured-candidate-snapshot/v2`
- [x] candidate snapshot v2 固定 `autoApply=false / humanVerified=false / readyForApprovalGate=true`
- [x] next gate 为 `curriculum_content_approval_gate`；这不等于正式批准/发布

## Math Wave 2 关键审计

- [x] `math_4a_rjb_exe8`：完整 raw source 有 `tests_concept → math_2a_rjb_cpt12（直角）`；判定 excerpt 漏边并补回
- [x] `math_4a_rjb_exe20`：已检查 G4 `tests_*` 区段 `math.json L65769-L66025`，exe19 后进入 exe26，未找到 exe20 tests 记录
- [x] exe20 状态 `source_unlinked_in_grade_tests_block`，保持未映射；不得制造 synthetic raw edge
- [x] 真人若提出 exe20 映射，只能走 `assessment_mapping + qiqi_curated_review`
- [x] G5 折线统计图 → G4 条形统计图保留 raw `relates_to`，不自动改 prerequisite
- [x] G2 `角` 在 G4 复用只进入 occurrence review
- [ ] Math G4/G5 真人逐条确认 assessment / cross-grade relation / occurrence reuse

## Wave 1 / Wave 2 真人任务

- [ ] F001–F004 按 `WAVE1_CHINESE_REVIEW.md` 完成真人 decision v2
- [ ] F005–F007 按 `WAVE2_LANGUAGE_REVIEW.md` 完成真人 decision v2
- [ ] Math G4/G5 按 `WAVE2_MATH_REVIEW.md` 完成真人 decision v2
- [ ] 需要结构变化的真人决定继续提交 structured proposal，并通过 secondary regression
- [ ] 当前真实 `humanVerified = 0`，不得伪造真人完成状态

## Wave 3 — 下一数据/教研波次

- [ ] 语文 G3/G5/G6：内容、课标证据、跨年级关系逐条复核
- [ ] 英语 G5：内容、交际功能、语言知识、课标证据逐条复核
- [ ] 数学 G1/G2/G6：来源、概念/技能、测评、跨年级关系逐条复核
- [ ] Wave 1–3 所有人审结果完成 v2 ingestion + structured regression 后，才进入正式内容审批/签名阶段

## 下一工程阶段

- [ ] 建立独立的 **curriculum content approval gate**，与 standards mapping gate 分离
- [ ] content approval package 必须绑定 candidate snapshot v2、内容摘要、reviewer identity/public key、审核版本与证据
- [ ] 内容变化后旧 approval 必须失效
- [ ] 首个真实签名必须来自线下核验的真实学科 reviewer；仓库不保存私钥
- [ ] 只有 content/standards/textbook-version/rights 等全部门禁满足时才允许正式发布
- [ ] normalized Math 接入统一三科 Curriculum 数据出口与离线 HTML
- [ ] 获取数学 2022 课标具体条款证据并接入 candidate_review → signed approval
- [ ] 移动真机 / EdgeOne 部署验证
- [ ] 主应用约 948 KB chunk 继续拆分
- [ ] npm audit 9 个依赖问题做非破坏性升级评估；禁止 `--force`

## 验收标准

1. `npm run build` 与完整 Vitest 通过；当前最新功能 HEAD 为 **21 files / 117 tests passed**。
2. 16 个必核年级不能因缺数据而删除。
3. 459 条语英节点和全部 normalized Math Occurrence 必须进入对应逐条台账。
4. 所有当前内容问题/Math audit task 必须有 exactly one human-review case。
5. human decision 必须有 reviewer、rationale、evidenceRefs；保持 unsigned/non-autoApply。
6. v1 不得进入正式审批；v2 必须匹配当前 caseState。
7. structured proposal 必须匹配当前 decision/case/evidence/端点。
8. content revision 不得越过 issue 允许字段范围。
9. concept split 必须有 redirect/Occurrence 计划，原节点不静默删除。
10. Assessment curated mapping 不得污染 K12-KGraph raw edge provenance。
11. Curriculum relation evidence 不得跨无关 KnowledgeNode pair 复用。
12. candidate prerequisite 必须通过 cycle check。
13. identity split 必须满足 Occurrence reference closure。
14. 当前数学 raw 基线保持 **131 nodes / 199 edges**；normalized **83 KnowledgeNode / 31 AssessmentTask**。
15. standards mapping 在可信 reviewer 签名前保持 candidate_review；仓库不保存审核者私钥。
16. 所有研究/核对/修订/真人审核/ingestion/proposal 页面不得修改儿童云端数据。
