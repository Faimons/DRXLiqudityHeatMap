/**
 * API-Connector für die DOM-Trading-Anwendung
 * Verbindet die Anwendung mit verschiedenen Datenquellen
 */
const APIConnector = {
    // Konfiguration
    dataSource: 'dxFeed', // Standardmäßig auf dxFeed gesetzt, um Live-Demo-Daten zu nutzen
    connected: false,
    intervalId: null,
    intervalTime: CONFIG.initialRefreshRate,
    lastUpdate: null,
    errorCount: 0,
    
    /**
     * Initialisiere den API-Connector
     * @param {string} source - Die zu verwendende Datenquelle
     */
    initialize: function(source = 'dxFeed') {
        console.log(`API-Connector wird mit Quelle ${source} initialisiert...`);
        this.dataSource = source;
        this.connected = false;
        this.errorCount = 0;
        this.lastUpdate = null;
        console.log('API-Connector erfolgreich initialisiert.');
    },
    
    /**
     * Ändere die Datenquelle
     * @param {string} newSource - Die neue Datenquelle
     */
    changeDataSource: function(newSource) {
        this.disconnect();
        console.log(`Datenquelle wird geändert von ${this.dataSource} zu ${newSource}`);
        this.dataSource = newSource;
        this.initialize(newSource);
    },
    
    /**
     * Verbinde mit der Datenquelle
     * @returns {boolean} Erfolg der Verbindung
     */
    connect: function() {
        if (this.connected) {
            console.log('Bereits verbunden, Verbindung wird zurückgesetzt.');
            this.disconnect();
        }
        
        console.log(`Verbinde mit Datenquelle: ${this.dataSource}`);
        
        // Verschiedene Datenquellen
        switch (this.dataSource) {
            case 'OANDA':
                this.connectToOANDA();
                break;
            case 'FXCM':
                this.connectToFXCM();
                break;
            case 'IG':
                this.connectToIG();
                break;
            case 'dxFeed':
                this.connectToDxFeed();
                break;
            case 'Simulierte Daten':
            default:
                this.connectToSimulation();
                break;
        }
        
        this.connected = true;
        this.lastUpdate = new Date();
        return true;
    },
    
    /**
     * Trenne von der Datenquelle
     */
    disconnect: function() {
        if (!this.connected) return;
        console.log(`Trenne von Datenquelle: ${this.dataSource}`);
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.connected = false;
    },
    
    /**
     * Hole Daten von der Datenquelle.
     * Diese Funktion wird regelmäßig aufgerufen, um Daten zu aktualisieren.
     */
    fetchData: function() {
        if (!this.connected && this.dataSource !== 'Simulierte Daten') {
            console.log('Nicht verbunden, keine Daten werden abgerufen.');
            return;
        }
        
        try {
            switch (this.dataSource) {
                case 'OANDA':
                    this.fetchFromOANDA();
                    break;
                case 'FXCM':
                    this.fetchFromFXCM();
                    break;
                case 'IG':
                    this.fetchFromIG();
                    break;
                case 'dxFeed':
                    this.fetchFromDxFeed();
                    break;
                case 'Simulierte Daten':
                default:
                    this.fetchFromSimulation();
                    break;
            }
            
            this.lastUpdate = new Date();
            this.errorCount = 0;
        } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error);
            this.errorCount++;
            if (this.errorCount >= 3) {
                console.log('Zu viele Fehler, Verbindung wird zurückgesetzt.');
                this.disconnect();
                setTimeout(() => this.connect(), 5000);
            }
        }
    },
    
    /**
     * Verbinde mit OANDA API (Platzhalter)
     */
    connectToOANDA: function() {
        console.log('Verbinde mit OANDA API...');
        this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
    },
    
    /**
     * Verbinde mit FXCM API (Platzhalter)
     */
    connectToFXCM: function() {
        console.log('Verbinde mit FXCM API...');
        this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
    },
    
    /**
     * Verbinde mit IG API (Platzhalter)
     */
    connectToIG: function() {
        console.log('Verbinde mit IG API...');
        this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
    },
    
    /**
     * Verbinde mit dxFeed API (Live Demo-Implementierung)
     */
    connectToDxFeed: function() {
        console.log('Verbinde mit dxFeed API (Live Demo)...');
        // Starte ein Intervall, um regelmäßig Daten abzurufen
        this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
    },
    
    /**
     * Verbinde mit Simulation für Demodaten (falls benötigt)
     */
    connectToSimulation: function() {
        console.log('Starte Simulation für Demodaten...');
        this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
    },
    
    /**
     * Hole Daten von OANDA API (Platzhalter)
     */
    fetchFromOANDA: function() {
        this.fetchFromSimulation();
    },
    
    /**
     * Hole Daten von FXCM API (Platzhalter)
     */
    fetchFromFXCM: function() {
        this.fetchFromSimulation();
    },
    
    /**
     * Hole Daten von IG API (Platzhalter)
     */
    fetchFromIG: function() {
        this.fetchFromSimulation();
    },
    
    /**
     * Hole Live Demo-Daten von dxFeed
     */
    fetchFromDxFeed: function() {
        console.log('Abrufen der dxFeed-Demo-Daten...');
        
        fetch('https://demo.dxfeed.com/webservice/orderbook?symbol=XAU/USD')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('dxFeed Daten empfangen:', data);
                
                // Verarbeite die dxFeed-Daten in das Format, das MarketData erwartet
                const processedData = this.processDxFeedData(data);
                
                // Aktualisiere MarketData
                this.updateMarketDataWithProcessedData(processedData);
                
                // Render DOM neu mit aktualisierten Daten
                if (window.DOMRenderer && typeof DOMRenderer.render === 'function') {
                    DOMRenderer.render();
                }
                
                // Speichere letzte Daten für Vergleich
                MarketData.lastData = data;
                this.lastUpdate = new Date();
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der dxFeed-Daten:', error);
                this.errorCount++;
                if (this.errorCount >= 3) {
                    console.log('Zu viele Fehler, Wechsel zu Simulationsdaten');
                    this.fetchFromSimulation();
                }
            });
    },
    
    /**
     * Verarbeite dxFeed-Daten in das Format, das MarketData erwartet
     * @param {Object} rawData - Rohdaten von dxFeed
     * @returns {Object} - Verarbeitete Daten
     */
    processDxFeedData: function(rawData) {
        // Erstelle ein Grundgerüst für die verarbeiteten Daten
        const processedData = {
            symbol: rawData.symbol || "XAU/USD",
            timestamp: new Date().getTime(),
            bids: [],
            asks: [],
            lastPrice: null,
            spread: null
        };
        
        // Verarbeite Bid-Orders
        if (rawData.bids && Array.isArray(rawData.bids)) {
            processedData.bids = rawData.bids.map(bid => ({
                price: parseFloat(bid.price),
                volume: parseFloat(bid.size),
                orderType: this.getRandomOrderType() // Füge zufälligen Ordertyp hinzu
            })).sort((a, b) => b.price - a.price); // Sortiere absteigend nach Preis
        }
        
        // Verarbeite Ask-Orders
        if (rawData.asks && Array.isArray(rawData.asks)) {
            processedData.asks = rawData.asks.map(ask => ({
                price: parseFloat(ask.price),
                volume: parseFloat(ask.size),
                orderType: this.getRandomOrderType() // Füge zufälligen Ordertyp hinzu
            })).sort((a, b) => a.price - b.price); // Sortiere aufsteigend nach Preis
        }
        
        // Berechne lastPrice und Spread
        if (processedData.asks.length > 0 && processedData.bids.length > 0) {
            const lowestAsk = processedData.asks[0].price;
            const highestBid = processedData.bids[0].price;
            
            // Verwende den Mittelwert als Preis
            processedData.lastPrice = (lowestAsk + highestBid) / 2;
            processedData.spread = lowestAsk - highestBid;
        } else if (window.MarketData && MarketData.lastPrice) {
            // Fallback: Behalte letzten Preis bei
            processedData.lastPrice = MarketData.lastPrice;
            processedData.spread = MarketData.spread || 0.3;
        } else {
            // Default-Werte, falls noch keine Daten vorhanden sind
            processedData.lastPrice = 1928.45;
            processedData.spread = 0.3;
        }
        
        return processedData;
    },
    
    /**
     * Aktualisiere MarketData mit den verarbeiteten Daten
     * @param {Object} data - Verarbeitete Daten
     */
    updateMarketDataWithProcessedData: function(data) {
        // Prüfe, ob MarketData verfügbar ist
        if (!window.MarketData) {
            console.error('MarketData ist nicht definiert!');
            return;
        }
        
        // Bestimme die Richtung der Preisänderung
        const oldPrice = MarketData.lastPrice || data.lastPrice;
        const priceChange = data.lastPrice > oldPrice ? 'up' : 
                           data.lastPrice < oldPrice ? 'down' : '';
        
        // Aktualisiere MarketData-Objekt
        MarketData.bids = data.bids;
        MarketData.asks = data.asks;
        MarketData.lastPrice = data.lastPrice;
        MarketData.lastPriceChange = priceChange;
        MarketData.spread = data.spread;
        
        // Berechne Spread, falls die Funktion existiert
        if (typeof MarketData.calculateSpread === 'function') {
            MarketData.calculateSpread();
        }
        
        // Aktualisiere die Preisanzeige im DOM, falls vorhanden
        const lastPriceElement = document.getElementById('last-price');
        if (lastPriceElement) {
            lastPriceElement.textContent = data.lastPrice.toFixed(2);
            lastPriceElement.className = 'price-display price-' + priceChange;
        }
    },
    
    /**
     * Hilfsfunktion: Generiere einen zufälligen Ordertyp für realistischere Daten
     * @returns {string} - Zufälliger Ordertyp
     */
    getRandomOrderType: function() {
        const orderTypes = ['limit', 'market', 'stop', 'iceberg'];
        const weights = [0.7, 0.15, 0.1, 0.05]; // Wahrscheinlichkeiten
        
        const random = Math.random();
        let cumWeight = 0;
        
        for (let i = 0; i < orderTypes.length; i++) {
            cumWeight += weights[i];
            if (random <= cumWeight) {
                return orderTypes[i];
            }
        }
        
        return 'limit'; // Fallback
    },
    
    /**
     * Hole Daten aus der Simulation (Fallback)
     */
    fetchFromSimulation: function() {
        const simulatedData = MarketData.simulateUpdate();
        updateDOMWithData(simulatedData);
        MarketData.lastData = simulatedData;
    },
    
    /**
     * Ändere das Update-Intervall
     * @param {number} newInterval - Neues Intervall in ms
     */
    setUpdateInterval: function(newInterval) {
        this.intervalTime = newInterval;
        if (this.connected && this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.fetchData(), this.intervalTime);
        }
    }
};

// Beispiel: DOM-Update-Funktion, die die empfangenen Daten in der Benutzeroberfläche darstellt
function updateDOMWithData(data) {
    console.log('DOM wird aktualisiert mit folgenden Daten:', data);
    
    // Falls der DOM-Renderer verfügbar ist, nutze ihn direkt
    if (window.DOMRenderer && typeof DOMRenderer.render === 'function') {
        // Prüfe, ob die Daten bereits verarbeitet wurden
        if (!data.bids || !data.asks) {
            // Daten müssen erst verarbeitet werden
            const processedData = APIConnector.processDxFeedData(data);
            APIConnector.updateMarketDataWithProcessedData(processedData);
        }
        
        // Rendere mit den aktualisierten Daten
        DOMRenderer.render();
    } else {
        console.warn('DOMRenderer nicht verfügbar. Bitte stelle sicher, dass alle Module geladen sind.');
    }
}