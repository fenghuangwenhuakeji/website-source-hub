# SETUP

这份文档面向第一次接手 `website-source-hub` 的团队成员，目标是让我们在最短时间内知道：

- 仓库里每个目录是干什么的
- 本地需要准备什么环境
- 哪些项目需要分别安装依赖
- 最稳妥的启动顺序是什么
- 云端桥接脚本应该从哪里看起

## 1. 环境准备

建议本地至少具备以下环境：

- Node.js `20.x` 或更高版本
- npm `10.x` 或更高版本
- Git
- Windows + PowerShell

说明：

- 仓库里有不少 `.ps1` 脚本，Windows 环境下使用最顺手
- `chaowuqiong-project` 的根 `package.json` 标明了 `node >= 20`

## 2. 仓库结构

```text
website-source-hub/
├─ README.md
├─ SETUP.md
├─ .gitignore
├─ fenghuang-unified/
│  ├─ src/
│  ├─ public/
│  └─ Vite / TypeScript 配置
├─ chaowuqiong-project/
│  ├─ apps/
│  │  ├─ backend/
│  │  ├─ frontent/
│  │  │  ├─ webuiapps/
│  │  │  └─ web-manage/
│  │  ├─ sql/
│  │  └─ tools/
│  ├─ packages/
│  │  └─ shared/
│  ├─ config/
│  ├─ deploy/
│  ├─ docs/
│  ├─ nginx/
│  └─ scripts/
└─ cloud-bridge/
   ├─ config/
   ├─ docs/
   ├─ history/
   └─ scripts/
```

## 3. 每个主目录负责什么

### `fenghuang-unified`

- 凤煌官网前端
- 适合做官网首页、营销页、页脚备案、官网公共视觉等改动
- 是独立的 Vite + React 项目

### `chaowuqiong-project/apps/backend`

- 超无穹后端接口
- 包含认证、订单、积分、体验码、支付、邀请、时长等业务逻辑
- 默认建议先走 SQLite 本地开发，再视情况切到 MySQL

### `chaowuqiong-project/apps/frontent/webuiapps`

- 主程序 Web / 桌面壳入口
- 对应用户侧的主窗口、聊天、充值中心、接入页等功能
- 同时包含 Electron 相关脚本

### `chaowuqiong-project/apps/frontent/web-manage`

- 后台管理端
- 对应运营总览、用户管理、订单管理、充值套餐、兑换记录等页面

### `chaowuqiong-project/apps/sql`

- 数据库初始化和补丁 SQL
- 适合排查表结构或手工补丁时参考

### `cloud-bridge`

- 云端桥接和部署方法仓库
- 提供 SSH / SCP / Clash / 验证部署脚本
- `history/` 只保留 Markdown 记录，方便复盘

## 4. 推荐启动顺序

最稳妥的本地启动顺序是：

1. 启动后端 `apps/backend`
2. 启动用户端 `apps/frontent/webuiapps`
3. 启动管理端 `apps/frontent/web-manage`
4. 按需单独启动官网 `fenghuang-unified`

原因：

- `webuiapps` 和 `web-manage` 很多页面依赖后端接口
- 官网是相对独立的一套前端，不一定每次都要一起跑

## 5. 依赖安装

### 官网

```powershell
cd .\fenghuang-unified
npm install
```

### 后端

```powershell
cd .\chaowuqiong-project\apps\backend
npm install
```

### 用户端 / 主程序 Web

```powershell
cd .\chaowuqiong-project\apps\frontent\webuiapps
npm install
```

### 管理后台

```powershell
cd .\chaowuqiong-project\apps\frontent\web-manage
npm install
```

说明：

- 虽然 `chaowuqiong-project` 根目录也有 `package.json`，但为了降低 workspace 层级差异带来的坑，推荐大家优先在各子项目目录里独立安装和运行
- 这样更适合新成员接手，也更容易定位具体项目的问题

## 6. 本地启动命令

### 6.1 官网 `fenghuang-unified`

```powershell
cd .\fenghuang-unified
npm run dev
```

可用命令：

- `npm run dev`
- `npm run build`
- `npm run preview`

### 6.2 后端 `apps/backend`

第一次本地开发，建议先复制环境模板：

```powershell
cd .\chaowuqiong-project\apps\backend
Copy-Item .env.example .env
```

启动命令：

```powershell
cd .\chaowuqiong-project\apps\backend
npm run dev:sqlite
```

如果你已经准备好了对应数据库环境，也可以使用：

```powershell
npm run dev
```

常用命令：

- `npm run dev`
- `npm run dev:mysql`
- `npm run dev:sqlite`
- `npm run build`
- `npm run typecheck`

### 6.3 用户端 `apps/frontent/webuiapps`

如果需要本地环境变量，先从模板创建：

```powershell
cd .\chaowuqiong-project\apps\frontent\webuiapps
Copy-Item .env.example .env
```

启动命令：

```powershell
cd .\chaowuqiong-project\apps\frontent\webuiapps
npm run dev
```

常用命令：

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
- `npm run electron:start`
- `npm run electron:build`

### 6.4 管理后台 `apps/frontent/web-manage`

```powershell
cd .\chaowuqiong-project\apps\frontent\web-manage
npm run dev
```

常用命令：

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## 7. 构建命令汇总

如果只构建单个项目，建议分别在各自目录执行：

```powershell
cd .\fenghuang-unified
npm run build
```

```powershell
cd .\chaowuqiong-project\apps\backend
npm run build
```

```powershell
cd .\chaowuqiong-project\apps\frontent\webuiapps
npm run build
```

```powershell
cd .\chaowuqiong-project\apps\frontent\web-manage
npm run build
```

## 8. 环境文件约定

仓库里只保留模板，不保留真实环境值。

当前已保留模板的项目：

- `chaowuqiong-project/apps/backend/.env.example`
- `chaowuqiong-project/apps/frontent/webuiapps/.env.example`

协作要求：

- 真实 `.env` 只放本地
- 不要把私钥、证书、数据库快照重新提交回仓库
- 如果新增了新的本地配置模板，优先补 `.env.example`

## 9. 云端桥接入口

如果要接手线上桥接或部署，先看这里：

1. `cloud-bridge/docs/01-ssh-bridge-playbook.md`
2. `cloud-bridge/docs/02-separate-mysql-deploy-plan.md`

常用脚本位于：

- `cloud-bridge/scripts/run-ssh-command-via-clash.ps1`
- `cloud-bridge/scripts/run-scp-via-clash.ps1`
- `cloud-bridge/scripts/set-clash-global.js`
- `cloud-bridge/scripts/verify-deployment.ps1`
- `cloud-bridge/scripts/verify-deployment-v2.ps1`

建议：

- 先读文档，再跑脚本
- 桥接脚本只适合在了解当前服务器约束的前提下使用
- 如果要补新的部署动作，同时更新 `docs/` 或 `history/`

## 10. 团队协作建议

- 只改你当前负责的子项目目录，避免一次提交同时混入官网、后台、后端三类改动
- 提交前至少跑一遍对应项目的启动或构建命令
- 后端接口变更时，顺手同步前端调用和文档
- 涉及桥接、部署、环境变量时，优先写明影响范围和回滚路径

## 11. 接手建议

如果你是第一次接手，建议顺序如下：

1. 先读根目录 `README.md`
2. 按本文件装好依赖
3. 先跑 `backend + webuiapps`
4. 再看 `web-manage`
5. 最后按需要补跑 `fenghuang-unified`

这样会比较快建立整套项目的上下文，也更容易知道哪一块对应哪一类业务。
