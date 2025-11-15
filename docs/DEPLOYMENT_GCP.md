# Google Cloud Platform Deployment Guide

This guide walks you through deploying the BTC Liquidity Heatmap Dashboard to Google Cloud Platform (GCP).

## Architecture Overview

The application is deployed using the following GCP services:

- **Cloud Run**: Serverless container platform for backend and frontend
- **Cloud Build**: Automated build and deployment pipeline
- **Container Registry**: Docker image storage
- **Cloud Memorystore (Redis)**: Managed Redis instance for caching

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                            │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼──────────┐
         │   Cloud Load Balancer │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────────────────┐
         │  Cloud Run - Frontend (Nginx)     │
         │  - Serves React App               │
         │  - Proxies /api and /ws to backend│
         └───────────┬──────────────────────┘
                     │
         ┌───────────▼──────────────────────┐
         │  Cloud Run - Backend (FastAPI)    │
         │  - WebSocket server               │
         │  - Binance data collection        │
         │  - Data processing                │
         └───────────┬──────────────────────┘
                     │
         ┌───────────▼──────────────────────┐
         │  Cloud Memorystore (Redis)        │
         │  - Real-time data cache           │
         │  - Orderbook storage              │
         └───────────────────────────────────┘
                     │
         ┌───────────▼──────────────────────┐
         │  Binance WebSocket API            │
         │  - Market data stream             │
         └───────────────────────────────────┘
```

## Prerequisites

### 1. Google Cloud Account

- Create a GCP account at [cloud.google.com](https://cloud.google.com)
- Enable billing for your project
- Note your Project ID: `540096542980`

### 2. Install Google Cloud SDK

**Linux/macOS:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

### 3. Authenticate

```bash
gcloud auth login
gcloud auth application-default login
```

### 4. Set Project

```bash
gcloud config set project 540096542980
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use the provided deployment script for a fully automated setup:

```bash
# Set your GCP project ID
export GCP_PROJECT_ID=540096542980
export GCP_REGION=us-central1  # or your preferred region

# Run deployment script
./deploy-gcp.sh
```

The script will:
1. Enable required GCP APIs
2. Create a Redis instance
3. Build Docker images
4. Deploy to Cloud Run
5. Configure networking
6. Display application URLs

**Deployment time:** ~10-15 minutes (first time)

### Method 2: Manual Deployment

#### Step 1: Enable Required APIs

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    redis.googleapis.com \
    containerregistry.googleapis.com
```

#### Step 2: Create Redis Instance

```bash
gcloud redis instances create btc-heatmap-redis \
    --tier=BASIC \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_0
```

Get Redis connection details:
```bash
gcloud redis instances describe btc-heatmap-redis \
    --region=us-central1 \
    --format="value(host)"
```

#### Step 3: Build and Deploy

```bash
# Submit build to Cloud Build
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_CLOUD_RUN_REGION=us-central1,_REDIS_HOST=<REDIS_HOST>
```

#### Step 4: Get Service URLs

```bash
# Backend URL
gcloud run services describe btc-heatmap-backend \
    --region=us-central1 \
    --format="value(status.url)"

# Frontend URL
gcloud run services describe btc-heatmap-frontend \
    --region=us-central1 \
    --format="value(status.url)"
```

## Configuration

### Environment Variables

#### Backend Service

Set via Cloud Run environment variables:

```bash
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --set-env-vars="
REDIS_HOST=<REDIS_IP>,
REDIS_PORT=6379,
BINANCE_WS_URL=wss://stream.binance.com:9443/ws,
SYMBOL=BTCUSDT,
ORDERBOOK_DEPTH=500,
WALL_THRESHOLD_BTC=100.0,
LOG_LEVEL=INFO
"
```

#### Frontend Service

Environment variables are baked into the build:
- `VITE_API_URL=/api`
- `VITE_WS_URL=/ws`

To update, rebuild and redeploy.

### Resource Configuration

Default resource limits:

**Backend:**
- Memory: 1GB
- CPU: 1 vCPU
- Max instances: 10
- Min instances: 0 (scales to zero)

**Frontend:**
- Memory: 512MB
- CPU: 1 vCPU
- Max instances: 5
- Min instances: 0

To adjust:
```bash
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --memory=2Gi \
    --cpu=2 \
    --max-instances=20
```

## Monitoring & Logging

### View Logs

**Backend logs:**
```bash
gcloud run services logs tail btc-heatmap-backend \
    --region=us-central1
```

**Frontend logs:**
```bash
gcloud run services logs tail btc-heatmap-frontend \
    --region=us-central1
```

### Cloud Monitoring

Access metrics in [Cloud Console](https://console.cloud.google.com/monitoring):
- Request count
- Latency (p50, p95, p99)
- Error rate
- Instance count
- Container CPU/Memory usage

### Set Up Alerts

Create alerts for:
- High error rate (> 5%)
- High latency (> 1s p95)
- Too many instances (cost control)

```bash
# Example: Create error rate alert
gcloud alpha monitoring policies create \
    --notification-channels=<CHANNEL_ID> \
    --display-name="High Error Rate" \
    --condition-display-name="Error rate > 5%" \
    --condition-threshold-value=0.05 \
    --condition-threshold-duration=300s
