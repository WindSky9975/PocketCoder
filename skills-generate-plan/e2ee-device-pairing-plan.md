# `e2ee-device-pairing` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `e2ee-device-pairing` skill。

该方案的目标是把 PocketCoder V1 已经确定的设备配对与端到端加密约束，沉淀为一个可重复使用的安全实现技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`e2ee-device-pairing` 的唯一职责，是为 PocketCoder V1 设计、实现并修正设备配对、设备密钥生命周期和消息级 E2EE 接入边界。

它必须完成以下事情：
- 建立 `agentd`、`relay`、`web` 三端与配对和密钥相关的结构边界
- 建立一次性配对 token、公钥交换、设备注册和设备撤销的实现骨架
- 建立消息加密、解密、密文转发和最小化元数据存储的接入边界
- 确保 relay 只能看到路由元数据和密文，不能读取会话明文
- 为后续联调提供统一、稳定、可验证的安全接入层

## 3. Skill 边界

### 3.1 负责范围
- 设计 `apps/agentd/src/security/` 的密钥、配对、加密边界
- 设计 `apps/relay/src/security/`、`apps/relay/src/modules/pairing/`、`apps/relay/src/storage/` 中与设备注册和配对相关的边界
- 设计 `apps/web/src/lib/crypto/` 和配对相关 feature 的浏览器端密钥与消息加解密接入边界
- 设计一次性 token、长期设备密钥、公钥交换、设备注册、设备撤销、会话访问能力的流程骨架
- 设计密文 payload、路由元数据、事件 blob、设备标识的存储与传输边界
- 设计配对与 E2EE 相关的最小测试和校验策略

### 3.2 不负责范围
- 不负责 `packages/protocol` 消息 schema 设计
- 不负责 `agentd` 的 PTY 和会话状态实现
- 不负责 `relay` WebSocket 主业务流实现
- 不负责 `web` 页面布局和交互细节
- 不负责 Docker、自托管和部署编排
- 不负责推送通知、多租户和团队协作模型
- 不负责 UI 文案、视觉设计和宣传素材

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 实现或修正设备配对流程
- 实现设备密钥、公钥交换、配对 token、消息加解密接入
- 修复 `agentd`、`relay`、`web` 三端与配对/E2EE 相关的目录边界
- 设计设备注册、设备撤销、访问能力与密文传输的安全骨架
- 按 PocketCoder 规范创建跨端的 E2EE 配对接入层

以下情况不应由该 skill 处理：
- 设计共享协议 package
- 实现桌面端 PTY 和本地会话状态机
- 实现 relay 的通用 WS/HTTP 业务结构
- 实现前端页面和移动端布局
- 设计 Windows 底层桌面控制逻辑

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- 首版安全模型固定为完整 E2EE 配对，不接受仅 token/TLS 的降级方案
- 桌面设备首次运行时生成长期密钥对
- 手机/浏览器设备首次配对时生成自己的密钥对
- 配对时通过一次性 token 交换公钥
- relay 只保存加密 payload 和最少量路由元数据
- relay 不得读取、记录或推断会话明文
- 设备撤销后不得继续访问后续会话
- 未配对设备不得订阅会话
- 所有敏感数据不得写入仓库、日志、测试快照或截图
- 模块划分必须符合高内聚、低耦合，安全逻辑不能散落在 UI、PTY 或通用 transport 代码里

## 6. 固定安全范围

该 skill 必须以 V1 已确定的安全范围为基础，至少覆盖以下内容：

### 6.1 配对流程
- `agentd auth` 生成一次性 token
- 桌面端展示 URL 或二维码内容
- 手机端使用 token 发起配对
- 双方交换公钥
- relay 注册设备并返回最小访问能力

### 6.2 密钥与设备
- 桌面端长期设备密钥
- 浏览器端设备密钥
- 设备标识与注册状态
- 设备撤销
- 配对 token 生命周期

### 6.3 消息级 E2EE
- 会话内容加密
- 会话内容解密
- 加密事件 blob
- 路由元数据与密文分离
- 密文历史的最近窗口回放

### 6.4 存储边界
- 设备信息
- 配对 token
- 会话路由 id
- 心跳时间戳
- TTL 加密事件 blob
- 已撤销设备标记

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/e2ee-device-pairing/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- 配对与 E2EE 规则必须随项目协议和实现边界同步演进
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/e2ee-device-pairing/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ crypto-constraints.md
│  ├─ pairing-flow.md
│  ├─ key-lifecycle.md
│  └─ storage-boundaries.md
├─ assets/
│  └─ templates/
│     ├─ agentd-security/
│     ├─ relay-security/
│     └─ web-crypto/
└─ scripts/
   ├─ init_pairing_layers.py
   └─ verify_pairing_layers.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段安全文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 实现配对前必须读取哪些项目约束
