# 小学课程知识体系 v0.2.x 基线

## 已完成研究资产

独立研究原型已经完成以下工作，并作为本 React 集成的上游基线：

- 真实 JSON 审计：统编语文 1–6 年级、PEP 英语 3–6 年级，共 20 册。
- 大纲条目：语文 299、英语 160，共 459 条。
- 四套 Schema：统一 Curriculum、语文、英语、数学。
- 数据治理：知识节点与教材 occurrence 分离；原始证据不覆盖；修订、研究快照和回滚分层。
- 已登记内容问题：7 条；跨年级名称相似候选：29 对。
- 自动测试：v0.2 基线曾完成领域、浏览器回归与工作台测试；后续 v0.2.1 增加发布就绪度检查。

## v0.2.1 新增

新增确定性的发布就绪度报告：

```bash
python manage.py readiness
```

当前预期状态：

- `research.ready = true`
- `official.ready = false`

正式发布必须继续被以下条件阻断，直到真实治理流程完成：

- `UNREVIEWED`
- `MISSING_SIGNED_APPROVAL`
- `EDITION_UNVERIFIED`
- `RIGHTS_UNRESOLVED`
- `OPEN_CONTENT_ISSUE`

## React 迁移策略

不直接把 1.7MB 单文件 HTML 当作 React 源码复制进来，而按版本化数据 + 可复用组件逐批迁移：

1. `src/content/curriculum/` 保存经过审计的轻量种子数据。
2. `/knowledge-map` 先承载检索、年级/册次过滤和治理状态。
3. 后续迁移教材目录视图、能力视图、关系视图。
4. 最后迁移修订工作台、课标证据、研究快照与导出。

## 数据边界

当前 React 仓库中的课程数据仍是研究种子，不代表专家认证或最新版教材。任何正式发布状态必须满足教材版次、教研审核、来源权利和内容问题四类门禁。
