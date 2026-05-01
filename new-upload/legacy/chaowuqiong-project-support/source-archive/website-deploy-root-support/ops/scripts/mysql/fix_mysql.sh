#!/bin/bash
pkill -9 mysqld
sleep 2
mysqld --skip-grant-tables --user=mysql &
sleep 3
echo "UPDATE mysql.user SET authentication_string='' WHERE User='root' AND Host='localhost'; FLUSH PRIVILEGES;" | mysql -u root
pkill -9 mysqld
sleep 2
systemctl start mysqld
