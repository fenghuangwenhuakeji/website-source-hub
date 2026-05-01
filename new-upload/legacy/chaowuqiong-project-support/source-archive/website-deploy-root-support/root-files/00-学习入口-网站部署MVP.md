# 网站部署学习入口

这套目录已经被整理成“项目运行 + 运维桥接 + 文档学习 + 移动端适配 + Agent 沉淀”五条主线。第一次接手时，建议按下面顺序阅读。

## 先看这三份

1. [01-MVP-SOP-执行手册](./01-MVP-SOP-%E6%89%A7%E8%A1%8C%E6%89%8B%E5%86%8C.md)
2. [02-技术文档-系统架构与运维说明](./02-%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3-%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84%E4%B8%8E%E8%BF%90%E7%BB%B4%E8%AF%B4%E6%98%8E.md)
3. [mobile-adaptation-center/README.md](./mobile-adaptation-center/README.md)

## 当前主线项目

- 官网与统一站点：`D:\网站部署\fenghuang-unified`
- 主应用与后台：`D:\网站部署\超无穹项目\chaowuqiong-project`
- 云端桥接资料：`D:\网站部署\cloud-bridge`
- Agent/Skill 主沉淀目录：`D:\网站部署\.trae`
- Agent/Skill 可编辑镜像：`D:\网站部署\trae复制`

## 当前已经稳定的方向

- 本地开发、构建和发布链路已经跑通。
- 小说、账户、订单、积分等业务数据已经明确走本地 SQL / 云端 MySQL 分层。
- 用户导入文件和用户上传文件明确走本地文件存储，不直接塞进云端缓存。
- 移动端适配已经单独收口到 `mobile-adaptation-center`，不再零散记在聊天记录里。
- 云端 SSH 桥接、SCP、部署、回滚、验收已经沉淀到 `cloud-bridge`。

## 快速操作入口

### 本地构建

```powershell
cd D:\网站部署\fenghuang-unified
npm run build

cd D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps
npm run build

cd D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage
npm run build
```

### 云端桥接

看这里：

- `D:\网站部署\cloud-bridge\README.md`
- `D:\网站部署\cloud-bridge\docs\01-ssh-bridge-playbook.md`
- `D:\网站部署\cloud-bridge\docs\02-separate-mysql-deploy-plan.md`

### Agent/Skill

看这里：

- `D:\网站部署\.trae\skills\website-deployment-mvp-agent`
- `D:\网站部署\trae复制\skills\website-deployment-mvp-agent`

## 你接手时最重要的原则

- 不要直接改受保护主线目录之外的结构，除非先确认归档目标。
- 不要把用户文件直接设计成云端唯一存储。
- 不要只修页面，必须同步记录到文档中心或 skill。
- 不要在未验构建的情况下直接发云端。
