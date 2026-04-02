# `node-pty-agentd` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `node-pty-agentd` skill。

该方案的目标是把 PocketCoder V1 已经确定的桌面端 agent 职责，沉淀为一个可重复使用的本地代理实现技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`node-pty-agentd` 的唯一职责，是为 PocketCoder V1 设计、实现并修正 `apps/agentd` 的桌面端代理骨架与核心执行流。

它必须完成以下事情：
- 初始化或修正 `apps/agentd` 的目录结构
- 建立 Node.js CLI 守护进程入口和命令组织方式
- 建立 `codex` provider 的 PTY 启动、输出采集和会话状态维护骨架
- 建立本地会话注册表、状态机、命令处理和事件发布边界
- 建立与 relay 通信的 transport 骨架
- 为安全模块和 Windows 平台能力留出清晰接入点，而不把它们实现细节混进主执行流

## 3. Skill 边界

### 3.1 负责范围
- 定义 `apps/agentd` 的目录结构与模块边界
- 设计 CLI 入口和命令分发方式
- 设计 `providers/codex/` 中的 PTY 启动、输出解析和 session adapter 骨架
- 设计 `sessions/` 中的 session manager、registry 和状态机职责
- 设计 `transport/` 中的 relay client、command handler、event publisher 边界
- 设计 `infra/` 中的配置、日志、路径和 bootstrap 入口
- 为 `security/`、`platform/windows/` 提供稳定接入点和调用边界
- 补充 agentd 端最小测试和结构校验策略

### 3.2 不负责范围
- 不负责 `protocol` 消息 schema 设计
- 不负责 `relay` 服务端 HTTP/WebSocket 业务实现
- 不负责 `web` 页面与浏览器交互
- 不负责设备密钥、公钥交换、加解密细节实现
- 不负责 Windows 输入恢复检测的底层实现细节
- 不负责 Docker、自托管部署和服务编排
- 不负责真实业务 prompt 逻辑和前端展示

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 实现或修正 `apps/agentd`
- 搭建 Node.js CLI 桌面守护进程
- 搭建 `codex` PTY provider 骨架
- 设计本地会话注册表、命令处理、事件发布和 relay 连接结构
- 修复 agentd 的目录结构、CLI 入口、状态机或 transport 分层
- 按 PocketCoder 规范创建 agentd 运行时骨架

以下情况不应由该 skill 处理：
- 设计共享协议 package
- 实现 relay 服务逻辑
- 实现浏览器端 PWA 页面
- 设计设备配对和 E2EE 细节
- 设计 Windows 底层输入恢复检测逻辑

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- `apps/agentd` 技术路线固定为 Node.js CLI 守护进程，不做 GUI，不做托盘
- agentd 通过 PTY 启动真实 `codex` 进程
- agentd 是本地事实来源，负责进程生命周期、会话状态和本机信任边界
- agentd 只通过 `packages/protocol` 与其他端共享消息契约
- agentd 必须维护统一的 `sessionId/provider/status/currentTask/lastActivityAt` 会话模型
- agentd 必须支持 `session.started`、`session.output.delta`、`session.state.changed`、`session.approval.requested`、`session.error`、`session.ended`
- agentd 必须接收入站命令：发送 prompt、授权响应、中断、恢复桌面控制、会话列表、会话订阅
- 模块划分必须符合高内聚、低耦合
- `security/` 和 `platform/windows/` 必须隔离成独立边界，不能把其实现散入 CLI、sessions 或 providers
- 单用户、Windows 优先、真实 `codex` 接入的 V1 假设不变

## 6. 固定 agentd 范围

该 skill 必须以 V1 已确定的 agentd 范围为基础，至少覆盖以下内容：

### 6.1 CLI 与启动
- 守护进程启动入口
- 命令分发入口
- `agentd auth` 之类命令的骨架位置
- bootstrap 流程

### 6.2 Provider 与 PTY
- `codex` provider 目录
- PTY 启动入口
- 输出流采集入口
- 输出解析入口
- session adapter 入口

### 6.3 会话管理
- session manager
- session registry
- session state machine
- current task 与 last activity 更新边界

### 6.4 传输与事件
- relay client
- command handler
- event publisher
- 会话事件上报边界

### 6.5 平台与安全接入点
- `security/` 作为设备密钥、配对、加密的边界目录
- `platform/windows/` 作为输入恢复检测和桌面控制边界目录

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/node-pty-agentd/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- agentd 的结构和职责必须跟随本项目协议与桌面端实现演进同步
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/node-pty-agentd/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ agentd-constraints.md
│  ├─ provider-flow.md
│  ├─ session-model.md
│  └─ transport-contracts.md
├─ assets/
│  └─ templates/
│     └─ agentd/
│        ├─ package.json
│        ├─ tsconfig.json
│        ├─ src/
│        │  ├─ bootstrap.ts
│        │  ├─ cli/
│        │  ├─ providers/
│        │  ├─ sessions/
│        │  ├─ transport/
│        │  ├─ security/
│        │  ├─ platform/
│        │  └─ infra/
│        └─ tests/
└─ scripts/
   ├─ init_agentd_service.py
   └─ verify_agentd_service.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段参考文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 创建或修正 agentd 前必须读取哪些项目约束
