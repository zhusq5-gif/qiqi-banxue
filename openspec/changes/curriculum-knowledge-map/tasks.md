# Tasks

## 已完成基础能力

- [x] `/knowledge-map`：459 条语英种子数据、20 册教材卡、教材/知识/关系三视图
- [x] `/knowledge-map/review`：7 条已知问题的 draft-only 修订工作台
- [x] `/knowledge-map/verification`：16 个必核年级单元 + item-level verification ledger；当前使用 Wave 2 workspace
- [x] `/knowledge-map/human-review`：真人审核 case、核对清单、本地草稿与 unsigned decision 导出
- [x] 2022 课标证据层：语/英/数 3 份标准文档元数据、语英 26 条证据、60 条 candidate mapping
- [x] Ed25519 外部签名 + SHA-256 内容绑定 + CI 验签门禁；真实 reviewer 仍为 0
- [x] K12-KGraph 数学 raw 图谱、跨年级 progression view 与 Math/Curriculum 规范化层
- [x] `React.lazy` 路由级拆包，课程数据/审核页不进入主应用首屏

## 强制任务：逐科、逐年级、逐知识点核对

### 核对矩阵与发布门禁

- [x] 16 个必核年级：语文 G1–G6、英语 G3–G6、数学 G1–G6
- [x] 语文/英语 459 条现有节点全部进入 item-level verification ledger
- [x] 数学按 `KnowledgeNode × grade Occurrence` 进入逐条台账；同一知识多年级出现时保留一个 KnowledgeNode、多条 Occurrence
- [x] 固定流程：覆盖检查 → 自动来源/结构检查 → 内容/关系核对 → 修补 → recheck → 真人学科核对 → 后续正式门禁
- [x] machine-screened / candidate patch / recheck_pending / audit_findings / unsigned_human_review / human verified 明确分离
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

## 真人核对交接资产

- [x] 新增 `src/content/curriculum/humanReview.ts`：从 7 条内容问题和当前 Math Wave 2 audit task 自动生成真人审核 case
- [x] 每个 case 必须有 subject / grade / wave / sourceRefs / checklist / allowedDecisions / `autoApply=false`
- [x] 新增 `qiqi-curriculum-human-review-decision/v1`，人工输出固定为 `unsigned_human_review`、`humanVerified=false`
- [x] `/knowledge-map/human-review`：按学科/Wave 筛选 case，填写审核人、角色、理由、实际证据并导出 unsigned JSON
- [x] `docs/curriculum/HUMAN_REVIEW_GUIDE.md`：统一真人核对方法
- [x] `docs/curriculum/review-packets/WAVE1_CHINESE_REVIEW.md`：F001–F004
- [x] `docs/curriculum/review-packets/WAVE2_LANGUAGE_REVIEW.md`：F005–F007
- [x] `docs/curriculum/review-packets/WAVE2_MATH_REVIEW.md`：Math G4/G5 Assessment / relation / occurrence 专项
- [x] `docs/curriculum/review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`：可填写模板
- [x] F005 只允许 split/rename-and-reframe/retain/defer，不提供自动接受改名
- [x] Math Assessment 无 raw tests_* 时只允许 keep_unmapped / needs_source_evidence / propose_curated_mapping / defer；不能直接创建 raw edge
- [x] Math cross-grade relation review 不得把 raw `relates_to` 自动改为 prerequisite/progression

## Wave 1 — 已完成机器首筛，等待真人核对

- [x] 语文 G1：F001/F002 candidate patch → `recheck_pending`
- [x] 语文 G2：F003/F004 candidate patch → `recheck_pending`
- [x] 英语 G3：来源/年级/结构逐条首筛
- [x] 数学 G3：Occurrence / 来源 / Assessment 端点 / 年级绑定首筛
- [ ] F001–F004 按 `WAVE1_CHINESE_REVIEW.md` 完成真人学科核对
- [ ] 人工 decision ingestion 后执行二次回归；未经确认不写回正式种子

## Wave 2 — 已完成机器审计，等待真人核对/局部数据治理

### 语文 / 英语

- [x] F005：`记叙文长话短说（缩句）` → `manual_review_required`，不自动拆分/改名
- [x] F006：只删除异常题型 `口算` → `recheck_pending`
- [x] F007：只修 `回。答 → 回答` → `recheck_pending`
- [ ] F005–F007 按 `WAVE2_LANGUAGE_REVIEW.md` 完成人工 decision
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
- [ ] Wave 1–3 所有人审结果完成 ingestion + 二次回归后，才进入正式 reviewer 签名/发布阶段

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

- [ ] 建立 content/math human decision ingestion + 内容层签名门禁（当前只完成 unsigned handoff）
- [ ] 获取数学 2022 课标具体条款证据，并接入 candidate_review → signed approval
- [ ] 将 normalized Math 接入统一三科 Curriculum 数据出口与离线 HTML
- [ ] 继续补语文/英语具体学段目标、课程内容、学业质量证据
- [ ] 完成真实学科 reviewer 公钥登记与第一条真实签名审批
- [ ] 完成移动端真机 / EdgeOne 部署验证
- [ ] 继续拆分约 947 KB 主应用 chunk
- [ ] 对 npm audit 9 个依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 与完整 Vitest 通过；当前最新 CI 为 **16 files / 92 tests passed**。
2. 16 个必核年级单元持续存在，不能删除缺数据年级来让覆盖率变好看。
3. 459 条语英节点和全部 normalized Math Occurrence 必须进入对应逐条台账。
4. 所有 7 条内容问题和 Math Wave 2 audit task 必须各有 exactly one human-review case。
5. 每个 human-review case 必须有来源、核对清单、允许决策；`autoApply=false`。
6. unsigned decision 必须有 reviewer name/role、rationale、evidenceRefs；仍 `humanVerified=false`。
7. F005 不得提供自动 accept candidate；`exe20` 不得提供直接创建 raw edge 的决策。
8. Assessment 无目标时必须先回查完整 raw source；excerpt 漏边与 raw 未绑定不得混为一类。
9. 源数据没有 tests_* 证据时不得依据题意生成 synthetic assessment binding。
10. 跨年级 raw relation 保留原类型/evidence/sourceLocator；review 不等于正式 progression。
11. 当前数学 raw 基线保持 **131 nodes / 199 edges**；normalized **83 KnowledgeNode / 31 AssessmentTask**。
12. standards mapping 在可信学科审核者签名前保持 candidate_review；仓库不得保存审核者私钥。
13. 所有研究/核对/修订/真人审核页面不得修改儿童云端数据。
