UPDATE mysql.user SET authentication_string='', plugin='caching_sha2_password' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
