# 凤煌平台线源码覆盖

`website-source-hub` 是凤煌正式主仓，不只是官网仓。它必须承接官网、用户端、后台、后端，以及凤煌桌面里真正可见的应用生态。

本次对账后确认：

- `D:\网站部署` 里的网站/后台/后端仍然是重要来源
- 但凤煌桌面应用生态的关键来源在 `D:\HTML`
- `D:\网站部署\chaowuqiong-project\apps\webuiapps\dist` 更接近部署产物，不足以单独代表凤煌桌面的完整源码
- `Nike232/super-wuqiong-app` 只负责旧命名空间启动器与归档，不负责凤煌桌面主体验

## 当前主线来源

| 来源 | 仓内归属 | 说明 |
| --- | --- | --- |
| `D:\网站部署\fenghuang-unified` | `apps/website` | 官网主线 |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage` | `apps/admin-web` | 管理后台主线 |
| `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend` | `apps/backend` | 后端主线 |
| `D:\网站部署\cloud-bridge` | `infra/cloud-bridge` | 桥接与部署资料 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\apps\CodeEditor` | `apps/client-web/public/apps/CodeEditor` 与 `public/desktop-bundles/code-editor` | 编辑器入口与桌面 bundle 对账基线 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\apps\WebChat` | `apps/client-web/public/apps/WebChat` 与 `public/desktop-bundles/agent-creator` | Agent Creator / WebChat 对账基线 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\apps\fenghuang` | `apps/client-web/public/apps/fenghuang` | 凤煌创作套件主入口 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\apps\medium-short` | `apps/client-web/public/apps/medium-short` | 中短篇创作套件 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\apps\short` | `apps/client-web/public/apps/short` | 短篇创作套件 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\desktop-bundles\agent-creator` | `apps/client-web/public/desktop-bundles/agent-creator` | 桌面导入应用 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\desktop-bundles\code-editor` | `apps/client-web/public/desktop-bundles/code-editor` | 桌面导入应用 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\desktop-bundles\short-book-lab` | `apps/client-web/public/desktop-bundles/short-book-lab` | 桌面导入应用 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\main-app\dist\desktop-bundles\phoenix-early` | `apps/client-web/public/desktop-bundles/phoenix-early` | 历史凤煌早期合集，保留为参考入口 |
| `D:\HTML\13-超无穹项目封装整理副本\01-桌面本地化-Electron封装\apps\desktop\fenghuang-app\app\*` | `apps/client-web/public/apps/fenghuang/*` | 更早期凤煌静态创作套件基线 |
| `D:\HTML` 中已整理的 HTML 应用库 | `apps/client-web/public/desktop-bundles/html-vault` | 桌面内容库，对外提供 `tavern-game` 等项目枚举与打开能力 |

## 凤煌桌面验收面

以下入口被定义为凤煌 Win 验收必须存在的正式应用面：

- `代码编辑器`
- `Agent Creator`
- `短篇拆书版`
- `HTML Vault`
- `凤煌创作入口`

其中 `凤煌创作入口` 必须包含以下源码目录：

- `5.50完全体`
- `丐版短篇`
- `丐版中长篇`
- `卡牌引擎`
- `循环细纲版`
- `第四种融合思路`
- `网页promax`

`HTML Vault` 必须至少能枚举和打开 `tavern-game` 这一类仓内已存在项目。

## 当前主线边界

- `apps/client-web` 是凤煌 Web 与桌面共用前端真源
- `apps/client-desktop` 只保留 Electron 壳和打包逻辑，输入固定为 `apps/client-web/dist`
- `apps/client-web/src/lib/appRegistry.ts` 负责组件化应用与主程序路由定义
- `apps/client-web/src/lib/desktopApps.ts` 负责凤煌桌面一级入口与导入 bundle 清单
- `Nike232/super-wuqiong-app` 只负责旧命名空间启动器与残余源码归档，不允许承接本仓 required 的凤煌桌面入口

## 明确排除项

| 来源路径 / 类型 | 归类 | 原因 |
| --- | --- | --- |
| `node_modules`、`server-node_modules`、`node_modules (2)` | 构建缓存 | 不作为源码纳入 |
| `dist*`、`build`、`release`、`dist-release*`、`dist-electron` | 构建产物 | 不作为主线真源纳入 |
| `*.zip`、`*.exe`、日志、数据库、证书、密钥 | 历史包 / 敏感文件 | 不纳入默认源码仓 |
| `D:\网站部署\超无穹项目\super-wuqiong-app` | 旧命名空间启动器线 | 归 `Nike232/super-wuqiong-app` |
| 没有对应源码的第三方二进制 | 外部依赖 | 只登记身份，不把二进制当源码 |

## Win 构建约束

- 标准验收环境固定为 `Win-Workstation` 的 `F:\work`
- 桌面端唯一前端输入固定为 `apps/client-web/dist`
- `build:acceptance:win` 会自动按 `LOCAL_ACCEPTANCE_MODE=1` 打包桌面，目标是直接进入 `/main?localAcceptance=1`
- 若打包结果只能打开登录页或充值页，或缺少上述正式应用面中的任意一项，即视为验收失败
