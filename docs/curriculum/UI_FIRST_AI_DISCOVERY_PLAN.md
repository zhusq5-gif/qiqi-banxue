# 课程知识体系 v0.3+：UI-first 真人审核 + AI Discovery 开发计划

状态：2026-09-09 起生效。  
适用分支：`feat/curriculum-knowledge-v03`。

## 一、核心调整

正常审核流程统一通过应用 UI 完成。Markdown/JSON 只保留为外部交接、备份、审计和交换格式，不再作为默认业务流程。

当前 UI 入口：

- `/knowledge-map/review-center`：审核中枢；
- `/knowledge-map/discovery`：AI 搜索候选真人审校；
- `/knowledge-map/discovery/domains`：学科 × 年级 × 领域搜索矩阵；
- `/knowledge-map/human-review/ai`：AI 候选进入真人精审后的本地 case draft 队列；
- `/knowledge-map/verification`：学科 × 年级核对矩阵；
- `/knowledge-map/human-review`：现有内容/数学 audit 真人核对；
- `/knowledge-map/human-review/current`：当前 case decision v2；
- `/knowledge-map/human-review/proposal`：结构化提案与二次回归；
- `/knowledge-map/human-review/ingest`：历史/外部 v1 JSON 兼容入口。

AI 数据流：

```text
AI / Search
  ↓
source-qualified candidate
  ↓
subject-grade-domain coverage / duplicate check
  ↓
UI decision
  ↓ promote_to_human_review
Human Review Case Draft（本地）
  ↓ 下一阶段：case activation
current-case decision v2
  ↓
new/existing structured proposal
  ↓
secondary regression
  ↓
content approval gate
  ↓
curated release
```

任何 AI 内容固定 `aiGenerated=true / reviewStatus=ai_candidate / autoApply=false / humanVerified=false`，不会直接修改 seed/raw/curated master/CloudBase。

## 二、AI 搜索源优先级

### Tier A：官方课程标准/教育行政来源

用于学习领域、任务群、课程目标、学业要求和课标证据。官方框架候选可以是 `high` confidence，但仍需 UI 人审。

当前已使用：

- 教育部 2022 数学课程标准；
- 教育部 2022 课标发布解读中的语文六学习任务群。

### Tier B：出版社当前教材/数字资源

用于当前可见的单元主题、活动栏目、交际功能和教材结构。页面只展示 `Read and write / Let’s spell / Let’s talk` 时，只能生成对应活动/能力候选，不得由栏目名自动补具体语法、句型或词汇清单。

### Tier C：出版社历史目录/版次未知配套资源

仅用于候选发现和版本差异检查；必须标 `publisher_catalog_version_unknown`，不得更新 current-edition 状态。

### Tier D：开放许可知识图谱/数据集

例如 K12-KGraph。必须保留 raw ID、sourceLocator、原始 relation type、license 和 provenance；AI解释层与 raw evidence 分开。

## 三、AI Discovery 当前基线

### Wave 01

`ai-discovery-2026-09-09-wave01`：20 条（语文7 / 英语5 / 数学8）。

### Wave 02

`ai-discovery-2026-09-09-wave02`：21 条（语文13 / 英语7 / 数学1），用于补齐第一批学科×年级空白和浅覆盖。

### Wave 03 — 领域缺口

`ai-discovery-2026-09-09-wave03-domain-gaps`：12 条：

- 语文 6：六个学习任务群官方框架锚点；
- 英语 4：四年级规则主题听说读写整合、五年级语音拼读/Read and write、六年级主题 Read and write；
- 数学 2：综合与实践、主题活动与项目学习。

三批合计：**53 条 AI candidate**：

- 语文 26；
- 英语 16；
- 数学 11。

## 四、两层搜索覆盖矩阵

### 1. 学科 × 年级最低候选池

16 个必核学科年级均已达到至少 3 条候选的 `candidate_review_ready` 最低启动门槛。该指标只表示“已有候选可审”，不是课程覆盖率。

### 2. 学科 × 年级 × 领域深度矩阵

新增 `aiDiscoveryDomainCoverage.ts` 和 `/knowledge-map/discovery/domains`。

共 **112 个搜索规划单元**：

- 语文：10 个领域/任务群 × 6 年级 = 60；
- 英语：7 个语言维度 × 4 年级 = 28；
- 数学：4 个领域 × 6 年级 = 24。

状态：

- `search_required`：0 条候选；
- `shallow_candidates`：仅 1 条；
- `review_pool_ready`：至少 2 条。

矩阵明确保留搜索空白，下一批 AI 搜索由这些空白驱动，而不是继续按总节点数优化。

## 五、逐科扩库方向

