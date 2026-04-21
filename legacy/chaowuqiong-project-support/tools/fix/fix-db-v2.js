const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  conn.exec('cd /root/backup_20260324/apps/license-backend/config && cp database.js database.js.backup', (err, stream) => {
    if (err) {
      console.error('备份失败:', err);
      conn.end();
      return;
    }
    
    stream.on('close', () => {
      console.log('备份完成');
      
      // 上传新的 database.js
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP失败:', err);
          conn.end();
          return;
        }
        
        const newContent = `const mysql = require('mysql2/promise');

let pool = null;

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'license_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: false,
    charset: 'utf8mb4',
    connectTimeout: 10000
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
};`;
        
        sftp.writeFile('/root/backup_20260324/apps/license-backend/config/database.js', newContent, (err) => {
          if (err) {
            console.error('写入失败:', err);
            conn.end();
            return;
          }
          
          console.log('database.js 已更新');
          
          // 重启服务
          conn.exec('cd /root/backup_20260324/apps/license-backend && pm2 restart license-backend', (err, stream) => {
            if (err) {
              console.error('重启失败:', err);
              conn.end();
              return;
            }
            
            stream.on('close', () => {
              console.log('服务已重启');
              conn.end();
            }).on('data', (data) => {
              console.log('' + data);
            });
          });
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
