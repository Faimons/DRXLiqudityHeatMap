# 🖥️ Lokales Setup - BTC Liquidity Heatmap

Schnellanleitung zum lokalen Testen der Anwendung.

## 🚀 Schnellstart (3 Optionen)

### Option 1: Automatisches Script ⭐ EINFACHSTE

**Linux/macOS:**
```bash
cd DRXLiqudityHeatMap
./start-local.sh
```

**Windows:**
```bash
cd DRXLiqudityHeatMap
start-local.bat
```

**Dann im Browser öffnen:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs

---

### Option 2: Docker (empfohlen wenn Docker installiert ist)

```bash
cd DRXLiqudityHeatMap

# Environment kopieren
cp .env.example .env

# Docker Compose starten
cd docker
docker-compose up -d

# Warten ~30 Sekunden...

# Im Browser öffnen:
# Frontend: http://localhost
# Backend: http://localhost:8000/docs
```

**Stoppen:**
```bash
docker-compose down
```

---

### Option 3: Manuell (Schritt-für-Schritt)

#### Voraussetzungen installieren

**1. Redis**

Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install redis-server
redis-server --daemonize yes
```

macOS:
```bash
brew install redis
redis-server --daemonize yes
```

Windows:
- Download: https://github.com/microsoftarchive/redis/releases
- Entpacken und `redis-server.exe` ausführen

**Redis testen:**
```bash
redis-cli ping
# Sollte ausgeben: PONG
```

**2. Python 3.11+**
```bash
python3 --version
# Sollte 3.11 oder höher sein
```

**3. Node.js 18+**
```bash
node --version
# Sollte v18 oder höher sein
```

---

#### Backend starten

```bash
# Terminal 1
cd DRXLiqudityHeatMap/backend

# Virtual Environment erstellen
python3 -m venv venv

# Aktivieren
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Dependencies installieren
pip install -r requirements.txt

# Starten
python -m backend.main
```

**Erfolgreich wenn du siehst:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Backend startup complete!
```

**Backend URL:** http://localhost:8000/docs

---

#### Frontend starten

```bash
# Terminal 2 (NEUES Terminal!)
cd DRXLiqudityHeatMap/frontend

# Dependencies installieren
npm install

# Starten
npm run dev
```

**Erfolgreich wenn du siehst:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Frontend URL:** http://localhost:5173

---

## ✅ Testen ob alles funktioniert

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```

**Sollte ausgeben:**
```json
{
  "status": "healthy",
  "redis": "connected",
  "collectors": {
    "orderbook": true,
    "trades": true
  }
}
```

### 2. Frontend öffnen

Browser öffnen: http://localhost:5173

**Du solltest sehen:**
- ✅ Header mit BTC/USDT Preis
- ✅ Chart mit Candlesticks
- ✅ Orderbook Heatmap (grün/rot Balken)
- ✅ Wall Tracker Panel (rechts oben)
- ✅ Volume Footprint (rechts mitte)
- ✅ Liquidation Levels (rechts unten)

### 3. Daten prüfen

**Im Browser Console (F12):**
```javascript
// WebSocket sollte connected sein
// Keine Fehler sichtbar
```

**Backend Logs prüfen:**
```bash
# Im Backend Terminal solltest du sehen:
WebSocket connected to Binance
Orderbook collector started
Trades collector started
```

---

## 🔧 Troubleshooting

### Problem: "Redis connection failed"

**Lösung:**
```bash
# Prüfen ob Redis läuft
redis-cli ping

# Falls nicht:
redis-server --daemonize yes  # Linux/macOS
redis-server.exe              # Windows
```

### Problem: "Port 8000 already in use"

**Lösung:**
```bash
# Finde Prozess auf Port 8000
lsof -ti:8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Beende Prozess
kill <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### Problem: "Port 5173 already in use"

**Lösung:**
```bash
# Vite startet automatisch auf anderem Port
# Oder manuell beenden:
lsof -ti:5173 | xargs kill  # Linux/macOS
```

### Problem: "Module not found"

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Binance WebSocket connection failed"

**Lösung:**
- Check Internet connection
- Binance könnte blockiert sein (VPN testen)
- Firewall prüfen

### Problem: "Frontend zeigt leere Daten"

**Prüfen:**
```bash
# 1. Backend läuft?
curl http://localhost:8000/health

# 2. WebSocket erreichbar?
# Browser Console (F12) → Network → WS
# Sollte zeigen: ws://localhost:8000/ws (Status: 101)

# 3. Binance Daten kommen an?
curl http://localhost:8000/api/orderbook
```

---

## 📊 Was du sehen solltest

