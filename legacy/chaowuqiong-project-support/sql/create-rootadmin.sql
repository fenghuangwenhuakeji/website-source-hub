-- 创建rootadmin管理员账号
-- 密码: gong134135 (bcrypt hash)
INSERT INTO users (username, password, nickname, role, status, points, created_at)
SELECT 'rootadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '超级管理员', 'admin', 'active', 10000, NOW()
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'rootadmin');

-- 查看结果
SELECT id, username, role, status FROM users WHERE username = 'rootadmin';
