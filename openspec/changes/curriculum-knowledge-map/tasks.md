# Tasks

## 已完成

- [x] 建立独立开发分支 `feat/curriculum-knowledge-v03`
- [x] 增加 `/knowledge-map` React 路由、459 条语英种子数据、20 册教材版本卡与三视图
- [x] 迁移 7 条问题修订工作台与 research_only JSON/HTML 导出
- [x] 建立 2022 课标证据层，登记语文/英语/数学 3 份正式标准文档元数据
- [x] 将语文/英语核心素养拆为可单独审核的证据记录，并建立人工映射审核队列
- [x] 增加 Ed25519 外部签名工具、受信公钥注册表、内容 SHA-256 绑定与 CI 验签门禁
- [x] 语文/英语证据层扩展至 26 条记录、60 条候选映射；新增 `evidenceScope` 防止不同证据等级混用
- [x] 增加 K12-KGraph 小学数学章级样板与 `subject_specific_KG/math.json` 细粒度原始子图
- [x] 将数学原始子图扩展到数与代数、图形与几何、统计与概率三个小学主题
- [x] 将三主题继续扩展为跨年级样板：分数 3→5→6 年级、几何 3→4→6 年级、统计 3→4→5→6 年级
- [x] 新增 `research_sequence` progression metadata；教材阶段顺序与 raw prerequisite 语义严格分离
- [x] 原始细粒度样板扩展为 121 个节点 / 179 条 raw 边，继续保留 Concept / Skill / Exercise / Chapter 与 sourceLocator
- [x] `/knowledge-map/math-sample/fine` 增加跨年级进阶轨道、主题筛选和 raw 关系浏览
- [x] 建立 Raw K12-KGraph → Math Schema / Curriculum Schema 规范化层
- [x] Raw Concept/Skill → provisional `KnowledgeNode`；`appears_in` → `Occurrence`；Exercise + `tests_*` → `AssessmentTask`；raw semantic edge → `Relation`
- [x] 规范化对象保留 raw ID、sourceLocator、CC BY-NC-SA 4.0、commercialUse=false 与 provenanceKind
- [x] 未进入已核主题的旧 raw 节点显式保持 `unclassified`，不自动猜数学领域
- [x] 新增 `/knowledge-map/math-sample/normalized`，可对照 KnowledgeNode / Occurrence / AssessmentTask / Raw Relation 与原始证据
- [x] 继续保持 K12-Bench `benchmark_prerequisite` 与 K12-KGraph raw edge provenance 分离
- [x] 将课程知识页面改为 `React.lazy` 路由级拆包，避免主打卡应用首屏加载全部课程数据

## 新增强制任务：逐科、逐年级、逐知识点核对

### 核对门禁与台账

- [x] 建立 16 个必核年级单元：语文 1–6 年级、英语 3–6 年级、数学 1–6 年级
- [x] 建立 `curriculumVerification.ts`，所有年级进入同一状态机：自动检查 → 内容核对/修补 → 修补后复测 → 真人学科复核
- [x] 建立知识点级核对台账：语文/英语每个现有节点一条记录；数学按 `KnowledgeNode × grade Occurrence` 建记录
- [x] 每条台账记录必须保留学科、年级、知识 ID、Occurrence、来源引用、问题关联、机器状态和真人复核状态
- [x] 建立 `/knowledge-map/verification` 核对矩阵与逐条台账页面
- [x] 7 条已登记问题全部转成显式 repair task，`autoApply=false`
- [x] CI 增加年级矩阵、逐条台账、来源完整性、年级绑定与 repair task 覆盖测试

### 分波执行计划

#### Wave 1 — 当前执行

- [x] 语文一年级：自动检查 + 逐条台账首筛；F001/F002 进入 `patch_proposed`
- [x] 语文二年级：自动检查 + 逐条台账首筛；F003/F004 进入 `patch_proposed`
- [x] 英语三年级：自动来源/年级/结构首筛完成；继续排队语义与教材适配人工核对
- [x] 数学三年级：normalized Occurrence、来源、测评端点与年级归属首筛完成；继续排队数学语义人工核对
- [ ] 对 F001–F004 形成正式修补草稿，并逐项执行“原始证据 → 修补内容 → 回归测试 → 教研确认”；在教研确认前不得写回正式种子

#### Wave 2 — 高风险与跨年级承接

- [ ] 语文四年级：优先处理 F005“长话短说/缩句”概念边界，再逐条核对全年级节点
- [ ] 英语四年级：优先处理 F006“口算”异常题型，再逐条核对全年级节点
- [ ] 英语六年级：优先处理 F007 标点损坏，再逐条核对全年级节点
- [ ] 数学四年级：逐条核对“角的度量/条形统计图”等跨年级承接节点、Occurrence 与 raw relation
- [ ] 数学五年级：逐条核对“可能性/折线统计图/分数意义”等节点、Occurrence、AssessmentTask 与 relation

