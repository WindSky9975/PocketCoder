# `protocol-schema-design` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `protocol-schema-design` skill。

该方案的目标是把 PocketCoder V1 已经确定的协议层约束，沉淀为一个可重复使用的协议设计技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`protocol-schema-design` 的唯一职责，是为 PocketCoder V1 设计并维护 `packages/protocol` 中的共享协议契约。

它必须完成以下事情：
- 定义协议层的消息模型与 envelope 结构
- 设计和维护 Zod schema、共享类型、错误码和常量
- 保证协议版本化、幂等、错误表达和兼容性约束清晰
- 保证 `web`、`agentd`、`relay` 三端共享同一协议真相源
- 为后续实现提供清晰、可验证、可扩展的协议基础

## 3. Skill 边界

### 3.1 负责范围
- 定义 `packages/protocol` 的目录结构
- 定义 protocol envelope、message types、session status、error codes
- 定义 Zod schema 组织方式
- 定义导出入口与共享类型组织方式
- 约束命令消息、事件消息、错误消息和兼容策略
- 为协议设计补充最小测试和兼容校验策略

### 3.2 不负责范围
- 不负责 `web` 页面实现
- 不负责 `agentd` PTY 逻辑
- 不负责 `relay` WebSocket/HTTP 业务实现
- 不负责 SQLite 表结构设计
- 不负责加密算法实现
- 不负责桌面端输入恢复检测实现
- 不负责前端状态管理和 UI 组件设计

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 设计共享协议层
- 设计或重构 `packages/protocol`
- 新增消息类型、状态枚举、错误码、schema
- 处理协议版本兼容、消息 envelope、命令/事件边界
- 校正三端共享契约的目录和导出方式

以下情况不应由该 skill 处理：
- 直接实现 relay 服务逻辑
- 直接实现 agentd 会话逻辑
- 直接实现前端页面或交互
- 直接实现数据库或加密细节

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- `packages/protocol` 是唯一跨端共享契约源
- 所有三端共享消息都必须从 `protocol` 导出
- 所有 envelope 必须包含 `protocolVersion`
- 所有入站命令必须支持 `messageId` 幂等语义
- schema 默认使用 Zod
- 协议字段命名、类型名、错误码命名使用英文
- 协议设计必须服务当前 4 个 workspace，不得引入额外共享层
- 协议目录结构必须符合高内聚、低耦合要求
- 不得把实现细节、业务逻辑或平台逻辑混入 `protocol`

## 6. 固定协议范围

该 skill 必须以 V1 已确定的协议范围为基础，至少覆盖以下内容：

### 6.1 Envelope 基础字段
- `protocolVersion`
- `messageId`
- `timestamp`
- `type`
- `payload`

### 6.2 消息类型
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

### 6.3 会话状态
- `idle`
- `running`
- `waiting_input`
- `waiting_approval`
- `error`
- `disconnected`

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/protocol-schema-design/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- 它必须与本项目协议演进保持同步
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/protocol-schema-design/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ pocketcoder-protocol-constraints.md
│  ├─ message-catalog.md
│  └─ package-layout.md
├─ assets/
│  └─ templates/
│     └─ protocol/
│        ├─ src/
│        │  ├─ constants/
│        │  ├─ schemas/
│        │  ├─ errors/
│        │  ├─ utils/
│        │  └─ index.ts
│        └─ tests/
└─ scripts/
   ├─ init_protocol_package.py
   └─ verify_protocol_contracts.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段协议文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 开始设计前必须读取哪些项目约束
- 如何区分 constants、schemas、errors、utils 的职责
- 如何设计 envelope 与 message catalog
- 如何处理导出入口和共享边界
- 何时读取 `references/pocketcoder-protocol-constraints.md`
- 何时读取 `references/message-catalog.md`
- 何时读取 `references/package-layout.md`
- 何时使用 `scripts/init_protocol_package.py`
- 何时使用 `scripts/verify_protocol_contracts.py`
- 不得越界实现三端业务逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `protocol-schema-design`
- `description`: 明确说明它用于设计或修正 PocketCoder 的共享协议层，适用于 envelope、消息 schema、常量、错误码和 `packages/protocol` 结构设计

## 10. `references/` 设计要求

### 10.1 `references/pocketcoder-protocol-constraints.md`
该文件负责提炼项目专属协议约束，只保留 protocol 设计需要的内容，包括：
- V1 消息范围
- envelope 固定字段
- 会话状态范围
- `protocolVersion` 规则
- 幂等约束
- 错误 envelope 要求
- 不允许做的结构性错误

### 10.2 `references/message-catalog.md`
该文件负责列出所有消息类型的职责和方向，包括：
- 命令消息
- 事件消息
- 配对消息
- 错误消息
- 每类消息的发送方、接收方、最小 payload 范围
- 哪些消息必须有 ack，哪些必须可去重

### 10.3 `references/package-layout.md`
该文件负责列出 `packages/protocol` 的目录职责，包括：
- `constants/`
- `schemas/`
- `errors/`
- `utils/`
- `index.ts`
- `tests/`

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的共享协议包”为原则，不提前塞入业务实现。

### 11.1 必须包含的模板文件
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/constants/protocol-version.ts`
- `src/constants/message-types.ts`
- `src/constants/session-status.ts`
- `src/schemas/envelope.ts`
- `src/schemas/pairing.ts`
- `src/schemas/session.ts`
- `src/schemas/command.ts`
- `src/schemas/error.ts`
- `src/errors/codes.ts`
- `src/utils/message-id.ts`
- `tests/schema/.gitkeep` 或最小测试模板
- `tests/compatibility/.gitkeep` 或最小测试模板

### 11.2 模板职责
- `constants/`：放协议版本、消息类型、状态枚举
- `schemas/`：放所有 Zod schema
- `errors/`：放标准错误码与错误相关共享定义
- `utils/`：只放与协议紧密相关的轻量工具
- `index.ts`：统一导出稳定公共接口
- `tests/`：保护 schema 和兼容性

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_protocol_package.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `packages/protocol` 的目录结构
- 写入模板文件
- 保持目录和导出结构符合项目约束
- 在已有实现存在时尽量避免覆盖用户逻辑
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_protocol_contracts.py`
该脚本负责协议层校验，至少检查：
- `packages/protocol` 是否存在
- constants、schemas、errors、utils 是否存在
- `index.ts` 是否存在并作为统一导出入口
- 是否出现不允许的额外共享层
- 是否存在基本的 schema/compatibility 测试目录
- 是否缺少固定消息类型、会话状态和 envelope 文件

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前 `packages/protocol` 状态和项目文档。
2. 判断当前任务是初始化、修正还是协议扩展。
3. 读取 `references/pocketcoder-protocol-constraints.md`，确认固定约束。
4. 读取 `references/message-catalog.md`，确认消息职责与分类。
5. 读取 `references/package-layout.md`，确认目录和导出边界。
6. 运行 `scripts/init_protocol_package.py` 初始化或修正协议包骨架。
7. 运行 `scripts/verify_protocol_contracts.py` 校验结果。
8. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
9. 输出协议层结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空包前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 `packages/protocol`
- 是否生成固定的 constants、schemas、errors、utils 结构
- 是否生成最小测试目录和统一导出入口

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现协议层结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `web`、`agentd`、`relay` 的业务实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的 `packages/protocol`
- 能修正缺失或偏离规范的协议目录结构
- 不会越界实现三端业务逻辑
- 协议层结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `protocol-schema-design` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定消息范围
- 固定 envelope 结构
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
