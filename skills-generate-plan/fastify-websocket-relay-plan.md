# `fastify-websocket-relay` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `fastify-websocket-relay` skill。

该方案的目标是把 PocketCoder V1 已经确定的 relay 端职责，沉淀为一个可重复使用的服务端实现技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`fastify-websocket-relay` 的唯一职责，是为 PocketCoder V1 设计、实现并修正 `apps/relay` 服务端骨架与核心数据流。

它必须完成以下事情：
- 初始化或修正 `apps/relay` 的服务结构
- 建立 Fastify + WebSocket 的服务入口和模块边界
- 建立设备注册、连接路由、心跳、在线状态、事件回放和命令去重的服务端基础
- 建立 SQLite 存储入口与 repository 边界
- 确保 relay 始终只处理路由、元数据和加密 payload，而不承载 AI 会话逻辑

## 3. Skill 边界

### 3.1 负责范围
- 定义 `apps/relay` 的目录结构与模块边界
- 设计 Fastify HTTP 入口与 WebSocket 入口
- 设计 pairing、devices、sessions、replay、presence 这些服务模块的职责
- 设计 `security/`、`storage/`、`transport/`、`infra/` 的职责分工
- 定义 SQLite 访问层、migrations 目录和 repository 边界
- 设计 relay 端的连接生命周期、心跳、在线状态、事件回放、命令去重的实现骨架
- 补充 relay 端最小测试和结构校验策略

### 3.2 不负责范围
- 不负责 `protocol` 消息 schema 设计
- 不负责 `agentd` 的 PTY 和本地会话逻辑
- 不负责 `web` 页面与浏览器交互
- 不负责设备密钥生成与加密算法实现
- 不负责前端或桌面端的消息解密
- 不负责 Docker Compose、自托管部署编排和 TLS/反向代理
- 不负责真实 AI 会话运行和任何明文会话解析

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 实现或修正 `apps/relay`
- 搭建 Fastify + WebSocket relay 服务
- 设计设备连接、会话订阅、事件转发、回放、心跳和在线状态
- 修复 relay 的目录结构、模块分层、HTTP/WS 入口或 SQLite 存储组织
- 按 PocketCoder 规范创建 relay 服务端骨架

以下情况不应由该 skill 处理：
- 设计共享协议 package
- 实现桌面端 PTY 和会话采集
- 实现浏览器端 PWA 页面
- 设计具体加密协议或端侧密钥管理
- 编写 Docker Compose、自托管脚本或部署流程

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- `apps/relay` 技术路线固定为 Fastify + WebSocket + SQLite
- relay 只承担设备注册、连接路由、加密消息转发、短期加密事件回放、心跳和在线状态
- relay 不运行任何 AI 会话逻辑，不解析 `codex` 会话明文
- relay 只持有最小化元数据和加密 payload/blob
- 所有跨端消息结构都来自 `packages/protocol`
- relay 必须对入站边界做 schema 校验，但不得自行发明脱离 `protocol` 的共享消息结构
- 模块划分必须符合高内聚、低耦合
- 数据访问必须通过 repository 边界，不得让 transport 或 module 直接散写 SQLite 细节
- 单用户、自托管、Windows 优先的 V1 假设不变

## 6. 固定 relay 范围

该 skill 必须以 V1 已确定的 relay 范围为基础，至少覆盖以下内容：

### 6.1 服务职责
- 设备注册与配对支持
- WebSocket 实时连接
- 会话路由与订阅
- 加密消息转发
- 最近窗口事件回放
- 心跳与在线状态
- 已处理命令去重

### 6.2 最小化存储内容
- 设备信息
- 配对 token
- 会话路由信息
- 心跳时间戳
- TTL 加密事件 blob
- 已撤销设备标记
- 已处理命令记录

### 6.3 目录模块
- `modules/pairing`
- `modules/devices`
- `modules/sessions`
- `modules/replay`
- `modules/presence`
- `transport/http`
- `transport/ws`
- `security`
- `storage`
- `infra`

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/fastify-websocket-relay/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- relay 的结构和职责必须跟随本项目协议与实现演进同步
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/fastify-websocket-relay/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ relay-constraints.md
│  ├─ module-map.md
│  ├─ transport-flow.md
│  └─ storage-contracts.md
├─ assets/
│  └─ templates/
│     └─ relay/
│        ├─ package.json
│        ├─ tsconfig.json
│        ├─ src/
│        │  ├─ app.ts
│        │  ├─ server.ts
│        │  ├─ modules/
│        │  ├─ transport/
│        │  ├─ security/
│        │  ├─ storage/
│        │  └─ infra/
│        └─ tests/
└─ scripts/
   ├─ init_relay_service.py
   └─ verify_relay_service.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段参考文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 创建或修正 relay 前必须读取哪些项目约束
