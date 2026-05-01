#!/bin/bash
# 修复所有导入路径脚本

cd /var/www/chaowuqiong/apps/backend/dist

# 停止服务
pm2 delete chaowuqiong-api 2>/dev/null

# 修复所有导入路径
for file in $(find . -name "*.js" -type f); do
    # 修复各种导入路径
    sed -i "s|from '\.\./config/database'|from '\.\./config/database.js'|g" "$file"
    sed -i "s|from '\.\./config/index'|from '\.\./config/index.js'|g" "$file"
    sed -i "s|from '\.\./config/redis'|from '\.\./config/redis.js'|g" "$file"
    sed -i "s|from '\.\./middleware/auth'|from '\.\./middleware/auth.js'|g" "$file"
    sed -i "s|from '\.\./middleware/errorHandler'|from '\.\./middleware/errorHandler.js'|g" "$file"
    sed -i "s|from '\.\./types/index'|from '\.\./types/index.js'|g" "$file"
    sed -i "s|from '\./config/index'|from '\./config/index.js'|g" "$file"
    sed -i "s|from '\./config/database'|from '\./config/database.js'|g" "$file"
    sed -i "s|from '\./config/redis'|from '\./config/redis.js'|g" "$file"
done

echo "修复完成！"

# 检查修复结果
echo "检查routes/auth.js中的导入..."
grep "from '../config" routes/auth.js || echo "已修复！"

# 启动服务
cd /var/www/chaowuqiong/apps/backend
pm2 start dist/app.js --name chaowuqiong-api
pm2 save

# 检查日志
echo "等待服务启动..."
sleep 3
pm2 logs chaowuqiong-api --lines 30
