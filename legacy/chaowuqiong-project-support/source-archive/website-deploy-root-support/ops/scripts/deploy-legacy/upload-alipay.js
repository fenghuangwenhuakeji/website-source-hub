const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const localFile = fs.readFileSync('d:\\网站部署\\alipay.js');
  const remotePath = '/root/backup_20260324/apps/license-backend/src/routes/alipay.js';
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    sftp.writeFile(remotePath, localFile, (err) => {
      if (err) {
        console.error('上传失败:', err);
        conn.end();
        return;
      }
      console.log('文件上传成功');
      
      // 重启服务
      conn.exec('cd /root/backup_20260324/apps/license-backend && pm2 restart license-backend', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('服务重启完成，退出码: ' + code);
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
