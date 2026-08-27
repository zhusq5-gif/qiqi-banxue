# AGENTS.md — 七七伴学（qiqi-banxue）

家长（chester）为 3–12 岁孩子构建的家庭学习管理系统：React + CloudBase PG，OpenSpec 规范驱动。本文件是 AI 协作会话的上下文入口。

## 怎么跑起来

P1 开发中，尚无可运行代码。脚手架就绪后：`npm run dev`（Vite + React 18 + TS）。
云后端：CloudBase 环境 `zhusiqi-knowledge-base-dbb4abd2f`（个人版，PG 模式，勿用 NoSQL API）。

## 技术栈与关键约定

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa（仅应用壳，不做离线数据层）
- 数据：CloudBase PostgreSQL，六张表 + RLS（`owner_id` 为 text，与 `auth.uid()` 返回类型对齐）；任何 schema 变更必须走 `cloudbase/migrations/` 版本化迁移（14 位时间戳版本号 + 仅小写字母下划线名称），禁止裸 DDL
- 认证：js-sdk v3（supabase-like）；会话用 `auth.getSession()`，登录用 `auth.signInWithPassword`；勿用 getLoginState/getUser
- 日期：一律 Asia/Shanghai 时区 `YYYY-MM-DD`
- 星星余额 = star_ledger 聚合，不冗余存储；打卡幂等靠 checkins(subject_id, date) 唯一约束
- 部署：EdgeOne Pages（GitHub 自动构建）；GitHub 写入用 gh CLI 凭证 + git push（MCP 只读）

## 目录与工作流

- `openspec/`：规范真相源。每阶段先出变更提案（proposal/specs/design/tasks），chester 确认后实现，完成后归档；proposal 必含 Non-goals
- `cloudbase/migrations/`：数据库迁移 SQL（版本化）
- `src/content/`（规划中）：题库/卡片 JSON，离线打包，不依赖运行时外部 API

## 当前状态与下一步

- P1「打卡核心」已批准实现：task 2.1 完成（建表+RLS+SMTP），下一步 task 1.1 脚手架
- 详细任务清单见 `openspec/changes/p1-checkin-core/tasks.md`
- CloudBase 试用期至 2026-09-25（自动续费，约 19.9 元/月）

## 硬性红线

- 儿童数据云上必须登录保护（RLS 已启用，勿放宽策略）
- 不接入第三方统计 SDK；任何阶段保留全量数据 JSON 导出能力
- 云厂商限定国内（腾讯云）
