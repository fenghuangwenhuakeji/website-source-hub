CREATE TABLE IF NOT EXISTS user_durations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total_duration BIGINT DEFAULT 0 COMMENT '总时长（秒）',
    remaining_duration BIGINT DEFAULT 0 COMMENT '剩余时长（秒）',
    is_active BOOLEAN DEFAULT FALSE COMMENT '是否激活',
    activated_at DATETIME NULL COMMENT '激活时间',
    expires_at DATETIME NULL COMMENT '过期时间',
    is_permanent BOOLEAN DEFAULT FALSE COMMENT '是否永久',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_expires (expires_at)
);
