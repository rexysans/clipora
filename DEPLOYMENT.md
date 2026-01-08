# Clipora Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 LTS (or similar)
- Root/sudo access
- Domain names configured:
  - `clipora.in` (frontend)
  - `api.clipora.in` (backend API)
  - `media.clipora.in` (media files)

### One-Command Deployment

```bash
# On your production server
curl -o deploy.sh https://raw.githubusercontent.com/yourusername/clipora/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

## 📋 Manual Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl git nginx postgresql ffmpeg

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Create Application User

```bash
sudo useradd -m -s /bin/bash clipora
sudo mkdir -p /var/www/clipora
sudo mkdir -p /var/media/{hls,thumbs,avatars,uploads}
sudo chown -R clipora:clipora /var/www/clipora
sudo chown -R clipora:clipora /var/media
```

### 3. Clone Repository

```bash
cd /var/www
sudo -u clipora git clone https://github.com/yourusername/clipora.git
cd clipora
```

### 4. Configure Environment Variables

```bash
# Backend
cd /var/www/clipora/backend
sudo -u clipora cp .env.production .env

# Edit with your actual values
sudo -u clipora nano .env
```

Update these critical values:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Generate with: `openssl rand -base64 64`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

```bash
# Frontend
cd /var/www/clipora/frontend
sudo -u clipora cp .env.production .env
```

### 5. Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE stream_platform;
CREATE USER stream_app WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE stream_platform TO stream_app;
\q
EOF

# Run migrations
cd /var/www/clipora/docs
for file in *.sql; do
    sudo -u postgres psql -d stream_platform -f "$file"
done
```

### 6. Install Dependencies

```bash
# Backend
cd /var/www/clipora/backend
sudo -u clipora npm install --production

# Frontend
cd /var/www/clipora/frontend
sudo -u clipora npm install
sudo -u clipora npm run build
```

### 7. Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/clipora/nginx.conf /etc/nginx/sites-available/clipora.conf

# Enable site
sudo ln -s /etc/nginx/sites-available/clipora.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL (After DNS is configured)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx -d clipora.in -d www.clipora.in
sudo certbot --nginx -d api.clipora.in
sudo certbot --nginx -d media.clipora.in

# Auto-renewal is set up automatically
```

### 9. Start Services with PM2

```bash
# Backend API
cd /var/www/clipora/backend
sudo -u clipora NODE_ENV=production pm2 start src/server.js --name clipora-api

# Worker (video processing)
cd /var/www/clipora/worker
sudo -u clipora NODE_ENV=production pm2 start index.js --name clipora-worker

# Save PM2 configuration
sudo -u clipora pm2 save

# Setup PM2 to start on boot
sudo pm2 startup systemd -u clipora --hp /home/clipora
```

### 10. Setup Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## 🔄 Updating Your App

Use the update script:

```bash
cd /var/www/clipora
sudo ./update.sh
```

Or manually:

```bash
cd /var/www/clipora
sudo -u clipora git pull

# Backend
cd backend
sudo -u clipora npm install --production
pm2 restart clipora-api

# Frontend
cd ../frontend
sudo -u clipora npm install
sudo -u clipora npm run build

# Worker
pm2 restart clipora-worker
```

## 📊 Monitoring

```bash
# Check service status
pm2 status

# View logs
pm2 logs clipora-api
pm2 logs clipora-worker

# Monitor resources
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Maintenance Commands

```bash
# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# View detailed info
pm2 show clipora-api

# Clear logs
pm2 flush

# Restart nginx
sudo systemctl restart nginx

# Test nginx config
sudo nginx -t
```

## 🗄️ Database Management

```bash
# Backup database
sudo -u postgres pg_dump stream_platform > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql stream_platform < backup_20260108.sql

# Access PostgreSQL
sudo -u postgres psql -d stream_platform
```

## 🔐 Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT_SECRET
- [ ] Configure Google OAuth correctly
- [ ] Enable firewall (ufw)
- [ ] Setup SSL certificates
- [ ] Configure rate limiting in nginx
- [ ] Secure environment variables
- [ ] Setup automatic backups
- [ ] Enable fail2ban
- [ ] Regular security updates

## 📈 Performance Optimization

### Enable Nginx Caching

Add to nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
}
```

### Database Connection Pooling

Already configured in `backend/src/db.js`

### PM2 Cluster Mode

```bash
pm2 start src/server.js -i max --name clipora-api
```

## 🐛 Troubleshooting

### Services won't start
```bash
pm2 logs clipora-api --err
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
sudo -u postgres psql -d stream_platform
\conninfo
```

### Video processing not working
```bash
pm2 logs clipora-worker
# Check FFmpeg installation
ffmpeg -version
```

## 📞 Support

- GitHub: https://github.com/yourusername/clipora
- Docs: https://clipora.in/docs
- Issues: https://github.com/yourusername/clipora/issues
