# 课程知识体系 v0.3+：UI-first 真人审核 + AI Discovery 开发计划

状态：2026-09-09 起生效。  
适用分支：`feat/curriculum-knowledge-v03`。

## 一、核心调整

### 1. 真人审核改为 UI-first

正常审核流程统一通过应用 UI 完成。Markdown 审核包与 JSON 模板只保留为：

- 外部交接；
- 离线备份；
- 审计证据；
- 第三方系统交换格式。

不再把“人工编辑 JSON/Markdown”作为默认业务流程。

当前 UI 入口：

- `/knowledge-map/review-center`：审核导航中枢；
- `/knowledge-map/verification`：学科×年级核对矩阵；
- `/knowledge-map/discovery`：AI 搜索候选真人审校；
- `/knowledge-map/human-review`：现有内容/数学 audit 真人核对；
- `/knowledge-map/human-review/current`：基于当前 case 的 decision v2；
- `/knowledge-map/human-review/proposal`：结构化提案与二次回归；
- `/knowledge-map/human-review/ingest`：历史/外部 v1 JSON 兼容入口。

Review Center v1 已完成导航收敛；下一步是进一步把队列、当前 case、decision 和 structured proposal 合并成更连续的单页审校体验，而不是要求审核者理解内部 JSON schema。

### 2. AI 可以持续搜索和生成候选，但不能直接进入 curated master

数据流：

```text
AI / Search
  ↓
source-qualified candidate
  ↓
duplicate / search-coverage check
  ↓
UI human review
  ↓
decision v2
  ↓
structured proposal（如需要）
  ↓
secondary regression
  ↓
content approval gate
  ↓
curated release
```

任何 AI 新内容固定：

- `aiGenerated=true`；
- `reviewStatus=ai_candidate`；
- `autoApply=false`；
- `nextGate=human_ui_review`；
- 不生成 `expert_verified`；
- 不直接修改 seed / raw / curated master / CloudBase。

## 二、AI 搜索源优先级

### Tier A：官方课程标准/教育行政来源

优先用于学段领域锚点、课程目标、学业要求、内容领域与课标证据。

当前已使用教育部《义务教育数学课程标准（2022年版）》产生数学领域候选。这类来源可以标为 `high` confidence，但仍需 UI 人审。

### Tier B：出版社当前教材/数字资源

优先用于教材结构、当前单元主题、交际功能、章节/小节/活动证据。

如果只能看到目录或主题标题，置信度必须下降，不能由标题直接推断完整知识点或具体语法规则。

### Tier C：出版社历史目录/版次未知配套资源

只用于发现候选和版本差异检查。必须显式标记：

- `publisher_catalog_version_unknown`；
- 不得声称为当前教材；
- 不得据此自动改变现有教材版次状态。

当前部分语文同步字词手册属于这一类：它们可以支持“字词学习方向”的候选发现，但不能替代当前教材版本核验。

### Tier D：开放许可知识图谱/数据集

例如 K12-KGraph。必须保留 raw ID、sourceLocator、原始 relation type、license 和 provenance。AI 解释层与 raw evidence 分开保存。

## 三、AI Discovery 当前基线

### Wave 01

`ai-discovery-2026-09-09-wave01`：20 条。

- 语文 7；
- 英语 5；
- 数学 8。

数学优先落 2022 课标领域锚点，例如数与运算、数量关系、图形的认识与测量、数据分类、图形的位置与运动、数据的收集整理与表达、随机现象发生的可能性。

### Wave 02

`ai-discovery-2026-09-09-wave02`：21 条。

优先补第一批空白/浅覆盖年级：

- 语文 G2/G3/G5/G6 从 0 提升为至少 3 条候选；
- 语文 G4 从 2 提升为 3；
- 英语 G4/G5 从 0 提升为 3；
- 英语 G6 从 2 提升为 3；
- 数学 G5/G6 增补第三学段“数据的收集、整理与表达”官方课标锚点。

两批合计：**41 条 AI candidate**。

- 语文：20；
- 英语：12；
- 数学：9。

### AI 搜索覆盖矩阵

16 个必核学科年级目前均达到 `candidate_review_ready` 的**最低门槛**（每个单元至少 3 条 AI candidate）：

- 语文 G1–G6：6/6；
- 英语 G3–G6：4/4；
- 数学 G1–G6：6/6。

这只表示“每个年级都有一批候选可以开始 UI 审校”，**不表示该年级知识体系完整，不是课程覆盖率，也不能作为发布指标。**

下一轮 AI 搜索不再以“每年级至少3条”为目标，而改为按领域/任务群覆盖深度推进。

## 四、逐科逐年级扩库策略

### Wave A：领域覆盖深度

#### 语文

按 2022 课标实践活动与学习任务群反向检查现有 299 条及 AI 候选，至少分别覆盖：

- 识字与写字；
- 阅读与鉴赏；
- 表达与交流；
- 梳理与探究；
- 六个学习任务群。

每个年级不能仅靠“字词”候选达到表面覆盖。

#### 英语

以当前 PEP 数字资源和课标证据为入口，至少分别检查：

