# 🚀 Clipora Production Deployment - Ready to Deploy!

## ✅ Everything is configured and ready!

### Files Created/Updated:
- ✅ [`deploy.sh`](deploy.sh) - Complete deployment script
- ✅ [`update.sh`](update.sh) - Quick update script
- ✅ [`nginx.conf`](nginx.conf) - Nginx configuration for 3 domains
- ✅ [`ecosystem.config.js`](ecosystem.config.js) - PM2 process management
- ✅ [`backend/.env.production`](backend/.env.production) - Backend production config
- ✅ [`frontend/.env.production`](frontend/.env.production) - Frontend production config
- ✅ [`worker/.env.production`](worker/.env.production) - Worker production config
- ✅ [`verify-deployment.sh`](verify-deployment.sh) - Pre-deployment verification

### What the Script Does:
1. Installs all dependencies (Node.js, PostgreSQL, nginx, ffmpeg)
2. Creates `clipora` user
3. Sets up directory structure (`/var/www/clipora`, `/var/media`)
4. Clones repository from GitHub
5. Installs npm dependencies
6. Builds frontend
7. **Generates secure database password automatically**
8. Sets up PostgreSQL database and runs migrations
9. Configures nginx
10. Sets up PM2 with ecosystem config
11. Creates log directories
12. Configures firewall (ports 22, 80, 443)

---

## 🎯 Quick Deployment (3 Steps)

### Step 1: Update Configuration (Local)

```bash
# Generate JWT Secret
openssl rand -base64 64

# Update backend/.env.production
nano backend/.env.production
```

Update these values:
```env
DATABASE_URL=postgresql://stream_app:WILL_BE_GENERATED@localhost:5432/stream_platform
JWT_SECRET=<paste_generated_secret>
GOOGLE_CLIENT_ID=your_real_google_client_id
GOOGLE_CLIENT_SECRET=your_real_google_client_secret
```

### Step 2: Commit and Push

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 3: Deploy on Server

```bash
# One command deployment!
curl -fsSL https://raw.githubusercontent.com/rexysans/clipora/main/deploy.sh | sudo bash
```

**The script will:**
- ✅ Generate a secure database password
- ✅ Display the password (SAVE IT!)
- ✅ Set up everything automatically

---

## 📋 After Deployment

### 1. Update Environment with Generated Password

The script generates a random password and displays it. SSH into your server:

```bash
ssh root@your-server-ip

# Update backend .env with generated password
nano /var/www/clipora/.env

# Update this line with the password shown during deployment:
DATABASE_URL=postgresql://stream_app:GENERATED_PASSWORD@localhost:5432/stream_platform

# Also update worker .env
nano /var/www/clipora/worker/.env
DATABASE_URL=postgresql://stream_app:SAME_PASSWORD@localhost:5432/stream_platform

# Restart services
pm2 restart all
```

### 2. Configure DNS

Point these domains to your server IP:

| Domain | Type | Value |
|--------|------|-------|
| clipora.in | A | Your Server IP |
| www.clipora.in | A | Your Server IP |
| api.clipora.in | A | Your Server IP |
| media.clipora.in | A | Your Server IP |

### 3. Enable SSL (after DNS propagates)

```bash
# Wait for DNS to propagate (5-60 minutes)
# Then run these commands on your server:

sudo certbot --nginx -d clipora.in -d www.clipora.in
sudo certbot --nginx -d api.clipora.in
sudo certbot --nginx -d media.clipora.in

# Certificates will auto-renew
```

### 4. Verify Everything Works

```bash
# Check services
pm2 status

# View logs
pm2 logs clipora-api --lines 50
pm2 logs clipora-worker --lines 50

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Test endpoints
curl https://api.clipora.in/health
```

---

## 🔧 Common Commands

### Service Management
```bash
pm2 status              # Check all services
pm2 restart all         # Restart everything
pm2 restart clipora-api # Restart API only
pm2 logs                # View all logs
pm2 logs clipora-worker # Worker logs only
pm2 monit               # Real-time monitoring
```

### Updates
```bash
cd /var/www/clipora
git pull
npm install --production
cd frontend && npm install && npm run build
pm2 restart all
```

Or use the quick update script:
```bash
curl -fsSL https://raw.githubusercontent.com/rexysans/clipora/main/update.sh | sudo bash
```

### Database
```bash
# Connect to database
sudo -u postgres psql -d stream_platform

# Check video processing
SELECT id, title, status, processing_progress FROM videos ORDER BY created_at DESC LIMIT 10;

# Check users
SELECT id, username, email FROM users LIMIT 10;
```

### Nginx
```bash
sudo nginx -t                    # Test config
sudo systemctl restart nginx     # Restart
sudo systemctl status nginx      # Check status
tail -f /var/log/nginx/access.log  # Access logs
tail -f /var/log/nginx/error.log   # Error logs
```

### Logs
```bash
# Application logs
tail -f /var/log/clipora/api-error.log
tail -f /var/log/clipora/worker-out.log

# System logs
journalctl -u nginx -f
```

---

## 🎉 You're All Set!

The deployment script is:
- ✅ Production-ready
- ✅ Secure (firewall, SSL)
- ✅ Automated (minimal manual steps)
- ✅ Monitored (PM2, logs)
- ✅ Scalable (clustered API)

### Deployment URL:
```bash
curl -fsSL https://raw.githubusercontent.com/rexysans/clipora/main/deploy.sh | sudo bash
```

### Need Help?
- Check [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed info
- Check [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) for step-by-step guide
- Run [`./verify-deployment.sh`](verify-deployment.sh) to check readiness

**Good luck with your deployment! 🚀**
