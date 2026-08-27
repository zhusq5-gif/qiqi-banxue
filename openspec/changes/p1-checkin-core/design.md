# Design · P1 打卡核心

## Context

从零初始化项目。全局技术约定见 `openspec/project.md`：React + TS + Vite + Tailwind 前端，腾讯云开发 CloudBase 后端（国内云厂商，2026-08-25 由 chester 确认替换原 Supabase 方案），EdgeOne Pages 托管。P1 需求见 `proposal.md`，行为契约见 `specs/`。本设计解决：数据模型、认证与隔离、日期边界、项目结构四个核心技术问题。

## Goals / Non-Goals

**Goals:**

- 一套代码覆盖 iPad Safari / 桌面浏览器，触控优先
- 数据模型一次到位，支持 P4 多子女扩展（P1 不做多子女界面）
- 打卡/星星的幂等性：重复点按不产生脏数据
- 部署路径清晰：本地开发 → EdgeOne Pages 上线

**Non-Goals:**

- 离线缓存与 Service Worker 数据同步（PWA 仅做 manifest + 添加主屏幕，不做离线数据层）
- 服务端业务逻辑（P1 全部逻辑在前端 + Postgres 约束/触发器）
- 自动化测试覆盖 UI（仅对日期工具与星星计算做单元测试）

## Decisions

### D1 数据模型：PostgreSQL 六张表 + RLS 行级隔离

环境实测为 PG 模式（`RuntimeMode=postgresql`，无可用 NoSQL 实例，2026-08-27 经 MCP queryEnv 核实），业务数据统一使用 CloudBase PostgreSQL：

```sql
profiles          (id uuid pk, owner_id text not null, name text not null, avatar_id text not null, birthday date not null, created_at timestamptz default now())
subjects          (id uuid pk, owner_id text not null, name text not null, icon_id text not null, stars int not null default 1, archived_at timestamptz null, created_at timestamptz default now())
checkins          (id uuid pk, owner_id text not null, subject_id uuid not null references subjects(id), date date not null, stars_awarded int not null, created_at timestamptz default now(), unique(subject_id, date))
star_ledger       (id uuid pk, owner_id text not null, delta int not null, reason text not null, ref_type text null, ref_id text null, created_at timestamptz default now())
wishes            (id uuid pk, owner_id text not null, title text not null, stars int not null, archived_at timestamptz null, created_at timestamptz default now())
wish_redemptions  (id uuid pk, owner_id text not null, wish_id uuid references wishes(id), stars_spent int not null, created_at timestamptz default now())
```

- 所有表带 `owner_id`，启用 RLS 并建立策略限定仅本人可读写自己的数据，实现"数据按账号隔离"。当前认证用户标识注入 RLS 策略的具体机制在实现时按官方 postgresql-development 指南核实，以任务 2.3 的跨账号拒绝测试为验收标准。
- **打卡幂等由 `unique(subject_id, date)` 唯一约束保证**——重复打卡插入违反约束直接失败，数据库层兜底，前端只需乐观更新（比原 NoSQL 文档 ID 方案更简洁）。
- 星星余额不存单独字段，由 `star_ledger` 聚合计算（`SUM(delta)`），避免余额与流水不一致。
- `profiles` 设计为多条记录（多子女预留），P1 界面固定取第一条。
- 建表 SQL 与 RLS 政策版本化于 `cloudbase/migrations/<version>_<name>.sql`（官方迁移工作流，与 CLI `tcb db pg migration` 一致），经 MCP `managePgDatabase(action="applyMigration")` 执行。首个迁移：`20260827035452_init_six_tables.sql`（2026-08-27 已应用并验证）。

**备选**：余额冗余字段。否决——双写不一致风险大于聚合查询成本（家庭数据量级下聚合无压力）。

### D2 认证：CloudBase 邮箱登录 + 前端路由守卫

- 使用 `@cloudbase/js-sdk` v3 认证 API（supabase-like，2026-08-27 经官方 auth-tool 指南核实）：注册走邮箱验证码流程（`auth.signUp({ email, password })` + getVerification/verify 验证码确认）；登录用 `auth.signInWithPassword({ email, password })`；会话查询用 `auth.getSession()`（禁用 getUser/getLoginState 旧 API）。登录态由 SDK 自动持久化（localStorage），满足"会话保持"。
- 前置条件（已完成 2026-08-27）：邮箱登录已开启、SMTP 发件人已配置并验证生效。
- Web 安全域名：需将 EdgeOne Pages 默认域名加入 CloudBase 环境「安全配置 → Web 安全域名」（随 task 7.1 部署执行）。
- 路由守卫：未登录访问业务路由重定向 `/login`；守卫判定基于 `auth.getSession()` 返回的 session 存在性。
- 数据安全主要靠 PostgreSQL 行级安全 RLS（守卫只是体验层）——即使前端被绕过，数据库仍拒绝跨账号读写。

