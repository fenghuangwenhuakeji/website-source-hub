const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/license-backend

echo "=== 1. 删除 PM2 进程并清除缓存 ==="
pm2 delete license-backend 2>/dev/null
pm2 flush license-backend 2>/dev/null
sleep 2

echo ""
echo "=== 2. 确保两个 database.js 都是最新的 ==="
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
            
            // 使用 mysql.format 来格式化SQL语句
            const formattedSql = mysql.format(sql, params);
            
            pool.query(formattedSql, (error, results) => {
                if (error) {
                    console.error('数据库查询错误:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = {
    initialize,
    query,
    getPool: () => pool
};
DBEOF

cp config/database.js src/config/database.js

echo ""
echo "=== 3. 加载环境变量并启动服务 ==="
export $(cat .env | xargs)
pm2 start app.js --name license-backend

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
