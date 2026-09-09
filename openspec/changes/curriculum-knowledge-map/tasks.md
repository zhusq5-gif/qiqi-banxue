# Tasks

## 已完成基础能力

- [x] `/knowledge-map`：459 条语英种子数据、20 册教材卡、教材/知识/关系三视图
- [x] `/knowledge-map/review`：7 条已知问题的 draft-only 修订工作台
- [x] 2022 课标证据层：语文/英语/数学 3 份标准文档元数据、语英 26 条证据、60 条 candidate mapping
- [x] Ed25519 外部签名 + SHA-256 内容绑定 + CI 验签门禁；真实 reviewer 仍为 0
- [x] K12-KGraph 数学 raw 图谱、跨年级 progression view 与 Math/Curriculum 规范化层
- [x] `React.lazy` 路由级拆包，课程数据不进入主应用首屏

## 强制任务：逐科、逐年级、逐知识点核对

### 核对矩阵与发布门禁

- [x] 建立 16 个必核年级单元：语文 1–6、英语 3–6、数学 1–6
- [x] `/knowledge-map/verification` 按学科/Wave 浏览年级状态与逐条台账；当前路由使用 Wave 2 workspace
- [x] 语文/英语 459 条现有节点全部进入 item-level verification ledger
- [x] 数学按 `KnowledgeNode × grade Occurrence` 进入逐条台账；同一知识多年级出现时保留一个 KnowledgeNode、多条 Occurrence
- [x] 固定流程：覆盖检查 → 自动来源/结构检查 → 内容修补 → 修补后复测 → 真人学科复核
- [x] 机器通过、candidate patch、recheck_pending、audit_findings 与 human verified 明确分离
- [x] 发布门禁同时检查 coverage、repair/recheck、数学阻断型 audit task 与 human verified

### 数学二年级覆盖缺口已闭环

- [x] 自动发现数学 G2 缺少本年级 Occurrence，曾生成 `coverage:math:2`
- [x] 未使用“二年级概念被四年级复用”冒充二年级覆盖
- [x] 从 K12-KGraph `math.json` 补入二上 `math_2a_rjb_ch1（长度单位）` 的本年级 raw 证据
- [x] 新增 4 Concept、2 Skill、2 Exercise、1 Chapter 与 19 条 raw edge
- [x] normalized 后产生 G2 **6 条本年级 Occurrence + 2 个 AssessmentTask**
- [x] 当前研究样板 Math G1–G6 均至少存在一个本年级自身 Occurrence；`coverageGapCount = 0`
- [ ] `coverageGapCount=0` 不作为数学全量知识覆盖声明；继续扩大各年级覆盖深度

### 当前数学数据基线

- [x] raw：**131 nodes / 199 edges**
- [x] raw 类型：17 Chapter / 61 Concept / 22 Skill / 31 Exercise
- [x] normalized：**83 provisional KnowledgeNode / 31 AssessmentTask**
- [x] 所有 normalized 实体保留 raw ID、sourceLocator、CC BY-NC-SA 4.0、commercialUse=false、provenance
- [x] `research_sequence` 仅用于课程浏览，不生成 synthetic prerequisite
- [x] K12-Bench `benchmark_prerequisite` 与 K12-KGraph raw edge provenance 持续分离

## Repair / Recheck 基础设施

- [x] 7 条已知问题全部进入 `CurriculumRepairTask`，`autoApply=false`
- [x] 7 条问题全部有 review-only `candidate_patch`
- [x] 修订草稿 v2 支持名称、学习要求、题型；兼容旧本地草稿
- [x] `curriculumRepairRecheck.ts`：只有预定义字段变化才能进入 `recheck_pending`
- [x] 超范围变化 → `manual_review_required`；`no_change` 不能绕过生命周期
- [x] `/knowledge-map/review` 可导出 `qiqi-curriculum-repair-recheck/v1`，下一关固定为 `human_subject_review`

## Wave 1 — 机器首筛与候选修补已执行

- [x] 语文 G1：逐条首筛；F001/F002 candidate patch → `recheck_pending`
- [x] 语文 G2：逐条首筛；F003/F004 candidate patch → `recheck_pending`
- [x] 英语 G3：来源/年级/结构逐条首筛
- [x] 数学 G3：Occurrence / 来源 / Assessment 端点 / 年级绑定首筛
- [ ] F001–F004 真人学科语义核对与最终确认
- [ ] 真人确认后执行二次回归；未经确认不写回正式种子

## Wave 2 — 已执行机器审计，进入人工核对/源数据修补

### 语文 / 英语

- [x] 语文 G4 进入 Wave 2；F005 已执行候选复测判定
- [x] F005 因“长话短说/概括”与句法“缩句”概念边界含混，系统保持 `manual_review_required`，不自动拆分/改名
- [x] 英语 G4 进入 Wave 2；F006 仅移除异常题型 `口算`，候选 → `recheck_pending`
- [x] 英语 G6 进入 Wave 2；F007 仅修 `回。答 → 回答`，候选 → `recheck_pending`
- [ ] 语文 G4 全年级知识点语义核对；真人确定 F005 是否拆分
- [ ] 英语 G4 全年级语言知识/交际功能/教材适配核对；真人确认 F006
- [ ] 英语 G6 全年级语言知识/交际功能/教材适配核对；真人确认 F007

### 数学 G4 / G5 专项审计

