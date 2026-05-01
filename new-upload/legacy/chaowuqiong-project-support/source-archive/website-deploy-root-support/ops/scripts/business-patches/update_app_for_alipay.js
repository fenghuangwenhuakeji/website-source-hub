const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/app.js';
let content = fs.readFileSync(filePath, 'utf8');

// 添加支付宝路由导入
if (!content.includes("const alipayRoutes")) {
    content = content.replace(
        "const referralRoutes = require('./routes/referral');",
        "const referralRoutes = require('./routes/referral');\nconst alipayRoutes = require('./routes/alipay');"
    );
}

// 添加支付宝路由使用
if (!content.includes("app.use('/api/payment/alipay'")) {
    content = content.replace(
        "app.use('/api/referral', authMiddleware, referralRoutes);",
        "app.use('/api/referral', authMiddleware, referralRoutes);\napp.use('/api/payment/alipay', authMiddleware, alipayRoutes);"
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ app.js 更新完成，支付宝路由已添加');
