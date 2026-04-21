CREATE TABLE IF NOT EXISTS recharge_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    points BIGINT NOT NULL,
    bonus_points BIGINT DEFAULT 0,
    product_name VARCHAR(100),
    status ENUM('pending', 'paid', 'expired', 'cancelled') DEFAULT 'pending',
    pay_method ENUM('wechat', 'alipay') DEFAULT 'wechat',
    pay_time DATETIME NULL,
    expire_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

SELECT username, points FROM users WHERE username = 'rootadmin';
