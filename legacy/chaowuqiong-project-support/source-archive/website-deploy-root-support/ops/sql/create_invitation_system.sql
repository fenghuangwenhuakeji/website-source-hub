USE chaowuqiong_db;

-- 创建邀请记录表
CREATE TABLE IF NOT EXISTS invitation_records (
    id VARCHAR(36) PRIMARY KEY,
    inviter_id VARCHAR(36) NOT NULL COMMENT '邀请人ID',
    invitee_id VARCHAR(36) COMMENT '被邀请人ID',
    invitee_username VARCHAR(50) COMMENT '被邀请人用户名',
    status ENUM('pending', 'registered', 'recharged') DEFAULT 'pending' COMMENT '状态：pending-已发送链接, registered-已注册, recharged-已充值',
    reward_points INT DEFAULT 0 COMMENT '奖励积分',
    reward_given BOOLEAN DEFAULT FALSE COMMENT '奖励是否已发放',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inviter (inviter_id),
    INDEX idx_invitee (invitee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请记录表';

-- 创建邀请统计表（用于缓存统计信息）
CREATE TABLE IF NOT EXISTS invitation_stats (
    user_id VARCHAR(36) PRIMARY KEY,
    total_invited INT DEFAULT 0 COMMENT '总邀请数',
    registered_count INT DEFAULT 0 COMMENT '已注册数',
    recharged_count INT DEFAULT 0 COMMENT '已充值数',
    total_reward_points INT DEFAULT 0 COMMENT '总奖励积分',
    last_invited_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_total_invited (total_invited)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请统计表';
