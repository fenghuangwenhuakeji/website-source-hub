USE chaowuqiong_db;
ALTER TABLE users ADD COLUMN referred_by varchar(36) NULL;
ALTER TABLE users ADD COLUMN referral_code varchar(20) NULL;
ALTER TABLE users ADD INDEX idx_referral_code (referral_code);
ALTER TABLE users ADD INDEX idx_referred_by (referred_by);
