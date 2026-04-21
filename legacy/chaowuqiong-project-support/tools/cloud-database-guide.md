# 云端数据库连接技巧指南

## 1. SSH隧道连接（推荐）

### 原理
通过SSH隧道将远程服务器的MySQL端口映射到本地，实现安全连接。

### 配置步骤

#### Windows (使用PowerShell)
```powershell
# 建立SSH隧道，将远程3306映射到本地3307
ssh -N -L 3307:localhost:3306 root@115.190.158.182

# 保持后台运行（使用 -f 参数）
ssh -fN -L 3307:localhost:3306 root@115.190.158.182
```

#### 本地连接配置
```javascript
// database.js 本地开发配置
const dbConfig = {
  host: 'localhost',      // 通过隧道连接
  port: 3307,             // 本地映射端口
  user: 'root',
  password: 'gong134135',
  database: 'license_system',
  charset: 'utf8mb4'
};
```

## 2. 直接连接（需开放端口）

### 服务器配置
```bash
# 1. 修改MySQL绑定地址
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# 将 bind-address = 127.0.0.1 改为 bind-address = 0.0.0.0

# 2. 创建远程访问用户
mysql -u root -p
CREATE USER 'dev'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON license_system.* TO 'dev'@'%';
FLUSH PRIVILEGES;

# 3. 开放防火墙端口
sudo ufw allow 3306/tcp
```

### 本地连接
```javascript
const dbConfig = {
  host: '115.190.158.182',
  port: 3306,
  user: 'dev',
  password: 'your_password',
  database: 'license_system'
};
```

## 3. 使用数据库客户端工具

### DBeaver / DataGrip 配置
1. **SSH标签页**：
   - Host: 115.190.158.182
   - Port: 22
   - User: root
   - Auth: Password 或 Public Key

2. **Main标签页**：
   - Host: localhost
   - Port: 3306
   - Database: license_system

### Navicat 配置
- 连接类型：SSH + MySQL
- SSH主机：115.190.158.182
- MySQL主机：localhost

## 4. Node.js 自动连接脚本

```javascript
// tools/connect-cloud-db.js
const { Client } = require('ssh2');
const mysql = require('mysql2/promise');

async function connectViaSSH() {
  const ssh = new Client();
  
  return new Promise((resolve, reject) => {
    ssh.on('ready', () => {
      ssh.forwardOut(
        '127.0.0.1', 12345,
        '127.0.0.1', 3306,
        async (err, stream) => {
          if (err) reject(err);
          
          const connection = await mysql.createConnection({
            stream: stream,
            user: 'root',
            password: 'gong134135',
            database: 'license_system'
          });
          
          resolve(connection);
        }
      );
    }).connect({
      host: '115.190.158.182',
      port: 22,
      username: 'root',
      password: 'Brfj0114'  // SSH密码
    });
  });
}

module.exports = { connectViaSSH };
```

## 5. 环境变量管理

### .env.local（本地开发）
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=gong134135
DB_NAME=license_system

# SSH配置
SSH_HOST=115.190.158.182
SSH_PORT=22
SSH_USER=root
SSH_PASSWORD=Brfj0114
```

### .env.production（生产环境）
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Chaowuqiong@2026!
DB_NAME=chaowuqiong_db
```

## 6. 常用命令

```bash
# 测试MySQL连接
mysql -h 115.190.158.182 -u root -p -e "SELECT 1"

# 导出数据库
mysqldump -h 115.190.158.182 -u root -p license_system > backup.sql

# 导入数据库
mysql -h 115.190.158.182 -u root -p license_system < backup.sql

# 查看连接
mysql -u root -p -e "SHOW PROCESSLIST"
```

## 7. 故障排除

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| ECONNREFUSED | MySQL未运行 | `sudo systemctl start mysql` |
| Access denied | 密码错误 | 重置密码或检查用户权限 |
| Timeout | 防火墙阻止 | 检查ufw/iptables规则 |
| SSL错误 | 认证插件不兼容 | 修改mysql_native_password |

## 8. 安全建议

1. **不要**在代码中硬编码密码
2. **使用**SSH密钥代替密码认证
3. **限制**远程访问IP白名单
4. **定期**更换数据库密码
5. **启用**SSL连接加密
