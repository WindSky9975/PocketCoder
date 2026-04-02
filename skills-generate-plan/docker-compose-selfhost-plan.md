# `docker-compose-selfhost` 生成方案

## 1. 文档目的

本方案用于指导后续创建 `docker-compose-selfhost` skill。

该方案的目标是把 PocketCoder V1 已经确定的单机自托管部署约束，沉淀为一个可重复使用的 Docker Compose 自托管技能。后续创建 skill 时，必须以本文件为唯一实现蓝图，不再重新定义其职责边界。

本方案对齐以下现有文档：
- `设计方案/V1-实施规划.md`
- `设计方案/V1-项目结构.md`
- `设计方案/V1-skills与MCP清单.md`
- `项目开发规范.md`

## 2. Skill 目标

`docker-compose-selfhost` 的唯一职责，是为 PocketCoder V1 设计、实现并修正基于 Docker Compose 的单机自托管运行方案。

它必须完成以下事情：
- 建立和修正 `compose` 相关文件与 `infra/docker/` 目录结构
- 建立 `relay` 容器镜像构建入口和 Compose 服务编排骨架
- 建立 SQLite 持久化、环境变量、卷挂载和基础健康检查的部署边界
- 提供“单机自托管可启动”的最小运行方式
- 保持部署层严格限定在自托管和本地联调范围内，不扩展到 SaaS、云模板和复杂运维编排

## 3. Skill 边界

### 3.1 负责范围
- 设计和修正 Docker Compose 文件结构
- 设计和修正 `infra/docker/relay.Dockerfile`
- 设计和修正 `.env.example` 或等价环境变量模板
- 设计单机场景下的持久化卷、端口暴露、容器命名和运行命令边界
- 设计 relay 容器的最小健康检查与启动约束
- 补充自托管层最小验证和结构校验策略

### 3.2 不负责范围
- 不负责 `relay` 服务内部业务逻辑实现
- 不负责 `protocol` 消息 schema 设计
- 不负责 `agentd` PTY 和桌面端逻辑
- 不负责 `web` 页面与 PWA 业务实现
- 不负责云平台模板、Kubernetes、SaaS、多租户或团队协作部署
- 不负责 TLS、域名、反向代理和公网暴露的完整生产方案
- 不负责生产级监控、备份、灰度和高可用编排

## 4. Skill 触发条件

当用户提出以下类型请求时，应触发该 skill：
- 为 PocketCoder 创建或修正 Docker Compose 自托管配置
- 为 `relay` 建立容器构建和本地运行骨架
- 搭建单机自托管的 `relay + SQLite` 运行方式
- 修复 `compose` 文件、Dockerfile、挂载卷、环境变量模板或健康检查结构
- 按 PocketCoder 规范创建最小可运行的自托管部署层

以下情况不应由该 skill 处理：
- 实现 relay 服务业务逻辑
- 设计共享协议 contract
- 实现桌面端和前端业务逻辑
- 设计生产级公网发布与反向代理方案
- 设计多服务云平台模板

## 5. 固定项目约束

后续创建该 skill 时，必须内置以下固定约束：
- 首版部署目标固定为单机自托管 Docker Compose
- 服务端部署范围固定为 `relay + SQLite`
- SQLite 作为嵌入式存储存在于 relay 运行环境，不引入额外 Postgres/Redis 容器
- `infra/` 只放部署相关文件，不混入业务代码
- `relay` Dockerfile 固定放在 `infra/docker/relay.Dockerfile`
- Compose 层必须支持最小持久化、环境变量和容器重启策略
- 自托管层必须服务本地联调和单机部署，不扩展到云模板和生产高可用
- 所有敏感配置只允许通过环境变量或被忽略的配置文件注入，不进入仓库
- 模块划分必须符合高内聚、低耦合，部署层不得散落到业务代码目录

## 6. 固定部署范围

该 skill 必须以 V1 已确定的部署范围为基础，至少覆盖以下内容：

