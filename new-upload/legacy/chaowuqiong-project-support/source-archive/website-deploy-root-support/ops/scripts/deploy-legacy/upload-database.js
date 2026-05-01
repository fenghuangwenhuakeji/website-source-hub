const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const dbContent = `const mysql = require('mysql');

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
};`;

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP失败:', err);
      conn.end();
      return;
    }
    
    // 写入 config/database.js
    sftp.writeFile('/root/backup_20260324/apps/license-backend/config/database.js', dbContent, (err) => {
      if (err) {
        console.error('写入 config/database.js 失败:', err);
        conn.end();
        return;
      }
      
      console.log('config/database.js 已更新');
      
      // 写入 src/config/database.js
      sftp.writeFile('/root/backup_20260324/apps/license-backend/src/config/database.js', dbContent, (err) => {
        if (err) {
          console.error('写入 src/config/database.js 失败:', err);
          conn.end();
          return;
        }
        
        console.log('src/config/database.js 已更新');
        
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
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
