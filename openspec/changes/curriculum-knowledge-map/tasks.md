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
- [x] 建立 `/knowledge-map/verification`：按学科/Wave 浏览年级核对状态与逐条台账
- [x] 语文/英语 459 条现有节点全部进入 item-level verification ledger
- [x] 数学按 `KnowledgeNode × grade Occurrence` 进入逐条台账；同一知识多年级出现时保留一个 KnowledgeNode、多条 Occurrence
- [x] 每条台账保留学科、年级、知识 ID、Occurrence、来源、问题、机器状态、真人状态
- [x] 核对状态固定为：覆盖检查 → 自动来源/结构检查 → 内容修补 → 修补后复测 → 真人学科复核
- [x] 机器通过、candidate patch、recheck_pending 与 human verified 明确分离
- [x] 任一 coverage gap、repair 未复测、知识点/年级未 human verified 时，逐年级正式发布门禁保持阻断

### 自动覆盖核对：数学二年级缺口已闭环

- [x] 自动发现数学二年级缺少本年级 Occurrence，曾生成 `coverage:math:2`
- [x] 未使用“二年级概念被四年级复用”冒充二年级覆盖
- [x] 从 K12-KGraph `math.json` 获取二上 `math_2a_rjb_ch1（长度单位）` 的本年级 raw 证据
- [x] 新增 4 Concept、2 Skill、2 Exercise、1 Chapter 与 19 条 raw edge
- [x] normalized 后产生二年级 **6 条本年级 Occurrence + 2 个 AssessmentTask**
- [x] 当前研究样板中数学 G1–G6 均至少有一个本年级自身 Occurrence；`coverage:math:2` 自动关闭
- [x] 当前 `coverageGapCount = 0`
- [ ] 注意：`coverageGapCount=0` 仅代表**当前研究样板**每个年级至少存在可定位 Occurrence，不代表数学全量知识覆盖完成

### 当前数学数据基线

- [x] raw：**130 nodes / 198 edges**
- [x] raw 类型：17 Chapter / 60 Concept / 22 Skill / 31 Exercise
- [x] normalized：**82 provisional KnowledgeNode / 31 AssessmentTask**
- [x] 所有 normalized 实体保留 raw ID、sourceLocator、CC BY-NC-SA 4.0、commercialUse=false、provenance
- [x] `research_sequence` 仅用于课程浏览，不生成 synthetic prerequisite
- [x] K12-Bench `benchmark_prerequisite` 与 K12-KGraph raw edge provenance 持续分离

## 修补计划与分波执行

### Repair 基础设施

- [x] 7 条已知问题全部进入 `CurriculumRepairTask`，`autoApply=false`
- [x] 7 条问题全部有 review-only `candidate_patch`
- [x] 修订草稿升级 v2：支持名称、学习要求、题型；兼容旧本地草稿
- [x] 新增 `curriculumRepairRecheck.ts`
- [x] 候选修补只有在**实际变更字段严格落在允许范围**时才能进入 `recheck_pending`
- [x] 草稿修改了候选范围外字段时自动变为 `manual_review_required`
- [x] `no_change` 不能绕过修补生命周期
- [x] `/knowledge-map/review` 显示实时复测判定，并可导出 `qiqi-curriculum-repair-recheck/v1` 复测包
- [x] recheck bundle 仍 `autoApply=false`，下一关固定为 `human_subject_review`

### Wave 1 — 已执行机器首筛与候选修补

- [x] 语文一年级逐条首筛：F001 / F002 → patch proposal
- [x] 语文二年级逐条首筛：F003 / F004 → patch proposal
- [x] 英语三年级来源/年级/结构逐条首筛
- [x] 数学三年级 Occurrence / 来源 / Assessment 端点 / 年级绑定首筛
- [x] F001–F004 系统候选 patch 均能进入 `recheck_pending`
- [x] F001：候选仅移除题型污染 `口算`，不自动猜替代题型
- [x] F002：候选标题 `AABB式词语积累`
- [x] F003：候选标题 `动物相关四字成语归类`
- [x] F004：候选标题 `ABAB式与AABB式重叠词的语态描写`，仍保留“可能需要拆分”的教研判断
- [ ] F001–F004 真人学科语义核对与最终确认
- [ ] 真人确认后，将确认稿标记 `recheck_pending` 并执行发布前二次回归；未经确认不写回正式种子

### Wave 2 — 高风险问题与跨年级承接

- [ ] 语文四年级：优先 F005“长话短说/缩句”概念边界，再全年级逐条核对
- [ ] 英语四年级：优先 F006 `口算` 题型污染，再全年级逐条核对
- [ ] 英语六年级：优先 F007 `回。答` 标点损坏，再全年级逐条核对
- [ ] 数学四年级：角的度量、条形统计图等节点/Occurrence/raw relation 逐条核对
- [ ] 数学五年级：可能性、折线统计图、分数意义等节点/Occurrence/Assessment/raw relation 逐条核对

### Wave 3 — 全面收口

- [ ] 语文三、五、六年级：内容、课标证据、跨年级关系逐条复核
- [ ] 英语五年级：内容、交际功能、语言知识、课标证据逐条复核
- [ ] 数学一、二、六年级：来源、概念/技能、测评、跨年级关系逐条复核
- [ ] Wave 1–3 所有修补项完成二次回归后才进入真人最终审核

## 每个年级强制核对项

- [ ] 本年级覆盖完整性（不得由其他年级复用替代）
- [ ] 来源文件 / JSON Pointer / raw sourceLocator 完整
- [ ] 学科、年级、册次归属正确
- [ ] 知识名称与学习要求一致
- [ ] 题型与学科适配
- [ ] 重复、近义、拆分/合并候选复核
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

1. `npm run build` 与完整 Vitest 通过。
2. 16 个必核年级单元持续存在，不能删除缺数据年级来让覆盖率变好看。
3. 459 条语英节点全部进入逐条台账；每条 normalized Math Occurrence 必须进入对应年级台账。
4. 年级 occurrence 聚合必须与 item-level 台账一致。
5. 缺少本年级自身 Occurrence 时必须生成 blocking coverage task。
6. 7 条问题必须同时有 repair task + candidate proposal；均不得自动写回种子。
7. candidate patch → recheck_pending 只允许预定义字段变化；超范围变化必须 manual_review_required。
8. recheck_pending 不等于 human verified；不能跳过真人复核。
9. 任一知识点/年级 `humanStatus != verified` 时，逐年级正式发布门禁保持阻断。
10. 当前数学 raw 基线预期为 130 nodes / 198 edges；normalized 为 82 KnowledgeNode / 31 AssessmentTask。
11. raw ID、edge type、sourceLocator 与许可证 provenance 必须保留。
12. `research_sequence` 不得转换为 `prerequisites_for`。
13. standards mapping 在可信学科审核者签名前必须保持 candidate_review。
14. 仓库不得保存审核者私钥；reviewer registry 为空时正式标准映射导出必须被 CI 阻断。
15. 所有研究/核对/修订页面不得修改儿童云端数据。