- 语音/拼读；
- 词汇与语言知识；
- 交际功能；
- 听说；
- 阅读；
- 写作/书面表达；
- 文化意识/跨文化主题。

单元标题只作为主题入口，不能自动生成具体句型规则。

#### 数学

继续采用 2022 课标领域 + K12-KGraph raw Concept/Skill/Exercise 双源：

- 数与代数；
- 图形与几何；
- 统计与概率；
- 综合与实践。

每个年级同时检查 KnowledgeNode、Occurrence、AssessmentTask 和关系证据。

### Wave B：年级内知识树

每个年级按：

```text
领域/任务群
  → 单元/主题
    → KnowledgeNode
      → Occurrence
      → AssessmentTask
      → Relation
      → StandardEvidence
```

逐一检查。

### Wave C：跨年级进阶

仅在有证据时建立 prerequisite、progresses_to、revisits、related_to。名称相似、教材顺序或 AI 常识都不能独立成为正式关系证据。

## 五、UI Review Center 下一阶段

Review Center v1 已提供统一入口和待办计数。下一步把分散页面的关键动作收敛成连续 UI 流程。

### 必须支持

- 学科 / 年级 / 来源 / Wave / 状态筛选；
- 左侧审核队列；
- 中间候选内容与 before/after；
- 右侧来源证据、重复命中、课标证据、relation context；
- 接受 / 修订 / 拒绝 / 暂缓；
- 键盘“上一条/下一条”；
- 本地自动保存；
- 审核进度和待办计数；
- 批量只做筛选/分派，不允许批量“审核通过”；
- 决策历史；
- 当前 caseState 失效提醒；
- structured proposal 可视化表单，不要求人工编写 JSON；
- AI candidate 的 `promote_to_human_review` 可以直接在 UI 创建下一阶段 case 草稿。

### 审核状态

```text
ai_candidate
→ human_review_pending
→ human_decision_recorded
→ structured_proposal_pending (如需要)
→ secondary_regression_passed
→ approval_pending
→ signed_approved / rejected / deferred
```

任何状态都不能通过 UI 文案混淆成“已正式发布”。

## 六、AI 扩库质量门禁

每个 AI candidate 至少检查：

1. sourceRefs 非空；
2. 来源 authority 明确；
3. 学科/年级范围明确；
4. evidenceSummary 与来源范围相符；
5. confidence 有依据；
6. exact duplicate 检查；
7. semantic duplicate 进入真人 review，不自动合并；
8. 当前教材版次未知时明确警告；
9. 不携带受版权限制的教材正文长文本；
10. 不自动写入正式库。

下一步增加领域覆盖检查与 AI search batch registry，避免只按节点数量优化。

## 七、开发优先级（调整后）

### P0 — UI-first 审核

- [x] AI Discovery Inbox v1；
- [x] Review Center v1 导航中枢；
- [ ] 将 human-review / current / proposal 的核心动作合并成连续 Review Center 工作流；
- [ ] structured proposal 改成可视化表单；
- [ ] 增加审核进度、下一条、快捷键、决策历史；
- [ ] AI candidate → human-review case 创建在 UI 内完成；
- [ ] 所有学科/年级审核通过 UI 完成，文件仅做导入导出。

### P0 — AI 扩库

- [x] Wave 01：20 条带来源 AI candidate；
- [x] Wave 02：21 条候选补齐空白/浅覆盖学科年级；
- [x] 两批聚合 registry：41 条候选；
- [x] 16 个学科×年级 AI 搜索最低候选覆盖矩阵；
- [ ] 建立领域维度 search batch registry；
- [ ] 自动生成“领域覆盖不足”搜索任务；
- [ ] 语文按实践活动/任务群深化；
- [ ] 英语按语音/语言知识/交际/听说读写/文化深化；
- [ ] 数学按四领域 + raw Assessment/Relation 深化；
- [ ] 每批进入 UI 人审，不直接写 curated master。

### P1 — Content Approval Gate

- [ ] 独立于 standards gate；
- [ ] 绑定 candidate snapshot v2 / evidence / current version / reviewer public key；
- [ ] 内容或证据变化后旧 approval 失效；
- [ ] 真实签名只来自线下核验 reviewer；仓库不保存私钥。

### P1 — Unified Curriculum Export

- [ ] normalized Math 接入统一三科 Curriculum；
- [ ] AI-approved candidate 接入同一 candidate ChangeSet；
- [ ] 离线 HTML 只导出明确 scope 的 reviewed/research 数据。

### P2 — 工程治理

- [ ] 移动端真机 / EdgeOne；
- [ ] 主包拆分；
- [ ] npm audit 非破坏性处理；
- [ ] 10k 节点性能测试。

## 八、不可改变的边界

- AI 不是学科审核者；
- AI 搜索结果不是教材事实；
- 出版社旧目录/配套手册不能冒充当前教材版次；
- `candidate_review_ready` 不是知识完整；
- exact duplicate=0 不代表没有语义重复；
- confidence 不是教育学正确率；
- 未经真人 UI 核对和正式门禁，任何 AI candidate 都不能进入正式发布数据。
