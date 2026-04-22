#!/bin/bash
# 服务器修复脚本

# 1. 创建Nginx配置文件
cat > /etc/nginx/conf.d/chaowuqiong.conf << 'EOF'
server {
    listen 80;
    server_name 115.190.158.182;

    root /var/www/chaowuqiong/apps/webuiapps/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /admin {
        root /var/www/chaowuqiong/apps;
        try_files $uri $uri/ /admin/index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 2. 测试并重载Nginx
nginx -t && systemctl reload nginx

# 3. 检查后端文件是否存在
echo "检查后端文件..."
ls -la /var/www/chaowuqiong/apps/backend/dist/ 2>/dev/null || echo "后端dist目录不存在"

# 4. 如果后端不存在，检查是否有源码需要编译
if [ ! -f "/var/www/chaowuqiong/apps/backend/dist/app.js" ]; then
    echo "后端服务文件不存在，需要部署"
    
    # 检查是否有package.json
    if [ -f "/var/www/chaowuqiong/apps/backend/package.json" ]; then
        echo "找到后端源码，尝试编译..."
        cd /var/www/chaowuqiong/apps/backend
        
        # 安装依赖并编译
        npm install
        npm run build
    else
        echo "后端源码也不存在！"
    fi
fi

# 5. 启动后端服务
if [ -f "/var/www/chaowuqiong/apps/backend/dist/app.js" ]; then
    echo "启动后端服务..."
    cd /var/www/chaowuqiong
    pm2 delete chaowuqiong-api 2>/dev/null
    pm2 start apps/backend/dist/app.js --name chaowuqiong-api --env production
    pm2 save
else
    echo "错误：后端文件仍然不存在！"
fi

# 6. 检查端口
echo "检查3000端口..."
netstat -tlnp | grep 3000 || echo "3000端口未监听"

# 7. 测试API
echo "测试API..."
curl -s http://127.0.0.1:3000/api/health || echo "API测试失败"

echo "修复完成！"
