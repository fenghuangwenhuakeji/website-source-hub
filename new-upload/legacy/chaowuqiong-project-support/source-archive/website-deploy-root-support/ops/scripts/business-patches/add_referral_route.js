const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/app.js';
let content = fs.readFileSync(filePath, 'utf8');

// 添加 referral 路由导入
if (!content.includes("const referralRoutes")) {
    content = content.replace(
        "const llmProxyRoutes = require('./routes/llm-proxy');",
        "const llmProxyRoutes = require('./routes/llm-proxy');\nconst referralRoutes = require('./routes/referral');"
    );
}

// 添加 referral 路由使用
if (!content.includes("app.use('/api/referral'")) {
    content = content.replace(
        "app.use('/api/llm-proxy', authMiddleware, llmProxyRoutes);",
        "app.use('/api/llm-proxy', authMiddleware, llmProxyRoutes);\napp.use('/api/referral', authMiddleware, referralRoutes);"
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ app.js 更新完成，referral 路由已添加');
