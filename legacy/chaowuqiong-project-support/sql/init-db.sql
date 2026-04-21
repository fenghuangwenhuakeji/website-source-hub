-- 超无穹数据库初始化脚本 v1.1

CREATE DATABASE IF NOT EXISTS chaowuqiong_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chaowuqiong_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    nickname VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    gender ENUM('male', 'female', 'other') NULL,
    birthday DATE NULL,
    location VARCHAR(100),
    website VARCHAR(500),
    wechat_openid VARCHAR(100),
    wechat_unionid VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'banned', 'inactive') DEFAULT 'active',
    locked_until DATETIME NULL,
    login_attempts INT DEFAULT 0,
    points BIGINT DEFAULT 0,
    total_recharge DECIMAL(10, 2) DEFAULT 0.00,
    total_earnings DECIMAL(10, 2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(36) NULL,
    vip_level TINYINT DEFAULT 0,
    vip_expire_time DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_wechat_openid (wechat_openid),
    INDEX idx_referred_by (referred_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 充值订单表
CREATE TABLE IF NOT EXISTS recharge_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    points BIGINT NOT NULL,
    bonus_points BIGINT DEFAULT 0,
    product_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'paid', 'expired', 'refunded') DEFAULT 'pending',
    pay_method ENUM('wechat', 'alipay') NOT NULL,
    pay_time DATETIME NULL,
    provider_transaction_id VARCHAR(100) NULL,
    provider_buyer_id VARCHAR(100) NULL,
    provider_status VARCHAR(50) NULL,
    payment_scene VARCHAR(50) NULL,
    paid_amount DECIMAL(10, 2) NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    notify_time DATETIME NULL,
    notify_payload LONGTEXT NULL,
    response_payload LONGTEXT NULL,
    expire_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_provider_transaction_id (provider_transaction_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分变动记录表
CREATE TABLE IF NOT EXISTS points_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('recharge', 'consume', 'refund', 'reward') NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    order_id VARCHAR(36) NULL,
    description VARCHAR(255),
    election_id VARCHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES recharge_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 作品表
CREATE TABLE IF NOT EXISTS novels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    cover_url VARCHAR(500),
    description TEXT,
    genre VARCHAR(50),
    tags JSON,
    status ENUM('ongoing', 'completed', 'paused') DEFAULT 'ongoing',
    word_count INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    chapter_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author_id (author_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 章节表
CREATE TABLE IF NOT EXISTS chapters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    novel_id BIGINT NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT,
    word_count INT DEFAULT 0,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_novel_id (novel_id),
    INDEX idx_chapter_number (novel_id, chapter_number),
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI生成记录表
CREATE TABLE IF NOT EXISTS generation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('image', 'text', 'audio', 'video') NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    points_cost BIGINT DEFAULT 0,
    model VARCHAR(50),
    prompt TEXT,
    result_url VARCHAR(500),
    status ENUM('success', 'failed') DEFAULT 'success',
    election_id VARCHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Election 日志表
CREATE TABLE IF NOT EXISTS election_log (
    id VARCHAR(36) PRIMARY KEY,
    term BIGINT NOT NULL DEFAULT 0,
    type ENUM('write', 'read') NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    client_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'committed', 'applied') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    committed_at DATETIME NULL,
    INDEX idx_term (term),
    INDEX idx_client_id (client_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Election 节点表
CREATE TABLE IF NOT EXISTS election_nodes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    node_id VARCHAR(36) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    role ENUM('leader', 'follower', 'candidate') DEFAULT 'follower',
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    vote_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_last_active (last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VIP订单表
CREATE TABLE IF NOT EXISTS vip_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    duration INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'expired', 'activated', 'refunded') DEFAULT 'pending',
    pay_method ENUM('wechat', 'alipay') NOT NULL,
    pay_time DATETIME NULL,
    provider_transaction_id VARCHAR(100) NULL,
    provider_buyer_id VARCHAR(100) NULL,
    provider_status VARCHAR(50) NULL,
    payment_scene VARCHAR(50) NULL,
    paid_amount DECIMAL(10, 2) NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    notify_time DATETIME NULL,
    notify_payload LONGTEXT NULL,
    response_payload LONGTEXT NULL,
    expire_time DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_provider_transaction_id (provider_transaction_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(50),
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 充值套餐表
CREATE TABLE IF NOT EXISTS recharge_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    points BIGINT NOT NULL,
    bonus_points BIGINT DEFAULT 0,
    duration INT DEFAULT 0,
    duration_unit ENUM('day', 'month', 'year') DEFAULT 'month',
    icon VARCHAR(100),
    recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分兑换产品表
CREATE TABLE IF NOT EXISTS points_exchange_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    points_cost BIGINT NOT NULL,
    points_reward BIGINT DEFAULT 0,
    duration INT DEFAULT 0,
    duration_unit ENUM('day', 'month', 'year') DEFAULT 'month',
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    package_id INT,
    package_name VARCHAR(100),
    points BIGINT DEFAULT 0,
    amount DECIMAL(10, 2) DEFAULT 0,
    duration INT DEFAULT 0,
    duration_unit VARCHAR(20),
    pay_method ENUM('wechat', 'alipay', 'points') DEFAULT 'wechat',
    status ENUM('pending', 'paid', 'cancelled', 'expired') DEFAULT 'pending',
    paid_at DATETIME NULL,
    provider_transaction_id VARCHAR(100) NULL,
    provider_buyer_id VARCHAR(100) NULL,
    provider_status VARCHAR(50) NULL,
    payment_scene VARCHAR(50) NULL,
    paid_amount DECIMAL(10, 2) NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    notify_time DATETIME NULL,
    notify_payload LONGTEXT NULL,
    response_payload LONGTEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_provider_transaction_id (provider_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认充值套餐
INSERT INTO recharge_packages (name, description, price, points, bonus_points, duration, duration_unit, recommended, sort_order) VALUES
('体验套餐', '新用户专享', 9.90, 100, 0, 7, 'day', FALSE, 1),
('月度套餐', '最受欢迎', 29.90, 500, 50, 1, 'month', TRUE, 2),
('季度套餐', '超值优惠', 79.90, 1800, 300, 3, 'month', FALSE, 3),
('年度套餐', '最佳性价比', 299.90, 8000, 2000, 1, 'year', FALSE, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入默认积分兑换产品
INSERT INTO points_exchange_products (name, description, points_cost, points_reward, duration, duration_unit, sort_order) VALUES
('1天时长', '使用积分兑换1天使用时长', 100, 0, 1, 'day', 1),
('7天时长', '使用积分兑换7天使用时长', 600, 0, 7, 'day', 2),
('30天时长', '使用积分兑换30天使用时长', 2000, 0, 30, 'day', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 管理员账号
INSERT INTO users (id, username, password_hash, nickname, role, status, points, created_at)
VALUES (
    'admin-001',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYvz1GvN7S',
    '管理员',
    'admin',
    'active',
    0,
    NOW()
) ON DUPLICATE KEY UPDATE username = username;
