const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  // 修改 database.js 添加更多配置选项
  const commands = `
cd /root/backup_20260324/apps/license-backend/config

# 备份原文件
cp database.js database.js.backup

# 创建新的 database.js，添加更多连接选项
cat > database.js << 'DBEOF'
const mysql = require('mysql2/promise');

let pool = null;

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'license_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // MySQL 8.0 兼容配置
    authPlugins: {
        mysql_native_password: () => () => Buffer.from(process.env.DB_PASSWORD + '\0'),
        caching_sha2_password: () => () => Buffer.from(process.env.DB_PASSWORD + '\0')
    },
    // 禁用 SSL
    ssl: false,
    // 设置字符集
    charset: 'utf8mb4',
    // 连接超时
    connectTimeout: 10000,
    // 启用调试
    debug: false
};

async function initialize() {
    if (pool) return pool;

    try {
        pool = mysql.createPool(DB_CONFIG);
        const connection = await pool.getConnection();
        connection.release();
        console.log('✅ MySQL数据库连接成功');
        return pool;
    } catch (error) {
        console.warn('⚠️ 数据库连接失败:', error.message);
        return null;
    }
}

async function query(sql, params = []) {
    try {
        const db = await initialize();
        if (!db) {
            throw new Error('数据库未初始化');
        }
        const [results] = await db.execute(sql, params);
        return results;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
}

module.exports = {
    initialize,
    query,
    getPool: () => pool
};
DBEOF

echo "=== database.js 已更新 ==="

# 重启服务
cd /root/backup_20260324/apps/license-backend
pm2 restart license-backend
sleep 3
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
