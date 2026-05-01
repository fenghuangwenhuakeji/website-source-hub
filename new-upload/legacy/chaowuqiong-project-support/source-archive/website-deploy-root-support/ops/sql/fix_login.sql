SELECT id, username, status, login_attempts FROM users WHERE username='rootadmin';
UPDATE users SET login_attempts = 0, locked_until = NULL WHERE username='rootadmin';
