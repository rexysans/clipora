#!/bin/bash

# Clipora Production Deployment Script
# Run this script on your production server

set -e  # Exit on error

echo "🚀 Starting Clipora deployment..."

# Configuration
APP_DIR="/var/www/clipora"
MEDIA_DIR="/var/media"
USER="clipora"
NODE_VERSION="20"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Installing system dependencies...${NC}"
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib ffmpeg

echo -e "${GREEN}Step 2: Installing Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

echo -e "${GREEN}Step 3: Creating application user...${NC}"
if ! id "$USER" &>/dev/null; then
    useradd -m -s /bin/bash $USER
    echo "User $USER created"
else
    echo "User $USER already exists"
fi

echo -e "${GREEN}Step 4: Creating directory structure...${NC}"
mkdir -p $APP_DIR
mkdir -p $MEDIA_DIR/{hls,thumbs,avatars,uploads}
mkdir -p /var/log/clipora
chown -R $USER:$USER $APP_DIR
chown -R $USER:$USER $MEDIA_DIR
chown -R $USER:$USER /var/log/clipora

echo -e "${GREEN}Step 5: Cloning/updating repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $USER git pull
else
    cd /var/www
    sudo -u $USER git clone https://github.com/rexysans/clipora.git clipora
    cd $APP_DIR
fi

echo -e "${GREEN}Step 6: Installing backend dependencies...${NC}"
cd $APP_DIR/backend
sudo -u $USER npm install --production

echo -e "${GREEN}Step 7: Installing frontend dependencies and building...${NC}"
cd $APP_DIR/frontend
sudo -u $USER npm install
sudo -u $USER npm run build

echo -e "${GREEN}Step 8: Setting up PostgreSQL database...${NC}"
# Generate a random password or use a secure one
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
sudo -u postgres psql -c "CREATE DATABASE stream_platform;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER stream_app WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stream_platform TO stream_app;"
echo -e "${YELLOW}Database password: $DB_PASSWORD${NC}"
echo -e "${YELLOW}⚠️  Save this password! Update it in $APP_DIR/.env${NC}"

echo -e "${GREEN}Step 9: Running database migrations...${NC}"
cd $APP_DIR/docs

# Run migrations in correct order (dependencies matter!)
MIGRATIONS=(
    "users_table.sql"
    "videos_table.sql"
    "followers_table.sql"
    "video_reactions_table.sql"
    "video_views_table.sql"
    "commments_table.sql"
    "watch_later_table.sql"
    "video_processing_progress.sql"
    "add_username.sql"
    "performance_indexes.sql"
)

for file in "${MIGRATIONS[@]}"; do
    if [ -f "$file" ]; then
        echo "Running $file..."
        sudo -u postgres psql -d stream_platform -f "$file" 2>/dev/null || echo "⚠️  Error in $file (may be already applied)"
    else
        echo "⚠️  $file not found, skipping..."
    fi
done

echo -e "${GREEN}Step 10: Installing worker dependencies...${NC}"
cd $APP_DIR
sudo -u $USER npm install --production

echo -e "${GREEN}Step 11: Configuring environment files...${NC}"
# Backend and Worker share the same root .env file
if [ ! -f "$APP_DIR/.env" ]; then
    cp $APP_DIR/.env.production $APP_DIR/.env
    echo -e "${YELLOW}⚠️  Update database credentials and secrets in $APP_DIR/.env${NC}"
fi

# Frontend has its own .env file
if [ ! -f "$APP_DIR/frontend/.env" ]; then
    cp $APP_DIR/frontend/.env.production $APP_DIR/frontend/.env
    echo -e "${YELLOW}⚠️  Frontend environment configured${NC}"
fi

if [ ! -f "$APP_DIR/frontend/.env" ]; then
    cp $APP_DIR/frontend/.env.production $APP_DIR/frontend/.env
fi

chown $USER:$USER $APP_DIR/.env
chown $USER:$USER $APP_DIR/frontend/.env

echo -e "${GREEN}Step 12: Configuring Nginx...${NC}"
# Use HTTP-only config initially, SSL will be added with certbot
cp $APP_DIR/nginx-http.conf /etc/nginx/sites-available/clipora.conf
ln -sf /etc/nginx/sites-available/clipora.conf /etc/nginx/sites-enabled/clipora.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "${GREEN}Step 13: Installing PM2 for process management...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 14: Starting services with PM2...${NC}"
cd $APP_DIR
sudo -u $USER pm2 delete all 2>/dev/null || true
sudo -u $USER pm2 start ecosystem.config.cjs --env production
sudo -u $USER pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

echo -e "${GREEN}Step 15: Setting up SSL with Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  SSL SETUP REQUIRED AFTER DNS CONFIGURATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. Configure your DNS records to point to this server:"
echo -e "   ${GREEN}clipora.in${NC} → Your Server IP"
echo -e "   ${GREEN}www.clipora.in${NC} → Your Server IP"
echo -e "   ${GREEN}api.clipora.in${NC} → Your Server IP"
echo -e "   ${GREEN}media.clipora.in${NC} → Your Server IP"
echo ""
echo -e "2. Wait for DNS propagation (5-60 minutes)"
echo ""
echo -e "3. Run these commands to enable SSL:"
echo -e "   ${GREEN}sudo certbot --nginx -d clipora.in -d www.clipora.in${NC}"
echo -e "   ${GREEN}sudo certbot --nginx -d api.clipora.in${NC}"
echo -e "   ${GREEN}sudo certbot --nginx -d media.clipora.in${NC}"
echo ""
echo -e "4. Replace nginx-http.conf with full SSL config:"
echo -e "   ${GREEN}sudo cp /var/www/clipora/nginx.conf /etc/nginx/sites-available/clipora.conf${NC}"
echo -e "   ${GREEN}sudo systemctl restart nginx${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}Step 16: Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Post-deployment steps:${NC}"
echo "1. Update $APP_DIR/.env with:"
echo "   - Database password from Step 8 above"
echo "   - JWT_SECRET (generate: openssl rand -base64 64)"
echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "2. Configure DNS records to point to this server:"
echo "   - clipora.in -> server IP"
echo "   - www.clipora.in -> server IP"
echo "   - api.clipora.in -> server IP"
echo "   - media.clipora.in -> server IP"
echo "3. Run SSL certificate commands above after DNS propagation"
echo "4. Restart services: pm2 restart all"
echo ""
echo -e "${YELLOW}🔍 Useful commands:${NC}"
echo "pm2 status              - Check services status"
echo "pm2 logs clipora-api    - View API logs"
echo "pm2 logs clipora-worker - View worker logs"
echo "pm2 restart all         - Restart all services"
echo "nginx -t                - Test nginx config"
echo "systemctl restart nginx - Restart nginx"
