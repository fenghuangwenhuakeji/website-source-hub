@echo off

echo 开始部署后端服务...

REM 上传压缩包
echo 1. 上传压缩包到服务器...
scp -i "C:\Users\8\Downloads\fenghuangwenhua.pem" "d:\网站部署\fenghuang-backend-deploy.zip" root@115.190.158.182:/tmp/

REM 解压文件
echo 2. 解压文件到目标目录...
ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "mkdir -p /var/www/fenghuang-backend && unzip /tmp/fenghuang-backend-deploy.zip -d /var/www/fenghuang-backend"

REM 安装依赖
echo 3. 安装Node.js依赖...
ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "cd /var/www/fenghuang-backend && npm install"

REM 启动服务
echo 4. 启动后端服务...
ssh -i "C:\Users\8\Downloads\fenghuangwenhua.pem" root@115.190.158.182 "cd /var/www/fenghuang-backend && npm start"

echo 部署完成！
pause