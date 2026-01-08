# Production Deployment Checklist for Clipora

## Before Deployment

### 1. Environment Variables
- [ ] Generate strong JWT_SECRET: `openssl rand -base64 64`
- [ ] Configure DATABASE_URL with production credentials
- [ ] Setup Google OAuth credentials (add production URLs to authorized origins)
- [ ] Set FRONTEND_URL, BASE_URL, STORAGE_BASE_URL
- [ ] Verify all storage paths are created: /var/media/{hls,thumbs,avatars,uploads}

### 2. DNS Configuration
- [ ] Point clipora.in to your server IP
- [ ] Point api.clipora.in to your server IP
- [ ] Point media.clipora.in to your server IP
- [ ] Wait for DNS propagation (check with: `dig clipora.in`)

### 3. Server Preparation
- [ ] Ubuntu 22.04 LTS or similar
- [ ] At least 2GB RAM (4GB+ recommended)
- [ ] 20GB+ storage space
- [ ] Root/sudo access
- [ ] Open ports 80, 443, 22

### 4. Google OAuth Setup
- [ ] Go to Google Cloud Console
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized JavaScript origins:
  - https://clipora.in
  - https://api.clipora.in
- [ ] Add authorized redirect URIs:
  - https://api.clipora.in/auth/google/callback
- [ ] Copy Client ID and Secret to .env

## Deployment Steps

### 1. Run Deployment Script
```bash
sudo ./deploy.sh
```

### 2. Configure Environment Files
```bash
# Backend
sudo -u clipora nano /var/www/clipora/backend/.env

# Frontend  
sudo -u clipora nano /var/www/clipora/frontend/.env
```

### 3. Update Database Password
```bash
sudo -u postgres psql
ALTER USER stream_app WITH PASSWORD 'your_strong_password';
\q
```

### 4. Get SSL Certificates
```bash
sudo certbot --nginx -d clipora.in -d www.clipora.in
sudo certbot --nginx -d api.clipora.in
sudo certbot --nginx -d media.clipora.in
```

### 5. Start Services
```bash
cd /var/www/clipora
pm2 start ecosystem.config.js
pm2 save
```

## Post-Deployment Testing

### 1. Check Services
- [ ] `pm2 status` - All services running
- [ ] `curl https://api.clipora.in/api/health` - API responds
- [ ] `curl https://clipora.in` - Frontend loads
- [ ] `curl https://media.clipora.in/thumbs/test.jpg` - Media server responds

### 2. Test Features
- [ ] Homepage loads
- [ ] User can sign up/login with Google
- [ ] Username modal appears for new users
- [ ] Video upload works
- [ ] Video processing completes
- [ ] Video playback works
- [ ] Comments system works
- [ ] Search functionality works
- [ ] Follow/unfollow works
- [ ] Like/dislike works

### 3. Performance Checks
- [ ] Page load time < 1 second
- [ ] Infinite scroll works smoothly
- [ ] Images lazy load correctly
- [ ] Database queries are fast (< 50ms)
- [ ] HLS streaming starts quickly

### 4. Security Checks
- [ ] HTTPS redirects working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Firewall enabled
- [ ] No sensitive data in logs
- [ ] Environment variables not exposed

## Monitoring Setup

### 1. Setup Logging
```bash
# Create log directory
sudo mkdir -p /var/log/clipora
sudo chown clipora:clipora /var/log/clipora
```

### 2. Setup Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Database Backups
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/bin/pg_dump -U stream_app stream_platform > /backups/db_$(date +\%Y\%m\%d).sql
```

## Maintenance Tasks

### Daily
- [ ] Check PM2 status: `pm2 status`
- [ ] Monitor disk space: `df -h`
- [ ] Check error logs: `pm2 logs --err`

### Weekly
- [ ] Review nginx logs
- [ ] Check database size
- [ ] Verify backups exist
- [ ] Update dependencies if needed

### Monthly
- [ ] Security updates: `sudo apt update && sudo apt upgrade`
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Performance audit

## Rollback Plan

If deployment fails:

```bash
# Stop services
pm2 stop all

# Restore previous version
cd /var/www/clipora
sudo -u clipora git checkout main^

# Reinstall and rebuild
cd backend && sudo -u clipora npm install
cd ../frontend && sudo -u clipora npm install && npm run build

# Restart
pm2 restart all
```

## Common Issues

### Services won't start
```bash
pm2 logs --err
# Check environment variables
# Check database connection
```

### SSL certificate errors
```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

### Video processing stuck
```bash
pm2 restart clipora-worker
# Check FFmpeg installation: ffmpeg -version
```

### Database connection errors
```bash
sudo -u postgres psql -d stream_platform
# Check DATABASE_URL format
# Verify password
```

## Support Contacts
- Server Admin: your-email@example.com
- GitHub Issues: https://github.com/yourusername/clipora/issues
- Documentation: https://clipora.in/docs

---

**Last Updated:** January 8, 2026
**Version:** 1.0.0
