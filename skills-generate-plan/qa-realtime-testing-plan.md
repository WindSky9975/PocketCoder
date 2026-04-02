# `qa-realtime-testing` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `qa-realtime-testing` skill。

该方案的目标是把 PocketCoder V1 已经确定的测试分层和实时链路验证要求，沉淀为一个可重复使用的质量保障技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`qa-realtime-testing` 的唯一职责，是为 PocketCoder V1 设计、实现并修正测试结构与主链路验证方案，重点覆盖协议、WebSocket 实时链路、配对流程、PWA 冒烟和回归验证。

它必须完成以下事情：
- 建立和修正 `protocol`、`relay`、`agentd`、`web` 的测试分层
- 建立主链路相关的单元测试、集成测试、冒烟测试与回归测试骨架
- 建立实时链路验证的测试策略，包括订阅、重连、回放、幂等和授权
- 建立“能否证明行为正确”的验证入口，而不是只关注实现覆盖率
- 建立统一的最小测试约束，支撑后续每个 skill 的增量实现

## 3. Skill 边界

### 3.1 负责范围
- 设计四个 workspace 的测试职责分层
- 设计协议测试、WebSocket 集成测试、PWA 冒烟测试、主链路回归测试的边界
- 设计测试目录结构、命名方式、最小数据夹具和测试入口
- 设计与 `npm run test`、`npm run typecheck`、`npm run lint` 相关的质量门槛对齐方式
- 设计测试如何覆盖配对、加密、幂等、授权、中断、重连、状态机这些高风险点
- 设计最小可执行的验证顺序和回归清单

### 3.2 不负责范围
- 不负责业务实现本身
- 不负责协议 schema 设计
- 不负责 relay、agentd、web 的具体主逻辑实现
- 不负责部署、Docker 和运维验证
- 不负责性能压测、容量压测和生产观测系统
- 不负责视觉设计、品牌素材或宣传页

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 设计或修正测试体系
- 为实时链路、配对流程、回放、幂等、授权、中断、重连补测试
- 建立或修正 `protocol`、`relay`、`agentd`、`web` 的测试目录和测试入口
- 设计主链路回归测试或 PWA 冒烟测试
- 校验某次改动是否破坏了关键质量门槛

以下情况不应由该 skill 处理：
- 直接设计共享协议 contract
- 直接实现 relay、agentd、web 业务逻辑
- 直接实现设备加密算法
- 直接实现 Windows 平台控制逻辑
- 直接设计 Docker 部署脚本

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- 未通过 `lint`、`typecheck`、相关测试的改动不得合入
- `protocol`、`relay`、`agentd` 的核心逻辑必须有自动化测试
- `web` 首版至少覆盖关键页面和主链路冒烟测试
- 涉及协议变更时，必须同步更新 schema、类型、测试和相关文档
- 涉及配对、加密、权限、幂等、中断、重连、状态机的改动时，必须补充回归测试
- 测试必须优先覆盖模块边界、公共接口和依赖关系稳定性，而不是只验证内部实现细节
- 测试目录默认跟随所属 workspace，不建立独立测试 workspace
- 测试夹具不得包含真实密钥、真实 token、未脱敏日志或敏感数据

## 6. 固定测试范围

该 skill 必须以 V1 已确定的测试范围为基础，至少覆盖以下内容：

### 6.1 单元测试
- 纯函数
- schema
- 状态转换
- 去重逻辑
- 权限判断

### 6.2 集成测试
- WebSocket 消息流
- 配对流程
- 会话订阅
- 最近事件回放
- relay 重启后的事实来源稳定性

### 6.3 冒烟测试
- 配对/登录页可访问
- 会话列表页可访问
- 会话详情页可访问
- 关键按钮和错误状态可见
- prompt 输入和授权卡片主流程可操作

### 6.4 回归重点
- 命令 `messageId` 去重
- 过期或已使用 token 拒绝
- 未配对设备拒绝订阅
- 授权请求展示和响应回传
- 本地输入恢复后的远程控制失效
- 手机断线重连后的最近事件回放

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/qa-realtime-testing/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- 测试结构必须和本项目的协议、relay、agentd、web 边界同步演进
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/qa-realtime-testing/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ test-constraints.md
│  ├─ scenario-matrix.md
│  ├─ workspace-test-map.md
│  └─ regression-checklist.md
├─ assets/
│  └─ templates/
│     ├─ protocol-tests/
│     ├─ relay-tests/
│     ├─ agentd-tests/
│     └─ web-tests/
└─ scripts/
   ├─ init_test_layers.py
   └─ verify_test_layers.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段测试文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 为何测试必须按 workspace 分层
