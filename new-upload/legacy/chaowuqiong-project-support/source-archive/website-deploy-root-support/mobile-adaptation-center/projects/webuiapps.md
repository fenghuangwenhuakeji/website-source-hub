# webuiapps 移动端适配

项目路径：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`

## 当前重点

- 登录页
- 充值中心
- 主应用入口
- 桌面系统容器

## 已完成

- `src/App.tsx` 加载态已改为 `100dvh + safe-area`
- `src/pages/MainPage.tsx` 加载态和主容器已补安全区
- 返回充值入口的固定按钮已缩窄边距并补顶部安全区偏移
- `fileApi.ts` 与 `FileSystemStore.ts` 的拆包冲突已收口

## 已知风险

- `vendor-typescript` 仍然偏大
- `MacOSDesktop` 仍是最重模块之一
- Sass 旧 API warning 仍待处理

## 下一步

- 继续拆编辑器和桌面系统重模块
- 继续检查移动端桌面壳层的浮层、抽屉和 dock
- 对主应用真机再做一轮触控反馈检查
