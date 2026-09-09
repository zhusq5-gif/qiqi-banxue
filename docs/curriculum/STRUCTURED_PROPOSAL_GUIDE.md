# 小学课程知识体系：Structured Proposal 操作指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 用途：把真人 decision v2 转成**可验证但不自动应用**的结构化候选变更。  
> 重要：本文件不是正式审核意见，也不会产生 `humanVerified=true`。

## 1. 什么时候需要 Structured Proposal

如果真人 decision v2 是以下任一决定，就不能仅靠一个 decision 字段继续：

- `revise_candidate`
- `split_nodes`
- `rename_and_reframe`
- `propose_curated_mapping`
- `propose_curriculum_relation`
- `split_identity_candidate`

这些决定都必须补一份：

`qiqi-curriculum-human-review-structured-proposal/v1`

系统入口：

`/knowledge-map/human-review/proposal`

输入两份 JSON：

1. 当前 case 绑定的 `qiqi-curriculum-human-review-decision/v2`
2. 对应的 structured proposal

页面会依次运行：

`proposal validation → reference closure → secondary regression → candidate snapshot v2`

只有全部通过，才会显示：

`nextGate = curriculum_content_approval_gate`

但候选仍固定：

- `autoApply=false`
- `humanVerified=false`

## 2. 通用字段

每个 proposal 都必须包含：

```json
{
  "schema": "qiqi-curriculum-human-review-structured-proposal/v1",
  "caseId": "与 decision v2 完全相同",
  "kind": "见下文五种类型",
  "rationale": "为什么要做这个结构变更",
  "evidenceRefs": ["至少一条当前 case 的真实 sourceRef"],
  "status": "structured_proposal_candidate",
  "autoApply": false
}
```

通用拒绝条件：

- decision v2 的 caseState 已不是当前 case；
- proposal.caseId 与 decision.caseId 不一致；
- proposal.kind 与人工 decision 不匹配；
- rationale 为空；
- evidenceRefs 为空或没有引用当前 case；
- 试图设置自动应用状态。

## 3. `content_revision`

对应人工决定：

- `revise_candidate`
- `rename_and_reframe`

核心字段：

```json
{
  "kind": "content_revision",
  "proposed": {
    "proposedLabel": "...",
    "proposedLearningDemand": "...",
    "proposedQuestionTypes": ["..."]
  }
}
```

### 普通 `revise_candidate`

必须继续遵守该 issue 已定义的允许字段范围。

例如 F006 原问题是英语题型污染，当前允许修补范围只有 `questionTypes`。如果真人同时修改知识名称，validator 会返回：

`CONTENT_REVISION_OUTSIDE_ALLOWED_FIELDS`

### F005 `rename_and_reframe`

当前只允许用于 F005。至少要改变 label 或 learningDemand，不能提交“看起来像变更、实际上原文未变”的 proposal。

### 二次回归

系统检查：

- 原 source entry 仍存在；
- 原 Knowledge identity 不被替换；
- seed 保持 immutable；
- 生成 before/after candidate，而不是写回 seed。

## 4. `concept_split`

当前对应：

`F005 + split_nodes`

核心字段：

```json
{
  "kind": "concept_split",
  "sourceNodeId": "F005 当前源节点",
  "proposedNodes": [
    {
      "temporaryId": "candidate:...",
      "label": "...",
      "learningDemand": "...",
      "questionTypes": ["..."],
      "inheritsSourceOccurrence": true
    }
  ]
}
```

当前强制条件：

- sourceNodeId 必须就是 F005 的源节点；
- 至少拆成两个候选节点；
- temporaryId 唯一且以 `candidate:` 开头；
- 每个候选都有名称、学习要求、题型；
- 每个候选明确声明 `inheritsSourceOccurrence=true`。

二次回归会生成：

`concept_split_changeset_candidate`

其中包含：

- 原 sourceNodeId；
- 原教材 occurrence 定位；
- `redirectsTo`；
- 两个或多个 proposed nodes。

候选阶段不会删除原节点。

## 5. `assessment_mapping`

对应人工决定：

`propose_curated_mapping`

用于 raw Exercise 没有 `tests_concept/tests_skill`，但真人教研基于教材证据认为应建立课程层 Assessment 映射的情况。

