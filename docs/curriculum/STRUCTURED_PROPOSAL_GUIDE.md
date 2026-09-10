# 小学课程知识体系：Structured Proposal 操作指南

> 适用分支：`feat/curriculum-knowledge-v03`  
> 用途：把真人 decision v2 转成**可验证但不自动应用**的结构化候选变更。  
> 重要：本文件不是正式审核意见，也不会产生 `humanVerified=true`。

## 1. 什么时候需要 Structured Proposal

以下人工决定不能仅靠一个 decision 字段继续：
- `revise_candidate`
- `split_nodes`
- `rename_and_reframe`
- `propose_curated_mapping`
- `propose_curriculum_relation`
- `split_identity_candidate`

必须补一份：`qiqi-curriculum-human-review-structured-proposal/v1`。

系统入口：`/knowledge-map/human-review/proposal`。

输入：当前 case 绑定的 `qiqi-curriculum-human-review-decision/v2` + structured proposal JSON。

执行：`proposal validation → reference closure → secondary regression → candidate snapshot v2`。

全部通过后：`nextGate = curriculum_content_approval_gate`。候选仍固定 `autoApply=false / humanVerified=false`。

## 2. 通用字段

```json
{
  "schema": "qiqi-curriculum-human-review-structured-proposal/v1",
  "caseId": "与 decision v2 完全相同",
  "kind": "五种类型之一",
  "rationale": "为什么要做这个结构变更",
  "evidenceRefs": ["至少一条当前 case 的真实 sourceRef"],
  "status": "structured_proposal_candidate",
  "autoApply": false
}
```

通用拒绝条件：decision v2 的 caseState 已变化、caseId/kind 不匹配、rationale/evidence 缺失、evidence 未引用当前 case、试图自动应用。

## 3. `content_revision`

对应 `revise_candidate / rename_and_reframe`。

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

普通 `revise_candidate` 必须继续遵守 issue 的字段范围。例如 F006 只允许题型范围内调整；同时改 label 会被 `CONTENT_REVISION_OUTSIDE_ALLOWED_FIELDS` 拦截。

F005 `rename_and_reframe` 当前只用于 F005，且至少改变 label 或 learningDemand。

二次回归检查 source entry/identity 不变、seed immutable，并生成 before/after candidate。

## 4. `concept_split`

当前用于 F005 `split_nodes`。

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

强制：sourceNodeId 必须是 F005 源节点；至少两个候选节点；candidate ID 唯一；每个候选有名称/学习要求/题型；每个候选明确继承原教材 occurrence。

二次回归生成 `concept_split_changeset_candidate`，包含 source occurrence、redirectsTo、proposedNodes。候选阶段不删除原节点。

## 5. `assessment_mapping`

对应 `propose_curated_mapping`。

```json
{
  "kind": "assessment_mapping",
  "rawExerciseId": "math_..._exe...",
  "targetKnowledgeNodeIds": ["math:kg:..."],
  "mappingType": "curated_assessed_by",
  "provenance": "qiqi_curated_review"
}
```

强制：当前 case 是 assessment_binding；rawExerciseId 就是当前 case 的 Exercise；target KnowledgeNode 存在；provenance 固定 curated 层。

二次回归检查 `raw_edge_immutable=true`，不会向 K12-KGraph raw tests_* 写 synthetic edge。

`math_4a_rjb_exe20` 当前 raw G4 tests block 未找到 tests_*；真人若提出绑定，只能走本 proposal，不修改 raw provenance。

## 6. `curriculum_relation`

对应 `propose_curriculum_relation`。

```json
{
  "kind": "curriculum_relation",
  "fromKnowledgeNodeId": "math:kg:...",
  "toKnowledgeNodeId": "math:kg:...",
  "relationType": "related_to | revisits | progresses_to | prerequisite_for",
  "supportingRawRefs": ["当前 relation case 的 raw evidence"],
  "provenance": "qiqi_curated_review"
}
```

强制：当前 case 是 cross_grade_relation；两端存在且不同；supporting raw relation 必须就是同一对 KnowledgeNode（方向可调整）；raw relation 保持不变。raw evidence 不能被拿去支撑无关节点对。

若 relationType=`prerequisite_for`，候选加入现有 prerequisite 图执行 cycle check。环检测算法使用独立纯有向图测试验证，不向真实课程样本制造关系。

## 7. `identity_split`

对应 `split_identity_candidate`。

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

强制：当前 case 是 occurrence_reuse；source node 就是审核对象；source 至少两个可定位 Occurrence；source Occurrence 全部且只分配一次；每个 candidate 至少一个 Occurrence。

二次回归执行 reference closure。候选阶段不删除 source node，只生成 split/redirect 计划。

## 8. 结果解释

- `proposal_revision_required`：结构、case/evidence、端点或 reference closure 有问题。
- `structured_proposal_secondary_regression`：proposal validation 已通过，进入回归。
- `curriculum_content_approval_gate`：validation + regression 均通过，可以把 candidate snapshot 交给下一层内容审批门禁。

它不意味着专家已签名、教材版本已核、权利已清、课标映射已批准或可以正式发布。

## 9. 下一工程门禁

`curriculum content approval gate` 需要绑定 candidate snapshot v2、审核对象版本、reviewer identity/public key、实际 evidence、内容摘要。内容/证据变化后旧 approval 必须失效。真实签名只能来自线下核验的学科 reviewer；仓库不保存私钥。

## 10. 当前真人依赖

仓库目前没有真实审核者提交的 decision v2，也没有真实 reviewer 签名，因此：`humanVerified = 0`。

structured proposal 流程已经可以接收真实审核结果，但不会自行伪造审核结论。
