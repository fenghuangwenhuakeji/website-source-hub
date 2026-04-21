const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 更新 Nginx 配置，将所有 /api/ 请求都代理到 3000 端口
  const nginxConfig = `server {
    listen 80;
    server_name 115.190.158.182;

    # 前端静态文件
    location / {
        root /var/www/chaowuqiong;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 请求 - 全部代理到 3000 端口 (chaowuqiong-api)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 支付回调 - 也代理到 3000 端口
    location /payment/ {
        proxy_pass http://127.0.0.1:3000/payment/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`;

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP失败:', err);
      conn.end();
      return;
    }
    
    sftp.writeFile('/etc/nginx/conf.d/chaowuqiong.conf', nginxConfig, (err) => {
      if (err) {
        console.error('写入 Nginx 配置失败:', err);
        conn.end();
        return;
      }
      
      console.log('✅ Nginx 配置已更新');
      
      // 测试并重载 Nginx
      conn.exec('nginx -t && nginx -s reload', (err, stream) => {
        if (err) {
          console.error('Nginx 重载失败:', err);
          conn.end();
          return;
        }
        
        stream.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Nginx 配置测试通过并重载成功');
          } else {
            console.log('❌ Nginx 配置测试失败');
          }
          conn.end();
        }).on('data', (data) => {
          console.log('' + data);
        }).stderr.on('data', (data) => {
          console.log('' + data);
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