- 如何区分单元测试、集成测试、冒烟测试和回归测试
- 如何优先验证主链路和高风险边界
- 何时读取 `references/test-constraints.md`
- 何时读取 `references/scenario-matrix.md`
- 何时读取 `references/workspace-test-map.md`
- 何时读取 `references/regression-checklist.md`
- 何时使用 `scripts/init_test_layers.py`
- 何时使用 `scripts/verify_test_layers.py`
- 不得伪造测试结果或跳过关键回归验证的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `qa-realtime-testing`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的测试结构与主链路验证体系，适用于协议测试、WebSocket 集成测试、PWA 冒烟测试和回归测试

## 10. `references/` 设计要求

### 10.1 `references/test-constraints.md`
该文件负责提炼项目固定测试约束，只保留质量保障需要的内容，包括：
- 根质量门槛
- 各 workspace 的最低自动化要求
- 不允许做的结构性错误
- 敏感数据与测试夹具边界

### 10.2 `references/scenario-matrix.md`
该文件负责列出核心测试场景矩阵，包括：
- 配对成功/失败
- 会话订阅
- prompt 发送
- 授权请求与响应
- 中断与恢复桌面控制
- 断线重连与回放
- 幂等与重复消息

### 10.3 `references/workspace-test-map.md`
该文件负责列出各 workspace 的测试职责，包括：
- `packages/protocol`
- `apps/relay`
- `apps/agentd`
- `apps/web`
- 每个 workspace 的单测/集成/冒烟边界

### 10.4 `references/regression-checklist.md`
该文件负责列出每次高风险改动后的最小回归清单，包括：
- 协议变更
- 配对与加密变更
- relay 连接流变更
- agentd 会话流变更
- web 实时交互变更

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的测试骨架”为原则，不提前依赖完整业务实现。

### 11.1 `protocol-tests/` 必须包含的模板文件
- `tests/schema/.gitkeep` 或最小 schema 测试模板
- `tests/compatibility/.gitkeep` 或最小兼容性测试模板

### 11.2 `relay-tests/` 必须包含的模板文件
- `tests/unit/.gitkeep` 或最小单测模板
- `tests/integration/.gitkeep` 或最小集成测试模板

### 11.3 `agentd-tests/` 必须包含的模板文件
- `tests/unit/.gitkeep` 或最小单测模板
- `tests/integration/.gitkeep` 或最小集成测试模板

### 11.4 `web-tests/` 必须包含的模板文件
- `src/tests/unit/.gitkeep` 或最小单测模板
- `src/tests/smoke/.gitkeep` 或最小冒烟测试模板

### 11.5 模板职责
- `protocol-tests/`：保护 schema 和兼容性
- `relay-tests/`：保护消息流、回放、去重和配对入口
- `agentd-tests/`：保护 PTY 骨架、事件流和命令幂等
- `web-tests/`：保护关键页面访问、主流程和关键状态展示

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_test_layers.py`
该脚本是主执行脚本，职责如下：
- 创建或修正四个 workspace 的测试目录和最小模板
- 按项目约束写入对应测试骨架
- 尽量避免覆盖已存在的用户测试
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_test_layers.py`
该脚本负责测试层校验，至少检查：
- 各 workspace 的测试目录是否存在
- 是否存在协议测试、relay 集成测试、agentd 集成测试、web 冒烟测试入口
- 是否缺少高风险场景的最小回归占位
- 是否存在违反目录边界的测试组织方式
- 是否存在敏感数据或不合理测试夹具结构

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前测试结构和项目文档。
2. 判断当前任务是初始化、修正还是扩展测试覆盖。
3. 读取 `references/test-constraints.md`，确认固定测试约束。
4. 读取 `references/scenario-matrix.md`，确认核心场景矩阵。
5. 读取 `references/workspace-test-map.md`，确认各 workspace 测试职责。
6. 读取 `references/regression-checklist.md`，确认高风险回归清单。
7. 运行 `scripts/init_test_layers.py` 初始化或修正测试骨架。
8. 运行 `scripts/verify_test_layers.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
10. 输出测试结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空仓前向验证
在一个新的测试仓库中验证：
- skill 能否创建四个 workspace 的最小测试骨架
- 是否生成固定的测试目录和最小模板
- 是否没有越界修改业务实现

### 14.3 修正前向验证
在一个测试结构错误的仓库中验证：
- skill 是否能发现测试层结构错误
- 是否能补齐缺失测试目录和最小模板
- 是否不会越界修改 `protocol`、relay、agentd、web 的核心实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的测试骨架
- 能修正缺失或偏离规范的测试目录结构
- 不会越界实现业务主逻辑
- 测试结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `qa-realtime-testing` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定测试范围
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
