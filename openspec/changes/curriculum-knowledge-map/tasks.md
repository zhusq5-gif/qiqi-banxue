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

## 下一步

- [ ] 获取数学 2022 课标可稳定定位的具体条款证据，并接入 candidate_review → signed approval 流程
- [ ] 将 normalized Math entities 接入统一三科 Curriculum 数据出口与离线 HTML 导出，而不仅是独立数学研究页
- [ ] 继续补语文/英语可稳定定位的具体学段目标、课程内容与学业质量证据，逐步减少只依赖上位官方解读的比例
- [ ] 完成至少 1 名真实学科审核者的线下身份核验与 Ed25519 公钥登记，形成第一条真实签名映射审批（需要真人参与，不能由系统伪造）
- [ ] 完成移动端真机与 EdgeOne feature 版本部署验证
- [ ] 继续降低主应用 bundle，并对 npm audit 依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 通过，课程模块按路由拆包。
2. `npm test` 通过课程种子、课标证据、审核包、数学章级/细粒度/规范化层与研究快照测试。
3. `/knowledge-map`、`/knowledge-map/review`、`/knowledge-map/standards`、`/knowledge-map/standards/review`、`/knowledge-map/math-sample`、`/knowledge-map/math-sample/fine`、`/knowledge-map/math-sample/normalized` 均不修改儿童云端数据。
4. 页面明确显示 research_only / candidate_review / provisional 等状态，不把未审核数据标记为正式结论。
5. `research_sequence` 只表示教材阶段顺序，不得自动转换为 `prerequisites_for`。
6. K12-Bench `benchmark_prerequisite` 与 K12-KGraph 原始 `prerequisites_for` 必须保持不同 provenance，不得混写。
7. 细粒度数学原始边必须保留原始关系类型，且每个节点/边保留可定位 sourceLocator。
8. 跨年级数学 raw 基线必须保持节点/边 ID 唯一且端点可解析；当前预期为 121 节点 / 179 边。
9. 三个 progression 的所有 stage anchor 必须存在，所有 `formalRawEdgeIds` 必须真实存在于 raw edge 集合。
10. 规范化层只允许 Concept/Skill 成为 KnowledgeNode；Exercise 必须进入 AssessmentTask，Chapter 仅作为 Occurrence 上下文。
11. 一个 raw KnowledgeNode 在多个章节出现时必须产生多个 Occurrence，而不能复制概念身份；例如五下折线统计图在六上复现时仍保持同一 KnowledgeNode。
12. 所有 normalized relation 必须一一对应 raw `prerequisites_for / relates_to / is_a`，不得生成 synthetic progression edge。
13. K12-KGraph 数据必须显式展示 CC BY-NC-SA 4.0 与 non-commercial 限制。
14. `official_interpretation` 与 `pedagogical_principle` 必须在数据模型和 UI 中可区分；后者不得冒充课标具体学段条款。
15. 所有知识点 ↔ 课标映射在受信学科审核者签名前保持 `candidate_review`。
16. 任何签名审批必须绑定当前映射内容 SHA-256；内容变化后旧签名不得继续有效。
17. 仓库不得保存审核者私钥；reviewer registry 为空时正式课标映射导出必须继续被 CI 阻断。
