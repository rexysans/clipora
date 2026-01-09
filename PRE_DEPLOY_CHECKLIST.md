# 🚀 Pre-Deployment Checklist

## ✅ Before Running deploy.sh

### 1. DNS Configuration
Configure these DNS records BEFORE deployment:

| Record Type | Hostname | Value |
|------------|----------|-------|
| A | clipora.in | YOUR_SERVER_IP |
| A | www.clipora.in | YOUR_SERVER_IP |
| A | api.clipora.in | YOUR_SERVER_IP |
| A | media.clipora.in | YOUR_SERVER_IP |

### 2. Update Environment Variables

Edit `backend/.env.production`:

```bash
# Generate JWT Secret first
openssl rand -base64 64

# Then update these values:
JWT_SECRET=<paste_generated_secret>
GOOGLE_CLIENT_ID=your_real_google_client_id
GOOGLE_CLIENT_SECRET=your_real_google_client_secret
```

### 3. Commit Changes

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 4. Server Requirements

- Ubuntu 20.04+ or Debian 11+
- Root access
- Minimum 2GB RAM
- 20GB storage

---

## 🎯 Deployment Command

```bash
curl -fsSL https://raw.githubusercontent.com/rexysans/clipora/main/deploy.sh | sudo bash
```

---

## 📋 What deploy.sh Does

1. ✅ Installs Node.js 20, PostgreSQL, nginx, ffmpeg
2. ✅ Creates `clipora` user and directories
3. ✅ Clones repository from GitHub
4. ✅ Installs dependencies (backend, frontend, worker)
5. ✅ Builds frontend
6. ✅ Creates database with secure password
7. ✅ Runs all SQL migrations in order
8. ✅ Configures nginx (HTTP only initially)
9. ✅ Sets up PM2 with ecosystem config
10. ✅ Starts services
11. ✅ Configures firewall

---

## ⚠️ After Deployment

### 1. Save Database Password
The script generates a password - **SAVE IT!**

### 2. Update Environment Files

```bash
# SSH into server
ssh root@your-server-ip

# Update backend .env
nano /var/www/clipora/backend/.env
# Update DATABASE_URL with generated password
# Update JWT_SECRET and Google credentials

# Update worker .env  
nano /var/www/clipora/worker/.env
# Update DATABASE_URL with same password

# Restart services
pm2 restart all
```

### 3. Wait for DNS Propagation
Check with: `dig clipora.in +short`

### 4. Enable SSL (after DNS works)

```bash
# Run certbot
sudo certbot --nginx -d clipora.in -d www.clipora.in
sudo certbot --nginx -d api.clipora.in
sudo certbot --nginx -d media.clipora.in

# Certificates auto-renew!
```

---

## 🔍 Verify Deployment

```bash
# Check services
pm2 status

# View logs
pm2 logs clipora-api --lines 50
pm2 logs clipora-worker --lines 50

# Test API
curl http://api.clipora.in/health

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 🎉 Your App is Live!

- Frontend: http://clipora.in (https after SSL)
- API: http://api.clipora.in (https after SSL)
- Media: http://media.clipora.in (https after SSL)

---

## 🆘 Troubleshooting

### PostgreSQL not running
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### PM2 not starting
```bash
cd /var/www/clipora
sudo -u clipora pm2 delete all
sudo -u clipora pm2 start ecosystem.config.js
sudo -u clipora pm2 save
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Check logs
```bash
tail -f /var/log/clipora/api-error.log
tail -f /var/log/clipora/worker-out.log
```
