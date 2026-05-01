#!/bin/bash
cd /var/www/chaowuqiong/apps/backend

# Backup current dist
if [ -d "dist_backup" ]; then
  rm -rf dist_backup
fi
if [ -d "dist" ]; then
  mv dist dist_backup
fi

# Create new dist directory
mkdir -p dist

# Copy new files
cp -r /tmp/backend-dist/* dist/

# Restart PM2
pm2 restart chaowuqiong-api

echo "Backend deployed successfully!"
