Write-Host "开始部署后端服务..."

# 上传压缩包
Write-Host "1. 上传压缩包到服务器..."
& scp -i "C:\Users\8\Downloads\fenghuangwenhua.pem" "d:\网站部署\fenghuang-backend-deploy.zip" root@115.190.158.182:/tmp/

# 解压文件
Write-Host "2. 解压文件到目标目录..."
& ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "mkdir -p /var/www/fenghuang-backend && unzip /tmp/fenghuang-backend-deploy.zip -d /var/www/fenghuang-backend"

# 安装依赖
Write-Host "3. 安装Node.js依赖..."
& ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "cd /var/www/fenghuang-backend && npm install"

# 启动服务
Write-Host "4. 启动后端服务..."
& ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "cd /var/www/fenghuang-backend && npm start"

Write-Host "部署完成！"
Read-Host "按Enter键退出"