- 如何划分 `cli/`、`providers/`、`sessions/`、`transport/`、`security/`、`platform/`、`infra/`
- 如何保持 PTY 逻辑、会话管理和 relay 通信各自独立
- 何时读取 `references/agentd-constraints.md`
- 何时读取 `references/provider-flow.md`
- 何时读取 `references/session-model.md`
- 何时读取 `references/transport-contracts.md`
- 何时使用 `scripts/init_agentd_service.py`
- 何时使用 `scripts/verify_agentd_service.py`
- 不得越界实现 `protocol`、`relay`、`web` 或深度安全/平台逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `node-pty-agentd`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的 `apps/agentd` 桌面端代理，适用于 Node.js CLI、PTY provider、会话状态、relay 通信和命令处理骨架

## 10. `references/` 设计要求

### 10.1 `references/agentd-constraints.md`
该文件负责提炼 agentd 端固定约束，只保留桌面端实现需要的内容，包括：
- agentd 是本地事实来源
- Node.js CLI 守护进程约束
- 真实 `codex` PTY 接入约束
- 单用户、Windows 优先假设
- 不允许做的结构性错误

### 10.2 `references/provider-flow.md`
该文件负责列出 provider 和 PTY 相关数据流边界，包括：
- `codex` 启动流程
- PTY 输出采集流程
- 输出解析到协议事件的流转
- 审批请求和状态变化的入口边界
- provider 与 sessions 的职责分离

### 10.3 `references/session-model.md`
该文件负责列出 agentd 会话模型与状态流，包括：
- `sessionId`
- `provider`
- `status`
- `currentTask`
- `lastActivityAt`
- 状态转换边界
- registry、manager、state machine 各自职责

### 10.4 `references/transport-contracts.md`
该文件负责列出 relay 通信边界，包括：
- relay client 职责
- command handler 职责
- event publisher 职责
- 与 `protocol` 的依赖边界
- 不允许直接耦合到 relay 内部实现的约束

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的 agentd 运行时骨架”为原则，不提前塞入具体业务细节。

### 11.1 必须包含的模板文件
- `package.json`
- `tsconfig.json`
- `src/bootstrap.ts`
- `src/cli/index.ts`
- `src/cli/commands/.gitkeep` 或最小命令入口
- `src/providers/codex/codex-pty.ts`
- `src/providers/codex/codex-parser.ts`
- `src/providers/codex/codex-session-adapter.ts`
- `src/sessions/session-manager.ts`
- `src/sessions/session-registry.ts`
- `src/sessions/state-machine.ts`
- `src/transport/relay-client.ts`
- `src/transport/command-handler.ts`
- `src/transport/event-publisher.ts`
- `src/security/device-keys.ts` 或占位模板
- `src/security/pairing.ts` 或占位模板
- `src/security/encryptor.ts` 或占位模板
- `src/platform/windows/desktop-control.ts` 或占位模板
- `src/infra/config.ts`
- `src/infra/logger.ts`
- `src/infra/paths.ts`
- `tests/unit/.gitkeep` 或最小测试模板
- `tests/integration/.gitkeep` 或最小测试模板

### 11.2 模板职责
- `bootstrap.ts`：组装 agentd 服务和依赖
- `cli/`：处理命令入口和参数解析
- `providers/codex/`：封装 PTY、解析器和 provider adapter
- `sessions/`：负责本地会话状态与注册表
- `transport/`：负责 relay 通信和命令/事件边界
- `security/`：只作为后续配对与加密接入点，不在此 skill 中实现深度细节
- `platform/windows/`：只作为后续桌面控制接入点，不在此 skill 中实现底层细节
- `infra/`：负责配置、日志、路径等基础设施
- `tests/`：保护 PTY 骨架、会话流和命令边界

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_agentd_service.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `apps/agentd` 的目录结构
- 写入模板文件
- 保持模块分层与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_agentd_service.py`
该脚本负责 agentd 层校验，至少检查：
- `apps/agentd` 是否存在
- 是否存在固定的 `cli/`、`providers/`、`sessions/`、`transport/`、`security/`、`platform/`、`infra/`
- `bootstrap.ts` 和 CLI 入口是否存在
- 是否出现越界共享层或不合理目录
- 是否存在基本单测与集成测试目录
- 是否缺少最小 provider、session、transport 结构

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前 `apps/agentd` 状态和项目文档。
2. 判断当前任务是初始化、修正还是 agentd 结构扩展。
3. 读取 `references/agentd-constraints.md`，确认固定约束。
4. 读取 `references/provider-flow.md`，确认 provider/PTy 流程边界。
5. 读取 `references/session-model.md`，确认会话模型与状态流。
6. 读取 `references/transport-contracts.md`，确认 relay 通信边界。
7. 运行 `scripts/init_agentd_service.py` 初始化或修正 agentd 骨架。
8. 运行 `scripts/verify_agentd_service.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
10. 输出 agentd 结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空包前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 `apps/agentd`
- 是否生成固定的 CLI、provider、sessions、transport、security、platform、infra 结构
- 是否生成最小测试目录和入口文件

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现 agentd 端结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、`relay`、`web` 的业务实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的 `apps/agentd`
- 能修正缺失或偏离规范的 agentd 目录结构
- 不会越界实现深度安全逻辑或平台底层逻辑
- 服务结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `node-pty-agentd` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定服务职责
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
