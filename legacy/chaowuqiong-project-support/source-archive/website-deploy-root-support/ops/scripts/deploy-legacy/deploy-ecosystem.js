const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const localFile = fs.readFileSync('d:\\网站部署\\ecosystem.config.js');
  const remotePath = '/root/backup_20260324/apps/license-backend/ecosystem.config.js';
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    sftp.writeFile(remotePath, localFile, (err) => {
      if (err) {
        console.error('上传失败:', err);
        conn.end();
        return;
      }
      console.log('ecosystem.config.js 上传成功');
      
      // 删除旧的服务并重新启动
      conn.exec('cd /root/backup_20260324/apps/license-backend && pm2 delete license-backend 2>/dev/null; pm2 start ecosystem.config.js', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('服务启动完成，退出码: ' + code);
          conn.end();
        }).on('data', (data) => {
          console.log('' + data);
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
