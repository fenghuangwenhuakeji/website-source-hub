CREATE TABLE IF NOT EXISTS license_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    type ENUM('hour', 'day', 'month', 'year') NOT NULL DEFAULT 'day',
    duration INT NOT NULL DEFAULT 1,
    duration_unit ENUM('hour', 'day', 'month', 'year') NOT NULL DEFAULT 'day',
    status ENUM('unused', 'used', 'expired') NOT NULL DEFAULT 'unused',
    created_by INT,
    used_by INT NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