- 如何划分 `modules/`、`transport/`、`security/`、`storage/`、`infra/`
- 如何保持 relay 只处理路由与元数据，不越界承载业务逻辑
- 何时读取 `references/relay-constraints.md`
- 何时读取 `references/module-map.md`
- 何时读取 `references/transport-flow.md`
- 何时读取 `references/storage-contracts.md`
- 何时使用 `scripts/init_relay_service.py`
- 何时使用 `scripts/verify_relay_service.py`
- 不得越界实现 `protocol`、`agentd`、`web` 逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `fastify-websocket-relay`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的 `apps/relay` 服务，适用于 Fastify、WebSocket、SQLite、连接路由、心跳、回放和去重的实现骨架

## 10. `references/` 设计要求

### 10.1 `references/relay-constraints.md`
该文件负责提炼 relay 端固定约束，只保留服务端实现需要的内容，包括：
- relay 只做弱逻辑和路由
- 不处理 AI 会话和明文内容
- 最小元数据原则
- 单用户、自托管约束
- WebSocket 主通道约束
- schema 校验边界
- 不允许做的结构性错误

### 10.2 `references/module-map.md`
该文件负责列出 `apps/relay` 各模块职责，包括：
- pairing
- devices
- sessions
- replay
- presence
- security
- storage
- transport/http
- transport/ws
- infra

### 10.3 `references/transport-flow.md`
该文件负责列出 HTTP 和 WebSocket 的数据流边界，包括：
- 配对相关 HTTP 流程
- 连接认证和初始化流程
- 会话订阅流程
- 消息转发流程
- 心跳与 presence 流程
- 最近事件回放流程
- 命令去重流程

### 10.4 `references/storage-contracts.md`
该文件负责列出 relay 存储层的职责边界，包括：
- SQLite 入口
- migrations 职责
- repositories 职责
- 最小化元数据范围
- 不允许持久化的内容
- 哪些 repository 必须存在

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的 relay 服务骨架”为原则，不提前塞入业务细节。

### 11.1 必须包含的模板文件
- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/server.ts`
- `src/modules/pairing/.gitkeep` 或最小模块入口
- `src/modules/devices/.gitkeep` 或最小模块入口
- `src/modules/sessions/.gitkeep` 或最小模块入口
- `src/modules/replay/.gitkeep` 或最小模块入口
- `src/modules/presence/.gitkeep` 或最小模块入口
- `src/transport/http/.gitkeep` 或最小路由入口
- `src/transport/ws/.gitkeep` 或最小路由入口
- `src/security/token-service.ts`
- `src/security/access-control.ts`
- `src/security/device-registry.ts`
- `src/storage/sqlite.ts`
- `src/storage/migrations/.gitkeep`
- `src/storage/repositories/.gitkeep`
- `src/infra/config.ts`
- `src/infra/logger.ts`
- `tests/unit/.gitkeep` 或最小测试模板
- `tests/integration/.gitkeep` 或最小测试模板

### 11.2 模板职责
- `app.ts`：组装 Fastify app、插件和模块入口
- `server.ts`：启动服务进程
- `modules/`：按领域划分服务能力
- `transport/http/`：只负责 HTTP 入口和请求装配
- `transport/ws/`：只负责 WebSocket 连接与事件装配
- `security/`：负责 token、访问控制、设备注册边界
- `storage/`：负责 SQLite、migrations 和 repositories
- `infra/`：负责配置、日志等基础设施
- `tests/`：保护 relay 的结构、流程和边界

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_relay_service.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `apps/relay` 的目录结构
- 写入模板文件
- 保持模块分层与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_relay_service.py`
该脚本负责 relay 层校验，至少检查：
- `apps/relay` 是否存在
- 是否存在固定的 `modules/`、`transport/`、`security/`、`storage/`、`infra/`
- `app.ts` 和 `server.ts` 是否存在
- 是否出现越界共享层或不合理目录
- 是否存在基本单测与集成测试目录
- 是否缺少最小 storage/repository 结构

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前 `apps/relay` 状态和项目文档。
2. 判断当前任务是初始化、修正还是 relay 结构扩展。
3. 读取 `references/relay-constraints.md`，确认固定约束。
4. 读取 `references/module-map.md`，确认模块职责。
5. 读取 `references/transport-flow.md`，确认 HTTP/WS 流程边界。
6. 读取 `references/storage-contracts.md`，确认 SQLite 与 repository 边界。
7. 运行 `scripts/init_relay_service.py` 初始化或修正 relay 骨架。
8. 运行 `scripts/verify_relay_service.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
10. 输出 relay 结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空包前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 `apps/relay`
- 是否生成固定的模块和最小服务入口
- 是否生成最小 storage、security、transport、tests 结构

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现 relay 端结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、`agentd`、`web` 的业务实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的 `apps/relay`
- 能修正缺失或偏离规范的 relay 目录结构
- 不会越界承载 AI 会话逻辑或明文业务逻辑
- 服务结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `fastify-websocket-relay` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定服务职责
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