### 6.1 Compose 范围
- 单个 `relay` 服务
- SQLite 数据持久化
- 环境变量注入
- 端口映射
- 基础健康检查
- 重启策略

### 6.2 容器范围
- `relay` 构建上下文
- `relay` 运行命令
- 容器内数据目录
- 只读/可写边界
- 日志和基础运行参数

### 6.3 自托管边界
- 本地单机部署
- 开发联调可用
- 不包含公网暴露默认配置
- 不包含多节点扩展

## 7. 推荐 Skill 位置

后续创建 skill 时，固定输出到以下目录：

```text
.codex/skills/docker-compose-selfhost/
```

使用仓库内 skill 的原因如下：
- 该 skill 是 PocketCoder 项目专用，而不是通用公开 skill
- 自托管结构需要跟随本项目 relay 运行方式同步演进
- 后续可直接在仓库内维护、验证和迭代

## 8. Skill 目录结构

后续创建 skill 时，目录结构固定如下：

```text
.codex/skills/docker-compose-selfhost/
├─ SKILL.md
├─ agents/
│  └─ openai.yaml
├─ references/
│  ├─ selfhost-constraints.md
│  ├─ compose-map.md
│  ├─ env-contracts.md
│  └─ volume-boundaries.md
├─ assets/
│  └─ templates/
│     └─ selfhost/
│        ├─ compose.yaml
│        ├─ .env.example
│        └─ infra/
│           └─ docker/
│              └─ relay.Dockerfile
└─ scripts/
   ├─ init_selfhost_stack.py
   └─ verify_selfhost_stack.py
```

## 9. `SKILL.md` 设计要求

`SKILL.md` 只保留核心指令，不复制大段部署文档，正文应覆盖以下内容：
- skill 的用途和明确触发场景
- 创建或修正自托管层前必须读取哪些项目约束
- 如何把 Compose、Dockerfile、环境变量和卷挂载限制在部署层边界内
- 如何保持部署层不侵入业务实现
- 何时读取 `references/selfhost-constraints.md`
- 何时读取 `references/compose-map.md`
- 何时读取 `references/env-contracts.md`
- 何时读取 `references/volume-boundaries.md`
- 何时使用 `scripts/init_selfhost_stack.py`
- 何时使用 `scripts/verify_selfhost_stack.py`
- 不得越界实现 relay 业务逻辑或生产级复杂运维方案的边界规则

`SKILL.md` 的 frontmatter 必须：
- `name`: `docker-compose-selfhost`
- `description`: 明确说明它用于设计、创建或修正 PocketCoder 的 Docker Compose 单机自托管层，适用于 `relay + SQLite`、Dockerfile、环境变量、卷和健康检查骨架

## 10. `references/` 设计要求

### 10.1 `references/selfhost-constraints.md`
该文件负责提炼项目固定部署约束，只保留自托管实现需要的内容，包括：
- 单机自托管范围
- `relay + SQLite` 约束
- 不引入额外数据库/缓存服务的约束
- 敏感配置边界
- 不允许做的结构性错误

### 10.2 `references/compose-map.md`
该文件负责列出 Compose 层职责，包括：
- `relay` 服务配置
- 镜像构建入口
- 端口映射
- 容器命令
- 健康检查
- 重启策略

### 10.3 `references/env-contracts.md`
该文件负责列出自托管层需要的环境变量边界，包括：
- 端口
- 主机绑定
- SQLite 数据路径
- 日志级别
- 公共 URL 或等价入口配置
- token 与事件 TTL 相关配置占位
- 哪些变量允许公开、哪些属于敏感配置

### 10.4 `references/volume-boundaries.md`
该文件负责列出持久化卷与容器内路径边界，包括：
- SQLite 数据目录
- 数据卷挂载位置
- 容器内可写路径
- 不应持久化的临时输出
- 升级时需要保留的内容

## 11. `assets/templates/` 设计要求

