# Deployment Guide

## Docker Deployment (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd btc-liquidity-heatmap
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Build and start**
```bash
cd docker
docker-compose up -d
```

4. **Verify deployment**
```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Health check
curl http://localhost:8000/health
```

5. **Access application**
- Frontend: http://localhost
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Scaling

To run multiple backend workers:

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 4
```

## Manual Deployment

### Backend Deployment

1. **Setup Python environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Configure environment**
```bash
export REDIS_HOST=your-redis-host
export REDIS_PORT=6379
export LOG_LEVEL=INFO
```

3. **Run with systemd**

Create `/etc/systemd/system/btc-heatmap-backend.service`:
```ini
[Unit]
Description=BTC Heatmap Backend
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/btc-heatmap/backend
Environment="PATH=/opt/btc-heatmap/backend/venv/bin"
Environment="REDIS_HOST=localhost"
ExecStart=/opt/btc-heatmap/backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable btc-heatmap-backend
sudo systemctl start btc-heatmap-backend
```

### Frontend Deployment

1. **Build frontend**
```bash
cd frontend
npm install
npm run build
```

2. **Deploy with Nginx**

Create `/etc/nginx/sites-available/btc-heatmap`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/btc-heatmap;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/btc-heatmap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Production Considerations

### Redis

For production, use Redis persistence:

```bash
# redis.conf
save 900 1
save 300 10
save 60 10000
appendonly yes
```

### Backend

1. **Use environment variables for secrets**
2. **Enable logging to file**
3. **Use multiple workers**
4. **Set up monitoring (Prometheus, etc.)**
5. **Configure CORS properly**

### Frontend

1. **Enable HTTPS with Let's Encrypt**
2. **Configure CDN for static assets**
3. **Enable gzip compression**
4. **Set proper cache headers**

### Monitoring

Use Prometheus + Grafana:

```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
```

### Backup

Backup Redis data:
```bash
# Cron job
0 2 * * * docker exec btc-heatmap-redis redis-cli SAVE && cp /var/lib/redis/dump.rdb /backup/redis-$(date +\%Y\%m\%d).rdb
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose up -d --build
```

### High memory usage
```bash
# Limit Redis memory in docker-compose.yml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### WebSocket disconnects
```bash
# Increase timeout in nginx
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```

## Security Checklist

- [ ] Change default Redis password
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