### 语文

- 识字与写字；
- 阅读与鉴赏；
- 表达与交流；
- 梳理与探究；
- 语言文字积累与梳理；
- 实用性阅读与交流；
- 文学阅读与创意表达；
- 思辨性阅读与表达；
- 整本书阅读；
- 跨学科学习。

六学习任务群的 Wave03 条目是框架锚点，不等于每个年级已经有具体内容；下一批应查分学段证据和教材实例。

### 英语

- 语音与拼读；
- 语言知识；
- 交际功能；
- 听说；
- 阅读；
- 写作；
- 文化意识。

优先补领域矩阵中的 `search_required`，尤其不能让单元主题候选替代语音、阅读、写作或文化维度。

### 数学

- 数与代数；
- 图形与几何；
- 统计与概率；
- 综合与实践。

继续采用 2022 课标领域 + K12-KGraph raw Concept/Skill/Exercise 双源，并同时核 AssessmentTask 和 relation evidence。

## 六、UI-first 审核现状

### 已完成

- [x] AI Discovery Inbox；
- [x] Review Center 导航中枢；
- [x] AI 领域深度搜索矩阵；
- [x] `promote_to_human_review` 通过 UI 直接生成绑定候选快照和证据的 `Human Review Case Draft`；
- [x] `/knowledge-map/human-review/ai` 查看本地 AI 精审队列；
- [x] 文件/JSON 降级为审计副本，不再是 AI 候选进入下一阶段的必经步骤。

### 下一步

- [ ] 将 AI case draft 激活为统一 `HumanReviewCase`；
- [ ] AI case activation 必须重新检查 current candidate state 与 evidence；
- [ ] 为“新增知识点”增加 `new_knowledge_candidate` structured proposal，而不是复用只针对现有节点的 patch schema；
- [ ] structured proposal 改成可视化表单；
- [ ] Review Center 增加连续“上一条/下一条”、审核进度、快捷键、决策历史；
- [ ] 批量只允许筛选/分派，禁止批量审核通过。

## 七、AI 扩库质量门禁

每个 AI candidate 至少检查：

1. sourceRefs 非空；
2. 来源 authority 明确；
3. 学科/年级范围明确；
4. evidenceSummary 不超出来源；
5. confidence 有来源层级依据；
6. exact duplicate 检查；
7. semantic duplicate 必须真人判断；
8. 版次未知必须警告；
9. 不复制受版权限制的教材正文长文本；
10. 不自动写正式库；
11. 进入真人精审时必须绑定当前 candidateState 与至少一条实际查看的 sourceRef；
12. 领域矩阵仅用于搜索规划，不得转译成“知识完成率”。

## 八、开发优先级

### P0 — UI-first 审核

- [x] AI候选 → 本地 Human Review Case Draft 直连；
- [ ] Case Draft → current HumanReviewCase activation；
- [ ] new-knowledge structured proposal；
- [ ] 连续单页审核体验与快捷键/历史。

### P0 — AI 扩库

- [x] Wave01 / Wave02 / Wave03，共 53 条；
- [x] 16 学科年级最低候选矩阵；
- [x] 112 单元领域深度矩阵；
- [ ] 根据 domain search queue 生成 Wave04；
- [ ] 继续补官方分学段课标证据，而不是只依赖出版社目录；
- [ ] K12-KGraph 数学 raw 数据继续扩大并映射到同一领域矩阵。

### P1 — Content Approval Gate

- [ ] 独立于 standards gate；
- [ ] 绑定 candidate snapshot / evidence / current version / reviewer public key；
- [ ] 内容或证据变化后旧 approval 失效；
- [ ] 真实签名只来自线下核验 reviewer；仓库不保存私钥。

### P1 — Unified Curriculum Export

- [ ] normalized Math 接入统一三科 Curriculum；
- [ ] 人审通过的 AI candidate 使用同一 candidate ChangeSet；
- [ ] 离线 HTML 明确 reviewed/research scope。

### P2 — 工程治理

- [ ] 移动端真机 / EdgeOne；
- [ ] 主包拆分；
- [ ] npm audit 非破坏性处理；
- [ ] 10k 节点性能测试。

## 九、不可改变的边界

- AI 不是学科审核者；
- AI 搜索结果不是教材事实；
- 出版社旧目录/配套手册不能冒充当前教材版次；
- `candidate_review_ready` / `review_pool_ready` 都不是知识完整；
- exact duplicate=0 不代表没有语义重复；
- confidence 不是教育学正确率；
- 当前 `humanVerified=0`；
- 未经真人 UI 核对和正式门禁，任何 AI candidate 都不能进入正式发布数据。
