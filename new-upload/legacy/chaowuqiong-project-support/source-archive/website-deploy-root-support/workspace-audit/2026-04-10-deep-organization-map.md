# 2026-04-10 Deep Organization Map

## Protected And Left In Place

These paths were intentionally preserved in place:

- `D:\网站部署\fenghuang-unified`
- `D:\网站部署\超无穹项目\super-wuqiong-app`
- `D:\网站部署\超无穹项目\IDE`
- `D:\网站部署\.trae`
- `D:\网站部署\Agent+Agent制造机`
- `D:\网站部署\trae复制`
- `D:\网站部署\codex`
- `D:\网站部署\codex-compiled`
- `D:\网站部署\codex-migration`
- `D:\网站部署\llm-proxy.js`

## Top-Level Reorganization

Moved into `projects\legacy`:

- `D:\网站部署\election打包`
- `D:\网站部署\fenghuang-backend`
- `D:\网站部署\fenghuang-backend-ts`
- `D:\网站部署\fenghuang-frontend`
- `D:\网站部署\fenghuang-website`

Moved into `projects\reference`:

- `D:\网站部署\fenghuang-workspace`
- `D:\网站部署\novel-platform`
- `D:\网站部署\quant-platform`

Moved into `content\writing`:

- `D:\网站部署\中短篇小说`
- `D:\网站部署\长篇`

Moved into `content\showcase`:

- `D:\网站部署\凤煌`

Moved into `reference\mixed`:

- `D:\网站部署\超无穹`

Special case kept in place:

- `D:\网站部署\fenghuang-project`
  - move attempt failed with access denied, so it was intentionally left in place for now

## 超无穹项目 Root Reorganization

Organized loose files under:

- `D:\网站部署\超无穹项目\archives\project-bundles`
- `D:\网站部署\超无穹项目\assets\images`
- `D:\网站部署\超无穹项目\assets\html-demos`
- `D:\网站部署\超无穹项目\docs\planning`
- `D:\网站部署\超无穹项目\docs\presentations`
- `D:\网站部署\超无穹项目\scripts\report-generation`
- `D:\网站部署\超无穹项目\config\nginx`

Still left in place there:

- `D:\网站部署\超无穹项目\chaowuqiong-project`
- `D:\网站部署\超无穹项目\super-wuqiong-app`
- `D:\网站部署\超无穹项目\IDE`
- `D:\网站部署\超无穹项目\龙虾与UI`

## chaowuqiong-project Root Reorganization

Protected and left in place:

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps`
- `D:\网站部署\超无穹项目\chaowuqiong-project\deploy`
- `D:\网站部署\超无穹项目\chaowuqiong-project\deploy-package`
- `D:\网站部署\超无穹项目\chaowuqiong-project\nginx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\node_modules`
- `D:\网站部署\超无穹项目\chaowuqiong-project\packages`

Organized into:

- `D:\网站部署\超无穹项目\chaowuqiong-project\archives\root-bundles`
- `D:\网站部署\超无穹项目\chaowuqiong-project\research\content-labs`
- `D:\网站部署\超无穹项目\chaowuqiong-project\desktop-support\toolchains`
- `D:\网站部署\超无穹项目\chaowuqiong-project\desktop-support\releases`
- `D:\网站部署\超无穹项目\chaowuqiong-project\workspace-support\logs`
- `D:\网站部署\超无穹项目\chaowuqiong-project\docs\planning`
- `D:\网站部署\超无穹项目\chaowuqiong-project\config\nginx`

## apps\desktop Reorganization

Active app layer kept flat:

- `admin-app`
- `codeeditor-app`
- `fenghuang-app`
- `main-app`
- `medium-short-app`
- `shared`
- `short-story-app`

Toolchains moved under:

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\toolchains\electron`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\toolchains\packaging`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\toolchains\installers`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\toolchains\archives`

Historical medium-short variants moved under:

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\variants\medium-short`

`待打包` was internally organized into:

- `archives`
- `docs`
- `scripts`

while keeping its staging content folders in place.

## Remaining Recommended Pass

If continuing after this round, the next best cleanup targets are:

1. classify `D:\网站部署\超无穹项目\龙虾与UI`
2. retry `D:\网站部署\fenghuang-project` once file locks are gone
3. internally split `D:\网站部署\reference\mixed\超无穹`
4. decide whether `chaowuqiong-project\backup`, `config`, `docs`, `scripts`, `secrets` should be further normalized
