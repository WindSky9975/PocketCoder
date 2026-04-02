# `windows-desktop-control` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `windows-desktop-control` skill。

该方案的目标是把 PocketCoder V1 已经确定的 Windows 桌面控制边界，沉淀为一个可重复使用的平台能力实现技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`windows-desktop-control` 的唯一职责，是为 PocketCoder V1 设计、实现并修正 Windows 平台上的本地控制权恢复检测与远程控制失效逻辑。

它必须完成以下事情：
- 建立 `apps/agentd/src/platform/windows/` 下的平台能力边界
- 建立“检测到桌面端重新接管当前会话的明确本地输入事件”这一能力的接入骨架
- 建立本地控制权恢复后撤销远程控制的状态流
- 建立向会话状态机和事件发布层上报“远程控制失效”的边界
- 保持该能力严格限定在 Windows 平台层，不散入 PTY、sessions、transport 或 UI 层

## 3. Skill 边界

### 3.1 负责范围
- 设计 `apps/agentd/src/platform/windows/` 的目录结构与模块边界
- 设计 Windows 输入恢复检测入口
- 设计远程控制失效判定入口
- 设计“把控制权还给桌面端”命令与本地输入恢复之间的关系边界
- 设计平台事件如何通知 `sessions/` 和 `transport/` 层
- 为 Windows 平台能力补充最小测试和结构校验策略

### 3.2 不负责范围
- 不负责 `protocol` 消息 schema 设计
- 不负责 `agentd` 的 PTY、provider 和主会话状态机实现
- 不负责 `relay` 服务端业务实现
- 不负责 `web` 页面与授权卡片交互实现
- 不负责设备配对、公钥交换和 E2EE 细节
- 不负责跨平台适配，macOS/Linux 不在本 skill 范围内
- 不负责桌面 GUI、托盘和原生窗口能力

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 实现或修正 Windows 输入恢复检测
- 实现本地控制权恢复后的远程控制撤销逻辑
- 修复 `apps/agentd/src/platform/windows/` 的结构和平台边界
- 搭建“把控制权还给桌面端”相关的平台接入层
- 按 PocketCoder 规范创建 Windows 平台能力骨架

以下情况不应由该 skill 处理：
- 设计共享协议 package
- 实现 PTY provider 和 `codex` 输出解析
- 实现 relay 服务逻辑
- 实现 web 页面与移动端交互
- 设计设备配对和加密

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- 首版桌面系统固定为 Windows，macOS/Linux 不进入当前范围
- agentd 是本地事实来源，检测到本地键盘恢复输入后必须标记远程控制失效
- 平台检测逻辑必须独立在 `platform/windows/` 内部，不得散落到 sessions、transport 或 providers
- 远程控制失效后，必须触发状态更新并阻止远程继续发送控制命令
- 本地输入恢复检测必须服务于当前会话，而不是全局模糊状态
- “把控制权还给桌面端”与“用户在桌面端主动重新输入”必须能统一归入本地控制恢复语义
- 模块划分必须符合高内聚、低耦合
- 平台层不得直接依赖 `web` 或 `relay` 实现细节

## 6. 固定平台范围

该 skill 必须以 V1 已确定的 Windows 平台范围为基础，至少覆盖以下内容：

### 6.1 检测能力
- 本地键盘输入恢复检测入口
- 当前会话与本地控制恢复之间的关联边界
- 平台事件来源与抽象边界

### 6.2 状态流
- 远程控制有效状态
- 本地控制恢复状态
- 远程控制失效事件
- 与会话状态机/事件发布的交互边界

### 6.3 命令关系
- `input.resumeDesktopControl` 的接入边界
- 主动释放控制权与被动本地恢复输入的关系
- 平台事件与业务命令的区分

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/windows-desktop-control/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- 平台检测逻辑必须与本项目 agentd 结构和会话边界同步演进
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/windows-desktop-control/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ windows-control-constraints.md
│  ├─ control-flow.md
│  ├─ platform-boundaries.md
│  └─ state-propagation.md
├─ assets/
│  └─ templates/
│     └─ windows-platform/
│        ├─ desktop-control.ts
│        ├─ input-detector.ts
│        ├─ control-state.ts
│        └─ tests/
└─ scripts/
   ├─ init_windows_control.py
   └─ verify_windows_control.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段平台文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 开始实现 Windows 控制逻辑前必须读取哪些项目约束
