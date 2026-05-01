const fs = require('fs');

const filePath = '/root/backup_20260324/apps/license-backend/src/app.js';
let content = fs.readFileSync(filePath, 'utf8');

// 添加 llm-proxy 路由导入
if (!content.includes("const llmProxyRoutes")) {
    content = content.replace(
        "const paymentRoutes = require('./routes/payment');",
        "const paymentRoutes = require('./routes/payment');\nconst llmProxyRoutes = require('./routes/llm-proxy');"
    );
}

// 添加 llm-proxy 路由使用
if (!content.includes("app.use('/api/llm-proxy'")) {
    content = content.replace(
        "app.use('/api/stats', authMiddleware, statsRoutes);",
        "app.use('/api/stats', authMiddleware, statsRoutes);\napp.use('/api/llm-proxy', authMiddleware, llmProxyRoutes);"
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ app.js 更新完成，llm-proxy 路由已添加');
