# D:\网站部署 结构化整理方案

更新时间：2026-04-10

## 当前主线

- `D:\网站部署\fenghuang-unified`
  - 当前凤煌官网、小说助手、写作中心统一站点。
- `D:\网站部署\超无穹项目\chaowuqiong-project`
  - 当前超无穹主系统 monorepo，包含 `apps\backend`、`apps\frontent\webuiapps`、`apps\frontent\web-manage`。

## 并行但非当前主线

- `D:\网站部署\超无穹项目\super-wuqiong-app`
  - 独立 Electron/桌面切换器产品线。
- `D:\网站部署\fenghuang-project`
  - 过渡整合仓，保留中间态能力但不建议作为当前发布主线。

## 历史/旧源码仓

- `D:\网站部署\fenghuang-backend`
- `D:\网站部署\fenghuang-backend-ts`
- `D:\网站部署\fenghuang-frontend`
- `D:\网站部署\fenghuang-website`
- `D:\网站部署\凤煌`

## 建议的顶层分类

- `D:\网站部署\projects\active`
  - `fenghuang-unified`
  - `chaowuqiong-project`
- `D:\网站部署\projects\parallel`
  - `super-wuqiong-app`
  - `novel-platform`
  - `quant-platform`
- `D:\网站部署\projects\staging`
  - `fenghuang-project`
  - `fenghuang-workspace`
- `D:\网站部署\projects\legacy`
  - `fenghuang-backend`
  - `fenghuang-backend-ts`
  - `fenghuang-frontend`
  - `fenghuang-website`
  - `凤煌`
- `D:\网站部署\tooling`
  - `.trae`
  - `trae复制`
  - `Agent+Agent制造机`
  - `codex`
  - `codex-compiled`
  - `codex-migration`
- `D:\网站部署\ops`
  - loose 运维脚本、部署脚本、验证脚本、Nginx 配置
- `D:\网站部署\docs`
  - 方案文档、商业材料、汇总说明
- `D:\网站部署\archives`
  - zip、tar、构建产物快照
- `D:\网站部署\content`
  - `长篇`
  - `中短篇小说`
- `D:\网站部署\secrets`
  - 密钥、证书类文件

## 重复/近重复目录

### 凤煌线

- `D:\网站部署\fenghuang-unified`：当前主线
- `D:\网站部署\fenghuang-project`：整合中间态
- `D:\网站部署\fenghuang-frontend`：旧前端 monorepo
- `D:\网站部署\fenghuang-backend`：旧 JS 后端
- `D:\网站部署\fenghuang-backend-ts`：旧 TS 后端
- `D:\网站部署\fenghuang-website`：旧静态官网
- `D:\网站部署\凤煌`：中文命名镜像

### 超无穹线

- `D:\网站部署\超无穹项目\chaowuqiong-project`：当前主线
- `D:\网站部署\超无穹项目\super-wuqiong-app`：并行独立产品
- `D:\网站部署\超无穹`：更像文档/材料包，不是当前主线代码仓

### 工具链线

- `D:\网站部署\.trae`
- `D:\网站部署\trae复制`
- `D:\网站部署\Agent+Agent制造机`

## 重复/近重复压缩包

### 超无穹快照

- `D:\网站部署\chaowuqiong-project.zip`
- `D:\网站部署\chaowuqiong-project (2).zip`
- `D:\网站部署\超无穹项目\chaowuqiong-project.zip`
- `D:\网站部署\超无穹项目\chaowuqiong-project (2).zip`
- `D:\网站部署\超无穹项目\chaowuqiong-project (3).zip`
- `D:\网站部署\超无穹项目\chaowuqiong-project (4).zip`

### 凤煌后端快照

- `D:\网站部署\fenghuang-backend.zip`
- `D:\网站部署\fenghuang-backend.tar`
- `D:\网站部署\fenghuang-backend-new.zip`
- `D:\网站部署\fenghuang-backend-deploy.zip`
- `D:\网站部署\fenghuang-backend-routes-update.zip`

### 凤煌前端快照

- `D:\网站部署\fenghuang-frontend.zip`
- `D:\网站部署\fenghuang-frontend-new.zip`
- `D:\网站部署\fenghuang-website.zip`

### 目录与压缩包并存

- `D:\网站部署\Agent+Agent制造机` + `D:\网站部署\Agent+Agent制造机.zip`
- `D:\网站部署\election打包` + `D:\网站部署\election打包.zip`
- `D:\网站部署\中短篇小说` + `D:\网站部署\中短篇小说.zip`
- `D:\网站部署\长篇` + `D:\网站部署\长篇(6).zip`
- `D:\网站部署\凤煌` + `D:\网站部署\凤煌.zip`
- `D:\网站部署\novel-platform` + `D:\网站部署\novel-platform.zip`
- `D:\网站部署\quant-platform` + `D:\网站部署\quant-platform.zip`

## 安全归档/合并建议

### 可优先归档到 archives

- 所有根目录 zip/tar
- `D:\网站部署\dist.zip`
- `D:\网站部署\backend-src.zip`
- `D:\网站部署\简化版.zip`

### 可优先收编到 ops

- `deploy*`
- `run-ssh*`
- `restart*`
- `reset*`
- `verify*`
- `debug*`
- `find-*`
- `nginx*.conf`

### 可优先收编到 docs

- `D:\网站部署\PROJECT-README.md`
- `D:\网站部署\SPEC.md`
- `D:\网站部署\backend-merge-plan.md`
- `D:\网站部署\凤煌智能平台_OPC分享_PPT大纲_技术版.md`

### 可保留但建议改名规范

- `D:\网站部署\凤煌` -> `fenghuang-legacy-cn`
- `D:\网站部署\超无穹` -> `chaowuqiong-doc-pack`
- `D:\网站部署\trae复制` -> `trae-legacy-copy`

## 不建议当前迁移的活跃仓

- `D:\网站部署\fenghuang-unified`
- `D:\网站部署\超无穹项目\chaowuqiong-project`
- `D:\网站部署\超无穹项目\super-wuqiong-app`

## 风险提示

- 根目录存在密钥文件：
  - `D:\网站部署\id_rsa_chaowuqiong`
  - `D:\网站部署\fenghuangwenhua.pem`
- 根目录存在 `package.json`、`package-lock.json`、`pnpm-lock.yaml`、`node_modules`
  - 容易污染命令执行上下文与依赖解析。
- loose 脚本过多且版本并存：
  - `reset-mysql-*`
  - `upload-alipay*`
  - `run-ssh*`
  - `restart*`
  - `verify*`
- 存在异常零散文件：
  - `D:\网站部署\-`
  - `D:\网站部署\Brfj0114.txt`

## 推荐执行顺序

1. 先建立目标分类目录，但不移动活跃仓。
2. 第一批只移动根目录 loose 压缩包到 `archives`。
3. 第二批只移动 loose 运维脚本到 `ops`，按 `deploy/ssh/db/verify` 分组。
4. 第三批整理文档与商业材料到 `docs`。
5. 第四批处理历史源码镜像目录的改名与归档。
6. 最后核对活跃仓路径，确认不影响构建、部署与运行。