### Frontend Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ BTC/USDT  $67,234.56  ▲ +2.34%         [Live]   [15m] │
├───────────────────────────┬─────────────────────────────┤
│                           │  Wall Tracker               │
│                           │  - Buy Wall: 45.2 BTC       │
│    Candlestick Chart      │  - Sell Wall: 38.7 BTC      │
│    mit Orderbook Overlay  ├─────────────────────────────┤
│    (grün/rot Balken)      │  Volume Footprint           │
│                           │  Delta: +1234 BTC           │
│                           ├─────────────────────────────┤
│                           │  Liquidation Levels         │
│                           │  Long: $65,432 (10x)        │
└───────────────────────────┴─────────────────────────────┘
```

### Interaktive Features

**Im Chart:**
- ✅ Timeframe wechseln (1m, 5m, 15m, etc.)
- ✅ Zoom (Mausrad / Pinch)
- ✅ Pan (Drag)
- ✅ Orderbook Overlay toggle
- ✅ Liquidation Levels toggle

**Updates:**
- ✅ Preis aktualisiert sich live (~1x/Sekunde)
- ✅ Orderbook animiert (grün/rot Balken bewegen sich)
- ✅ Wall Tracker zeigt neue Walls
- ✅ Candlesticks updaten

---

## 🎨 Performance Einstellungen

### Backend (.env anpassen)

```env
# Weniger Orderbook Levels (schneller)
ORDERBOOK_DEPTH=200  # Standard: 500

# Update Intervall (ms)
UPDATE_INTERVAL_MS=200  # Standard: 100

# Log Level
LOG_LEVEL=INFO  # oder DEBUG für mehr Output
```

### Frontend

Im Browser Console:
```javascript
// Performance monitoring
console.log('FPS:', performance.now())
```

---

## 📝 Logs ansehen

### Backend Logs
```bash
# Wenn via Script gestartet:
tail -f logs/backend.log

# Oder im Terminal wo Backend läuft
```

### Frontend Logs
```bash
# Wenn via Script gestartet:
tail -f logs/frontend.log

# Oder Browser Console (F12)
```

### Redis Logs
```bash
redis-cli monitor
```

---

## 🛑 Services stoppen

### Mit Script gestartet
- **Linux/macOS:** `Ctrl+C` im Terminal
- **Windows:** Terminal-Fenster schließen

### Mit Docker
```bash
cd docker
docker-compose down
```

### Manuell
- **Backend:** `Ctrl+C` im Backend Terminal
- **Frontend:** `Ctrl+C` im Frontend Terminal
- **Redis:** `redis-cli shutdown`

---

## 🔄 Neu starten (nach Code-Änderungen)

### Backend
```bash
# Im Backend Terminal: Ctrl+C
# Dann neu starten:
python -m backend.main
```

### Frontend
```bash
# Vite hot-reload ist aktiv
# Änderungen werden automatisch übernommen
# Nur bei package.json Änderungen neu starten
```

---

## 📦 Datenbank zurücksetzen

### Redis Cache leeren
```bash
redis-cli FLUSHALL
```

---

## 💡 Tipps

### Schnellere Entwicklung

1. **Backend Auto-Reload:**
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend HMR (Hot Module Replacement):**
   - Ist bereits aktiv mit `npm run dev`

3. **Multi-Terminal:**
   - Benutze `tmux` oder `screen` (Linux/macOS)
   - Oder Windows Terminal mit Tabs

### Browser DevTools

- **F12** → Console: WebSocket Messages
- **F12** → Network → WS: WebSocket Verbindung
- **F12** → Performance: FPS Monitoring

### VS Code Debugging

Erstelle `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "backend.main:app",
        "--reload"
      ],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

---

## 📚 Weitere Ressourcen

- **Backend API Docs:** http://localhost:8000/docs
- **WebSocket Test:** http://localhost:8000/ws (Browser DevTools)
- **Redis GUI:** [RedisInsight](https://redis.com/redis-enterprise/redis-insight/)

---

## ✅ Checkliste: "Es funktioniert!"

- [ ] Redis läuft (`redis-cli ping`)
- [ ] Backend läuft (http://localhost:8000/health)
- [ ] Frontend läuft (http://localhost:5173)
- [ ] WebSocket connected (Browser Console)
- [ ] Binance Daten kommen an (Backend Logs)
- [ ] Chart zeigt Candlesticks
- [ ] Orderbook Overlay sichtbar (grün/rot Balken)
- [ ] Preis updated live
- [ ] Keine Fehler in Logs

**Alles ✅? Perfekt! Viel Spaß beim Testen! 🚀**

---

**Probleme?** Schau in die Troubleshooting Sektion oben oder check die Logs!
