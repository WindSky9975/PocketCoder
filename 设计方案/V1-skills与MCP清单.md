# PocketCoder V1 Skills 与 MCP 清单

## 1. 背景

本清单用于说明 PocketCoder V1 当前开发所需的 skills 和 MCP 能力，目标是让后续实现工作明确知道：
- 哪些能力当前已经可用
- 哪些能力当前缺失但建议补充
- 哪些是 V1 首批必须项
- 哪些只是辅助型能力，不应误判为核心阻塞项

本清单基于以下文档整理：
- `设计方案/V1-自托管的手机远程控制Codex.md`
- `设计方案/V1-实施规划.md`
- `项目开发规范.md`

V1 当前关键方向如下：
- `npm workspaces` monorepo
- `web`、`agentd`、`relay`、`protocol` 四个 workspace
- Windows 优先
- 真实 `codex` 的 PTY 接入
- 自托管 `relay + SQLite`
- 设备配对与消息级 E2EE

## 2. 当前环境可用的 Skills

### 2.1 当前内置且相关

#### `openai-docs`
- 当前可用：是
- V1 必需：否
- 主要用途：查询 OpenAI 官方文档、模型能力和 API 用法
- 使用时机：后续如果需要接入 OpenAI 官方接口、确认模型或 SDK 文档时使用
- 备注：它不是当前 V1 核心工程阻塞项，因为 V1 的主链路重点是 `web/agentd/relay/protocol`

#### `imagegen`
- 当前可用：是
- V1 必需：否
- 主要用途：生成位图类视觉素材、演示图、概念图
- 使用时机：后续如果要做产品宣传图、PWA 视觉素材或设计草图时使用
- 备注：不适合替代正式前端实现

### 2.2 当前内置但基本无关

#### `plugin-creator`
- 当前可用：是
- V1 必需：否
- 主要用途：创建 Codex 插件结构
- 使用时机：仅在要开发插件时使用

#### `skill-creator`
- 当前可用：是
- V1 必需：否
- 主要用途：创建新的技能文档与工作流
- 使用时机：当后续确定要为本项目沉淀专用 skill 时使用

#### `skill-installer`
- 当前可用：是
- V1 必需：否
- 主要用途：安装已有 skill
- 使用时机：当外部已有适合本项目的 skill 可直接复用时使用

## 3. 建议新增或自定义的 Skills

### 3.1 首批必须

#### `typescript-monorepo-bootstrap`
- 当前可用：否
- V1 必需：是
- 主要用途：初始化 `npm workspaces`、根脚本、TypeScript 严格模式、lint/test/typecheck 约束
- 使用时机：项目初始化阶段

#### `protocol-schema-design`
- 当前可用：否
- V1 必需：是
- 主要用途：定义 envelope、消息类型、Zod schema、错误码和兼容策略
- 使用时机：开始实现 `packages/protocol` 前

#### `node-pty-agentd`
- 当前可用：否
- V1 必需：是
- 主要用途：封装 `agentd` 的 PTY 启动、输出解析、会话状态维护和命令处理
- 使用时机：实现真实 `codex` 接入时

#### `fastify-websocket-relay`
- 当前可用：否
- V1 必需：是
- 主要用途：实现 `relay` 的 HTTP/WebSocket 服务、订阅、心跳、转发和事件回放
- 使用时机：实现服务端主链路时

#### `nextjs-pwa-mobile`
- 当前可用：否
- V1 必需：是
- 主要用途：实现移动端优先 PWA、安装能力、会话列表页、会话详情页和连接状态页
- 使用时机：实现 `web` 端主链路时

### 3.2 第二批建议补充

#### `e2ee-device-pairing`
- 当前可用：否
- V1 必需：是
- 主要用途：实现设备密钥、公钥交换、配对 token、消息加解密
- 使用时机：协议层和 `agentd/relay/web` 三端进入联调前

