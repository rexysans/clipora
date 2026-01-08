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
chown -R $USER:$USER $APP_DIR
chown -R $USER:$USER $MEDIA_DIR

echo -e "${GREEN}Step 5: Cloning/updating repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $USER git pull
else
    cd /var/www
    sudo -u $USER git clone https://github.com/yourusername/clipora.git clipora
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
sudo -u postgres psql -c "CREATE DATABASE stream_platform;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER stream_app WITH PASSWORD 'your_secure_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stream_platform TO stream_app;"

echo -e "${GREEN}Step 9: Running database migrations...${NC}"
cd $APP_DIR/docs
for file in *.sql; do
    echo "Running $file..."
    sudo -u postgres psql -d stream_platform -f "$file" 2>/dev/null || echo "Skipping $file"
done

echo -e "${GREEN}Step 10: Configuring Nginx...${NC}"
cp $APP_DIR/nginx.conf /etc/nginx/sites-available/clipora.conf
ln -sf /etc/nginx/sites-available/clipora.conf /etc/nginx/sites-enabled/clipora.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "${GREEN}Step 11: Installing PM2 for process management...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 12: Setting up backend service...${NC}"
cd $APP_DIR/backend
sudo -u $USER NODE_ENV=production pm2 start src/server.js --name clipora-api
sudo -u $USER pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

echo -e "${GREEN}Step 13: Setting up worker service...${NC}"
cd $APP_DIR/worker
sudo -u $USER NODE_ENV=production pm2 start index.js --name clipora-worker
sudo -u $USER pm2 save

echo -e "${GREEN}Step 14: Setting up SSL with Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx
echo -e "${YELLOW}Run these commands manually after DNS is configured:${NC}"
echo "certbot --nginx -d clipora.in -d www.clipora.in"
echo "certbot --nginx -d api.clipora.in"
echo "certbot --nginx -d media.clipora.in"

echo -e "${GREEN}Step 15: Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Post-deployment steps:${NC}"
echo "1. Update environment variables in $APP_DIR/backend/.env.production"
echo "2. Configure DNS records to point to this server"
echo "3. Run SSL certificate commands above"
echo "4. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo ""
echo -e "${YELLOW}🔍 Useful commands:${NC}"
echo "pm2 status              - Check services status"
echo "pm2 logs clipora-api    - View API logs"
echo "pm2 logs clipora-worker - View worker logs"
echo "pm2 restart all         - Restart all services"
echo "nginx -t                - Test nginx config"
echo "systemctl restart nginx - Restart nginx"