- 如何把安全逻辑限定在 `agentd/security`、`relay/security`、`web/lib/crypto` 等边界内
- 如何保持 relay 只接触密文和最小路由元数据
- 何时读取 `references/crypto-constraints.md`
- 何时读取 `references/pairing-flow.md`
- 何时读取 `references/key-lifecycle.md`
- 何时读取 `references/storage-boundaries.md`
- 何时使用 `scripts/init_pairing_layers.py`
- 何时使用 `scripts/verify_pairing_layers.py`
- 不得越界实现协议定义、UI 页面和非安全业务逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `e2ee-device-pairing`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的设备配对、设备密钥、公钥交换和消息级 E2EE 接入层，适用于 `agentd`、`relay`、`web` 三端安全边界实现

## 10. `references/` 设计要求

### 10.1 `references/crypto-constraints.md`
该文件负责提炼项目固定安全约束，只保留配对和 E2EE 实现需要的内容，包括：
- 完整 E2EE 前提
- relay 不可读明文约束
- 最小化元数据原则
- 敏感信息不得入日志与仓库的约束
- 不允许做的结构性错误

### 10.2 `references/pairing-flow.md`
该文件负责列出配对流程和各端职责，包括：
- `agentd auth`
- token 生成与使用
- URL/二维码内容边界
- 手机端发起配对
- 公钥交换
- 设备注册结果返回

### 10.3 `references/key-lifecycle.md`
该文件负责列出密钥与设备生命周期，包括：
- 桌面端长期密钥
- 浏览器端设备密钥
- 首次生成时机
- 存储位置边界
- 撤销与轮换策略边界

### 10.4 `references/storage-boundaries.md`
该文件负责列出 relay 可存与不可存的内容，包括：
- 可存元数据
- 可存密文事件 blob
- 不可存明文 payload
- token 和设备状态边界
- TTL 与回放边界

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的配对与 E2EE 接入层”为原则，不提前塞入无关业务逻辑。

### 11.1 `agentd-security/` 必须包含的模板文件
- `device-keys.ts`
- `pairing.ts`
- `encryptor.ts`

### 11.2 `relay-security/` 必须包含的模板文件
- `token-service.ts`
- `access-control.ts`
- `device-registry.ts`
- `modules/pairing/.gitkeep` 或最小模块入口
- `storage/repositories/.gitkeep` 或最小存储入口

### 11.3 `web-crypto/` 必须包含的模板文件
- `lib/crypto/.gitkeep` 或最小入口
- `features/pairing/.gitkeep` 或最小入口
- `lib/storage/.gitkeep` 或设备信息存储入口

### 11.4 模板职责
- `agentd-security/`：桌面端密钥、token 生成与消息加密接入
- `relay-security/`：token 校验、设备注册、访问控制和最小元数据边界
- `web-crypto/`：浏览器端密钥生成、配对接入、消息解密接入

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_pairing_layers.py`
该脚本是主执行脚本，职责如下：
- 创建或修正三端与配对/E2EE 相关的目录和模板
- 写入最小安全接入骨架
- 保持模块分层与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_pairing_layers.py`
该脚本负责配对与 E2EE 层校验，至少检查：
- `agentd/security`、`relay/security`、`web/lib/crypto` 是否存在
- 配对相关目录是否齐全
- 是否出现明文内容落盘或错误边界目录
- relay 是否只保留最小化元数据与密文相关结构
- 是否存在最小测试目录或测试占位

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前三端与配对/E2EE 相关的结构和项目文档。
2. 判断当前任务是初始化、修正还是安全边界扩展。
3. 读取 `references/crypto-constraints.md`，确认固定安全约束。
4. 读取 `references/pairing-flow.md`，确认配对流程边界。
5. 读取 `references/key-lifecycle.md`，确认密钥与设备生命周期。
6. 读取 `references/storage-boundaries.md`，确认 relay 可存与不可存的内容。
7. 运行 `scripts/init_pairing_layers.py` 初始化或修正配对/E2EE 接入层。
8. 运行 `scripts/verify_pairing_layers.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
10. 输出安全边界结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空仓前向验证
在一个新的测试仓库中验证：
- skill 能否创建三端所需的配对和 E2EE 接入边界
- 是否生成固定的安全目录和最小模板
- 是否没有越界修改无关业务层

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现配对和安全边界结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、页面 UI 或 PTY 主执行流

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的设备配对与 E2EE 接入层
- 能修正缺失或偏离规范的安全边界目录结构
- 不会越界实现协议定义、页面布局或 PTY 主执行流
- 安全结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `e2ee-device-pairing` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定配对流程范围
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
