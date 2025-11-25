# Quick Start: Deploy to Google Cloud

Deploy your BTC Liquidity Heatmap to Google Cloud in under 15 minutes!

## Prerequisites

- Google Cloud account with billing enabled
- Project ID: `540096542980`
- `gcloud` CLI installed

## 🚀 One-Command Deployment

```bash
# 1. Clone and navigate to repository
cd DRXLiqudityHeatMap

# 2. Login to Google Cloud
gcloud auth login
gcloud config set project 540096542980

# 3. Deploy!
./deploy-gcp.sh
```

That's it! The script will:
- ✅ Enable required APIs
- ✅ Create Redis instance
- ✅ Build Docker containers
- ✅ Deploy to Cloud Run
- ✅ Configure networking
- ✅ Display your application URLs

## What You Get

After deployment:

- **Frontend URL**: `https://btc-heatmap-frontend-xxxxx.a.run.app`
  - Live trading dashboard
  - Real-time orderbook heatmap
  - Candlestick charts

- **Backend URL**: `https://btc-heatmap-backend-xxxxx.a.run.app`
  - WebSocket server
  - REST API
  - Interactive docs at `/docs`

- **Redis**: Managed Cloud Memorystore instance
  - 1GB memory
  - Redis 7.0
  - Automatic failover

## Architecture

```
User → Cloud Run (Frontend) → Cloud Run (Backend) → Redis
                                      ↓
                              Binance WebSocket
```

## Cost Estimate

**~$60-80/month** for moderate usage:
- Cloud Run Backend: ~$15-25/month
- Cloud Run Frontend: ~$5-10/month
- Redis (1GB Basic): ~$47/month
- Bandwidth: ~$3-5/month

**Free tier includes**:
- 2M requests/month
- 360k GB-seconds/month
- 1GB egress/month

## Next Steps

1. **Monitor your deployment**:
   ```bash
   gcloud run services logs tail btc-heatmap-backend --region=us-central1
   ```

2. **View in Cloud Console**:
   - [Cloud Run Services](https://console.cloud.google.com/run)
   - [Cloud Build History](https://console.cloud.google.com/cloud-build)
   - [Redis Instances](https://console.cloud.google.com/memorystore/redis)

3. **Add custom domain** (optional):
   ```bash
   gcloud run domain-mappings create \
       --service=btc-heatmap-frontend \
       --domain=your-domain.com \
       --region=us-central1
   ```

4. **Scale resources** (if needed):
   ```bash
   gcloud run services update btc-heatmap-backend \
       --region=us-central1 \
       --memory=2Gi \
       --cpu=2
   ```

## Troubleshooting

**Deployment fails?**
- Check billing is enabled
- Verify project ID: `gcloud config get-value project`
- Check API quotas: [Quotas Page](https://console.cloud.google.com/iam-admin/quotas)

**Can't access application?**
- Services must be public: `--allow-unauthenticated`
- Check firewall rules in VPC settings
- Verify CORS settings in backend

**High costs?**
```bash
# Set max instances to limit scaling
gcloud run services update btc-heatmap-backend \
    --max-instances=5 \
    --region=us-central1

# Scale to zero when idle
gcloud run services update btc-heatmap-backend \
    --min-instances=0 \
    --region=us-central1
```

## Update Deployment

To deploy new code changes:

```bash
# Commit your changes
git add .
git commit -m "Update: description"
git push

# Redeploy
gcloud builds submit --config=cloudbuild.yaml
```

## Cleanup

To delete everything and stop billing:

```bash
# Delete services
gcloud run services delete btc-heatmap-backend --region=us-central1 --quiet
gcloud run services delete btc-heatmap-frontend --region=us-central1 --quiet

# Delete Redis
gcloud redis instances delete btc-heatmap-redis --region=us-central1 --quiet
```

## Support

- 📖 Full docs: [DEPLOYMENT_GCP.md](./docs/DEPLOYMENT_GCP.md)
- 🐛 Issues: [GitHub Issues](https://github.com/Faimons/DRXLiqudityHeatMap/issues)
- 💬 GCP Support: [cloud.google.com/support](https://cloud.google.com/support)

---

**Ready to deploy?** Run `./deploy-gcp.sh` now! 🚀
