# `typescript-monorepo-bootstrap` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `typescript-monorepo-bootstrap` skill。

该方案的目标是把 PocketCoder V1 已经确定的工程约束，沉淀为一个可重复使用的 monorepo 初始化与修正技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`typescript-monorepo-bootstrap` 的唯一职责，是为 PocketCoder V1 创建或修正符合规范的 TypeScript monorepo 骨架。

它必须完成以下事情：
- 初始化或修正根目录工程配置
- 初始化或修正固定的 4 个 workspace
- 让目录结构符合高内聚、低耦合原则
- 让依赖方向符合项目约束
- 让根脚本、TypeScript、lint、测试入口具备统一约定
- 提供最小验证能力，确认仓库已达到“可继续开发”的状态

## 3. Skill 边界

### 3.1 负责范围
- 创建 `npm workspaces` monorepo 根配置
- 创建 `apps/web`、`apps/agentd`、`apps/relay`、`packages/protocol` 四个 workspace 骨架
- 创建根级脚本、TypeScript 基础配置、lint 配置、CI 占位配置、README、忽略规则
- 为每个 workspace 生成最小入口文件和测试占位文件
- 校验目录边界、依赖方向、文件完整性和基础脚本可用性
- 在已有仓库结构偏离规范时，按项目约束修正为合规结构

### 3.2 不负责范围
- 不负责具体业务实现
- 不负责 `protocol` 详细 schema 设计
- 不负责 `agentd` 的 PTY 逻辑
- 不负责 `relay` 的配对、E2EE 和消息路由细节
- 不负责 `web` 的页面业务实现
- 不负责 Docker 自托管细节
- 不负责真实数据库表结构设计
- 不负责多 provider 抽象的业务落地

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 初始化 PocketCoder 风格的 TypeScript monorepo
- 为本项目创建或补齐 `npm workspaces` 骨架
- 修复根配置、workspace 结构、脚本约定、目录边界
- 按 PocketCoder 规范重建工程骨架

以下情况不应由该 skill 处理：
- 设计 `protocol` 消息和 schema
- 实现 `agentd`、`relay`、`web` 的业务逻辑
- 设计加密、配对和权限策略
- 编写具体页面、WebSocket 流、PTY 解析器

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- 包管理器固定为 `npm workspaces`
- workspace 固定为：`apps/web`、`apps/agentd`、`apps/relay`、`packages/protocol`
- `packages/protocol` 是唯一跨端共享契约源
- `web`、`agentd`、`relay` 不得互相直接引用源码，只能通过 `protocol` 对齐契约
- 默认启用 TypeScript 严格模式
- 根脚本至少包含：`dev`、`build`、`lint`、`typecheck`、`test`
- 工程结构必须符合高内聚、低耦合原则
- 禁止为了少量复用提前抽象新的 shared 包
- `web` 固定为 Next.js App Router 结构
- `agentd` 固定为 Node.js CLI 守护进程骨架
- `relay` 固定为 Fastify + WebSocket 骨架
- 文档默认中文，代码和协议命名默认英文

## 6. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/typescript-monorepo-bootstrap/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- skill 应与本项目文档和结构演进保持同步
- 后续可直接在仓库内维护、验证和迭代

## 7. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/typescript-monorepo-bootstrap/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ pocketcoder-bootstrap-constraints.md
│  └─ file-contracts.md
├─ assets/
│  └─ templates/
│     ├─ root/
│     │  ├─ package.json
│     │  ├─ tsconfig.base.json
│     │  ├─ eslint.config.mjs
│     │  ├─ .gitignore
│     │  ├─ README.md
│     │  └─ .github-workflows-ci.yml
│     ├─ apps/
│     │  ├─ web/
│     │  ├─ agentd/
│     │  └─ relay/
│     └─ packages/
│        └─ protocol/
└─ scripts/
   ├─ init_monorepo.py
   └─ verify_monorepo.py
