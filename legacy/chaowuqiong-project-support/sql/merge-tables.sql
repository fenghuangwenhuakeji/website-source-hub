-- 合并后端项目的数据库表
-- 执行此SQL来添加从 license-backend 和 backend_original 迁移过来的表

USE chaowuqiong_db;

-- 1. 积分记录表 (从 license-backend)
CREATE TABLE IF NOT EXISTS points_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    points INT NOT NULL COMMENT '变动积分',
    type VARCHAR(50) NOT NULL COMMENT '类型: recharge/exchange/consume',
    description VARCHAR(255) DEFAULT NULL COMMENT '描述',
    order_no VARCHAR(100) DEFAULT NULL COMMENT '关联订单号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分记录表';

-- 2. 充值套餐表 (如果不存在)
CREATE TABLE IF NOT EXISTS recharge_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    description TEXT COMMENT '套餐描述',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    points INT NOT NULL COMMENT '包含积分',
    duration INT DEFAULT 0 COMMENT 'VIP时长(天)',
    duration_unit VARCHAR(20) DEFAULT 'day' COMMENT '时长单位',
    icon VARCHAR(255) DEFAULT NULL COMMENT '图标',
    recommended TINYINT DEFAULT 0 COMMENT '是否推荐',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='充值套餐表';

-- 3. 插入默认充值套餐
INSERT INTO recharge_packages (name, description, price, points, duration, duration_unit, icon, recommended, sort_order) VALUES
('9小时体验卡', '适合短期体验', 9.90, 100, 0, 'hour', 'clock-circle', 0, 1),
('周卡', '7天会员', 14.90, 200, 7, 'day', 'calendar', 0, 2),
('月卡', '30天会员 推荐', 29.90, 500, 30, 'day', 'crown', 1, 3),
('季卡', '90天会员', 79.90, 1500, 90, 'day', 'gift', 0, 4),
('半年卡', '180天会员', 149.90, 3000, 180, 'day', 'star', 0, 5),
('年卡', '365天会员 超值', 299.90, 7000, 365, 'day', 'crown', 1, 6)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. 检查 users 表是否有 points 字段
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = 'chaowuqiong_db' AND table_name = 'users' AND column_name = 'points');
SET @sql := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN points INT DEFAULT 0 COMMENT "积分"', 'SELECT "points字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 检查 users 表是否有 balance 字段
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = 'chaowuqiong_db' AND table_name = 'users' AND column_name = 'balance');
SET @sql := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00 COMMENT "余额"', 'SELECT "balance字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 检查 orders 表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(100) NOT NULL UNIQUE COMMENT '订单号',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    package_id INT DEFAULT NULL COMMENT '套餐ID',
    package_name VARCHAR(100) DEFAULT NULL COMMENT '套餐名称',
    points INT DEFAULT 0 COMMENT '积分数量',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    duration INT DEFAULT 0 COMMENT 'VIP时长',
    duration_unit VARCHAR(20) DEFAULT 'day' COMMENT '时长单位',
    pay_method VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
    status VARCHAR(50) DEFAULT 'pending' COMMENT '状态: pending/paid/cancelled',
    trade_no VARCHAR(100) DEFAULT NULL COMMENT '第三方支付流水号',
    paid_at TIMESTAMP NULL DEFAULT NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 7. 创建充值记录表 (兼容 recharge_records 和 orders)
CREATE TABLE IF NOT EXISTS recharge_records (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    order_no VARCHAR(100) NOT NULL UNIQUE,
    package_id INT DEFAULT NULL,
    package_name VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    points INT DEFAULT 0,
    duration INT DEFAULT 0,
    pay_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    trade_no VARCHAR(100),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '数据库表合并完成!' as result;
