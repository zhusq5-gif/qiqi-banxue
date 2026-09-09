# 小学课程知识体系：真人核对指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 状态：研究/审校流程文件，不代表正式专家审核结果。

## 1. 谁来核对

建议由对应学科的小学教师、教研员或具有该学科课程教学经验的审核者执行。数据整理/开发人员可以准备证据，但不应同时把自己的机器结论直接标成“专家已核”。

当前系统中 `human verified = 0`。任何人工填写结果先作为 `unsigned_human_review`，之后还需进入系统复测与正式审核/签名流程。

## 2. 固定核对步骤

每个 case 都按以下顺序执行：

1. **看原始来源**：先打开 case 中的 `sourceRefs`，核对原始 JSON Pointer / raw `sourceLocator`，不要只看系统候选文字。
2. **确认年级和教材情境**：判断该知识、技能、题型、关系或练习确实属于当前年级/章节情境。
3. **核教学语义**：检查知识名称与学习要求是否一致；题型是否适合该学科；关系类型是否与 evidence 一致。
4. **只在证据范围内决策**：没有原始证据时可以“保持未映射/需要更多证据/提出 curated mapping 候选”，不能伪造 raw edge。
5. **填写理由和证据**：至少记录审核人姓名、角色、决策、理由、实际查阅的证据引用和时间。
6. **导出 unsigned decision**：人工决定不直接改 seed，不直接产生 `expert_verified`。
7. **系统复测**：修补或 curated mapping 在进入正式发布前必须重新跑 CI/数据门禁。

## 3. 决策边界

### 内容修补

- `accept_candidate`：候选修补与实际教材/来源一致。
- `revise_candidate`：方向正确但候选文字/分类需要人工修改。
- `defer`：证据不足或需要更高层级教研判断。

### F005 概念边界

F005 不提供“接受自动改名”。必须区分：

- **长话短说/概括**：对篇章或事件信息进行压缩，保留主要内容与关键行动；
- **缩句**：句法操作，删除修饰限制成分后保留句子主干。

允许决定：`split_nodes`、`rename_and_reframe`、`retain_single_node`、`defer`。

### 数学 Assessment 绑定

当 Exercise 有章节定位但没有 `tests_concept/tests_skill`：

- 先检查完整 K12-KGraph raw source；
- 如果只是本项目 excerpt 漏边，补回**可定位的原始边**；
- 如果 raw source 中没有对应边，保持 `keep_unmapped` 或 `needs_source_evidence`；
- 教研认为应该绑定时只能提交 `propose_curated_mapping`，不得伪装成 K12-KGraph raw edge。

### 数学跨年级关系

原始 `relates_to / prerequisites_for / is_a` 原样保留。人工可决定是否只保留 raw relation，或提出新的 Curriculum relation 候选；但原始 `relates_to` 不能因为“看起来像进阶”就自动改为 prerequisite。

### 同一知识跨年级复用

先判断是否仍是同一概念身份，再比较不同年级 Occurrence 的学习要求。默认不要因为年级变化就复制 KnowledgeNode。

## 4. 本轮审核包

- `review-packets/WAVE1_CHINESE_REVIEW.md`：F001–F004
- `review-packets/WAVE2_LANGUAGE_REVIEW.md`：F005–F007
- `review-packets/WAVE2_MATH_REVIEW.md`：数学 G4/G5 Assessment / relation / occurrence 专项
- `review-packets/HUMAN_REVIEW_DECISION_TEMPLATE.json`：人工决定填写模板

系统页面入口：`/knowledge-map/human-review`。

## 5. 通过条件

一个 case 只有满足以下条件，才可以进入下一步系统复测：

- 原始证据可定位；
- 审核者身份/角色已填写；
- decision 属于该 case 允许的决策集合；
- rationale 非空且说明教学依据；
- evidenceRefs 至少一条且是审核者实际查看过的证据；
- 仍保持 `autoApply=false` 和 `humanVerified=false`。

正式发布还需要后续内容版本、权利、课标映射和签名门禁，不因一次人工核对自动开放。
