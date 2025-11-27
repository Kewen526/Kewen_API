# Kewen API Platform - Deployment Guide

Complete guide for deploying Kewen API Platform to your server.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Deployment](#manual-deployment)
- [Production Configuration](#production-configuration)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#ssl-https-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 2GB+ RAM (4GB+ recommended)
- 20GB+ disk space
- Node.js 18+ (for manual deployment)
- Docker & Docker Compose (for Docker deployment)

### Required Services
- PostgreSQL 13+
- Redis 6+
- Nginx (optional, for reverse proxy)

## Quick Start with Docker

### 1. Install Docker & Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/kewen-api.git
cd kewen-api

# Configure environment
cp .env.example .env
nano .env  # Edit configuration
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Check status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database (optional)
docker-compose exec api npx prisma db seed
```

### 5. Verify Installation

```bash
curl http://localhost:3000/api/health
```

## Manual Deployment

### 1. Install Dependencies

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server
```

### 2. Setup PostgreSQL

```bash
# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE kewen_api;
postgres=# CREATE USER kewen WITH PASSWORD 'your_secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE kewen_api TO kewen;
postgres=# \q
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/kewen-api.git
cd kewen-api

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env

# Generate Prisma Client
npx prisma generate

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### 4. Setup Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name kewen-api

# Configure auto-start
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs kewen-api
```

## Production Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://kewen:password@localhost:5432/kewen_api?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security - CHANGE THESE!
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/kewen-api

# Cache
CACHE_TTL=3600
CACHE_ENABLED=true

# Webhook
WEBHOOK_TIMEOUT=10000
WEBHOOK_RETRY_TIMES=3

# Monitoring
ENABLE_METRICS=true
METRICS_INTERVAL=60000
```

### Security Checklist

- [ ] Change default JWT_SECRET to a strong random string
- [ ] Use strong database passwords
- [ ] Enable Redis authentication
- [ ] Configure firewall (ufw/firewalld)
- [ ] Enable HTTPS/SSL
- [ ] Set up fail2ban for brute force protection
- [ ] Regular security updates
- [ ] Enable database backups

## Nginx Configuration

### Install Nginx

```bash
sudo apt-get install nginx
```

### Configure Reverse Proxy

Create `/etc/nginx/sites-available/kewen-api`:

```nginx
upstream kewen_api {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/kewen-api-access.log;
    error_log /var/log/nginx/kewen-api-error.log;

    # Proxy Configuration
    location / {
        proxy_pass http://kewen_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # File upload size
    client_max_body_size 10M;
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/kewen-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## Monitoring & Maintenance

### Database Backup

```bash
# Create backup script
cat > /opt/kewen-api/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/kewen-api"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -U kewen kewen_api | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/kewen-api/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/kewen-api/backup.sh") | crontab -
```

### Log Rotation

Create `/etc/logrotate.d/kewen-api`:

```
/var/log/kewen-api/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        pm2 reload kewen-api
    endscript
}
```

### Health Monitoring

```bash
# Simple health check script
cat > /opt/kewen-api/healthcheck.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
    exit 0
else
    echo "❌ API is down, restarting..."
    pm2 restart kewen-api
    exit 1
fi
EOF

chmod +x /opt/kewen-api/healthcheck.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/kewen-api/healthcheck.sh") | crontab -
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs kewen-api
# or for Docker
docker-compose logs api

# Check environment
cat .env

# Verify database connection
npx prisma db pull
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U kewen -d kewen_api -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check firewall
sudo ufw status
```

### Redis connection issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
sudo systemctl status redis

# Check Redis configuration
sudo nano /etc/redis/redis.conf
```

### High memory usage

```bash
# Check Node.js memory
pm2 show kewen-api

# Restart application
pm2 restart kewen-api

# Clear Redis cache
redis-cli FLUSHDB
```

### Performance issues

```bash
# Check database performance
SELECT * FROM pg_stat_activity;

# Analyze slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check API metrics
curl http://localhost:3000/api/health
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Log rotation configured
- [ ] PM2/Docker auto-restart enabled
- [ ] Health checks configured
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Security headers added
- [ ] Documentation updated

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/kewen-api/issues
- Email: support@kewen-api.com
- Documentation: http://localhost:3000/api-docs

---

Happy deploying! 🚀
