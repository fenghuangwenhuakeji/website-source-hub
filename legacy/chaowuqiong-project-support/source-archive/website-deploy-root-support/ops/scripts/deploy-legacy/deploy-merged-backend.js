const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 上传文件到服务器的函数
  function uploadFile(localPath, remotePath, callback) {
    conn.sftp((err, sftp) => {
      if (err) {
        callback(err);
        return;
      }
      
      fs.readFile(localPath, (err, data) => {
        if (err) {
          callback(err);
          return;
        }
        
        sftp.writeFile(remotePath, data, (err) => {
          if (err) {
            callback(err);
            return;
          }
          console.log(`✅ 已上传: ${path.basename(localPath)}`);
          callback(null);
        });
      });
    });
  }
  
  // 上传新创建的路由文件
  const filesToUpload = [
    {
      local: 'd:\\网站部署\\超无穹项目\\chaowuqiong-project\\apps\\backend\\src\\routes\\orders.ts',
      remote: '/root/backup_20260324/apps/backend/src/routes/orders.ts'
    },
    {
      local: 'd:\\网站部署\\超无穹项目\\chaowuqiong-project\\apps\\backend\\src\\routes\\points.ts',
      remote: '/root/backup_20260324/apps/backend/src/routes/points.ts'
    },
    {
      local: 'd:\\网站部署\\超无穹项目\\chaowuqiong-project\\apps\\backend\\src\\app.ts',
      remote: '/root/backup_20260324/apps/backend/src/app.ts'
    }
  ];
  
  let uploadIndex = 0;
  
  function uploadNext() {
    if (uploadIndex >= filesToUpload.length) {
      // 所有文件上传完成，执行SQL和重启服务
      console.log('\n📦 所有文件上传完成，执行部署...');
      
      const commands = `
cd /root/backup_20260324/apps/backend

echo "=== 1. 执行数据库合并SQL ==="
mysql -u root -p"gong134135" < scripts/merge-tables.sql 2>&1

echo ""
echo "=== 2. 安装依赖 ==="
npm install 2>&1 | tail -5

echo ""
echo "=== 3. 构建项目 ==="
npm run build 2>&1 | tail -10

echo ""
echo "=== 4. 重启服务 ==="
pm2 restart chaowuqiong-api

sleep 3

echo ""
echo "=== 5. 检查服务状态 ==="
pm2 status | grep chaowuqiong-api
`;
      
      conn.exec(commands, (err, stream) => {
        if (err) {
          console.error('部署失败:', err);
          conn.end();
          return;
        }
        
        stream.on('close', (code) => {
          console.log(`\n✅ 部署完成，退出码: ${code}`);
          conn.end();
        }).on('data', (data) => {
          console.log('' + data);
        }).stderr.on('data', (data) => {
          console.log('' + data);
        });
      });
      return;
    }
    
    const file = filesToUpload[uploadIndex];
    uploadFile(file.local, file.remote, (err) => {
      if (err) {
        console.error(`❌ 上传失败 ${file.local}:`, err.message);
      }
      uploadIndex++;
      uploadNext();
    });
  }
  
  // 开始上传
  uploadNext();
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
