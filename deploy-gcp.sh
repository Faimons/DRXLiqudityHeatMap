#!/bin/bash

# BTC Liquidity Heatmap - Google Cloud Deployment Script
# This script deploys the application to Google Cloud Platform

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BTC Liquidity Heatmap - GCP Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-540096542980}"
REGION="${GCP_REGION:-us-central1}"
REDIS_INSTANCE_NAME="btc-heatmap-redis"
REDIS_TIER="BASIC"
REDIS_MEMORY="1"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Redis Instance: $REDIS_INSTANCE_NAME"

# Prompt for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Set GCP project
echo -e "\n${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    redis.googleapis.com \
    containerregistry.googleapis.com \
    --quiet

# Create Redis instance if it doesn't exist
echo -e "\n${YELLOW}Checking Redis instance...${NC}"
if ! gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION &> /dev/null; then
    echo -e "${YELLOW}Creating Redis instance (this may take several minutes)...${NC}"
    gcloud redis instances create $REDIS_INSTANCE_NAME \
        --tier=$REDIS_TIER \
        --size=$REDIS_MEMORY \
        --region=$REGION \
        --redis-version=redis_7_0 \
        --quiet

    echo -e "${GREEN}Redis instance created successfully${NC}"
else
    echo -e "${GREEN}Redis instance already exists${NC}"
fi

# Get Redis host IP
echo -e "\n${YELLOW}Getting Redis connection details...${NC}"
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME \
    --region=$REGION \
    --format="value(host)")

echo "  Redis Host: $REDIS_HOST"

# Build and deploy using Cloud Build
echo -e "\n${YELLOW}Building and deploying with Cloud Build...${NC}"
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_CLOUD_RUN_REGION=$REGION,_REDIS_HOST=$REDIS_HOST \
    --quiet

# Get service URLs
echo -e "\n${YELLOW}Getting deployment URLs...${NC}"
BACKEND_URL=$(gcloud run services describe btc-heatmap-backend \
    --region=$REGION \
    --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe btc-heatmap-frontend \
    --region=$REGION \
    --format="value(status.url)")

# Update frontend to use correct backend URL
echo -e "\n${YELLOW}Updating frontend backend URL...${NC}"
gcloud run services update btc-heatmap-frontend \
    --region=$REGION \
    --set-env-vars="BACKEND_URL=$BACKEND_URL" \
    --quiet

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Application URLs:${NC}"
echo -e "  Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "  Backend:  ${GREEN}$BACKEND_URL${NC}"
echo -e "  API Docs: ${GREEN}$BACKEND_URL/docs${NC}"
echo ""
echo -e "${YELLOW}Redis Connection:${NC}"
echo -e "  Host: $REDIS_HOST"
echo -e "  Port: 6379"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Visit the frontend URL to access the dashboard"
echo "  2. Monitor logs: gcloud run services logs tail btc-heatmap-backend --region=$REGION"
echo "  3. Update domain (optional): gcloud run domain-mappings create --service=btc-heatmap-frontend"
echo ""
