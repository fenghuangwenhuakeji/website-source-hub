# web-manage 移动端适配

项目路径：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`

## 当前重点

- 登录页
- 用户管理
- 套餐管理
- 邀请管理
- 订单与时长页

## 已完成

- React Router future flags 已补
- 静态 `message.*` 已继续收口到 `App.useApp()`
- 现有页面已经具备基础响应式栅格

## 已知风险

- `vendor-antd` 仍偏大
- 某些表格在极窄宽度下仍依赖横向滚动

## 下一步

- 继续压缩操作列宽度
- 继续检查表单弹窗在手机端的滚动体验
- 若后续上真移动端管理台，需要再拆一层“概览卡片 + 明细抽屉”模式
