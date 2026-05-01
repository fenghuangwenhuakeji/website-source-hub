-- Create rootadmin account
-- Password: gong134135
INSERT INTO users (username, password, nickname, role, status, points, created_at)
VALUES ('rootadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SuperAdmin', 'admin', 'active', 10000, NOW())
ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role), status=VALUES(status);

SELECT id, username, role, status FROM users WHERE username='rootadmin';