- 如何把平台逻辑限制在 `platform/windows/` 边界内
- 如何把本地输入恢复事件传递给会话状态与事件发布层
- 何时读取 `references/windows-control-constraints.md`
- 何时读取 `references/control-flow.md`
- 何时读取 `references/platform-boundaries.md`
- 何时读取 `references/state-propagation.md`
- 何时使用 `scripts/init_windows_control.py`
- 何时使用 `scripts/verify_windows_control.py`
- 不得越界实现 PTY、协议、配对或 UI 逻辑的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `windows-desktop-control`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的 Windows 本地控制恢复检测与远程控制失效接入层，适用于 `apps/agentd/src/platform/windows/` 的平台边界实现

## 10. `references/` 设计要求

### 10.1 `references/windows-control-constraints.md`
该文件负责提炼项目固定平台约束，只保留 Windows 控制逻辑需要的内容，包括：
- Windows 优先范围
- 本地输入恢复即远程控制失效的规则
- 平台层边界
- 不允许做的结构性错误

### 10.2 `references/control-flow.md`
该文件负责列出控制恢复相关流程，包括：
- 用户主动“把控制权还给桌面端”
- 用户在桌面端重新输入
- 平台检测事件
- 会话状态更新
- 远程命令阻断

### 10.3 `references/platform-boundaries.md`
该文件负责列出 `platform/windows/` 与其他模块的边界，包括：
- 对 sessions 的依赖边界
- 对 transport 的依赖边界
- 对 providers 的依赖边界
- 对 protocol 的依赖边界
- 不允许跨层直接耦合的情况

### 10.4 `references/state-propagation.md`
该文件负责列出平台事件如何上报和传播，包括：
- 平台事件模型
- 状态传播顺序
- 远程控制失效通知
- 与命令处理的关系

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的 Windows 平台控制接入层”为原则，不提前塞入无关业务逻辑。

### 11.1 必须包含的模板文件
- `desktop-control.ts`
- `input-detector.ts`
- `control-state.ts`
- `tests/.gitkeep` 或最小测试模板

### 11.2 模板职责
- `desktop-control.ts`：平台层主入口，负责接线和对外暴露稳定接口
- `input-detector.ts`：本地输入恢复检测接入点
- `control-state.ts`：本地控制恢复相关状态和判定边界
- `tests/`：保护平台边界、控制恢复逻辑入口和状态传播

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_windows_control.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `apps/agentd/src/platform/windows/` 的目录结构
- 写入模板文件
- 保持平台层边界与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_windows_control.py`
该脚本负责 Windows 平台层校验，至少检查：
- `platform/windows/` 是否存在
- 是否存在固定平台入口和状态文件
- 是否出现平台逻辑散落到 sessions、transport 或 providers
- 是否存在最小测试目录
- 是否缺少本地输入恢复检测相关结构

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前 `apps/agentd/src/platform/windows/` 状态和项目文档。
2. 判断当前任务是初始化、修正还是平台控制扩展。
3. 读取 `references/windows-control-constraints.md`，确认固定平台约束。
4. 读取 `references/control-flow.md`，确认本地控制恢复流程。
5. 读取 `references/platform-boundaries.md`，确认平台与其他模块的边界。
6. 读取 `references/state-propagation.md`，确认状态传播和通知顺序。
7. 运行 `scripts/init_windows_control.py` 初始化或修正 Windows 控制接入层。
8. 运行 `scripts/verify_windows_control.py` 校验结果。
9. 视情况执行最小验证命令：
   - `npm run typecheck`
   - `npm run test`
10. 输出平台层结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空仓前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 Windows 平台控制接入层
- 是否生成固定的平台文件和最小测试结构
- 是否没有越界修改无关业务层

### 14.3 修正前向验证
在一个结构错误的测试仓库中验证：
- skill 是否能发现 Windows 平台层结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、relay、web 或 PTY 主执行流

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的 Windows 控制接入层
- 能修正缺失或偏离规范的平台目录结构
- 不会越界实现 PTY、协议、配对或 UI 逻辑
- 平台结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `windows-desktop-control` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定平台范围
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
