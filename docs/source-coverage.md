# 凤煌平台线源码覆盖

本仓只承接凤煌平台线主源码，不承接整个“超无穹总启动器”产品线。

## 已纳入主线的 `D:\网站部署` 源目录

| 来源目录 | 仓内归属 |
| --- | --- |
| `D:\网站部署\fenghuang-unified` | `apps/website` |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps` | `apps/client-web` |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage` | `apps/admin-web` |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend` | `apps/backend` |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\main-app` | `apps/client-desktop` |
| `D:\网站部署\超无穹项目\chaowuqiong-project\packages\shared` | `packages/shared` |
| `D:\网站部署\cloud-bridge` | `infra/cloud-bridge` |

## 明确不进入凤煌主线的目录

这些内容经过对账后被归为参考、副本、历史产物或另一条产品线：

- `D:\网站部署\超无穹项目\super-wuqiong-app`
  归入独立仓 `Nike232/super-wuqiong-app`
- `D:\HTML\13-超无穹项目封装整理副本`
  为 `chaowuqiong-project` 的整理副本，不作为凤煌主线真源
- `D:\HTML\11-网站建设`
  以资料、草图和说明性内容为主，不作为当前默认构建输入
- `D:\网站部署` 与 `chaowuqiong-project` 内的 `node_modules`、`dist*`、`build`、`release`、压缩包、日志、数据库、证书、密钥
  归为产物、缓存或敏感文件，不进入主线

## `D:\HTML` 的使用方式

- `D:\HTML` 只作为补充线索源和整理副本来源
- 若某文件能在 `D:\网站部署` 找到对应主源，则优先以 `D:\网站部署` 为准
- 若后续发现 `D:\HTML` 包含凤煌主线缺失源码，应先完成只读对账，再补入主线或 `legacy/`

## Win 构建约束

- 标准验收环境固定为 `Win-Workstation` 的 `F:\work`
- 桌面端唯一前端输入固定为 `apps/client-web/dist`
- 使用 `LOCAL_ACCEPTANCE_MODE=1` 时，桌面壳会进入本地验收模式，允许在无生产登录态下验证主界面
