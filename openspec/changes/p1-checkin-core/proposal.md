# P1 · 打卡核心（MVP）

## Why

孩子即将 3 岁，学习管理需要从"开始记录"的那一天就建立习惯。P1 是整个七七伴学系统的最小可用版本：不追求功能完整，但要做到上线当天家长和孩子就能日常使用，并为后续所有阶段（计划、内容玩法、闯关、报告）提供数据底座。

## What Changes

- 新建 React + TypeScript + Vite + Tailwind 前端项目，PWA 配置（iPad 添加到主屏幕）
- 接入腾讯云开发 CloudBase：家长邮箱密码登录、PostgreSQL 数据表（RLS 行级隔离）、打卡云函数
- 儿童档案：昵称、头像（预设 SVG 头像选择）、生日
- 每日打卡：家长可自定义科目/活动（如"英语磨耳朵""绘本共读"），孩子每天完成打卡，打卡即得星星
- 星星奖励：星星累计、心愿单（礼品/特权）设定与兑换
- 家长视图：今日完成情况、本周打卡统计
- 数据导出：一键导出全部数据为 JSON
- 低龄模式界面：大按钮、大图标、即时星星动效反馈

## Capabilities

### New Capabilities

- `parent-auth`: 家长账号注册登录（CloudBase 邮箱/密码），会话保持，未登录不可访问数据
- `child-profile`: 儿童档案的创建与编辑（昵称、SVG 头像、生日），支持后续多子女扩展的数据结构
- `daily-checkin`: 自定义科目管理与每日打卡记录，按日期存储
- `star-rewards`: 星星账本（收入/支出记录）、心愿单创建与兑换
- `parent-dashboard`: 家长视图（今日/本周统计）与全量数据 JSON 导出

### Modified Capabilities

（无——首个变更，全部为新建能力）

## Impact

- **代码**：从零初始化项目（`package.json`、`src/`、`cloudbase/`），无存量代码受影响
- **依赖**：react、react-dom、typescript、vite、tailwindcss、@cloudbase/js-sdk、vite-plugin-pwa；云函数运行时为 Node.js
- **外部服务**：腾讯云开发 CloudBase 个人版（环境 `zhusiqi-knowledge-base-dbb4abd2f`，PG 模式，试用期至 2026-09-25；SMTP 发件人经 MCP 配置用于邮箱验证）；腾讯 EdgeOne Pages 免费档托管（GitHub 仓库自动构建）
- **数据**：CloudBase PostgreSQL 新建六张表并启用行级安全 RLS：`profiles`、`subjects`、`checkins`、`star_ledger`、`wishes`、`wish_redemptions`，策略限定仅 owner 本人可读写

## Non-goals

- 不做任何内容玩法模块（字母乐园、古诗花园、数字王国、逻辑挑战、闯关冒险——属 P2/P3/P4）
- 不做学习计划与课程表（P2）
- 不做多子女切换（数据结构预留，界面不做）
- 不做学龄模式（P1 只做低龄模式界面）
- 不做离线缓存与离线打卡（P1 联网使用；若网络故障，家长可稍后补卡，当天内有效）
- 不接入任何第三方统计 SDK
