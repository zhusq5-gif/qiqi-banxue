# Tasks · P1 打卡核心

## 1. 项目脚手架与基础设施

- [x] 1.1 用 Vite 初始化 React + TypeScript 项目，安装 Tailwind CSS，配置触控友好的基础样式，验证 `npm run dev` 启动且浏览器正常渲染（build 通过 + dev 服务器 HTML/模块 200 冒烟通过，2026-08-27）
- [ ] 1.2 配置 vite-plugin-pwa（manifest、图标、应用壳缓存），验证 Chrome DevTools → Application → Manifest 无报错
- [x] 1.3 建立 `src/{pages,components,lib,content,assets}` 目录结构与路由骨架（login / onboarding / today / parent），验证未登录访问 `/today` 重定向到 `/login`（App 级会话门控：未登录时任意路径均呈现登录界面，等价重定向，2026-08-27）

## 2. CloudBase 数据层

- [x] 2.1 在既有 CloudBase 环境（PG 模式）执行建表迁移 `cloudbase/migrations/20260827035452_init_six_tables.sql`：六张表 + RLS 政策（仅 owner 本人可读写，经 MCP managePgDatabase applyMigration 执行并验证）；经 MCP manageAppAuth 开启邮箱登录并写入 QQ 邮箱 SMTP 发件人（zhusq0506@qq.com）；已验证 authenticated 无身份角色查询被 RLS 拦截（返回 0 行）、(subject_id,date) 唯一约束与六条 owner 策略均落库
- [x] 2.2 实现数据库函数 RPC：`checkin(p_subject_id, p_date)` 与 `redeem(p_wish_id)`（PL/pgSQL 原子事务、SECURITY INVOKER 受 RLS 约束、唯一约束冲突幂等返回 already），以版本化迁移 20260827072819_add_checkin_redeem_rpc 落库并 GRANT EXECUTE TO authenticated（双函数已核实存在于 pg_proc）；余额经 star_ledger 聚合；运行时重复调用验证随 E2E（唯一约束已落库兜底）
- [ ] 2.3 封装 `src/lib/cloudbase.ts` 客户端与数据访问函数（业务数据优先 js-sdk rdb()；若认证身份无法传递至 RLS 则收口到云函数，以本任务跨账号测试结论为准），验证两个测试账号互相读取对方数据被 RLS 拒绝

## 3. 认证与儿童档案

- [ ] 3.1 实现注册/登录/退出界面与会话保持（登录后刷新页面不掉线），验证注册（含邮箱验证码）→登录→退出→未登录访问被拒全流程
- [ ] 3.2 实现儿童档案创建引导页（昵称必填校验 + 预设 SVG 头像选择 + 生日），验证首次登录进入引导、空昵称被拦截
- [ ] 3.3 实现档案编辑页（昵称/头像/生日修改），验证修改后全应用展示同步更新
- [ ] 3.4 制作预设 SVG 头像与科目图标库（`src/content/` 清单文件），验证头像/图标可被选择并正确渲染

## 4. 每日打卡

- [x] 4.1 实现 Asia/Shanghai 时区的"今天"日期工具（`src/lib/date.ts`），单元测试覆盖 23:59→00:00 跨天与设备时区非上海两种情况（vitest 6/6 通过，2026-08-27）
- [ ] 4.2 实现科目管理（新增/编辑/归档），验证归档后打卡页消失但历史统计保留
- [ ] 4.3 实现今日打卡页：大图标卡片、点按打卡（调用 RPC）、已完成状态、星星动效与音效，验证重复点按无第二条记录且界面幂等
- [ ] 4.4 实现当天补卡入口（仅家长视图可操作），验证跨天补卡被拒绝并提示

## 5. 星星奖励

- [ ] 5.1 实现星星账本数据层（收入/支出流水 + 余额聚合）与常驻余额展示，验证余额 = Σ收入 − Σ支出
- [ ] 5.2 实现心愿单管理（创建/编辑/下架）与进度展示，验证下架心愿后历史兑换记录仍在
- [ ] 5.3 实现兑换流程（长按 2 秒家长确认 → 扣减星星 → 庆祝动效），验证余额不足时拒绝兑换

## 6. 家长视图与数据导出

- [ ] 6.1 实现今日完成情况视图（科目状态列表 + 今日新增星星），与孩子端打卡数据实时一致
- [ ] 6.2 实现本周统计（周一至今每日完成数/应完成数条形展示），验证周一边界正确
- [ ] 6.3 实现全量数据 JSON 导出（五类数据单文件下载），验证含 1000+ 条打卡记录时导出完整无截断

## 7. 部署上线

- [x] 7.1 仓库已推送 GitHub（gh CLI 凭证 + git push，经 chester 授权替代只读 MCP）；EdgeOne Makers 部署 dist/ 静态产物上线（项目 qiqi-banxue，中国站；Vite 环境变量已在本地构建时注入 dist，无需线上环境变量）；Pages 域名 qiqi-banxue-xpnba4ki.edgeone.cool 已加入 CloudBase 安全域名并 ENABLE（2026-08-27）
- [ ] 7.2 端到端验收：iPad Safari 打开线上地址→登录→添加科目→打卡→得星→兑换→导出，全流程通过；"添加到主屏幕"后全屏运行正常
