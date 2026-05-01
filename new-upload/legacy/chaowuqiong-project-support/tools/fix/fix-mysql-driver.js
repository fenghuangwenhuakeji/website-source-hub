const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/license-backend

echo "=== 1. 安装 mysql 驱动 ==="
npm install mysql --save

echo ""
echo "=== 2. 更新 database.js 使用 mysql 驱动 ==="
cat > config/database.js << 'DBEOF'
const mysql = require('mysql');

let pool = null;

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'license_system',
    connectionLimit: 10,
    charset: 'utf8mb4'
};

function initialize() {
    if (pool) return Promise.resolve(pool);
    
    return new Promise((resolve, reject) => {
        pool = mysql.createPool(DB_CONFIG);
        pool.getConnection((err, connection) => {
            if (err) {
                console.warn('⚠️ 数据库连接失败:', err.message);
                pool = null;
                resolve(null);
            } else {
                console.log('✅ MySQL数据库连接成功');
                connection.release();
                resolve(pool);
            }
        });
    });
}

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        initialize().then(pool => {
            if (!pool) {
                reject(new Error('数据库未初始化'));
                return;
            }
            pool.query(sql, params, (error, results) => {
                if (error) {
                    console.error('数据库查询错误:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    });
}

module.exports = {
    initialize,
    query,
    getPool: () => pool
};
DBEOF

echo ""
echo "=== 3. 重启服务 ==="
pm2 restart license-backend

sleep 3

echo ""
echo "=== 4. 检查状态 ==="
pm2 status | grep license-backend
`;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\n命令执行完成，退出码: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
