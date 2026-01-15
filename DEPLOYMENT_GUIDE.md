# Deployment Guide

## Overview

This guide covers deploying the Plumbing IoT BSV Platform to production.

## Prerequisites

- Node.js 18+ or Docker
- MongoDB (Atlas or self-hosted)
- BSV wallet/account for blockchain transactions
- SSL certificate for HTTPS

## Local Development

### Quick Start

```bash
# Make setup script executable
chmod +x start.sh

# Run setup
./start.sh
```

This will:
1. Install dependencies
2. Build the backend
3. Configure environment files
4. Display startup instructions

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### 1. Environment Configuration

Update `.env.production`:

```bash
cp .env.production backend/.env.production

# Edit with production values
nano backend/.env.production
```

Critical variables:
- `MONGODB_URI`: Production MongoDB connection
- `JWT_SECRET`: Strong, random secret (32+ characters)
- `BSV_NETWORK`: Set to `mainnet`
- `FRONTEND_URL`: Your domain

### 2. Build Docker Image

```bash
# Build backend image
docker build -t plumbing-backend:latest .

# Tag for registry
docker tag plumbing-backend:latest myregistry/plumbing-backend:latest

# Push to registry
docker push myregistry/plumbing-backend:latest
```

### 3. Deploy with Docker

#### Single Server

```bash
docker run -d \
  --name plumbing-backend \
  -p 3001:3001 \
  --restart unless-stopped \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret-key" \
  -e BSV_NETWORK="mainnet" \
  -e NODE_ENV="production" \
  myregistry/plumbing-backend:latest
```

#### Docker Compose (Production)

```yaml
version: '3.8'

services:
  backend:
    image: myregistry/plumbing-backend:latest
    restart: always
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
      BSV_NETWORK: mainnet
      # ... other variables
    networks:
      - plumbing
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  plumbing:
    driver: bridge
```

### 4. Kubernetes Deployment

#### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plumbing-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plumbing-backend
  template:
    metadata:
      labels:
        app: plumbing-backend
    spec:
      containers:
      - name: backend
        image: myregistry/plumbing-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: plumbing-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: plumbing-secrets
              key: jwt-secret
        - name: BSV_NETWORK
          value: "mainnet"
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: plumbing-backend-service
spec:
  selector:
    app: plumbing-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl create secret generic plumbing-secrets \
  --from-literal=mongodb-uri='...' \
  --from-literal=jwt-secret='...'
```

### 5. SSL/TLS Configuration

#### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Database Backup

#### MongoDB Backup

```bash
# Local backup
mongodump --uri "mongodb://user:pass@host:27017/plumbing" \
  --out ./backups/$(date +%Y%m%d_%H%M%S)

# Restore
mongorestore --uri "mongodb://user:pass@host:27017" ./backups/backup_name
```

#### Automated Backup (Cron)

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/plumbing"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri "$MONGODB_URI" --out "$BACKUP_DIR/$DATE"

# Keep only last 30 days
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \;
```

Add to crontab:
```
0 2 * * * /scripts/backup.sh >> /var/log/plumbing-backup.log 2>&1
```

### 7. Monitoring & Logging

#### Application Logs

```bash
# Docker logs
docker logs -f plumbing-backend

# Kubernetes logs
kubectl logs -f deployment/plumbing-backend
```

#### Health Monitoring

```bash
# Check health
curl http://localhost:3001/health

# Response:
# {
#   "status": "healthy",
#   "timestamp": "2026-01-09T...",
#   "uptime": 3600.5,
#   "service": "Plumbing IoT BSV Platform"
# }
```

#### Set Up Alerting

```bash
# Check every 5 minutes
*/5 * * * * curl -f http://localhost:3001/health || \
  mail -s "Platform Down" admin@company.com
```

### 8. Performance Optimization

#### Database Indexes

```javascript
// Create in MongoDB
db.iot_readings.createIndex({ propertyId: 1, timestamp: -1 })
db.jobs.createIndex({ status: 1, createdAt: -1 })
db.consent.createIndex({ propertyId: 1 })
db.blockchain_proofs.createIndex({ propertyId: 1, timestamp: -1 })
```

#### Caching

```bash
# Add Redis for caching (optional)
docker run -d --name plumbing-redis \
  -p 6379:6379 \
  redis:alpine
```

### 9. Security Checklist

- [ ] HTTPS enabled
- [ ] JWT secret is strong and random
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Database credentials in secrets, not code
- [ ] Regular backups configured
- [ ] Firewall rules restrictive
- [ ] Monitoring and alerts active
- [ ] Security patches up to date

### 10. Scaling

For high traffic:

1. **Horizontal Scaling**: Use load balancer (AWS ELB, GCP LB)
2. **Database**: MongoDB Atlas with auto-scaling
3. **Caching**: Redis for frequently accessed data
4. **CDN**: CloudFlare or similar for static assets
5. **Microservices**: Split into separate services if needed

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### MongoDB Connection Issues

```bash
# Test connection
mongo mongodb://user:pass@host:27017/plumbing

# Check MongoDB status
systemctl status mongod
```

### High Memory Usage

```bash
# Check memory
docker stats plumbing-backend

# Increase container memory
docker update --memory 2g plumbing-backend
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/p2ppsr/meter/issues
- Documentation: See QUICK_START.md and PLUMBING_PLATFORM.md
