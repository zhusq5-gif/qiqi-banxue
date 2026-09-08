# 课标映射审核与签名流程

## 目的

系统把“人工给出审核意见”和“正式可发布的受信审批”分成两层：

1. 浏览器中的 `/knowledge-map/standards/review` 只产生本地草稿和 `unsigned_review_bundle`。
2. 受信学科审核者在浏览器之外使用 Ed25519 私钥签名。
3. 仓库只保存维护者线下核验过的公钥，不保存任何私钥。
4. `scripts/curriculum-standard-gate.mjs` 重新计算当前映射内容 SHA-256 并验证签名；内容发生变化时旧签名自动失效。

## 1. 浏览器人工审核

审核者在课标映射审核队列中：

- 核对教材节点与来源 Pointer；
- 核对课标证据摘要与教育部来源；
- 给出建议通过、拒绝或需要修订；
- 填写审核者本地标识和审核备注；
- 导出 `unsigned_review_bundle`。

即使选择“建议通过”，静态数据中的映射仍保持 `candidate_review`。

## 2. 线下核验审核者身份

由项目维护者线下确认审核者的真实身份、学科和授权范围。确认后，审核者自行生成 Ed25519 密钥对；私钥不得进入仓库、聊天、网盘共享目录或前端代码。

维护者只将公钥登记到：

```text
config/curriculum-reviewers.json
```

示例结构：

```json
{
  "schema": "qiqi-curriculum-trusted-reviewers/v1",
  "reviewers": {
    "reviewer-cn-001": {
      "displayName": "已线下核验的语文学科审核者",
      "roles": ["subject_reviewer"],
      "subjects": ["chinese"],
      "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
    }
  }
}
```

不要仅凭用户在页面里填写的姓名自动加入此注册表。

## 3. 外部签名

审核者确认已经完成真实人工审核后，在本地运行：

```bash
node scripts/sign-curriculum-standard-review.mjs \
  --bundle standard-mapping-review-map2-cn-thinking-1.json \
  --reviewer-id reviewer-cn-001 \
  --private-key /secure/path/reviewer-cn-001.pem \
  --output approval-map2-cn-thinking-1.json \
  --confirm-reviewed
```

工具会拒绝：

- `pending` 审核决定；
- 未勾选教材证据或课标证据；
- 缺少审核者标识；
- 非 Ed25519 私钥；
- 覆盖已有输出文件。

## 4. 登记签名审批

维护者审阅签名文件后，将其加入：

```text
approvals/curriculum-standard-approvals.json
```

签名文件包含映射内容的 SHA-256。任何映射、知识点或课标证据变化都会导致门禁重新计算的摘要不同，从而使旧审批失效。

## 5. 验签门禁

查看当前状态：

```bash
node scripts/curriculum-standard-gate.mjs
```

要求课标映射正式导出就绪：

```bash
node scripts/curriculum-standard-gate.mjs --require-ready
```

在当前没有受信审核者和有效签名的基线中，CI 应确认仍被阻断：

```bash
node scripts/curriculum-standard-gate.mjs --expect-blocked
```

密码学实现自测：

```bash
node scripts/curriculum-standard-gate.mjs --self-test
```

## 边界

这一门禁只覆盖“知识点 ↔ 课标条款”映射审批。整个课程知识库正式发布仍需额外满足：教材版次核验、来源权利判定、内容问题关闭、知识点本身的学科审核等门禁。
