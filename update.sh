#!/bin/bash

# Quick update script for production
# Run this after making changes to your code

set -e

APP_DIR="/var/www/clipora"
USER="clipora"

echo "🔄 Updating Clipora..."

cd $APP_DIR

# Pull latest code
echo "📥 Pulling latest code..."
sudo -u $USER git pull

# Update backend
echo "📦 Updating backend dependencies..."
cd $APP_DIR/backend
sudo -u $USER npm install --production

# Update and rebuild frontend
echo "🎨 Rebuilding frontend..."
cd $APP_DIR/frontend
sudo -u $USER npm install
sudo -u $USER npm run build

# Restart services
echo "♻️ Restarting services..."
pm2 restart clipora-api
pm2 restart clipora-worker

# Restart nginx if config changed
if [ -f "$APP_DIR/nginx.conf" ]; then
    echo "🔧 Updating nginx config..."
    cp $APP_DIR/nginx.conf /etc/nginx/sites-available/clipora.conf
    nginx -t && systemctl reload nginx
fi

echo "✅ Update complete!"
pm2 status