- [x] 新增 `mathGradeAudit.ts`：按年级检查 Assessment 绑定、跨年级 semantic relation、低年级知识复用、未来年级来源与 relation evidence
- [x] `blocking` 与 `review` 分离：数据绑定/证据缺口才阻断；已有 raw evidence 的跨年级关系只进入人工 review
- [x] G4/G5 relation evidence 缺失数 = 0；future-origin occurrence = 0
- [x] 保留 `fine-v3-e67` 为 raw `relates_to`（G5 折线统计图 → G4 条形统计图），不转换为 prerequisite
- [x] G4 识别 `math_2a_rjb_cpt9（角）` 在四上“角的度量”复用，记录为 occurrence review，不合成 prerequisite
- [x] 自动发现 G4 excerpt 中 `math_4a_rjb_exe8`、`math_4a_rjb_exe20` 一度均无知识目标
- [x] 新增 `math-wave2-source-audit-v01.json`：**excerpt 缺边必须先回查完整 raw source，不能直接判源数据缺失**
- [x] 回查确认 `math_4a_rjb_exe8` 在完整 raw source 有 `tests_concept → math_2a_rjb_cpt12（直角）`（`math.json L65814-L65822`）
- [x] 新增 `math-fine-wave2-repair-v04.json`，补入 `math_2a_rjb_cpt12` 与 `fine-v4-wave2-e01`；该假阳性 blocker 自动消失
- [x] `math_4a_rjb_exe20` 完整 raw 回查当前只确认 `appears_in`；G4 tests 区段从 exe19 跳到 exe26，未定位到 `tests_concept/tests_skill`
- [x] `exe20` 现标记为 `source_unlinked_assessment_candidate`，保持 **1 条 blocking task**，严禁依据题意自动造边
- [ ] 继续核对 `exe20` 的源数据/教材意图；只有找到 raw 证据才补边，否则保持明确未映射/待教研状态
- [ ] G4 跨年级关系与低年级知识复用逐条真人确认
- [ ] G5 跨年级关系、可能性/折线统计图/分数意义等逐条真人确认

## Wave 3 — 全面收口

- [ ] 语文 G3/G5/G6：内容、课标证据、跨年级关系逐条复核
- [ ] 英语 G5：内容、交际功能、语言知识、课标证据逐条复核
- [ ] 数学 G1/G2/G6：来源、概念/技能、测评、跨年级关系逐条复核
- [ ] Wave 1–3 所有修补项完成二次回归后才进入真人最终审核

## 每个年级强制核对项

- [ ] 本年级覆盖完整性（不得由其他年级复用替代）
- [ ] 来源文件 / JSON Pointer / raw sourceLocator 完整
- [ ] 学科、年级、册次归属正确
- [ ] 知识名称与学习要求一致
- [ ] 题型与学科适配
- [ ] 重复、近义、拆分/合并候选复核
- [ ] AssessmentTask 必须区分：已绑定 / excerpt 漏边 / 源数据未绑定候选 / 悬空端点
- [ ] 跨年级关系有证据；教材顺序不得冒充 prerequisite
- [ ] 课标映射有可定位证据；无证据保持 candidate/unmapped
- [ ] 来源许可与公开分发权利状态明确
- [ ] 修补后回归测试通过
- [ ] 真人学科复核完成

## 其他后续任务

- [ ] 获取数学 2022 课标具体条款证据，并接入 candidate_review → signed approval
- [ ] 将 normalized Math 接入统一三科 Curriculum 数据出口与离线 HTML
- [ ] 继续补语文/英语具体学段目标、课程内容、学业质量证据
- [ ] 完成真实学科 reviewer 公钥登记与第一条真实签名审批
- [ ] 完成移动端真机 / EdgeOne 部署验证
- [ ] 继续拆分约 947 KB 主应用 chunk
- [ ] 对 npm audit 9 个依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 与完整 Vitest 通过；当前最新 CI 为 **15 files / 85 tests passed**。
2. 16 个必核年级单元持续存在，不能删除缺数据年级来让覆盖率变好看。
3. 459 条语英节点全部进入逐条台账；每条 normalized Math Occurrence 必须进入对应年级台账。
4. 年级 occurrence 聚合必须与 item-level 台账一致；缺少本年级自身 Occurrence 时生成 blocking coverage task。
5. 7 条问题必须同时有 repair task + candidate proposal；均不得自动写回种子。
6. candidate patch → recheck_pending 只允许预定义字段变化；超范围变化必须 manual_review_required。
7. Assessment 无目标时必须先回查完整 raw source；excerpt 漏边与源数据缺失不得混为一类。
8. 源数据没有 tests_* 证据时不得依据题意生成 synthetic assessment binding。
9. 跨年级 raw relation 必须保留原类型/evidence/sourceLocator；review 不等于正式 progression。
10. recheck_pending / audit_findings 都不等于 human verified；不能跳过真人复核。
11. 当前数学 raw 基线预期为 **131 nodes / 199 edges**；normalized 为 **83 KnowledgeNode / 31 AssessmentTask**。
12. `research_sequence` 不得转换为 `prerequisites_for`。
13. standards mapping 在可信学科审核者签名前必须保持 candidate_review。
14. 仓库不得保存审核者私钥；reviewer registry 为空时正式标准映射导出必须被 CI 阻断。
15. 所有研究/核对/修订页面不得修改儿童云端数据。
