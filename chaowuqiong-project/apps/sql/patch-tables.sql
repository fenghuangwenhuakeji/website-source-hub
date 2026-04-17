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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    INDEX idx_provider_transaction_id (provider_transaction_id)
);

INSERT IGNORE INTO recharge_packages (name, description, price, points, bonus_points, duration, duration_unit, recommended, sort_order) VALUES
('Trial', 'New user special', 9.90, 100, 0, 7, 'day', 0, 1),
('Monthly', 'Most popular', 29.90, 500, 50, 1, 'month', 1, 2),
('Quarterly', 'Best value', 79.90, 1800, 300, 3, 'month', 0, 3),
('Yearly', 'Best deal', 299.90, 8000, 2000, 1, 'year', 0, 4);

INSERT IGNORE INTO points_exchange_products (name, description, points_cost, points_reward, duration, duration_unit, sort_order) VALUES
('1 Day', 'Exchange for 1 day', 100, 0, 1, 'day', 1),
('7 Days', 'Exchange for 7 days', 600, 0, 7, 'day', 2),
('30 Days', 'Exchange for 30 days', 2000, 0, 30, 'day', 3);