#### Wave 3 — 全面收口

- [ ] 语文三、五、六年级：逐条内容核对、课标证据核对、跨年级关系复核
- [ ] 英语五年级：逐条内容核对、交际功能/语言知识/课标证据复核
- [ ] 数学一、二、六年级：逐条来源、概念/技能、测评、跨年级关系与课标证据复核
- [ ] 对 Wave 1–3 全部修补项执行二次回归，不允许“修补完成但未复测”的年级进入真人审核

### 每个年级强制核对项

- [ ] 来源文件 / JSON Pointer / raw sourceLocator 完整
- [ ] 学科与年级/册次归属正确
- [ ] 知识名称与学习要求一致
- [ ] 题型与学科适配
- [ ] 重复、近义、拆分/合并候选经过复核
- [ ] 跨年级关系有证据，教材序列不得冒充 prerequisite
- [ ] 课标映射有可定位证据；无证据保持 candidate/unmapped
- [ ] 来源许可与公开分发权利状态明确
- [ ] 修补后完成回归测试
- [ ] 真人学科复核完成后方可标记该年级 `verified`

## 其他下一步

- [ ] 获取数学 2022 课标可稳定定位的具体条款证据，并接入 candidate_review → signed approval 流程
- [ ] 将 normalized Math entities 接入统一三科 Curriculum 数据出口与离线 HTML 导出，而不仅是独立数学研究页
- [ ] 继续补语文/英语可稳定定位的具体学段目标、课程内容与学业质量证据，逐步减少只依赖上位官方解读的比例
- [ ] 完成至少 1 名真实学科审核者的线下身份核验与 Ed25519 公钥登记，形成第一条真实签名映射审批（需要真人参与，不能由系统伪造）
- [ ] 完成移动端真机与 EdgeOne feature 版本部署验证
- [ ] 继续降低主应用 bundle，并对 npm audit 依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 通过，课程模块按路由拆包。
2. `npm test` 通过课程种子、课标证据、审核包、数学章级/细粒度/规范化层、逐科逐年级核对矩阵与研究快照测试。
3. `/knowledge-map/verification` 必须覆盖语文 1–6、英语 3–6、数学 1–6 共 16 个年级单元，不能缺年级。
4. 语文/英语 459 条现有节点必须全部进入 item-level verification ledger；数学每条 normalized Occurrence 必须进入对应年级台账。
5. 每个年级聚合的 occurrence 数必须与逐条台账数量一致；任何来源缺失、年级绑定失败或悬空端点必须让测试失败。
6. 7 条已登记问题必须全部对应 repair task；修补任务不得自动写回原始/种子数据。
7. 机器检查状态、修补状态与真人复核状态必须分离；机器通过不得显示为“专家已核”。
8. 任何年级或知识点 `humanStatus != verified` 时，逐年级核对门禁不得返回正式发布就绪。
9. 修补后必须进入 `recheck_pending` 并通过回归后才能进入真人审核；禁止直接从 `patch_proposed` 跳到正式发布。
10. `/knowledge-map`、`/knowledge-map/review`、`/knowledge-map/verification`、`/knowledge-map/standards`、`/knowledge-map/standards/review`、`/knowledge-map/math-sample`、`/knowledge-map/math-sample/fine`、`/knowledge-map/math-sample/normalized` 均不修改儿童云端数据。
11. 页面明确显示 research_only / candidate_review / provisional / machine-screened 等状态，不把未审核数据标记为正式结论。
12. `research_sequence` 只表示教材阶段顺序，不得自动转换为 `prerequisites_for`。
13. K12-Bench `benchmark_prerequisite` 与 K12-KGraph 原始 `prerequisites_for` 必须保持不同 provenance，不得混写。
14. 细粒度数学原始边必须保留原始关系类型，且每个节点/边保留可定位 sourceLocator。
15. 跨年级数学 raw 基线必须保持节点/边 ID 唯一且端点可解析；当前预期为 121 节点 / 179 边。
16. 一个 raw KnowledgeNode 在多个章节出现时必须产生多个 Occurrence，而不能复制概念身份。
17. 所有 normalized relation 必须一一对应 raw `prerequisites_for / relates_to / is_a`，不得生成 synthetic progression edge。
18. K12-KGraph 数据必须显式展示 CC BY-NC-SA 4.0 与 non-commercial 限制。
19. 所有知识点 ↔ 课标映射在受信学科审核者签名前保持 `candidate_review`。
20. 任何签名审批必须绑定当前映射内容 SHA-256；内容变化后旧签名不得继续有效。
21. 仓库不得保存审核者私钥；reviewer registry 为空时正式课标映射导出必须继续被 CI 阻断。
