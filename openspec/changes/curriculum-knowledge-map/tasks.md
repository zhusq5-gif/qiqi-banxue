# Tasks

## 已完成

- [x] 建立独立开发分支 `feat/curriculum-knowledge-v03`
- [x] 增加 `/knowledge-map` React 路由、459 条语英种子数据、20 册教材版本卡与三视图
- [x] 迁移 7 条问题修订工作台与 research_only JSON/HTML 导出
- [x] 建立 2022 课标证据层，登记语文/英语/数学 3 份正式标准文档元数据
- [x] 将语文/英语核心素养拆为可单独审核的证据记录，并建立人工映射审核队列
- [x] 增加 Ed25519 外部签名工具、受信公钥注册表、内容 SHA-256 绑定与 CI 验签门禁
- [x] 保持 `official_source_verified`、`candidate_review`、`unsigned_review_bundle` 与 signed approval 状态隔离
- [x] 第一批语文/英语课标证据扩展至 17 条、24 条候选映射
- [x] 第二批新增六个语文学习任务群，并将英语“体验中学习 / 实践中运用 / 迁移中创新”作为 `pedagogical_principle` 证据层，而非具体学段条款
- [x] 语文/英语证据层当前扩展至 26 条记录、60 条候选映射；新增 `evidenceScope` 防止不同证据等级混用
- [x] 修复签名门禁，使 expansion v02 的 36 条新增映射也进入正式验签范围
- [x] 增加 K12-KGraph 小学数学章级样板：12 册范围、8 个可核章节、10 条 K12-Bench 基础关系证据
- [x] 成功读取 K12-KGraph `subject_specific_KG/math.json` 可定位原始文本，建立一年级上册细粒度原始子图样板
- [x] 细粒度数学样板包含 26 个原始节点（Concept / Skill / Exercise / Chapter）与 31 条原始关系，保留 `prerequisites_for / appears_in / tests_concept / tests_skill / relates_to / is_a`
- [x] 增加 `/knowledge-map/math-sample/fine` 原始子图浏览页，并保持 CC BY-NC-SA 4.0 / non-commercial / research_only 边界
- [x] 将课程知识页面改为 `React.lazy` 路由级拆包，避免主打卡应用首屏加载全部课程数据

## 下一步

- [ ] 继续补语文/英语可稳定定位的具体学段目标、课程内容与学业质量证据，逐步减少只依赖上位官方解读的比例
- [ ] 完成至少 1 名真实学科审核者的线下身份核验与 Ed25519 公钥登记，形成第一条真实签名映射审批（需要真人参与，不能由系统伪造）
- [ ] 扩大 `math.json` 原始子图抽样：至少覆盖数与代数、图形与几何、统计与概率三个小学主题，并接入统一数学 Schema
- [ ] 获取数学 2022 课标可稳定定位的具体条款证据，并接入 candidate_review → signed approval 流程
- [ ] 完成移动端真机与 EdgeOne feature 版本部署验证
- [ ] 继续降低主应用 bundle，并对 npm audit 依赖问题做非破坏性升级评估；禁止 `--force` 盲升级

## 验收标准

1. `npm run build` 通过，课程模块按路由拆包。
2. `npm test` 通过课程种子、课标证据、审核包、数学章级/细粒度样板与研究快照测试。
3. `/knowledge-map`、`/knowledge-map/review`、`/knowledge-map/standards`、`/knowledge-map/standards/review`、`/knowledge-map/math-sample`、`/knowledge-map/math-sample/fine` 均为只读研究/本地草稿流程，不修改儿童云端数据。
4. 页面明确显示 research_only / candidate_review 等状态，不把未审核数据标记为正式结论。
5. 关系视图中的 `similar_label_candidate` 不得展示为正式 prerequisite。
6. K12-Bench `benchmark_prerequisite` 与 K12-KGraph 原始 `prerequisites_for` 必须保持不同 provenance，不得混写。
7. 细粒度数学原始边必须保留原始关系类型，且每个节点/边保留可定位 sourceLocator。
8. K12-KGraph 数据必须显式展示 CC BY-NC-SA 4.0 与 non-commercial 限制。
9. `official_interpretation` 与 `pedagogical_principle` 必须在数据模型和 UI 中可区分；后者不得冒充课标具体学段条款。
10. 所有知识点 ↔ 课标映射在受信学科审核者签名前保持 `candidate_review`。
11. 课标映射不得跨越条款声明的年级范围；悬空 entry/clause 引用必须让测试失败。
12. 任何签名审批必须绑定当前映射内容 SHA-256；内容变化后旧签名不得继续有效。
13. 仓库不得保存审核者私钥；只登记维护者线下核验过的 Ed25519 公钥。
14. reviewer registry 为空时，`node scripts/curriculum-standard-gate.mjs --expect-blocked` 必须成功，且报告的 `candidateMappings` 必须等于当前完整映射总数。
15. 正式发布门禁未满足时，不提供“正式发布成功”的误导性状态。
