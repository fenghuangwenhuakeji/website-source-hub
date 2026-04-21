USE chaowuqiong_db;

-- Align users with the backend runtime fields.
SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'wechat_openid'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100) NULL AFTER website', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'wechat_unionid'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100) NULL AFTER wechat_openid', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'total_earnings'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN total_earnings DECIMAL(10, 2) DEFAULT 0.00 AFTER total_recharge', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'referral_code'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) NULL AFTER total_earnings', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'referred_by'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN referred_by VARCHAR(36) NULL AFTER referral_code', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN last_login DATETIME NULL AFTER created_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_wechat_openid'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_wechat_openid ON users (wechat_openid)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_referred_by'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_referred_by ON users (referred_by)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'uk_referral_code'
);
SET @sql := IF(@exists = 0, 'CREATE UNIQUE INDEX uk_referral_code ON users (referral_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Recharge orders
SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN provider_transaction_id VARCHAR(100) NULL AFTER pay_time', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'provider_buyer_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN provider_buyer_id VARCHAR(100) NULL AFTER provider_transaction_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'provider_status'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN provider_status VARCHAR(50) NULL AFTER provider_buyer_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'payment_scene'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN payment_scene VARCHAR(50) NULL AFTER provider_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'paid_amount'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN paid_amount DECIMAL(10, 2) NULL AFTER payment_scene', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'currency'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN currency VARCHAR(10) DEFAULT ''CNY'' AFTER paid_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'notify_time'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN notify_time DATETIME NULL AFTER currency', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'notify_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN notify_payload LONGTEXT NULL AFTER notify_time', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND column_name = 'response_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE recharge_orders ADD COLUMN response_payload LONGTEXT NULL AFTER notify_payload', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'recharge_orders' AND index_name = 'idx_provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_provider_transaction_id ON recharge_orders (provider_transaction_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Orders
SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN provider_transaction_id VARCHAR(100) NULL AFTER paid_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'provider_buyer_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN provider_buyer_id VARCHAR(100) NULL AFTER provider_transaction_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'provider_status'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN provider_status VARCHAR(50) NULL AFTER provider_buyer_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'payment_scene'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN payment_scene VARCHAR(50) NULL AFTER provider_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'paid_amount'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(10, 2) NULL AFTER payment_scene', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'currency'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN currency VARCHAR(10) DEFAULT ''CNY'' AFTER paid_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'notify_time'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN notify_time DATETIME NULL AFTER currency', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'notify_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN notify_payload LONGTEXT NULL AFTER notify_time', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'response_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE orders ADD COLUMN response_payload LONGTEXT NULL AFTER notify_payload', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_provider_transaction_id ON orders (provider_transaction_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Vip orders
SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN provider_transaction_id VARCHAR(100) NULL AFTER pay_time', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'provider_buyer_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN provider_buyer_id VARCHAR(100) NULL AFTER provider_transaction_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'provider_status'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN provider_status VARCHAR(50) NULL AFTER provider_buyer_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'payment_scene'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN payment_scene VARCHAR(50) NULL AFTER provider_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'paid_amount'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN paid_amount DECIMAL(10, 2) NULL AFTER payment_scene', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'currency'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN currency VARCHAR(10) DEFAULT ''CNY'' AFTER paid_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'notify_time'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN notify_time DATETIME NULL AFTER currency', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'notify_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN notify_payload LONGTEXT NULL AFTER notify_time', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND column_name = 'response_payload'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE vip_orders ADD COLUMN response_payload LONGTEXT NULL AFTER notify_payload', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'vip_orders' AND index_name = 'idx_provider_transaction_id'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_provider_transaction_id ON vip_orders (provider_transaction_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
