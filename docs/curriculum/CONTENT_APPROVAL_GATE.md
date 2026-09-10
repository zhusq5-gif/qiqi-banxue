# Curriculum Content Approval Gate

> 这是一道**内容本体审批门禁**，与 `curriculum-standard-gate.mjs` 的课标映射审批完全分离。

## 1. 为什么单独建门

“某知识点映射到了正确课标条款”和“这个知识点/拆分/关系/Assessment 映射本身应该进入正式课程数据”是两个不同判断。

因此正式流程拆成：

```text
UI 真人核对
→ decision v2
→ structured/new-knowledge proposal
→ secondary regression
→ candidate snapshot (readyForApprovalGate=true)
→ 显式 formal candidate registration
→ content reviewer Ed25519 签名
→ CI content gate 验签
```

当前仓库：

- `approvals/curriculum-content-candidates.json`：空；
- `config/curriculum-content-reviewers.json`：空；
- `approvals/curriculum-content-approvals.json`：空；
- 因此正式内容发布**必须保持 blocked**。

这不是失败，而是正确的初始安全状态。

## 2. Browser candidate 不能自动进入正式门

浏览器中的 candidate snapshot 仍然：

- `autoApply=false`
- `humanVerified=false`
- `readyForApprovalGate=true` 只表示工程检查完成

系统不会从 localStorage 自动读取并提交到仓库。

需要项目负责人显式导出 snapshot，并执行正式登记。

## 3. 登记 candidate

工具：

```bash
node scripts/register-curriculum-content-candidate.mjs \
  --snapshot ./candidate-snapshot.json \
  --candidate-id content:F006:2026-09-09 \
  --dataset-version 0.3-research \
  --source-commit <CURRENT_GIT_SHA> \
  --evidence '<evidence-ref-1>' \
  --evidence '<evidence-ref-2>' \
  --registered-by '<operator label>' \
  --output ./content-candidate.json \
  --confirm-registration
```

只接受：

- `qiqi-curriculum-structured-candidate-snapshot/v2`
- `qiqi-curriculum-ai-new-knowledge-candidate-snapshot/v2`

且必须：

- `readyForApprovalGate=true`
- `autoApply=false`
- `humanVerified=false`
- 能安全解析 subject
- 有 evidence
- 绑定 datasetVersion 与 Git sourceCommit

输出记录 schema：

`qiqi-curriculum-content-candidate/v1`

登记后仍需要人工把该记录加入 `approvals/curriculum-content-candidates.json`，建议通过 PR 审查完成，不自动写仓库。

## 4. Reviewer registry

`config/curriculum-content-reviewers.json`

真实审核者必须经过线下身份/学科角色核验后登记 Ed25519 **公钥**。示意：

```json
{
  "schema": "qiqi-curriculum-content-reviewer-registry/v1",
  "reviewers": {
    "reviewer-id": {
      "label": "真实审核人",
      "roles": ["content_reviewer"],
      "subjects": ["chinese"],
      "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
    }
  }
}
```

私钥永远不进仓库。

## 5. 离线签名

审核者在自己设备上运行：

```bash
node scripts/sign-curriculum-content-review.mjs \
  --candidate ./content-candidate.json \
  --reviewer-id <reviewer-id> \
  --reviewer-label '<reviewer label>' \
  --private-key /secure/path/content-reviewer-private.pem \
  --decision approve \
  --output ./content-approval.json \
  --confirm-reviewed
```

支持：

- `approve`
- `reject`
- `needs_revision`

签名 payload 会绑定整个 candidate 的 canonical SHA-256，包括：

- candidate snapshot
- evidenceRefs
- datasetVersion
- Git sourceCommit
- registration metadata

候选内容、证据或版本发生变化后，旧签名 digest 自动失效。

## 6. CI 验证

```bash
node scripts/curriculum-content-gate.mjs --self-test
node scripts/curriculum-content-gate.mjs --expect-blocked --expect-candidate-count=0
```

当前预期 blocker 至少包括：

- `NO_REGISTERED_CONTENT_CANDIDATE`
- `NO_TRUSTED_CONTENT_REVIEWER`

一旦正式登记候选，所有登记 candidate 都必须有有效 `approve`，且不得存在 reject / needs_revision / 签名错误，才能令 content gate ready。

## 7. 仍然不是整站正式发布

即使 content gate ready，正式发布仍至少还需要：

- standards mapping gate
- textbook edition/version gate
- rights gate
- scope-specific issue/coverage gates

Content gate 只回答：

> “当前登记的课程内容候选，是否有匹配当前内容摘要的可信真人签名批准？”

它不替代其他治理判断。
