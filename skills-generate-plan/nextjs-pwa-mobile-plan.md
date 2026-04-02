# `nextjs-pwa-mobile` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `nextjs-pwa-mobile` skill。

该方案的目标是把 PocketCoder V1 已经确定的移动端 Web/PWA 职责，沉淀为一个可重复使用的前端实现技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`nextjs-pwa-mobile` 的唯一职责，是为 PocketCoder V1 设计、实现并修正 `apps/web` 的移动端优先 PWA 骨架与核心页面流。

它必须完成以下事情：
- 初始化或修正 `apps/web` 的目录结构
- 建立 Next.js App Router 的页面入口和布局边界
- 建立移动端优先的配对页、会话列表页、会话详情页和连接异常页骨架
- 建立浏览器端实时连接、设备本地存储、PWA 安装能力的接入边界
- 为浏览器端配对、加解密、协议适配和状态展示留出清晰接入点，而不把深层逻辑混进页面层

## 3. Skill 边界

### 3.1 负责范围
- 定义 `apps/web` 的目录结构与模块边界
- 设计 `src/app/`、`src/features/`、`src/components/ui/`、`src/lib/`、`src/tests/` 的职责分工
- 设计 Next.js App Router 页面入口、布局和页面装配方式
- 设计浏览器端 `crypto/`、`protocol/`、`realtime/`、`storage/`、`pwa/` 这些接入目录的边界
- 设计移动端页面和核心交互骨架
- 设计最小冒烟测试和结构校验策略

### 3.2 不负责范围
- 不负责 `protocol` 消息 schema 设计
- 不负责 `relay` 服务端 HTTP/WebSocket 业务实现
- 不负责 `agentd` 的 PTY 和会话逻辑
- 不负责设备密钥、公钥交换、加解密细节实现
- 不负责真实 WebSocket 协议细节和消息去重实现
- 不负责浏览器推送通知、SaaS、多租户或原生 App 方案
- 不负责视觉资产生成和宣传页素材

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 实现或修正 `apps/web`
- 搭建 Next.js App Router 移动端 PWA
- 创建配对页、会话列表页、会话详情页、连接异常页骨架
- 搭建浏览器端实时连接、设备本地存储和 PWA 安装结构
- 修复 web 端目录结构、页面装配、移动端布局或前端分层
- 按 PocketCoder 规范创建移动端优先前端骨架

以下情况不应由该 skill 处理：
- 设计共享协议 package
- 实现 relay 服务逻辑
- 实现桌面端 PTY 和本地会话逻辑
- 设计设备配对和 E2EE 算法细节
- 生成产品宣传图或视觉素材

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- `apps/web` 技术路线固定为 Next.js App Router
- 前端必须移动端优先，不做原生 App
- 首版必须具备 PWA 安装能力
- 页面固定为：配对/登录页、会话列表页、会话详情页、连接异常页
- 会话详情页必须包含：实时输出流、底部固定 prompt 输入框、授权卡片 allow/deny、显式“把控制权还给桌面端”操作
- WebSocket 是唯一主实时通道
- `web` 只能通过 `packages/protocol` 共享消息契约，不得依赖 `agentd` 或 `relay` 源码
- 页面层不得直接承载配对算法、加解密细节或消息协议实现细节
- 模块划分必须符合高内聚、低耦合
- 默认中文文案结构，代码与协议命名默认英文

## 6. 固定 web 范围

该 skill 必须以 V1 已确定的 web 范围为基础，至少覆盖以下内容：

### 6.1 页面范围
- 配对/登录页
- 会话列表页
- 会话详情页
- 连接异常页

### 6.2 页面能力
- 实时输出流展示
- prompt 输入
- 授权请求展示与 allow/deny 交互入口
- 远程控制释放入口
- 已配对身份重连与订阅入口
- PWA 安装能力入口

### 6.3 前端内部边界
- `app/`：路由和页面装配
- `features/`：业务场景模块
- `components/ui/`：可复用基础组件
- `lib/crypto/`：浏览器端密钥与加解密接入边界
- `lib/protocol/`：协议适配边界
- `lib/realtime/`：WebSocket 连接、重连、订阅边界
- `lib/storage/`：设备信息和轻量持久化边界
- `lib/pwa/`：manifest、安装、service worker 接入边界

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/nextjs-pwa-mobile/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- web 端结构和页面职责必须跟随本项目协议与交互演进同步
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/nextjs-pwa-mobile/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ web-constraints.md
│  ├─ page-map.md
│  ├─ feature-boundaries.md
│  └─ pwa-contracts.md
├─ assets/
│  └─ templates/
│     └─ web/
│        ├─ package.json
│        ├─ tsconfig.json
│        ├─ next.config.ts
│        ├─ public/
│        │  ├─ icons/
│        │  └─ manifest.webmanifest
│        ├─ src/
│        │  ├─ app/
│        │  ├─ features/
│        │  ├─ components/
│        │  ├─ lib/
│        │  └─ tests/
│        └─ service-worker/
└─ scripts/
   ├─ init_web_app.py
   └─ verify_web_app.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段参考文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 创建或修正 web 前必须读取哪些项目约束