#### `windows-desktop-control`
- 当前可用：否
- V1 必需：是
- 主要用途：实现 Windows 输入恢复检测、本地控制权撤销和远程控制失效逻辑
- 使用时机：`agentd` 进入 Windows 特性开发阶段

#### `docker-compose-selfhost`
- 当前可用：否
- V1 必需：否
- 主要用途：整理 Docker Compose、自托管部署和本地运行方式
- 使用时机：服务端能本地跑通后

#### `qa-realtime-testing`
- 当前可用：否
- V1 必需：否
- 主要用途：构建协议测试、WebSocket 集成测试、PWA 冒烟测试和主链路回归测试
- 使用时机：进入联调和验收阶段

## 4. 当前环境可用的 MCP

### 4.1 当前实际有价值的 MCP

#### `browser / playwright`
- 当前可用：是
- V1 必需：是
- 主要用途：验证 PWA 页面、移动端视口、关键页面流程和浏览器端交互
- 使用时机：前端页面联调、配对流程验证、会话页冒烟测试
- 备注：这是当前最直接有工程价值的 MCP

### 4.2 当前资源型 MCP 状态

- 当前 `MCP resources`：空
- 当前 `MCP resource templates`：空
- 结论：当前没有可直接消费的资源型 MCP 上下文，暂时不能依赖 MCP 资源来提供代码库、数据库或文档内容

## 5. 建议补充的 MCP

### 5.1 首批必须

#### `filesystem`
- 当前可用：否
- V1 必需：是
- 主要用途：稳定读取项目文件、配置、文档和生成物
- 使用时机：代码规模扩大后，减少单纯依赖 shell 的上下文缺失

#### `sqlite`
- 当前可用：否
- V1 必需：是
- 主要用途：直接检查设备表、配对 token、事件回放和去重记录
- 使用时机：`relay` 开始使用 SQLite 后

#### `docker`
- 当前可用：否
- V1 必需：是
- 主要用途：管理 `docker compose`、容器状态、日志和镜像
- 使用时机：自托管部署与本地联调阶段

#### `git/github`
- 当前可用：否
- V1 必需：是
- 主要用途：查看提交、分支、PR、CI 状态和变更历史
- 使用时机：多人协作、持续集成和版本管理阶段

### 5.2 第二批建议补充

#### `http/api`
- 当前可用：否
- V1 必需：否
- 主要用途：直接调试配对接口、健康检查和服务端 HTTP 入口
- 使用时机：`relay` HTTP 接口增多后

#### `websocket`
- 当前可用：否
- V1 必需：否
- 主要用途：直接观察消息收发、订阅、重连和回放行为
- 使用时机：实时链路联调阶段

#### `docs`
- 当前可用：否
- V1 必需：否
- 主要用途：读取 Node.js、Next.js、Fastify、Zod、PTY 等官方文档
- 使用时机：遇到官方能力边界或版本差异问题时

#### `openai docs`
- 当前可用：否
- V1 必需：否
- 主要用途：读取 OpenAI 官方文档
- 使用时机：仅在项目后续明确接入 OpenAI 能力时需要

## 6. V1 首批必须清单

### Skills
- `typescript-monorepo-bootstrap`
- `protocol-schema-design`
- `node-pty-agentd`
- `fastify-websocket-relay`
- `nextjs-pwa-mobile`

### MCP
- `browser / playwright`
- `filesystem`
- `sqlite`
- `docker`
- `git/github`

## 7. 使用建议

- 当前可以直接用的核心能力，是浏览器自动化类 MCP 和已有的通用工程能力，不是现成的项目专用 skill。
- 当前内置 skills 里，没有一个能直接完整覆盖 `protocol`、`agentd`、`relay` 三块核心工程实现，因此后续最好补项目专用 skill。
- 对当前 V1 来说，`imagegen` 和 `openai-docs` 都属于辅助能力，不应排在 `protocol`、`agentd`、`relay` 之前。
- 如果后续只补最小集合，优先补 `filesystem`、`sqlite`、`docker` 这 3 个 MCP，以及 5 个首批核心 skills。
