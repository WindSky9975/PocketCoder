# V1 方案：自托管的手机远程控制 Codex

## 概述
构建一个自托管、移动端优先的 PWA，用来远程控制运行在用户电脑上的 `codex` 会话。这个方案应直接借鉴 Happy 的核心架构原则：服务端保持“无状态/弱逻辑”，Agent 必须运行在本机，真正的产品价值在协议层和安全模型上。

V1 范围固定为：
- 移动端优先的 Web/PWA，不做原生 App
- 仅支持自托管 relay
- 支持远程查看会话、发送 prompt、处理授权/继续执行类操作
- 先支持 `codex`，同时在抽象层面为后续接入 `claude code` 留出扩展点

## 实现方案
### 总体架构
- 使用 monorepo，拆成 4 个包：
  - `web`：移动端优先的 PWA，提供会话列表、实时输出、输入框、授权操作界面
  - `agentd`：本地桌面 daemon/CLI 包装器，负责启动并监管 `codex`
  - `relay`：轻量级 WebSocket/HTTP 服务，负责设备认证、转发加密消息、存储短期加密历史
  - `protocol`：共享的 TypeScript 类型和 Zod schema，定义所有传输消息
- 服务端不运行 AI 会话。`agentd` 负责进程生命周期、PTY 捕获、会话状态和本机信任边界。
- `relay` 仅负责：
  - 设备注册/配对
  - 加密消息转发
  - 基于加密事件 blob 的断线重放
  - 在线状态/心跳元数据

### 本地 Agent（`agentd`）
- 通过 PTY 启动 `codex`，确保可以可靠捕获输出流、提示状态和交互状态。
- 对外暴露统一的本地会话模型：
  - `sessionId`
  - `provider` = `codex`
  - `status` = idle/running/waiting_input/waiting_approval/error/disconnected
  - `currentTask`
  - `lastActivityAt`
- 需要实现的出站事件：
  - `session.started`
  - `session.output.delta`
  - `session.state.changed`
  - `session.approval.requested`
  - `session.error`
  - `session.ended`
- 需要实现的入站命令：
  - `input.sendPrompt`
  - `input.approvalResponse`
  - `input.interrupt`
  - `input.resumeDesktopControl`
  - `session.list`
  - `session.subscribe`
- 桌面端始终作为事实来源。如果检测到本地键盘恢复输入，则标记远程控制失效，并向手机客户端推送状态变更。

### Web/PWA
- 以窄屏/手机界面为第一优先级。
- 核心页面：
  - 配对/登录
  - 会话列表
  - 会话实时详情页
  - 授权/操作面板
  - 连接异常/错误状态页
- 会话详情页必须支持：
  - 实时日志/输出流展示
  - 底部固定输入框，用于发送下一条 prompt
  - 授权卡片，支持 allow/deny
  - 明确的“把控制权还给桌面端”操作
- 以 PWA 形式交付，具备安装能力和后续接入推送通知的结构，但 V1 不依赖推送通知完成核心流程。

### Relay 与安全模型
- 使用 WebSocket 作为主传输通道。
- 会话流量使用端到端加密：
  - 桌面设备首次运行时生成长期密钥对
  - 手机/浏览器设备首次配对时生成自己的密钥对
  - 配对时通过一次性 token 交换公钥
  - relay 只保存加密后的 payload 和最少量路由元数据
- 配对流程：
  - 用户执行 `agentd auth`
  - 桌面端生成一次性配对 token，并展示二维码和 URL
  - 手机端打开 PWA，通过扫码或打开链接发起配对
  - relay 注册设备，并返回加密后的会话访问能力
- 服务端元数据严格最小化：
  - account/device id
  - 会话路由 id
  - 心跳时间戳
  - 带 TTL 的加密事件 blob
- 加密历史只保留到足够支持断线重连和最近一段滚动回放即可。

### 协议 / 接口
- 在 `protocol` 包中定义所有传输消息，并使用版本化 schema。
- 最少需要的消息类型：
  - `PairingInit`
  - `PairingConfirm`
  - `DeviceRegistered`
  - `SessionSummary`
  - `SessionSubscribe`
  - `SessionOutputDelta`
  - `SessionStateChanged`
  - `ApprovalRequested`
  - `ApprovalResponse`
  - `SendPrompt`
  - `InterruptSession`
  - `ResumeDesktopControl`
  - `Ack`
  - `ErrorEnvelope`
- 从第一天开始，所有 envelope 必须包含 `protocolVersion`。

## 测试计划
- 配对：
  - 桌面端生成 token，手机端成功配对
  - 过期 token / 已使用 token 会被拒绝
  - 未配对设备不能订阅会话
- 会话控制：
  - 启动 `codex` 后，输出可以实时推送到手机端
  - 手机端发送 prompt，agent 端只收到一次
  - 授权请求可以在手机端正确展示，响应能回传到桌面端
  - 检测到本地键盘输入后，远程控制状态能被正确撤销
- 可靠性：
  - 手机端断线重连后可以回放最近的加密历史
  - relay 重启不会破坏桌面端当前会话状态
  - 通过消息 id 去重，避免命令重复执行
- 安全性：
  - relay 无法读取明文会话内容
  - 错误设备密钥不能解密会话历史
  - 被撤销设备无法继续访问后续会话
- 兼容性：
  - 在开始做 Claude 适配前，先确认 PTY 包装层在目标桌面系统上稳定可用

## 假设
- V1 面向单用户，不支持团队协作或共享工作区。
- 认证方式采用设备配对，而不是邮箱/密码。
- 初始只实现 `codex`，但现在就预留 provider 抽象，`claude code` 适配器后续再加。
- V1 每个会话只允许一个远程控制端处于活跃状态。
- 推送通知、计费、多租户 SaaS、原生移动端、任意 shell/file browser 远控均不在 V1 范围内。
- 推荐技术栈：
  - `web`：React + Vite 或 Next.js PWA
  - `agentd`：Node.js + PTY 库
  - `relay`：Fastify + WebSocket
  - `protocol`：TypeScript + Zod
  - 存储：SQLite/Postgres 存设备元数据，Redis 仅在后续确有必要时再引入
