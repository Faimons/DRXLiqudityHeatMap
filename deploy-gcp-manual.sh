#!/bin/bash

# BTC Liquidity Heatmap - Manuelles Deployment Guide
# Schritt-für-Schritt Befehle zum manuellen Deployment

# ==================================================
# SCHRITT 1: Projekt Setup
# ==================================================

echo "🔧 Schritt 1: Projekt konfigurieren"
gcloud config set project 540096542980

# ==================================================
# SCHRITT 2: APIs aktivieren
# ==================================================

echo "📡 Schritt 2: APIs aktivieren (Dauer: ~2 Min.)"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable containerregistry.googleapis.com

# ==================================================
# SCHRITT 3: Redis erstellen
# ==================================================

echo "💾 Schritt 3: Redis Instance erstellen (Dauer: ~5 Min.)"

# Redis erstellen
gcloud redis instances create btc-heatmap-redis \
    --tier=BASIC \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_0

# Redis IP abrufen
REDIS_HOST=$(gcloud redis instances describe btc-heatmap-redis \
    --region=us-central1 \
    --format="value(host)")

echo "✅ Redis erstellt: $REDIS_HOST"

# ==================================================
# SCHRITT 4: Backend Image bauen & deployen
# ==================================================

echo "🐳 Schritt 4a: Backend Image bauen (Dauer: ~3 Min.)"
gcloud builds submit \
    --tag gcr.io/540096542980/btc-heatmap-backend:latest \
    --file docker/Dockerfile.backend-cloudrun \
    .

echo "🚀 Schritt 4b: Backend zu Cloud Run deployen"
gcloud run deploy btc-heatmap-backend \
    --image gcr.io/540096542980/btc-heatmap-backend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10 \
    --set-env-vars="REDIS_HOST=$REDIS_HOST,REDIS_PORT=6379,BINANCE_WS_URL=wss://stream.binance.com:9443/ws,SYMBOL=BTCUSDT,LOG_LEVEL=INFO"

# Backend URL abrufen
BACKEND_URL=$(gcloud run services describe btc-heatmap-backend \
    --region=us-central1 \
    --format="value(status.url)")

echo "✅ Backend deployed: $BACKEND_URL"

# ==================================================
# SCHRITT 5: Frontend Image bauen & deployen
# ==================================================

echo "🐳 Schritt 5a: Frontend Image bauen (Dauer: ~3 Min.)"
gcloud builds submit \
    --tag gcr.io/540096542980/btc-heatmap-frontend:latest \
    --file docker/Dockerfile.frontend-cloudrun \
    --build-arg VITE_API_URL=/api \
    --build-arg VITE_WS_URL=/ws \
    .

echo "🚀 Schritt 5b: Frontend zu Cloud Run deployen"
gcloud run deploy btc-heatmap-frontend \
    --image gcr.io/540096542980/btc-heatmap-frontend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --max-instances=5

# Frontend URL abrufen
FRONTEND_URL=$(gcloud run services describe btc-heatmap-frontend \
    --region=us-central1 \
    --format="value(status.url)")

echo "✅ Frontend deployed: $FRONTEND_URL"

# ==================================================
# SCHRITT 6: Ergebnisse anzeigen
# ==================================================

echo ""
echo "========================================="
echo "✅ DEPLOYMENT ERFOLGREICH!"
echo "========================================="
echo ""
echo "🌐 Deine URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   API Docs: $BACKEND_URL/docs"
echo ""
echo "💾 Redis:"
echo "   Host: $REDIS_HOST"
echo "   Port: 6379"
echo ""
echo "📊 Monitoring:"
echo "   Logs: gcloud run services logs tail btc-heatmap-backend --region=us-central1"
echo "   Console: https://console.cloud.google.com/run?project=540096542980"
echo ""
