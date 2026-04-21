-- Chaowuqiong MySQL 8 schema
-- Covers auth, recharge, payment, points, referral, duration and novel data.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(191) NULL UNIQUE,
  phone VARCHAR(32) NULL UNIQUE,
  phone_verified_at DATETIME NULL,
  password_hash VARCHAR(255) NULL,
  password_updated_at DATETIME NULL,
  password_reset_requested_at DATETIME NULL,
  last_password_reset_at DATETIME NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_url TEXT NULL,
  role ENUM('user', 'admin', 'rootadmin', 'super_admin') NOT NULL DEFAULT 'user',
  gender VARCHAR(32) NULL,
  birthday DATE NULL,
  location VARCHAR(255) NULL,
  website VARCHAR(255) NULL,
  wechat_openid VARCHAR(128) NULL UNIQUE,
  wechat_unionid VARCHAR(128) NULL UNIQUE,
  wechat_bound_at DATETIME NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
  locked_until DATETIME NULL,
  login_attempts INT NOT NULL DEFAULT 0,
  must_bind_contact TINYINT(1) NOT NULL DEFAULT 1,
  points INT NOT NULL DEFAULT 0,
  total_recharge DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  referral_code VARCHAR(20) NULL UNIQUE,
  referred_by VARCHAR(36) NULL,
  vip_level INT NOT NULL DEFAULT 0,
  vip_expire_time DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  INDEX idx_users_status (status),
  INDEX idx_users_referred_by (referred_by),
  CONSTRAINT fk_users_referred_by
    FOREIGN KEY (referred_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recharge_packages (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12, 2) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  bonus_points INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  duration_unit ENUM('hour', 'day', 'week', 'month', 'year', 'permanent') NOT NULL DEFAULT 'day',
  icon VARCHAR(32) NULL,
  recommended TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recharge_packages_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS points_exchange_products (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  points_cost INT NOT NULL,
  points_reward INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  duration_unit ENUM('hour', 'day', 'week', 'month', 'year', 'permanent') NOT NULL DEFAULT 'day',
  icon VARCHAR(32) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_exchange_products_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recharge_orders (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  bonus_points INT NOT NULL DEFAULT 0,
  product_name VARCHAR(100) NOT NULL,
  status ENUM('pending', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  pay_method ENUM('wechat', 'alipay') NOT NULL,
  pay_time DATETIME NULL,
  provider_transaction_id VARCHAR(128) NULL,
  provider_buyer_id VARCHAR(128) NULL,
  provider_status VARCHAR(64) NULL,
  payment_scene VARCHAR(64) NULL,
  paid_amount DECIMAL(12, 2) NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
  notify_time DATETIME NULL,
  notify_payload LONGTEXT NULL,
  response_payload LONGTEXT NULL,
  expire_time DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recharge_orders_user (user_id),
  INDEX idx_recharge_orders_status (status),
  INDEX idx_recharge_orders_expire (expire_time),
  CONSTRAINT fk_recharge_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  package_id INT NULL,
  package_name VARCHAR(100) NULL,
  points INT NOT NULL DEFAULT 0,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  duration INT NOT NULL DEFAULT 0,
  duration_unit ENUM('hour', 'day', 'week', 'month', 'year', 'permanent') NOT NULL DEFAULT 'day',
  pay_method ENUM('wechat', 'alipay') NOT NULL DEFAULT 'wechat',
  status ENUM('pending', 'paid', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  provider_transaction_id VARCHAR(128) NULL,
  provider_buyer_id VARCHAR(128) NULL,
  provider_status VARCHAR(64) NULL,
  payment_scene VARCHAR(64) NULL,
  paid_amount DECIMAL(12, 2) NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
  notify_time DATETIME NULL,
  notify_payload LONGTEXT NULL,
  response_payload LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_orders_package
    FOREIGN KEY (package_id) REFERENCES recharge_packages(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS vip_orders (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  duration INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  pay_method ENUM('wechat', 'alipay') NOT NULL,
  pay_time DATETIME NULL,
  provider_transaction_id VARCHAR(128) NULL,
  provider_buyer_id VARCHAR(128) NULL,
  provider_status VARCHAR(64) NULL,
  payment_scene VARCHAR(64) NULL,
  paid_amount DECIMAL(12, 2) NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
  notify_time DATETIME NULL,
  notify_payload LONGTEXT NULL,
  response_payload LONGTEXT NULL,
  expire_time DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vip_orders_user (user_id),
  INDEX idx_vip_orders_status (status),
  CONSTRAINT fk_vip_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_durations (
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  total_duration INT NOT NULL DEFAULT 0,
  remaining_duration INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  is_permanent TINYINT(1) NOT NULL DEFAULT 0,
  activated_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_durations_expires (expires_at),
  CONSTRAINT fk_user_durations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS points_records (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  points INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_points_records_user (user_id),
  INDEX idx_points_records_type (type),
  CONSTRAINT fk_points_records_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS points_log (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  balance_before INT NOT NULL DEFAULT 0,
  balance_after INT NOT NULL DEFAULT 0,
  order_id VARCHAR(36) NULL,
  description VARCHAR(255) NULL,
  election_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_points_log_user (user_id),
  INDEX idx_points_log_type (type),
  CONSTRAINT fk_points_log_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  referrer_id VARCHAR(36) NOT NULL,
  referee_id VARCHAR(36) NOT NULL,
  referee_type ENUM('trial', 'paid') NOT NULL DEFAULT 'trial',
  reward_type ENUM('points', 'cashback') NOT NULL DEFAULT 'points',
  reward_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  reward_status ENUM('pending', 'completed') NOT NULL DEFAULT 'completed',
  order_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_referrals_referee (referee_id),
  INDEX idx_referrals_referrer (referrer_id),
  CONSTRAINT fk_referrals_referrer
    FOREIGN KEY (referrer_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_referrals_referee
    FOREIGN KEY (referee_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS referral_settings (
  id INT NOT NULL PRIMARY KEY,
  inviter_points INT NOT NULL DEFAULT 50,
  invitee_points INT NOT NULL DEFAULT 50,
  recharge_commission_rate DECIMAL(8, 4) NOT NULL DEFAULT 0.1000,
  milestone_rewards JSON NOT NULL,
  leaderboard_rewards TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS referral_reward_claims (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  referrer_id VARCHAR(36) NOT NULL,
  reward_key VARCHAR(100) NOT NULL,
  reward_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_referral_reward_claims_unique (referrer_id, reward_key),
  CONSTRAINT fk_referral_reward_claims_user
    FOREIGN KEY (referrer_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS election_nodes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  node_id VARCHAR(100) NOT NULL UNIQUE,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'follower',
  last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vote_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_election_nodes_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS election_log (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  term INT NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value LONGTEXT NULL,
  client_id VARCHAR(100) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS novels (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  author_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  genre VARCHAR(100) NULL,
  cover_url TEXT NULL,
  tags TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ongoing',
  word_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  chapter_count INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_novels_author (author_id),
  INDEX idx_novels_publish (is_published, status),
  CONSTRAINT fk_novels_author
    FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS chapters (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  novel_id BIGINT NOT NULL,
  chapter_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NULL,
  word_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chapters_novel_number (novel_id, chapter_number),
  CONSTRAINT fk_chapters_novel
    FOREIGN KEY (novel_id) REFERENCES novels(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO recharge_packages (
  id, name, description, price, points, bonus_points, duration, duration_unit, recommended, is_active, sort_order
) VALUES
  (1, '8小时卡', '适合首次体验与临时使用', 9.90, 99, 0, 8, 'hour', 0, 1, 1),
  (2, '日卡', '轻量高频使用的单日时长卡', 14.90, 149, 0, 1, 'day', 0, 1, 2),
  (3, '周卡', '适合短周期连续使用', 29.90, 299, 0, 7, 'day', 0, 1, 3),
  (4, '月卡', '主推卡种，适合长期稳定使用', 79.90, 799, 0, 30, 'day', 1, 1, 4),
  (5, '季卡', '中长期用户的高性价比选择', 299.00, 2990, 0, 90, 'day', 0, 1, 5),
  (6, '半年卡', '适合工作流深度接入与持续协作', 699.00, 6990, 0, 180, 'day', 0, 1, 6),
  (7, '年卡', '全年稳定使用的旗舰方案', 999.00, 9990, 0, 365, 'day', 1, 1, 7),
  (8, '永久卡', '一次开通，长期有效', 4999.00, 49990, 0, 0, 'permanent', 0, 1, 8)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  points = VALUES(points),
  bonus_points = VALUES(bonus_points),
  duration = VALUES(duration),
  duration_unit = VALUES(duration_unit),
  recommended = VALUES(recommended),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

INSERT INTO points_exchange_products (
  id, name, description, points_cost, points_reward, duration, duration_unit, is_active, sort_order
) VALUES
  (1, '8小时卡', '使用积分兑换 8 小时访问时长', 99, 0, 8, 'hour', 1, 1),
  (2, '日卡', '使用积分兑换 1 天访问时长', 149, 0, 1, 'day', 1, 2),
  (3, '周卡', '使用积分兑换 7 天访问时长', 299, 0, 7, 'day', 1, 3),
  (4, '月卡', '使用积分兑换 30 天访问时长', 799, 0, 30, 'day', 1, 4),
  (5, '季卡', '使用积分兑换 90 天访问时长', 2990, 0, 90, 'day', 1, 5),
  (6, '半年卡', '使用积分兑换 180 天访问时长', 6990, 0, 180, 'day', 1, 6),
  (7, '年卡', '使用积分兑换 365 天访问时长', 9990, 0, 365, 'day', 1, 7),
  (8, '永久卡', '使用积分兑换永久访问资格', 49990, 0, 0, 'permanent', 1, 8)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  points_cost = VALUES(points_cost),
  points_reward = VALUES(points_reward),
  duration = VALUES(duration),
  duration_unit = VALUES(duration_unit),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

INSERT INTO referral_settings (
  id, inviter_points, invitee_points, recharge_commission_rate, milestone_rewards, leaderboard_rewards
) VALUES (
  1,
  50,
  50,
  0.1000,
  JSON_ARRAY(
    JSON_OBJECT('inviteCount', 3, 'name', '周卡', 'duration', 7, 'durationUnit', 'day'),
    JSON_OBJECT('inviteCount', 10, 'name', '月卡', 'duration', 30, 'durationUnit', 'day'),
    JSON_OBJECT('inviteCount', 50, 'name', '年卡', 'duration', 365, 'durationUnit', 'day')
  ),
  '月度邀请榜奖励请在后台进一步维护。'
)
ON DUPLICATE KEY UPDATE
  inviter_points = VALUES(inviter_points),
  invitee_points = VALUES(invitee_points),
  recharge_commission_rate = VALUES(recharge_commission_rate),
  milestone_rewards = VALUES(milestone_rewards),
  leaderboard_rewards = VALUES(leaderboard_rewards);
