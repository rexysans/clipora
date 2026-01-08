#!/bin/bash

# Pre-deployment verification script
# Run this before deploying to check if everything is ready

echo "🔍 Checking deployment readiness..."
echo ""

ERRORS=0

# Check if required files exist
echo "📁 Checking required files..."
FILES=(
    "deploy.sh"
    "update.sh"
    "nginx.conf"
    "ecosystem.config.js"
    "backend/.env.production"
    "frontend/.env.production"
    "worker/.env.production"
    "worker/.env.example"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📝 Checking SQL migrations..."
SQL_COUNT=$(ls -1 docs/*.sql 2>/dev/null | wc -l)
if [ "$SQL_COUNT" -gt 0 ]; then
    echo "✅ Found $SQL_COUNT SQL migration files"
else
    echo "❌ No SQL files found in docs/"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔐 Checking environment variables..."

# Check backend .env.production
if grep -q "CHANGE_THIS_PASSWORD" backend/.env.production 2>/dev/null; then
    echo "⚠️  backend/.env.production - Contains placeholder password"
fi

if grep -q "your_google_client" backend/.env.production 2>/dev/null; then
    echo "⚠️  backend/.env.production - Contains placeholder Google credentials"
fi

if grep -q "super_long_random_secret_change" backend/.env.production 2>/dev/null; then
    echo "⚠️  backend/.env.production - Contains placeholder JWT_SECRET"
fi

# Check worker .env.production
if grep -q "YOUR_PASSWORD" worker/.env.production 2>/dev/null; then
    echo "⚠️  worker/.env.production - Contains placeholder password"
fi

echo ""
echo "📦 Checking package.json..."
if [ -f "package.json" ]; then
    if grep -q "\"type\": \"module\"" package.json; then
        echo "✅ ES modules configured"
    else
        echo "❌ ES modules not configured"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🔧 Checking scripts..."
if [ -x "deploy.sh" ]; then
    echo "✅ deploy.sh is executable"
else
    echo "⚠️  deploy.sh is not executable (run: chmod +x deploy.sh)"
fi

if [ -x "update.sh" ]; then
    echo "✅ update.sh is executable"
else
    echo "⚠️  update.sh is not executable (run: chmod +x update.sh)"
fi

echo ""
echo "🌐 Checking GitHub repository..."
REPO_URL=$(git config --get remote.origin.url 2>/dev/null)
if [ -n "$REPO_URL" ]; then
    echo "✅ Git repository: $REPO_URL"
    
    if grep -q "$REPO_URL" deploy.sh 2>/dev/null; then
        echo "✅ deploy.sh has matching repository URL"
    else
        echo "⚠️  deploy.sh repository URL may not match"
    fi
else
    echo "❌ No git remote configured"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical checks passed!"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "1. Update DATABASE_URL in backend/.env.production"
    echo "2. Generate JWT_SECRET: openssl rand -base64 64"
    echo "3. Add real Google OAuth credentials"
    echo "4. Update worker/.env.production with database password"
    echo "5. Configure DNS records before deployment"
    echo ""
    echo "Ready to deploy! Run:"
    echo "curl -fsSL https://raw.githubusercontent.com/rexysans/clipora/main/deploy.sh | sudo bash"
else
    echo "❌ Found $ERRORS critical issues"
    echo "Please fix them before deploying"
    exit 1
fi