```

## Networking & Security

### Custom Domain

Map a custom domain to your frontend:

```bash
gcloud run domain-mappings create \
    --service=btc-heatmap-frontend \
    --domain=btc-heatmap.yourdomain.com \
    --region=us-central1
```

Add the DNS records shown in the output to your domain provider.

### HTTPS/SSL

Cloud Run automatically provisions SSL certificates for custom domains.

### VPC Connector (Optional)

For secure Redis access via private IP:

1. Create VPC connector:
```bash
gcloud compute networks vpc-access connectors create btc-heatmap-connector \
    --region=us-central1 \
    --network=default \
    --range=10.8.0.0/28
```

2. Update Cloud Run service:
```bash
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --vpc-connector=btc-heatmap-connector
```

### Authentication (Optional)

Enable Cloud IAM authentication:

```bash
gcloud run services update btc-heatmap-frontend \
    --region=us-central1 \
    --no-allow-unauthenticated
```

Access requires:
```bash
gcloud run services proxy btc-heatmap-frontend \
    --region=us-central1 \
    --port=8080
```

## Cost Optimization

### Estimated Monthly Costs

**Cloud Run:**
- Backend: ~$10-30/month (depends on traffic)
- Frontend: ~$5-15/month
- Free tier: 2M requests, 360k GB-seconds

**Cloud Memorystore (Redis):**
- Basic 1GB: ~$47/month
- Standard 1GB: ~$93/month

**Total:** ~$60-140/month

### Reduce Costs

1. **Use Redis Basic tier** instead of Standard
2. **Set max instances** to control scaling
3. **Scale to zero** when not in use
4. **Use Cloud Build free tier** (120 build-minutes/day)

```bash
# Set minimum instances to 0 (scale to zero)
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --min-instances=0

# Limit max instances
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --max-instances=3
```

## Updating the Application

### Deploy New Version

```bash
# Rebuild and deploy
gcloud builds submit --config=cloudbuild.yaml
```

### Rollback

```bash
# List revisions
gcloud run revisions list \
    --service=btc-heatmap-backend \
    --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic btc-heatmap-backend \
    --region=us-central1 \
    --to-revisions=<REVISION_NAME>=100
```

### Blue/Green Deployment

```bash
# Deploy new version without traffic
gcloud run deploy btc-heatmap-backend \
    --region=us-central1 \
    --image=gcr.io/540096542980/btc-heatmap-backend:new-version \
    --no-traffic

# Gradually shift traffic
gcloud run services update-traffic btc-heatmap-backend \
    --region=us-central1 \
    --to-revisions=new-revision=50,old-revision=50

# Complete migration
gcloud run services update-traffic btc-heatmap-backend \
    --region=us-central1 \
    --to-latest
```

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
gcloud run services logs read btc-heatmap-backend \
    --region=us-central1 \
    --limit=50
```

**Common issues:**
- Redis connection failure: Verify REDIS_HOST
- Binance WebSocket error: Check BINANCE_WS_URL
- Port mismatch: Ensure PORT=8080

### High Latency

**Causes:**
- Cold starts (first request after idle)
- Insufficient resources
- Slow external APIs (Binance)

**Solutions:**
```bash
# Set minimum instances to avoid cold starts
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --min-instances=1

# Increase resources
gcloud run services update btc-heatmap-backend \
    --region=us-central1 \
    --memory=2Gi \
    --cpu=2
```

### WebSocket Disconnections

**Check:**
- Cloud Run timeout settings (default: 5 minutes)
- Nginx proxy configuration
- Client-side reconnection logic

### Build Failures

**View build logs:**
```bash
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Deploy
        run: |
          gcloud builds submit --config=cloudbuild.yaml
```

### Cloud Build Triggers

Automatically deploy on git push:

```bash
gcloud builds triggers create github \
    --repo-name=DRXLiqudityHeatMap \
    --repo-owner=Faimons \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

## Backup & Disaster Recovery

### Redis Backups

Cloud Memorystore doesn't support manual backups on Basic tier. For Standard tier:

```bash
gcloud redis instances export \
    btc-heatmap-redis \
    --destination=gs://your-backup-bucket/redis-backup.rdb \
    --region=us-central1
```

### Container Image Backups

Images in Container Registry are automatically retained. To backup:

```bash
# Pull and save
docker pull gcr.io/540096542980/btc-heatmap-backend:latest
docker save gcr.io/540096542980/btc-heatmap-backend:latest -o backup.tar
```

## Cleanup

To remove all resources:

```bash
# Delete Cloud Run services
gcloud run services delete btc-heatmap-backend --region=us-central1 --quiet
gcloud run services delete btc-heatmap-frontend --region=us-central1 --quiet

# Delete Redis instance
gcloud redis instances delete btc-heatmap-redis --region=us-central1 --quiet

# Delete container images
gcloud container images delete gcr.io/540096542980/btc-heatmap-backend --quiet
gcloud container images delete gcr.io/540096542980/btc-heatmap-frontend --quiet
```

## Support

- **GCP Documentation**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)
- **Cloud Run Issues**: [issuetracker.google.com](https://issuetracker.google.com)
- **Project Issues**: [GitHub Issues](https://github.com/Faimons/DRXLiqudityHeatMap/issues)

---

**Last Updated**: 2024-11-15
**GCP Project ID**: 540096542980
