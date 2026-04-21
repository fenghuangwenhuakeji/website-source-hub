# 2026-04-13 管理后台订单/兑换记录/时长修复上线记录

## 本次目标

- 统一业务规则：支付成功只发积分，不自动发时长
- 管理后台支持手动补单
- 管理后台支持订单记录增删改
- 管理后台支持兑换记录增删改
- 管理后台支持时长记录增删改

## 本地构建结果

- `apps/backend`: `npm run build` 通过
- `apps/frontent/web-manage`: `npm run build` 通过

## 已上线内容

- 后端：
  - `apps/backend/src/routes/admin.ts`
  - `apps/backend/src/routes/orders.ts`
  - `apps/backend/src/services/payment/orderStore.ts`
- 管理后台：
  - `apps/frontent/web-manage/src/App.tsx`
  - `apps/frontent/web-manage/src/api/index.ts`
  - `apps/frontent/web-manage/src/pages/layout/index.tsx`
  - `apps/frontent/web-manage/src/pages/orders/index.tsx`
  - `apps/frontent/web-manage/src/pages/durations/index.tsx`
  - `apps/frontent/web-manage/src/pages/exchange-records/index.tsx`

## 线上部署动作

- 上传 `backend dist`:
  - `/tmp/backend-dist-admin-fix-20260413-112125.tar.gz`
  - `/tmp/backend-dist-admin-fix-20260413-112304.tar.gz`
- 上传 `web-manage dist`:
  - `/tmp/admin-dist-admin-fix-20260413-112125.tar.gz`
- 替换目录：
  - `/var/www/chaowuqiong/apps/backend/dist`
  - `/var/www/chaowuqiong/apps/web-manage/dist`
- 重启：
  - `pm2 restart chaowuqiong-api --update-env`
- 校验：
  - `http://127.0.0.1/admin/` 返回 `200`
  - `https://fhwhkj.top/admin/` 返回新入口 `index-DV_nDy62.js`
  - 新静态资源存在：
    - `exchange-records-U7xH_JW_.js`
    - `durations-SFdXPhkE.js`
    - `orders-D2872W4y.js`

## 额外修复

- 修复支付回调入账时 `points_records.id` 未写入导致的：
  - `ER_NO_DEFAULT_FOR_FIELD`
- 做法：
  - `orderStore.ts` 改为统一走 `insertPointsRecord()`

## 当前说明

- 已支付订单不会自动发时长，时长需通过积分兑换或后台时长管理单独处理
- 兑换记录页会同步修正用户积分
- 时长变更需在时长管理页单独维护
- 已支付订单默认不允许直接删除，避免误删后产生积分/返佣不一致
