module.exports = {
  apps: [
    {
      name: 'chaowuqiong-api',
      script: 'apps/backend/dist/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/chaowuqiong/pm2-error.log',
      out_file: '/var/log/chaowuqiong/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