```

## 8. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段参考文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 初始化前检查步骤
- 空仓初始化流程
- 已有仓库修正流程
- 何时读取 `references/pocketcoder-bootstrap-constraints.md`
- 何时读取 `references/file-contracts.md`
- 何时使用 `scripts/init_monorepo.py`
- 何时使用 `scripts/verify_monorepo.py`
- 不得越界实现业务逻辑的边界规则
- 需要验证的最小命令集合

`SKILL.md` 的 frontmatter 必须：
- `name`: `typescript-monorepo-bootstrap`
- `description`: 明确说明它用于创建或修正 PocketCoder 风格的 TypeScript monorepo，适用于初始化根配置、workspace 骨架和结构边界修正

## 9. `references/` 设计要求

### 9.1 `references/pocketcoder-bootstrap-constraints.md`
该文件负责提炼项目专属约束，只保留 bootstrap 需要的内容，包括：
- 固定 workspace 列表
- 固定依赖方向
- 根脚本约定
- 高内聚、低耦合约束
- 根配置清单
- 各 workspace 技术定位
- 不允许做的结构性错误

### 9.2 `references/file-contracts.md`
该文件负责列出“必须生成的文件”和“每个文件的职责”，包括：
- 根目录文件合同
- `apps/web` 文件合同
- `apps/agentd` 文件合同
- `apps/relay` 文件合同
- `packages/protocol` 文件合同
- 每个文件是否允许为空占位、是否必须可执行、是否必须参与验证

## 10. `assets/templates/` 设计要求

模板必须以“最小但可继续开发”为原则，不提前塞入业务实现。

### 10.1 根目录模板
必须包含：
- `package.json`
- `tsconfig.base.json`
- `eslint.config.mjs`
- `.gitignore`
- `README.md`
- `.github-workflows-ci.yml`

这些模板的职责如下：
- `package.json`：声明 workspaces、根脚本、共享开发依赖
- `tsconfig.base.json`：统一 TypeScript 严格模式和路径规则
- `eslint.config.mjs`：提供 Node、Next.js、测试代码的统一 lint 入口
- `.gitignore`：忽略依赖、构建产物、本地配置、日志和调试产物
- `README.md`：说明项目目标、目录结构、开发入口和文档入口
- `.github-workflows-ci.yml`：至少校验 `lint`、`typecheck`、`test`

### 10.2 `apps/web` 模板
至少生成：
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/features/.gitkeep` 或等价占位
- `src/components/ui/.gitkeep` 或等价占位
- `src/lib/.gitkeep` 或等价占位
- `src/tests/.gitkeep` 或等价占位

### 10.3 `apps/agentd` 模板
至少生成：
- `package.json`
- `tsconfig.json`
- `src/cli/index.ts`
- `src/bootstrap.ts`
- `src/providers/codex/.gitkeep`
- `src/sessions/.gitkeep`
- `src/transport/.gitkeep`
- `src/security/.gitkeep`
- `src/platform/windows/.gitkeep`
- `tests/.gitkeep`

### 10.4 `apps/relay` 模板
至少生成：
- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/server.ts`
- `src/modules/.gitkeep`
- `src/transport/http/.gitkeep`
- `src/transport/ws/.gitkeep`
- `src/security/.gitkeep`
- `src/storage/.gitkeep`
- `tests/.gitkeep`

### 10.5 `packages/protocol` 模板
至少生成：
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/constants/.gitkeep`
- `src/schemas/.gitkeep`
- `src/errors/.gitkeep`
- `src/utils/.gitkeep`
- `tests/.gitkeep`

## 11. `scripts/` 设计要求

### 11.1 `scripts/init_monorepo.py`
该脚本是主执行脚本，职责如下：
- 判断目标仓库是空仓初始化还是已有结构修正
- 创建缺失目录
- 将模板写入目标位置
- 尽量避免覆盖已存在的用户实现
- 在必须覆盖时先报出冲突点，再由使用者确认
- 输出创建结果清单

参数建议如下：
- 目标仓库路径
- 初始化模式：`init` / `repair`
- 是否允许写入已存在文件：默认否

### 11.2 `scripts/verify_monorepo.py`
该脚本负责结构校验，至少检查：
- 根目录关键文件是否存在
- 四个 workspace 是否存在
- 是否新增了不被允许的第五个 workspace
- `protocol` 是否是唯一共享契约目录
- 根脚本是否齐全
- TypeScript 基础配置是否存在
- CI 配置是否存在

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 12. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前结构和项目文档。
2. 判断当前任务是初始化还是修正。
3. 读取 `references/pocketcoder-bootstrap-constraints.md`，确认固定约束。
4. 读取 `references/file-contracts.md`，确认应生成的文件清单。
5. 运行 `scripts/init_monorepo.py` 生成或修正骨架。
6. 运行 `scripts/verify_monorepo.py` 校验结果。
7. 视情况执行最小验证命令：
   - `npm install`
   - `npm run typecheck`
   - `npm run test`
8. 输出结构变更摘要和后续待实现部分。

## 13. 验证方案

创建该 skill 后，必须完成以下验证：

### 13.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 13.2 空目录前向验证
在一个新的空目录中测试：
- skill 能否生成 PocketCoder 风格 monorepo
- 是否只生成 4 个 workspace
- 根配置是否齐全
- 目录是否符合 `V1-项目结构.md`

### 13.3 仓库修正前向验证
在一个故意缺少部分文件的测试仓库中验证：
- skill 是否能补齐缺失文件
- 是否不会擅自注入业务逻辑
- 是否不会新增不必要的 shared 层

## 14. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能在空目录中生成符合 PocketCoder 规范的最小 monorepo
- 能在已有仓库中修正缺失的根配置和 workspace 骨架
- 不会越界实现业务逻辑
- 结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 15. 后续衔接

在本方案落地后，下一步再创建 `typescript-monorepo-bootstrap` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定 workspace 列表
- 根配置清单
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
