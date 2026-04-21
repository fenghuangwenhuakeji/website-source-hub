#!/bin/bash

# 部署脚本 - 在服务器上执行

echo "=== 开始修复nginx配置 ==="

# 1. 重命名react-admin目录为admin
echo "1. 重命名react-admin目录为admin..."
if [ -d "/var/www/chaowuqiong/apps/react-admin" ]; then
    rm -rf /var/www/chaowuqiong/apps/admin
    mv /var/www/chaowuqiong/apps/react-admin /var/www/chaowuqiong/apps/admin
    echo "   ✓ 重命名完成"
else
    echo "   ! react-admin目录不存在"
fi

# 2. 更新nginx配置
echo "2. 更新nginx配置..."
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
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
echo "   ✓ nginx配置更新完成"

# 3. 测试nginx配置
echo "3. 测试nginx配置..."
nginx -t
if [ $? -eq 0 ]; then
    echo "   ✓ nginx配置测试通过"
else
    echo "   ✗ nginx配置测试失败"
    exit 1
fi

# 4. 重启nginx
echo "4. 重启nginx..."
systemctl restart nginx
echo "   ✓ nginx重启完成"

# 5. 验证文件
echo "5. 验证admin目录..."
ls -la /var/www/chaowuqiong/apps/admin/

echo ""
echo "=== 部署完成 ==="
echo "请访问: http://115.190.158.182/admin"
