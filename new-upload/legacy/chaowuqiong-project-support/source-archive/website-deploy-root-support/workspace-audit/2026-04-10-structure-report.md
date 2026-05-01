# D:\网站部署 结构规范化报告

生成时间：2026-04-10

## 1. 当前建议保留的主线项目

- `D:\网站部署\fenghuang-unified`
  - 当前官网、小说助手、写作中心统一站点主线。
- `D:\网站部署\超无穹项目\chaowuqiong-project`
  - 当前桌面系统、用户前台、管理后台、后端主线。
- `D:\网站部署\fenghuang-backend-ts`
  - 作为独立后端演进线保留观察，但不建议继续与上面两条主线混杂开发。
- `D:\网站部署\workspace-audit`
  - 后续所有目录整理、去重、归档决策统一落在这里。

## 2. 高概率历史副本 / 过渡项目

这些目录不建议再继续直接开发，建议后续改为只读归档区：

- `D:\网站部署\fenghuang-project`
- `D:\网站部署\fenghuang-website`
- `D:\网站部署\fenghuang-frontend`
- `D:\网站部署\fenghuang-workspace`
- `D:\网站部署\凤煌`
- `D:\网站部署\超无穹`
- `D:\网站部署\trae复制`
- `D:\网站部署\codex-compiled`
- `D:\网站部署\codex-migration`

## 3. 顶层明显需要归类的散落脚本

建议后续按用途归档到独立目录，而不是继续散在根目录：

- 部署类：`deploy*.js`、`deploy*.ps1`、`deploy*.sh`、`upload*.js`、`upload*.ps1`
- 运维类：`run-ssh*.ps1`、`run-scp-via-clash.ps1`、`nginx*.conf`、`nginx*.sh`
- 数据库类：`reset_mysql*.sql`、`update_pass*.sql`、`create_invitation_system.sql`
- 调试测试类：`debug_*.cjs`、`test_*.cjs`、`test-*.js`、`quick-check.js`
- 环境/密钥类：`*.pem`、`id_rsa_chaowuqiong*`

建议目标结构：

- `D:\网站部署\ops\deploy`
- `D:\网站部署\ops\ssh`
- `D:\网站部署\ops\nginx`
- `D:\网站部署\ops\db`
- `D:\网站部署\ops\diagnostics`
- `D:\网站部署\ops\secrets`

## 4. 顶层压缩包重复度很高的候选

这些文件高度疑似历史打包产物，可优先进入“待归档清单”，不要继续留在根目录：

- `D:\网站部署\chaowuqiong-project.zip`
- `D:\网站部署\chaowuqiong-project (2).zip`
- `D:\网站部署\fenghuang-backend.zip`
- `D:\网站部署\fenghuang-backend-new.zip`
- `D:\网站部署\fenghuang-backend-deploy.zip`
- `D:\网站部署\fenghuang-backend-routes-update.zip`
- `D:\网站部署\fenghuang-backend.tar`
- `D:\网站部署\fenghuang-frontend.zip`
- `D:\网站部署\fenghuang-frontend-new.zip`
- `D:\网站部署\fenghuang-website.zip`
- `D:\网站部署\凤煌.zip`
- `D:\网站部署\中短篇小说.zip`
- `D:\网站部署\简化版.zip`
- `D:\网站部署\长篇(6).zip`
- `D:\网站部署\election打包.zip`
- `D:\网站部署\Agent+Agent制造机.zip`

建议后续迁移目标：

- `D:\网站部署\archives\project-snapshots`
- `D:\网站部署\archives\exports`
- `D:\网站部署\archives\content-packs`

## 5. 第一轮安全整理建议

第一轮只做这些，不删文件：

1. 建立 `ops`、`archives`、`active-projects` 三层目录。
2. 把当前主线项目登记到 `active-projects-manifest.md`。
3. 把所有顶层压缩包移动到 `archives`，保留原文件名。
4. 把根目录散落脚本按用途移动到 `ops`。
5. 对每次移动生成 `move-log-YYYY-MM-DD.md`，保留源路径与目标路径。

## 6. 风险提示

- `D:\网站部署` 根目录当前混有运行中项目、历史快照、部署脚本和密钥文件，直接人工拖动容易破坏引用关系。
- `node_modules` 位于根目录，说明这里存在共享依赖/历史安装痕迹；在未确认消费方前不建议处理。
- `chaowuqiong-project.zip` 体积很大，后续整理时应优先校验是否仍是唯一有效备份。
- 包含密钥和服务器接入信息的文件必须最后处理，且应优先移入受控目录而不是随项目移动。

## 7. 当前建议结论

- 主开发线收敛到两套：`fenghuang-unified` 和 `超无穹项目\chaowuqiong-project`
- 其余项目优先视为归档或迁移来源
- 根目录后续不应继续新增业务脚本和压缩包
