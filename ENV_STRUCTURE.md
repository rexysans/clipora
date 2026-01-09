# Environment File Structure

## Production Setup

### Root Level: `.env`
**Location:** `/var/www/clipora/.env`  
**Used by:** Backend API + Worker (shared)

```bash
# Production Environment Variables - Shared by Backend and Worker
NODE_ENV=production
PORT=4000

# URLs
FRONTEND_URL=https://clipora.in
BASE_URL=https://api.clipora.in
STORAGE_BASE_URL=https://media.clipora.in

# Database
DATABASE_URL=postgresql://stream_app:YOUR_PASSWORD@localhost:5432/stream_platform

# Auth
JWT_SECRET=super_long_random_secret_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Storage paths
UPLOAD_DIR=/var/media/uploads
HLS_DIR=/var/media/hls
THUMB_DIR=/var/media/thumbs
AVATAR_DIR=/var/media/avatars

# Worker Configuration
LOG_LEVEL=INFO
```

### Frontend Level: `frontend/.env`
**Location:** `/var/www/clipora/frontend/.env`  
**Used by:** Frontend build (Vite)

```bash
VITE_BASE_URL=https://api.clipora.in
VITE_FRONTEND_URL=https://clipora.in
VITE_STORAGE_BASE_URL=https://media.clipora.in
```

## Deployment Flow

1. **Deploy script copies templates:**
   - `.env.production` → `.env` (root)
   - `frontend/.env.production` → `frontend/.env`

2. **PM2 starts services:**
   - Backend API reads `/var/www/clipora/.env`
   - Worker reads `/var/www/clipora/.env` (same file)
   - Frontend already built with `frontend/.env` vars

## Why This Structure?

- ✅ Backend and Worker share database/storage configuration
- ✅ Single source of truth for server-side config
- ✅ Frontend has separate build-time variables
- ✅ Easier to maintain - update one file for both services
