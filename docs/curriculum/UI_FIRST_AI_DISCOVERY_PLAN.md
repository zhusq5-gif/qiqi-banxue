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

主入口：

- `/knowledge-map/verification`：学科×年级核对矩阵；
- `/knowledge-map/human-review`：现有内容/数学 audit 真人核对；
- `/knowledge-map/human-review/current`：基于当前 case 的 decision v2；
- `/knowledge-map/human-review/proposal`：结构化提案与二次回归；
- `/knowledge-map/discovery`：AI 搜索候选的真人 UI 审校。

后续目标是将这些入口收敛成统一 Review Center，而不是要求审核人理解内部 JSON schema。

### 2. AI 可以持续搜索和生成候选，但不能直接进入 curated master

新增数据流：

```text
AI / Search
  ↓
source-qualified candidate
  ↓
duplicate / coverage check
  ↓
UI human review
  ↓
decision v2
  ↓
structured proposal
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
- 不直接修改 seed / raw / CloudBase。

## 二、AI 搜索源优先级

### Tier A：官方课程标准/教育行政来源

优先用于：

- 学段领域锚点；
- 课程目标；
- 学业要求；
- 内容领域；
- 课标证据。

当前首批：教育部《义务教育数学课程标准（2022年版）》。这类来源可产生 `high` confidence 候选，但仍需 UI 人审后才进入知识体系。

### Tier B：出版社当前教材/数字资源

优先用于：

- 教材结构；
- 当前单元主题；
- 交际功能；
- 章节/小节/活动证据。

如果只能看到目录或主题标题，置信度必须下降，不能由标题直接推断完整知识点。

### Tier C：出版社历史目录/版次未知资源

只用于发现候选和版本差异检查。必须显式标记：

- `publisher_catalog_version_unknown`；
- 不得声称为当前教材；
- 不得据此自动改变现有教材版次状态。

### Tier D：开放许可知识图谱/数据集

例如 K12-KGraph。必须保留：

- raw ID；
- sourceLocator；
- 原始 relation type；
- license；
- provenance。

AI 解释层与 raw evidence 分开保存。

## 三、第一批 AI Discovery 基线

`ai-discovery-2026-09-09-wave01`

共 20 条：

- 语文：7；
- 英语：5；
- 数学：8。

其中数学优先落 2022 课标领域锚点，例如：

- 数与运算；
- 数量关系；
- 图形的认识与测量；
- 数据分类；
- 图形的位置与运动；
- 数据的收集、整理与表达；
- 随机现象发生的可能性。

语文/英语首批主要作为“AI 搜索流程可用性”样板：出版社目录或公开教学资源只生成候选，不直接认定当前版次和正式知识边界。

## 四、逐科逐年级扩库策略

### Wave A：现有数据缺口优先

1. 数学：优先继续把 1–6 年级每个年级的 raw Concept/Skill/Exercise 覆盖做深；
2. 语文：从 2022 课标任务群/学段要求反向检查现有 299 条的覆盖缺口；
3. 英语：以当前 PEP 资源的 unit/theme/function 为入口，识别现有 160 条中缺失的交际功能、语音、阅读、写作候选。

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

仅在有证据时建立：

- prerequisite；
- progresses_to；
- revisits；
- related_to。

名称相似、教材顺序或 AI 常识都不能独立成为正式关系证据。

## 五、UI Review Center 下一阶段

目标：把现有多个页面整合为一个审核中枢。

### 必须支持

- 学科 / 年级 / 来源 / Wave / 状态筛选；
- 左侧审核队列；
- 中间候选内容与 before/after；
- 右侧来源证据、重复命中、课标证据、relation context；
- 接受 / 修订 / 拒绝 / 暂缓；
- 键盘下一条；
- 本地自动保存；
- 批量只做筛选/分派，不允许批量“审核通过”；
- 决策历史；
- 当前 caseState 失效提醒；
- structured proposal 可视化表单，不要求人工编写 JSON。

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

## 七、开发优先级（调整后）

### P0 — UI-first 审核

- [x] AI Discovery Inbox v1；
- [ ] 将现有 human-review / current / proposal 合并为 Review Center；
- [ ] structured proposal 改成可视化表单；
- [ ] 增加审核进度、下一条、快捷键、待办计数；
- [ ] 所有学科/年级审核通过 UI 完成，文件仅做导入导出。

### P0 — AI 扩库

- [x] 首批 20 条带来源的 AI candidate；
- [ ] 建立每学科×年级 AI search batch registry；
- [ ] 自动生成 coverage-gap candidate；
- [ ] 语文 G1–G6 扩库批次；
- [ ] 英语 G3–G6 扩库批次；
- [ ] 数学 G1–G6 raw/standard 双源扩库批次；
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
- 出版社旧目录不能冒充当前版次；
- exact duplicate=0 不代表没有语义重复；
- confidence 不是教育学正确率；
- 未经真人 UI 核对和正式门禁，任何 AI candidate 都不能进入正式发布数据。
