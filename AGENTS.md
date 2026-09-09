# AGENTS.md — 七七伴学（qiqi-banxue）

家长（chester）为 3–12 岁孩子构建的家庭学习管理系统：React + CloudBase PG，OpenSpec 规范驱动。本文件是 AI 协作会话的上下文入口。

## 怎么跑起来

`npm run dev`（Vite + React 18 + TS），构建 `npm run build`，测试 `npm test`（vitest）。
云后端：CloudBase 环境 `zhusiqi-knowledge-base-dbb4abd2f`（个人版，PG 模式，勿用 NoSQL API）。
线上（预览）：https://qiqi-banxue-xpnba4ki.edgeone.cool（EdgeOne Makers 项目 qiqi-banxue，已可匿名访问）。
正式域名（配置中）：`qiqi.77xiaomiao.cn` → EdgeOne Pages 绑定，已加入 CloudBase 安全域名（2026-09-06）。

## 技术栈与关键约定

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa（仅应用壳，不做离线数据层）
- 数据：CloudBase PostgreSQL，六张表 + RLS（`owner_id` 为 text，与 `auth.uid()` 返回类型对齐）；任何 schema 变更必须走 `cloudbase/migrations/` 版本化迁移（14 位时间戳版本号 + 仅小写字母下划线名称），禁止裸 DDL
- 认证：js-sdk v3（supabase-like）；会话用 `auth.getSession()`，登录用 `auth.signInWithPassword`；勿用 getLoginState/getUser。忘记密码 = `resetPasswordForEmail(email)` 返回 updateUser 回调 → `updateUser({ nonce: 邮箱验证码, password })`；注册页邮箱探测 = `auth.isUsernameRegistered(email)`（已注册返回 true，未注册返回 undefined，见 cloudbase.ts checkEmailRegistered）
- 日期：一律 Asia/Shanghai 时区 `YYYY-MM-DD`
- 星星余额 = star_ledger 聚合，不冗余存储；打卡幂等靠 checkins(subject_id, date) 唯一约束
- 部署：EdgeOne Makers（deploy_folder 上传 dist/ 产物，实测无 GitHub 自动构建绑定）；GitHub 写入用 gh CLI 凭证 + git push（MCP 只读）

## 目录与工作流

- `openspec/`：规范真相源。每阶段先出变更提案（proposal/specs/design/tasks），chester 确认后实现，完成后归档；proposal 必含 Non-goals
- `cloudbase/migrations/`：数据库迁移 SQL（版本化）
- `src/content/`（规划中）：题库/卡片 JSON，离线打包，不依赖运行时外部 API

## 当前状态与下一步

- P1「打卡核心」实现 21/22：全量代码已上线 EdgeOne 并通过线上 E2E（注册→打卡→兑换→导出，2026-08-28）；4.2/4.4/5.2/6.3 经代码核对确认已实现，1.2 PWA 可安装性经真实浏览器核验通过，2.3 双账号 RLS 隔离经真实双账号显式测试通过（2026-09-08/09）
- 剩余 1 项：7.2（iPad 真机验收：Safari 登录→打卡→兑换→导出 + 添加主屏幕全屏，建议用正式域名 qiqi.77xiaomiao.cn）；iPad Air 视口模拟预检已全通过（2026-09-09），预检中发现并修复 StatsTab 日期解析 bug（`Date.UTC` 月份未减一导致本周图表溢出 33 列）；测试账号：zhusq0506@qq.com / Qiqi@2026a、383534737@qq.com / Qiqi@2026c（RLS 回归用）
- 性能：构建产物已代码分割——主包 180KB + vendor-cloudbase 750KB（SDK 独立 chunk，hash 稳定，PWA 增量更新免重复下载）；页面级 React.lazy（Today/Parent）
- `.edgeone/` 已加入 .gitignore 并取消跟踪（2026-09-09 清理）
- 正式域名上线三步（2026-09-06 起）：① CloudBase 安全域名已加 qiqi.77xiaomiao.cn ✅ ② EdgeOne 控制台绑定自定义域名+免费证书（chester 操作）③ DNSPod 加 CNAME（绑定弹窗给值）
- 详细任务清单见 `openspec/changes/p1-checkin-core/tasks.md`
- CloudBase 试用期至 2026-09-25（自动续费，约 19.9 元/月）；ICP 备案已完成（2026-09-06 确认）

## 硬性红线

- 儿童数据云上必须登录保护（RLS 已启用，勿放宽策略）
- 不接入第三方统计 SDK；任何阶段保留全量数据 JSON 导出能力
- 云厂商限定国内（腾讯云）