核心字段：

```json
{
  "kind": "assessment_mapping",
  "rawExerciseId": "math_..._exe...",
  "targetKnowledgeNodeIds": ["math:kg:..."],
  "mappingType": "curated_assessed_by",
  "provenance": "qiqi_curated_review"
}
```

强制条件：

- 当前 human-review case 必须是 `assessment_binding`；
- rawExerciseId 必须就是这个 case 所审核的 Exercise；
- target KnowledgeNode 必须真实存在；
- provenance 必须是 `qiqi_curated_review`。

二次回归明确检查：

`raw_edge_immutable = true`

即：curated mapping 不会写成 K12-KGraph raw `tests_*` edge。

### exe20

`math_4a_rjb_exe20` 当前 raw source 的 G4 tests block 未发现 tests_* 记录，因此：

- 可以继续 `keep_unmapped`；
- 可以要求更多来源证据；
- 真人若提出课程映射，只能使用本 proposal 类型；
- 不能修改 K12-KGraph raw provenance。

## 6. `curriculum_relation`

对应人工决定：

`propose_curriculum_relation`

核心字段：

```json
{
  "kind": "curriculum_relation",
  "fromKnowledgeNodeId": "math:kg:...",
  "toKnowledgeNodeId": "math:kg:...",
  "relationType": "related_to | revisits | progresses_to | prerequisite_for",
  "supportingRawRefs": ["raw edge id 或当前 case sourceLocator"],
  "provenance": "qiqi_curated_review"
}
```

强制条件：

- 当前 case 必须是 `cross_grade_relation`；
- 两端 KnowledgeNode 必须存在且不能相同；
- supportingRawRefs 至少包含当前 case 的 raw evidence；
- supporting raw relation 必须就是**同一对 KnowledgeNode**（方向可因课程解释而调整）；
- raw relation 本身保持不变。

因此一条 raw relation 的 evidence 不能被拿去支撑完全无关的两个节点。

如果 relationType 是 `prerequisite_for`，二次回归会把候选加入现有 prerequisite 图并执行 cycle check。存在环则拒绝。

注意：当前真实 Wave 2 样本不一定包含可构造反向环的 prerequisite case；环检测算法使用独立纯有向图测试验证，不为了测试而制造课程 raw edge。

## 7. `identity_split`

对应人工决定：

`split_identity_candidate`

用于真人认为“同一个 normalized KnowledgeNode 在多个 Occurrence 中其实不应继续共用概念身份”的情况。

核心字段：

```json
{
  "kind": "identity_split",
  "sourceKnowledgeNodeId": "math:kg:...",
  "proposedNodes": [
    {
      "temporaryId": "candidate:...",
      "canonicalName": "...",
      "occurrenceIds": ["math:occ:..."]
    }
  ]
}
```

强制条件：

- 当前 case 必须是 `occurrence_reuse`；
- source KnowledgeNode 必须就是当前 case 审核的节点；
- source 至少有两个可定位 Occurrence，否则没有足够证据拆 identity；
- 所有 source Occurrence 必须且只能被分配一次；
- temporaryId 唯一且以 `candidate:` 开头；
- 每个新节点至少分到一个 Occurrence。

二次回归执行 reference closure：

`全部 source occurrence = 全部 proposed assignment，且无重复`

候选阶段仍不删除 source node，只生成 split/redirect 计划。

## 8. 结果如何解释

### `proposal_revision_required`

结构、case/evidence 绑定、端点或 reference closure 有问题。修改 proposal 后重新运行。

### `structured_proposal_secondary_regression`

proposal validation 已通过，准备执行二次回归。

### `curriculum_content_approval_gate`

validation + secondary regression 均通过，可以把 candidate snapshot 交给下一层内容审批门禁。

它不意味着：

- 专家已正式签名；
- 教材版本已核；
- 权利状态已完成；
- 课标映射已批准；
- 可以正式发布。

## 9. 当前真人依赖

本仓库目前没有真实审核者提交的 decision v2，也没有真实 reviewer 签名。因此：

`humanVerified = 0`

上述 structured proposal 流程已经可以接收真实审核结果，但不会自行伪造审核结论。
