#!/bin/bash
spawn ssh root@115.190.158.182 "pm2 restart license-backend"
expect "password:"
send "Brfj0114\r"
interact