- 如何划分 `app/`、`features/`、`components/ui/`、`lib/`、`tests/`
- 如何保持页面层只做装配，不堆积协议、存储或实时细节
- 何时读取 `references/web-constraints.md`
- 何时读取 `references/page-map.md`
- 何时读取 `references/feature-boundaries.md`
- 何时读取 `references/pwa-contracts.md`
- 何时使用 `scripts/init_web_app.py`
- 何时使用 `scripts/verify_web_app.py`
- 不得越界实现 `protocol`、`relay`、`agentd` 或深度加密逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `nextjs-pwa-mobile`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的 `apps/web` 移动端 PWA，适用于 Next.js App Router、页面结构、实时会话 UI、PWA 安装和浏览器端接入骨架

## 10. `references/` 设计要求

### 10.1 `references/web-constraints.md`
该文件负责提炼 web 端固定约束，只保留前端实现需要的内容，包括：
- 移动端优先约束
- Next.js App Router 约束
- PWA 交付约束
- 固定页面范围
- WebSocket 主实时通道约束
- 不允许做的结构性错误

### 10.2 `references/page-map.md`
该文件负责列出页面范围和职责，包括：
- 配对/登录页
- 会话列表页
- 会话详情页
- 连接异常页
- 每个页面的职责边界
- 页面之间的数据进入方式

### 10.3 `references/feature-boundaries.md`
该文件负责列出 feature 与 lib 的边界，包括：
- pairing
- sessions
- approvals
- connection
- crypto
- protocol
- realtime
- storage
- pwa

### 10.4 `references/pwa-contracts.md`
该文件负责列出 PWA 相关接入边界，包括：
- `manifest.webmanifest`
- icons
- 安装入口
- service worker 接入点
- 不依赖推送通知完成核心流程的约束

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的移动端 PWA 骨架”为原则，不提前塞入业务细节。

### 11.1 必须包含的模板文件
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `public/manifest.webmanifest`
- `public/icons/.gitkeep` 或最小图标占位
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/pair/page.tsx`
- `src/app/sessions/page.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `src/app/connection-error/page.tsx`
- `src/features/pairing/.gitkeep` 或最小 feature 入口
- `src/features/sessions/.gitkeep` 或最小 feature 入口
- `src/features/approvals/.gitkeep` 或最小 feature 入口
- `src/features/connection/.gitkeep` 或最小 feature 入口
- `src/components/ui/.gitkeep` 或最小组件入口
- `src/lib/crypto/.gitkeep` 或最小接入入口
- `src/lib/protocol/.gitkeep` 或最小接入入口
- `src/lib/realtime/.gitkeep` 或最小接入入口
- `src/lib/storage/.gitkeep` 或最小接入入口
- `src/lib/pwa/.gitkeep` 或最小接入入口
- `src/tests/smoke/.gitkeep` 或最小测试模板
- `src/tests/unit/.gitkeep` 或最小测试模板

### 11.2 模板职责
- `app/`：页面入口、布局和页面级装配
- `features/`：按业务场景组织页面逻辑
- `components/ui/`：放通用基础组件，不放业务状态机
- `lib/crypto/`：浏览器端加解密接入边界
- `lib/protocol/`：协议适配边界
- `lib/realtime/`：WebSocket 连接、订阅、重连边界
- `lib/storage/`：设备信息和本地持久化边界
- `lib/pwa/`：manifest、安装和 service worker 接入边界
- `tests/`：保护页面访问、主链路和关键状态展示

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_web_app.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `apps/web` 的目录结构
- 写入模板文件
- 保持模块分层与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_web_app.py`
该脚本负责 web 层校验，至少检查：
- `apps/web` 是否存在
- 是否存在固定的 `app/`、`features/`、`components/ui/`、`lib/`、`tests/`
- `layout.tsx`、`globals.css` 和核心页面是否存在
- 是否出现越界共享层或不合理目录
- 是否存在 manifest 和最小 PWA 入口
- 是否缺少最小 smoke/unit 测试目录

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前 `apps/web` 状态和项目文档。
2. 判断当前任务是初始化、修正还是 web 结构扩展。
3. 读取 `references/web-constraints.md`，确认固定约束。
4. 读取 `references/page-map.md`，确认页面职责。
5. 读取 `references/feature-boundaries.md`，确认 feature 与 lib 边界。
6. 读取 `references/pwa-contracts.md`，确认 PWA 接入边界。
7. 运行 `scripts/init_web_app.py` 初始化或修正 web 骨架。
8. 运行 `scripts/verify_web_app.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
10. 输出 web 结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空包前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 `apps/web`
- 是否生成固定页面结构、feature 结构和 lib 边界
- 是否生成最小 PWA 入口和测试目录

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现 web 端结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、`relay`、`agentd` 的业务实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的 `apps/web`
- 能修正缺失或偏离规范的 web 目录结构
- 不会越界实现深度协议、加密或 relay 逻辑
- 前端结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `nextjs-pwa-mobile` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定页面范围
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
