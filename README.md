# Website Source Hub

这个仓库是从 `D:\网站部署` 整理出来的团队协作用源码包，只保留网站相关源码、后台与后端源码，以及云端桥接脚本和方法文档。

## 包含内容

- `fenghuang-unified`
  官网前端源码。
- `chaowuqiong-project`
  与当前网站体系直接相关的业务项目源码，包含：
  - `apps/frontent/webuiapps`
  - `apps/frontent/web-manage`
  - `apps/backend`
  - `apps/sql`
  - `apps/tools`
  - `packages/shared`
  - `config` `deploy` `docs` `nginx` `scripts`
- `cloud-bridge`
  云端桥接方法与脚本，保留：
  - `README.md`
  - `docs/`
  - `scripts/`
  - `config/`
  - 纯 Markdown 的历史部署记录

## 已剔除内容

- `node_modules`
- `dist` 和各类构建产物
- `.env` `.env.local`
- `secrets`
- 本地数据库与缓存文件
- 压缩包、证书、日志、临时目录
- 与当前网站协作无关的桌面打包目录和备份目录

## 使用建议

1. 先分别进入 `fenghuang-unified` 和 `chaowuqiong-project` 安装依赖。
2. 官网修改看 `fenghuang-unified/src`。
3. 主程序 Web 入口看 `chaowuqiong-project/apps/frontent/webuiapps`。
4. 管理后台看 `chaowuqiong-project/apps/frontent/web-manage`。
5. 后端接口和体验码、充值、订单逻辑看 `chaowuqiong-project/apps/backend`。
6. 云端部署和桥接方法看 `cloud-bridge/docs` 与 `cloud-bridge/scripts`。

## 桥接入口

- `cloud-bridge/docs/01-ssh-bridge-playbook.md`
- `cloud-bridge/docs/02-separate-mysql-deploy-plan.md`
- `cloud-bridge/scripts/run-ssh-command-via-clash.ps1`
- `cloud-bridge/scripts/run-scp-via-clash.ps1`

## 说明

这个仓库是为团队共享准备的“纯源码版本”。如果后续要推送到 GitHub，建议把仓库名定成和当前用途一致，例如：

- `website-source-hub`
- `fenghuang-website-suite`
- `chaowuqiong-web-stack`
