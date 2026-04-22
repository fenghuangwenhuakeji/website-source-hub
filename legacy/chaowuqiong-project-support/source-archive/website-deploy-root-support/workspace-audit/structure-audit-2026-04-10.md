# D:\网站部署 结构审计（2026-04-10）

## 当前主线项目

- `D:\网站部署\fenghuang-unified`
  - 统一官网/小说助手/写作中心/HTML 展台主线站点。
- `D:\网站部署\超无穹项目\chaowuqiong-project`
  - 当前桌面系统、充值、主程序、管理后台、后端主线项目。
- `D:\网站部署\fenghuang-backend`
  - 独立后端项目候选，但是否仍为主线需结合部署脚本再核对。

## 历史来源或参考副本

- `D:\网站部署\fenghuang-project`
  - 被统一站点吸收过内容，当前更像历史来源项目。
- `D:\网站部署\fenghuang-website`
  - 被统一站点吸收过视觉与内容，当前更像历史来源项目。
- `D:\网站部署\fenghuang-frontend`
  - 需与 `fenghuang-unified`、`超无穹项目` 的职责再拆分，避免重复维护。
- `D:\网站部署\fenghuang-workspace`
  - 命名偏泛，建议后续确认是否仅为临时工作区。
- `D:\网站部署\trae复制`
  - 明显是副本目录，适合后续归档。
- `D:\网站部署\超无穹`
  - 与 `D:\网站部署\超无穹项目` 命名高度近似，需确认是否是旧版或素材目录。

## 顶层高风险重复点

- 近重复目录：
  - `D:\网站部署\超无穹`
  - `D:\网站部署\超无穹项目`
- 同主题多版本目录：
  - `D:\网站部署\fenghuang-project`
  - `D:\网站部署\fenghuang-website`
  - `D:\网站部署\fenghuang-unified`
  - `D:\网站部署\fenghuang-frontend`
  - `D:\网站部署\fenghuang-workspace`

## 顶层压缩包清单

- `D:\网站部署\Agent+Agent制造机.zip`
- `D:\网站部署\backend-src.zip`
- `D:\网站部署\chaowuqiong-project (2).zip`
- `D:\网站部署\chaowuqiong-project.zip`
- `D:\网站部署\dist.zip`
- `D:\网站部署\election打包.zip`
- `D:\网站部署\fenghuang-backend.tar`
- `D:\网站部署\fenghuang-backend.zip`
- `D:\网站部署\fenghuang-backend-deploy.zip`
- `D:\网站部署\fenghuang-backend-new.zip`
- `D:\网站部署\fenghuang-backend-routes-update.zip`
- `D:\网站部署\fenghuang-frontend.zip`
- `D:\网站部署\fenghuang-frontend-new.zip`
- `D:\网站部署\fenghuang-website.zip`
- `D:\网站部署\novel-platform.zip`
- `D:\网站部署\quant-platform.zip`
- `D:\网站部署\凤煌.zip`
- `D:\网站部署\简化版.zip`
- `D:\网站部署\长篇(6).zip`
- `D:\网站部署\中短篇小说.zip`

## 安全整理建议

1. 建立单独归档区，例如 `D:\网站部署\_archive\packages`，后续仅迁移压缩包，不碰运行中项目。
2. 建立单独来源区，例如 `D:\网站部署\_archive\sources`，把 `fenghuang-project`、`fenghuang-website` 这类历史来源项目逐步迁入，前提是先确认部署链路已全部切到 `fenghuang-unified`。
3. 对 `超无穹` 与 `超无穹项目` 先做用途核验，再决定是否保留双目录。
4. 顶层脚本数量很多，建议后续再按职责整理到：
   - `D:\网站部署\ops\deploy`
   - `D:\网站部署\ops\verify`
   - `D:\网站部署\ops\database`
   - `D:\网站部署\ops\ssh`
5. `node_modules` 位于顶层，后续应确认它是否只是临时依赖目录；如果不是明确的 monorepo 根依赖，建议迁出或重装到各项目内部。

## 本轮不执行的动作

- 不删除任何唯一文件。
- 不移动任何运行中的项目目录。
- 不修改任何现有部署路径。

## 下一步建议

1. 先确认主线只保留：
   - `D:\网站部署\fenghuang-unified`
   - `D:\网站部署\超无穹项目\chaowuqiong-project`
2. 确认后，再进行第二轮“物理整理”：
   - 只迁移压缩包
   - 只归档明确的历史副本
   - 不动主线运行目录
