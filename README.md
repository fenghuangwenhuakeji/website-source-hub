# Website Source Hub

`website-source-hub` 是面向团队协作整理出来的源码仓库，集中收纳当前网站体系里最常用的三部分内容：

- `fenghuang-unified`：凤煌官网前端源码
- `chaowuqiong-project`：超无穹业务主项目源码，包含用户端、管理端、后端与相关脚本
- `cloud-bridge`：云端桥接脚本、部署方法文档和保留的 Markdown 历史记录

这个仓库的目标不是做运行时镜像，而是提供一份适合团队协作、代码审阅、功能接力和二次开发的“纯源码版本”。

## 仓库定位

- 作为团队统一源码入口，减少到处找散落项目目录的成本
- 保留官网、主程序、后台、后端、桥接脚本这几条核心研发链路
- 刻意排除构建产物、证书、数据库快照、日志和本地环境文件，避免把不适合共享的内容带进公开仓库

## 目录概览

```text
website-source-hub/
├─ fenghuang-unified/
├─ chaowuqiong-project/
└─ cloud-bridge/
```

更详细的结构、安装顺序和启动命令见 [`SETUP.md`](./SETUP.md)。

## 包含内容

### `fenghuang-unified`

- 官网前端源码
- Vite + React 项目骨架
- `src/`、`public/`、构建配置与依赖声明

### `chaowuqiong-project`

- `apps/backend`：Node.js 后端接口与业务逻辑
- `apps/frontent/webuiapps`：主程序 Web / 桌面壳入口
- `apps/frontent/web-manage`：后台管理端
- `apps/sql`：数据库初始化与补丁 SQL
- `apps/tools`：辅助检查和修复脚本
- `packages/shared`：共享模块
- `config`、`deploy`、`docs`、`nginx`、`scripts`：部署与工程配套目录

说明：

- 原项目目录名保留了已有命名，例如 `frontent`
- 为了便于团队上手，这里保留的是实际开发相关源码，不再附带原目录里的运行时垃圾文件

### `cloud-bridge`

- `docs/`：桥接和部署说明
- `scripts/`：SSH / SCP / Clash / 验证脚本
- `config/`：桥接相关配置模板
- `history/`：仅保留 Markdown 历史记录，方便追溯部署过程

## 已主动剔除

- `node_modules`
- `dist`、`build`、`release`、桌面打包目录
- `.env`、`.env.local`、证书、密钥、账号凭据
- 本地数据库、SQLite 快照、缓存文件
- 压缩包、Base64 打包件、日志和临时文件
- 不适合公开协作的历史残留与测试 token

## 推荐阅读顺序

1. [`SETUP.md`](./SETUP.md)
2. `cloud-bridge/docs/01-ssh-bridge-playbook.md`
3. `cloud-bridge/docs/02-separate-mysql-deploy-plan.md`

## 版权与许可

- 本仓库默认不是宽松开源仓库
- 代码、脚本、文档与配置的版权归 `凤煌科技有限公司` 所有
- 未经书面许可，不得直接商用、二次分发、镜像部署或改作他用
- 详细条款见 [`LICENSE`](./LICENSE)

## 协作建议

- 新功能优先在对应子项目目录内开发，不要把官网、管理端、后端改动混成一团
- 本地环境文件自行创建，不要把 `.env`、证书或数据库重新提交回仓库
- 提交前至少验证自己改动对应项目能够正常启动或构建
- 如果改的是桥接和部署脚本，优先补文档，不要只改代码不写用法

## 适合谁使用

- 负责官网前端的同学
- 负责主程序 / 用户端界面的同学
- 负责管理后台和后端接口的同学
- 负责云端部署、桥接和运维交接的同学

如果你是第一次接手这套项目，直接从 [`SETUP.md`](./SETUP.md) 开始就行。
