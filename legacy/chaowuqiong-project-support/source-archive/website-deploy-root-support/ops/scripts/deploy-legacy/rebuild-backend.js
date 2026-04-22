const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 上传修复后的文件
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP失败:', err);
      conn.end();
      return;
    }
    
    const files = [
      {
        local: 'd:\\网站部署\\超无穹项目\\chaowuqiong-project\\apps\\backend\\src\\routes\\orders.ts',
        remote: '/root/backup_20260324/apps/backend/src/routes/orders.ts'
      },
      {
        local: 'd:\\网站部署\\超无穹项目\\chaowuqiong-project\\apps\\backend\\src\\routes\\points.ts',
        remote: '/root/backup_20260324/apps/backend/src/routes/points.ts'
      }
    ];
    
    let index = 0;
    function uploadNext() {
      if (index >= files.length) {
        console.log('\n📦 文件上传完成，重新构建...');
        
        conn.exec('cd /root/backup_20260324/apps/backend && npm run build 2>&1 | tail -15', (err, stream) => {
          if (err) {
            console.error('构建失败:', err);
            conn.end();
            return;
          }
          
          stream.on('close', (code) => {
            if (code === 0) {
              console.log('✅ 构建成功！');
              // 重启服务
              conn.exec('pm2 restart chaowuqiong-api && sleep 2 && pm2 status | grep chaowuqiong-api', (err, stream) => {
                if (err) {
                  conn.end();
                  return;
                }
                stream.on('close', () => conn.end()).on('data', (data) => console.log('' + data));
              });
            } else {
              console.log('❌ 构建失败');
              conn.end();
            }
          }).on('data', (data) => console.log('' + data));
        });
        return;
      }
      
      const file = files[index];
      fs.readFile(file.local, (err, data) => {
        if (err) {
          console.error('读取失败:', err);
          index++;
          uploadNext();
          return;
        }
        
        sftp.writeFile(file.remote, data, (err) => {
          if (err) {
            console.error('上传失败:', err);
          } else {
            console.log(`✅ 已上传: ${file.local.split('\\').pop()}`);
          }
          index++;
          uploadNext();
        });
      });
    }
    
    uploadNext();
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