模板必须以“最小但完整的单机自托管骨架”为原则，不提前塞入复杂运维逻辑。

### 11.1 必须包含的模板文件
- `compose.yaml`
- `.env.example`
- `infra/docker/relay.Dockerfile`

### 11.2 模板职责
- `compose.yaml`：定义单机自托管的 `relay` 服务、卷、端口和健康检查
- `.env.example`：列出运行所需环境变量和默认占位
- `infra/docker/relay.Dockerfile`：提供 `relay` 的容器构建入口

## 12. `scripts/` 设计要求

### 12.1 `scripts/init_selfhost_stack.py`
该脚本是主执行脚本，职责如下：
- 创建或修正 `compose.yaml`、`.env.example` 和 `infra/docker/relay.Dockerfile`
- 保持部署层结构与项目约束一致
- 尽量避免覆盖已存在的用户实现
- 输出创建或修正结果摘要

参数建议如下：
- 目标仓库路径
- 模式：`init` / `repair`
- 是否允许覆盖已存在文件：默认否

### 12.2 `scripts/verify_selfhost_stack.py`
该脚本负责自托管层校验，至少检查：
- `compose.yaml` 是否存在
- `infra/docker/relay.Dockerfile` 是否存在
- `.env.example` 是否存在
- 是否只包含当前允许的最小服务范围
- 是否存在数据卷和环境变量边界
- 是否缺少基础健康检查或运行参数

输出应分为：
- 通过项
- 缺失项
- 结构性错误
- 建议修复项

## 13. Skill 执行流程

后续 skill 创建完成后，使用该 skill 时必须遵循以下流程：

1. 读取仓库当前自托管层结构和项目文档。
2. 判断当前任务是初始化、修正还是部署层扩展。
3. 读取 `references/selfhost-constraints.md`，确认固定部署约束。
4. 读取 `references/compose-map.md`，确认 Compose 结构。
5. 读取 `references/env-contracts.md`，确认环境变量边界。
6. 读取 `references/volume-boundaries.md`，确认卷和数据路径边界。
7. 运行 `scripts/init_selfhost_stack.py` 初始化或修正自托管骨架。
8. 运行 `scripts/verify_selfhost_stack.py` 校验结果。
9. 视情况执行最小验证命令：
   - `docker compose config`
   - `docker compose up -d`
   - `docker compose ps`
10. 输出自托管结构变更摘要和后续待实现部分。

## 14. 验证方案

创建该 skill 后，必须完成以下验证：

### 14.1 Skill 自身校验
- 运行 `quick_validate.py <skill-folder>`
- 确认 frontmatter、命名和目录结构合法

### 14.2 空仓前向验证
在一个新的测试仓库中验证：
- skill 能否创建合规的 Compose 自托管骨架
- 是否生成固定的 Compose、Dockerfile 和环境变量模板
- 是否没有越界修改业务实现

### 14.3 修正前向验证
在一个部署结构错误的测试仓库中验证：
- skill 是否能发现自托管层结构错误
- 是否能补齐缺失文件
- 是否不会越界修改 `protocol`、relay 主逻辑、agentd 或 web 业务实现

## 15. 验收标准

当以下条件全部满足时，才视为该 skill 创建完成：
- 能创建符合 PocketCoder 规范的单机自托管骨架
- 能修正缺失或偏离规范的部署层目录结构
- 不会越界实现业务主逻辑或复杂生产运维逻辑
- 部署结构符合高内聚、低耦合要求
- 输出结果与 `V1-实施规划.md`、`项目开发规范.md`、`V1-项目结构.md` 一致
- skill 本身通过 `quick_validate.py`

## 16. 后续衔接

在本方案落地后，下一步再创建 `docker-compose-selfhost` skill 本体。创建时不得改动本方案定义的：
- skill 名称
- 推荐目录结构
- 固定部署范围
- 模板范围
- 脚本职责边界

如确需修改，必须先更新本方案文档，再创建或调整 skill。
