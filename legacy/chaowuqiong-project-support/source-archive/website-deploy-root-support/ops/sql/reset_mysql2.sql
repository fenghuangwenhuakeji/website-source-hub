UPDATE mysql.user SET authentication_string=PASSWORD('gong134135'), plugin='mysql_native_password' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
