# Curriculum Content Approval Preparation

页面：`/knowledge-map/content-approval`

## 目的

把已经通过 secondary regression 的 candidate snapshot 转成**仓库登记准备包**，但不在浏览器里注册正式 candidate，也不生成签名。

支持的 snapshot：

- `qiqi-curriculum-structured-candidate-snapshot/v2`
- `qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2`

必须满足：

- `readyForApprovalGate=true`
- `autoApply=false`
- `humanVerified=false`
- evidenceRefs 非空
- datasetVersion 非空
- sourceCommit 非空
- preparedBy 非空

UI 输出：`qiqi-curriculum-content-registration-request/v1`。

固定状态：

- `status=browser_preparation_only`
- `requiresRepositoryRegistration=true`
- `autoApply=false`
- `humanVerified=false`

## 正式后续

1. 维护者检查 registration request 和 snapshot；
2. 运行 `scripts/register-curriculum-content-candidate.mjs` 明确登记 formal candidate；
3. 线下核验真实 content reviewer；
4. 仓库只登记 reviewer Ed25519 公钥；
5. reviewer 用本地私钥执行 `scripts/sign-curriculum-content-review.mjs`；
6. CI 执行 `scripts/curriculum-content-gate.mjs` 验签和内容摘要；
7. candidate 内容、证据、datasetVersion 或 sourceCommit 变化后，旧 approval digest 失效。

当前仓库 deliberate blockers：

- registered formal content candidate = 0；
- trusted content reviewer = 0；
- signed content approval = 0。

不要为了演示伪造 reviewer、公钥或签名。