### D3 日期边界：Asia/Shanghai 固定时区（不变）

- `date` 字段统一存 `YYYY-MM-DD` 字符串（无时区歧义），由前端用 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' })` 计算当天日期。
- 打卡页每次加载时计算"今天"，不缓存跨天的旧值。

### D4 项目结构：功能分层，内容数据独立目录

```
src/
  pages/        路由页面（login, onboarding, today, parent）
  components/   复用组件（SubjectCard, StarBalance, ...）
  lib/          cloudbase 客户端、日期工具、星星计算
  content/      静态内容 JSON（P1：头像/图标清单；P2+：字母、古诗题库）
  assets/       SVG
cloudbase/
  migrations/           建表 SQL + RLS 政策 + RPC 数据库函数（版本化迁移，官方工作流）
```

`content/` 目录从 P1 就建立，P2/P3 的内容玩法数据统一放这里，与代码解耦。

### D5 PWA：manifest + 图标，不做离线数据层（不变）

`vite-plugin-pwa` 仅生成 manifest 与基础缓存（应用壳），满足 iPad"添加到主屏幕"全屏运行。数据实时读写 CloudBase，离线时界面提示网络不可用。

**备选**：离线优先 + 后台同步（IndexedDB + sync 队列）。否决——复杂度高一个量级，家庭 Wi-Fi 场景收益低，留待真实使用后评估。

### D6 打卡与星星的一致性：数据库函数（RPC）事务

官方 FAQ 明确云开发 PostgreSQL SDK 不直接支持客户端事务，推荐"数据库 RPC 封装事务"（2026-08-27 核实）。据此实现两个 PL/pgSQL 数据库函数（SECURITY INVOKER，以调用者身份运行、受 RLS 约束、auth.uid() 可用）：

- `checkin(p_subject_id, p_date)`：插入 checkins（唯一约束冲突即幂等返回 already=true）+ 插入 star_ledger 收入，函数体原子；
- `redeem(p_wish_id)`：校验余额 → 插入 wish_redemptions + star_ledger 支出，原子。

前端通过 `db.rpc('checkin', {...})` 调用。避免前端两次请求中途失败造成"打卡了没星星"。

**备选**：Node 云函数封装事务。否决——多一层部署面且 node-sdk 访问 PG 路径未官方文档化；RPC 方案事务直接在数据库内完成，最简。

## Risks / Trade-offs

- [CloudBase 个人版云函数超时固定 3 秒] → 打卡/兑换均为毫秒级单事务操作，远低于上限；不在此环境跑任何长耗时任务。
- [js-sdk rdb() 与 RLS 用户标识衔接未实测] → 实现阶段先完成任务 2.3 跨账号隔离测试再写业务页面；若 Web SDK 无法传递认证身份，回退方案是全部数据访问收敛到云函数（结构已支持）。
- [CloudBase 个人版为付费套餐（约 19.9 元/月）] → 家庭用量远低于 20 万次调用/月配额，成本可控；数据导出作为冷备份手段（本就是硬性约定），必要时可平迁。
- [邮箱注册依赖 SMTP 发件人配置] → 一次性配置 QQ/163 邮箱 SMTP 即可；验证邮件量极低（家庭仅注册一次）。
- [3 岁儿童可能误触兑换心愿] → 兑换操作需要家长确认（长按 2 秒，简单且低龄友好）。
- [Web Speech/音频在 iPad Safari 首次播放需用户手势] → 动效音效均由点按触发，天然满足手势要求。

## Migration Plan

1. 本地 `npm run dev` 开发，直连 CloudBase 云端环境（个人版，新用户 30 天免费试用）。
2. 建表 SQL 与 RLS 政策版本化于 `cloudbase/migrations/` 并经 MCP `managePgDatabase(action="applyMigration")` 执行；邮箱登录与 SMTP 发件人经 MCP `manageAppAuth` 配置（均已完成的项见 tasks.md 勾选状态）；云函数经 CLI/MCP 部署。
3. 上线：GitHub 仓库（GitHub MCP 推送）→ EdgeOne Pages 导入 Git 仓库自动构建 → 环境变量 `VITE_TCB_ENV_ID` → 将 Pages 域名加入 CloudBase Web 安全域名。
4. 回滚：静态站点，回滚即 EdgeOne Pages 重新部署上一版本；数据库结构只加不改，无回滚需求。

## Open Questions

（无——影响方案的问题已在蓝图阶段与 chester 确认）
