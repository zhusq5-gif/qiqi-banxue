# Tasks

## 已完成

- [x] 建立独立开发分支 `feat/curriculum-knowledge-v03`
- [x] 增加 `/knowledge-map` React 路由
- [x] 增加研究数据状态与发布就绪度页面
- [x] 明确研究版与正式版的发布边界
- [x] 将 20 册教材版本卡迁移为 React 数据源与筛选器
- [x] 将 459 条种子节点导入 `src/content/` 的版本化 JSON
- [x] 迁移“教材目录 / 知识能力 / 关系”三视图
- [x] 右侧详情展示学习要求、版次状态、问题、来源 Pointer 与关系候选
- [x] 增加种子数据不变量测试：计数、唯一 ID、引用完整性、问题与候选端点
- [x] 迁移 7 条问题修订工作台：本地版本化草稿、原文对照、JSON 导出、基线恢复
- [x] 增加研究快照 JSON/HTML 导出：继承当前筛选条件，HTML 自包含且支持离线搜索
- [x] 接入 2022 课标证据实体：语文/英语/数学 3 份标准文档、17 条语英教育部来源证据条款、24 条候选映射
- [x] 增加 `/knowledge-map/standards` 证据浏览页，并接入知识点右栏与修订工作台
- [x] 将语文文化自信/语言运用/思维能力/审美创造、英语语言能力/文化意识/思维品质/学习能力拆为可单独审核的条款
- [x] 增加 `/knowledge-map/standards/review` 人工映射审核队列：本地决策、双证据勾选、unsigned 审核包导出
- [x] 区分 `official_source_verified`、`candidate_review` 与 `unsigned_review_bundle`，三者不能互相替代
- [x] 增加 Ed25519 外部签名工具、受信公钥注册表与正式映射验签门禁
- [x] CI 验证 Ed25519 自测，并强制确认当前无受信审核者时正式映射导出仍被阻断
- [x] 增加课标证据测试：来源域、文档/条款引用、年级范围、映射端点、低置信映射与审核边界
- [x] 增加 K12-KGraph 小学数学真实数据样板：12 册范围、8 个可核目标章节、10 条 K12-Bench 基础关系证据
- [x] 数学样板强制保留 CC BY-NC-SA 4.0 / non-commercial / research_only 边界，并对未核前置章节 ID 保持 null
- [x] 增加 `/knowledge-map/math-sample` 数学样板页，并登记《义务教育数学课程标准（2022年版）》官方文档元数据；数学具体条款仍保持为空

## 下一步

- [ ] 继续扩充语文/英语学段目标、课程内容与学业质量条款，并将审核队列从样板扩展到更高覆盖率
- [ ] 完成至少 1 名真实学科审核者的线下身份核验与公钥登记，形成第一条真实签名映射审批（需要真人参与，不能由系统伪造）
- [ ] 获取 K12-KGraph `subject_specific_KG/math.json` 中更细的 Concept/Skill/Exercise 数据，扩展当前章级数学样板
- [ ] 获取数学2022课标可稳定定位的具体条款证据，并接入同一 candidate_review → signed approval 流程
- [ ] 完成移动端与 EdgeOne 部署验证

## 验收标准

1. `npm run build` 通过。
2. `npm test` 通过现有回归、课程种子不变量、课标证据、审核包、数学样板与研究快照安全测试。
3. 登录后 `/knowledge-map`、`/knowledge-map/review`、`/knowledge-map/standards`、`/knowledge-map/standards/review`、`/knowledge-map/math-sample` 可访问且不会修改儿童云端数据。
4. 页面明确显示“研究版”，不把未审核数据标记为正式结论。
5. 关系视图仅将 29 对数据标识为相似标签候选，不展示为正式 prerequisite。
6. 教材版次未知或不一致时，右侧版本卡必须显式展示，不得默认为最新版。
7. 内容修订与课标映射审核均只保存本地 draft/unsigned 数据，不直接覆盖种子 JSON 或生成专家审核状态。
8. JSON/HTML 导出物必须标记 `research_only`，HTML 不依赖远程脚本资源。
9. 教育部来源可标记为 `official_source_verified`，但知识点映射在受信学科审核者签名前必须保持 `candidate_review`。
10. 课标映射不得跨越条款声明的年级范围；缺少可核来源时保持为空，不自动补造。
11. 任何签名审批必须绑定当前映射内容 SHA-256；内容变化后旧签名不得继续有效。
12. 仓库不得保存审核者私钥；只登记维护者线下核验过的 Ed25519 公钥。
13. 当前受信 reviewer registry 为空时，`node scripts/curriculum-standard-gate.mjs --expect-blocked` 必须成功，`--require-ready` 必须失败。
14. 数学样板不得将 K12-Bench 的基础问答证据伪装成未经核验的 raw `prerequisites_for` 边；未核 external id 不得推断。
15. K12-KGraph 数学样板必须显式展示 CC BY-NC-SA 4.0 与 non-commercial 限制。
16. 正式发布门禁未满足时，不提供“正式发布成功”的误导性状态。
