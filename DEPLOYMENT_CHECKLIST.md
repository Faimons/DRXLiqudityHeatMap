# ✅ Google Cloud Deployment Checklist

Folge dieser Checkliste Schritt für Schritt für ein erfolgreiches Deployment!

## 📋 Vor dem Deployment

### ☐ 1. Google Cloud Account
- [ ] Account erstellt bei [cloud.google.com](https://cloud.google.com)
- [ ] Billing aktiviert (Kreditkarte hinterlegt)
- [ ] Project ID notiert: `540096542980`

**Billing prüfen:**
```bash
gcloud beta billing projects describe 540096542980
```

### ☐ 2. gcloud SDK installiert
- [ ] Installation abgeschlossen
- [ ] Version check funktioniert

```bash
gcloud --version
# Sollte ausgeben: Google Cloud SDK 4xx.x.x
```

### ☐ 3. Authentifizierung
- [ ] Login durchgeführt
- [ ] Projekt gesetzt

```bash
# Login
gcloud auth login

# Projekt setzen
gcloud config set project 540096542980

# Prüfen
gcloud config get-value project
# Sollte ausgeben: 540096542980
```

### ☐ 4. Repository bereit
- [ ] Repository geklont
- [ ] Auf richtigem Branch

```bash
cd DRXLiqudityHeatMap
git status
# Sollte zeigen: On branch claude/push-project-to-cloud-01FvP5nxA5XGnDCr6JqjZdUL
```

## 🚀 Deployment Durchführen

### Methode A: Automatisches Deployment (empfohlen)

```bash
./deploy-gcp.sh
```

**Erwartete Dauer:** 10-15 Minuten

**Fortschritt beobachten:**
- ✅ "Enabling required APIs..." (~2 Min.)
- ✅ "Creating Redis instance..." (~5 Min.)
- ✅ "Building and deploying with Cloud Build..." (~5-8 Min.)
- ✅ "Deployment completed successfully!"

### Methode B: Manuelles Deployment

Falls das automatische Script fehlschlägt:

```bash
./deploy-gcp-manual.sh
```

### Methode C: Cloud Build verwenden

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## ✅ Nach dem Deployment

### ☐ 1. URLs notieren
Nach erfolgreichem Deployment werden ausgegeben:
- Frontend URL: `https://btc-heatmap-frontend-xxxxx-uc.a.run.app`
- Backend URL: `https://btc-heatmap-backend-xxxxx-uc.a.run.app`

### ☐ 2. Frontend testen
- [ ] URL im Browser öffnen
- [ ] Dashboard lädt
- [ ] BTC/USDT Chart sichtbar
- [ ] Orderbook Heatmap aktualisiert sich

### ☐ 3. Backend testen
```bash
# Health Check
curl https://btc-heatmap-backend-xxxxx-uc.a.run.app/health

# API Docs im Browser öffnen
# https://btc-heatmap-backend-xxxxx-uc.a.run.app/docs
```

### ☐ 4. Logs prüfen
```bash
# Backend Logs
gcloud run services logs tail btc-heatmap-backend --region=us-central1

# Sollte zeigen:
# - "WebSocket connected to Binance"
# - "Redis connection established"
# - Keine ERROR Meldungen
```

### ☐ 5. Redis Verbindung prüfen
```bash
gcloud redis instances describe btc-heatmap-redis --region=us-central1

# Status sollte sein: READY
```

## 🔧 Troubleshooting

### Problem: "Permission denied" beim Deployment

**Lösung:**
```bash
# Nochmal authentifizieren
gcloud auth login
gcloud auth application-default login

# Berechtigung für Cloud Build
gcloud projects add-iam-policy-binding 540096542980 \
    --member=serviceAccount:540096542980@cloudbuild.gserviceaccount.com \
    --role=roles/run.admin
```

### Problem: "Billing must be enabled"

**Lösung:**
1. Gehe zu: https://console.cloud.google.com/billing
2. Wähle Projekt `540096542980`
3. "Billing-Konto verknüpfen"
4. Zahlungsmethode hinzufügen

### Problem: "Service btc-heatmap-backend already exists"

**Lösung:**
```bash
# Service löschen und neu deployen
gcloud run services delete btc-heatmap-backend --region=us-central1 --quiet
gcloud run services delete btc-heatmap-frontend --region=us-central1 --quiet

# Erneut deployen
./deploy-gcp.sh
```

### Problem: Redis Creation Timeout

**Lösung:**
```bash
# Redis Status prüfen
gcloud redis instances list --region=us-central1

# Wenn Status "CREATING" hängt (>10 Min), löschen und neu erstellen
gcloud redis instances delete btc-heatmap-redis --region=us-central1 --quiet

# Neu erstellen
gcloud redis instances create btc-heatmap-redis \
    --tier=BASIC \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_0
```

### Problem: Frontend zeigt "Cannot connect to backend"

**Lösung:**
```bash
# Backend URL abrufen
BACKEND_URL=$(gcloud run services describe btc-heatmap-backend \
    --region=us-central1 \
    --format="value(status.url)")

# Frontend mit korrekter Backend URL aktualisieren
gcloud run services update btc-heatmap-frontend \
    --region=us-central1 \
    --set-env-vars="BACKEND_URL=$BACKEND_URL"
```

### Problem: "404 Not Found" bei Frontend

**Lösung:**
```bash
# Nginx config prüfen und Frontend neu deployen
gcloud builds submit \
    --tag gcr.io/540096542980/btc-heatmap-frontend:latest \
    --file docker/Dockerfile.frontend-cloudrun

gcloud run services update btc-heatmap-frontend \
    --region=us-central1 \
    --image gcr.io/540096542980/btc-heatmap-frontend:latest
```

## 📊 Monitoring Setup (Optional)

### Logs-Explorer verwenden
```bash
# In Browser öffnen
echo "https://console.cloud.google.com/logs/query?project=540096542980"
```

### Uptime Check erstellen
```bash
gcloud monitoring uptime create btc-heatmap-uptime \
    --resource-type=url \
    --resource-url=https://btc-heatmap-frontend-xxxxx-uc.a.run.app/health
```

## 💰 Kosten-Monitoring (Optional)

### Budget erstellen
```bash
# In Browser öffnen
echo "https://console.cloud.google.com/billing/budgets?project=540096542980"

# Budget erstellen mit Alert bei 50€/Monat
```

### Aktuelle Kosten ansehen
```bash
# In Browser öffnen
echo "https://console.cloud.google.com/billing/reports?project=540096542980"
```

## 🎯 Erfolgreiche Deployment-Kriterien

- ✅ Frontend lädt ohne Fehler
- ✅ BTC/USDT Preis wird angezeigt
- ✅ Orderbook Heatmap aktualisiert sich live
- ✅ Keine Fehler in den Logs
- ✅ Backend API Docs erreichbar
- ✅ Redis Status = READY
- ✅ Cloud Run Services = Healthy

## 📞 Support

**Bei Problemen:**
1. Logs prüfen: `gcloud run services logs tail btc-heatmap-backend --region=us-central1`
2. Cloud Console öffnen: https://console.cloud.google.com/run?project=540096542980
3. GitHub Issue erstellen: https://github.com/Faimons/DRXLiqudityHeatMap/issues

**Nützliche Links:**
- Cloud Run Docs: https://cloud.google.com/run/docs
- Redis Docs: https://cloud.google.com/memorystore/docs/redis
- Cloud Build Docs: https://cloud.google.com/build/docs

---

**Viel Erfolg beim Deployment! 🚀**
