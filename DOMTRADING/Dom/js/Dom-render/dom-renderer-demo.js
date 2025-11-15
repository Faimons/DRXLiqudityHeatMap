/**
 * DOM-Renderer Demo-Modul
 * Verantwortlich für Demo-Funktionen und Daten-Simulation
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das Demo-Modul
DOMRenderer.Demo = {
    // Intervall-Timer für Simulationen
    priceSimInterval: null,
    liquiditySimInterval: null,

    /**
     * Demo-Funktion: Simuliere eine Preisänderung
     * Wird für die Demo-Anwendung verwendet
     */
    simulatePriceChange: function() {
        // Zufällige Preisänderung
        const change = (Math.random() - 0.5) * 0.5;
        const newPrice = MarketData.lastPrice + change;
        
        // Aktualisiere Preis
        DOMRenderer.updateCurrentPrice(newPrice);
    },

    /**
     * Demo-Funktion: Simuliere Liquiditätsveränderungen
     * Wird für die Demo-Anwendung verwendet
     */
    simulateLiquidityChanges: function() {
        // Simuliere Änderungen in Bids
        MarketData.bids.forEach(order => {
            // 30% Chance auf Volumenänderung
            if (Math.random() < 0.3) {
                const change = (Math.random() - 0.4) * 5; // Bevorzugt Volumenabnahme
                order.volume = Math.max(0.1, order.volume + change);
            }
            
            // 5% Chance auf neuen Order-Typ
            if (Math.random() < 0.05) {
                const types = ['market', 'limit', 'stop', 'iceberg'];
                order.orderType = types[Math.floor(Math.random() * types.length)];
            }
        });
        
        // Simuliere Änderungen in Asks
        MarketData.asks.forEach(order => {
            // 30% Chance auf Volumenänderung
            if (Math.random() < 0.3) {
                const change = (Math.random() - 0.4) * 5; // Bevorzugt Volumenabnahme
                order.volume = Math.max(0.1, order.volume + change);
            }
            
            // 5% Chance auf neuen Order-Typ
            if (Math.random() < 0.05) {
                const types = ['market', 'limit', 'stop', 'iceberg'];
                order.orderType = types[Math.floor(Math.random() * types.length)];
            }
        });
        
        // Rendere mit neuen Daten
        DOMRenderer.Rendering.render();
    },

    /**
     * Starte Demo-Simulation für Echtzeit-Updates
     */
    startDemoSimulation: function() {
        // Preisänderungen simulieren (1-3 Sekunden Intervall)
        this.priceSimInterval = setInterval(() => {
            this.simulatePriceChange();
        }, 1000 + Math.random() * 2000);
        
        // Liquiditätsänderungen simulieren (0.5-1.5 Sekunden Intervall)
        this.liquiditySimInterval = setInterval(() => {
            this.simulateLiquidityChanges();
        }, 500 + Math.random() * 1000);
        
        // Toast-Benachrichtigung anzeigen
        DOMRenderer.UI.showToast('Demo-Simulation gestartet', 'info');
        console.log('Demo-Simulation gestartet.');
    },

    /**
     * Stoppe Demo-Simulation
     */
    stopDemoSimulation: function() {
        clearInterval(this.priceSimInterval);
        clearInterval(this.liquiditySimInterval);
        
        // Toast-Benachrichtigung anzeigen
        DOMRenderer.UI.showToast('Demo-Simulation gestoppt', 'info');
        console.log('Demo-Simulation gestoppt.');
    },

    /**
     * Generiere zufällige Marktdaten für eine Demo
     * @param {number} bidCount - Anzahl der Bid-Orders
     * @param {number} askCount - Anzahl der Ask-Orders
     * @param {number} basePrice - Basispreis
     */
    generateRandomMarketData: function(bidCount = 50, askCount = 50, basePrice = 1928.00) {
        // Erstelle oder leere bestehende Arrays
        MarketData.bids = [];
        MarketData.asks = [];
        
        // Setze aktuellen Preis
        MarketData.lastPrice = basePrice;
        
        // Spread zwischen Bid und Ask (0.2 bis 0.5)
        const spread = 0.2 + Math.random() * 0.3;
        
        // Generiere Bid-Orders (unter dem aktuellen Preis)
        for (let i = 0; i < bidCount; i++) {
            const priceDiff = (i * 0.1) + (Math.random() * 0.05);
            const price = basePrice - spread - priceDiff;
            
            // Volumen zwischen 1 und 50
            const volume = 1 + Math.random() * 49;
            
            // Order-Typ
            const types = ['market', 'limit', 'stop', 'iceberg'];
            const orderType = types[Math.floor(Math.random() * types.length)];
            
            // Füge Order hinzu
            MarketData.bids.push({
                price: Math.round(price * 100) / 100,
                volume: Math.round(volume * 10) / 10,
                orderType: orderType
            });
        }
        
        // Sortiere Bids (absteigend nach Preis)
        MarketData.bids.sort((a, b) => b.price - a.price);
        
        // Generiere Ask-Orders (über dem aktuellen Preis)
        for (let i = 0; i < askCount; i++) {
            const priceDiff = (i * 0.1) + (Math.random() * 0.05);
            const price = basePrice + spread + priceDiff;
            
            // Volumen zwischen 1 und 50
            const volume = 1 + Math.random() * 49;
            
            // Order-Typ
            const types = ['market', 'limit', 'stop', 'iceberg'];
            const orderType = types[Math.floor(Math.random() * types.length)];
            
            // Füge Order hinzu
            MarketData.asks.push({
                price: Math.round(price * 100) / 100,
                volume: Math.round(volume * 10) / 10,
                orderType: orderType
            });
        }
        
        // Sortiere Asks (aufsteigend nach Preis)
        MarketData.asks.sort((a, b) => a.price - b.price);
        
        // Berechne Spread
        MarketData.calculateSpread();
        
        // Rendere mit neuen Daten
        DOMRenderer.Rendering.render();
        
        // Toast-Benachrichtigung anzeigen
        DOMRenderer.UI.showToast(`${bidCount + askCount} zufällige Orders erstellt`, 'success');
    },

    /**
     * Generiere ein Szenario mit simulierten Marktdaten
     * @param {string} scenarioType - Art des Szenarios ('bullish', 'bearish', 'volatile', 'quiet')
     */
    generateScenario: function(scenarioType) {
        const basePrice = 1928.00;
        
        switch (scenarioType) {
            case 'bullish':
                // Bullisches Szenario: Starker Kaufdruck
                this.generateRandomMarketData(80, 40, basePrice);
                
                // Erhöhe Bid-Volumina
                MarketData.bids.forEach(order => {
                    order.volume *= 1.5 + Math.random();
                });
                
                // Füge große Kaufaufträge hinzu
                for (let i = 0; i < 3; i++) {
                    const bigOrder = {
                        price: basePrice - (i * 0.5) - Math.random(),
                        volume: 80 + Math.random() * 120,
                        orderType: 'limit'
                    };
                    MarketData.bids.push(bigOrder);
                }
                
                // Sortiere Bids neu
                MarketData.bids.sort((a, b) => b.price - a.price);
                
                DOMRenderer.UI.showToast('Bullisches Marktszenario generiert', 'success');
                break;
                
            case 'bearish':
                // Bärisches Szenario: Starker Verkaufsdruck
                this.generateRandomMarketData(40, 80, basePrice);
                
                // Erhöhe Ask-Volumina
                MarketData.asks.forEach(order => {
                    order.volume *= 1.5 + Math.random();
                });
                
                // Füge große Verkaufsaufträge hinzu
                for (let i = 0; i < 3; i++) {
                    const bigOrder = {
                        price: basePrice + (i * 0.5) + Math.random(),
                        volume: 80 + Math.random() * 120,
                        orderType: 'limit'
                    };
                    MarketData.asks.push(bigOrder);
                }
                
                // Sortiere Asks neu
                MarketData.asks.sort((a, b) => a.price - b.price);
                
                DOMRenderer.UI.showToast('Bärisches Marktszenario generiert', 'success');
                break;
                
            case 'volatile':
                // Volatiles Szenario: Große Volumina auf beiden Seiten
                this.generateRandomMarketData(60, 60, basePrice);
                
                // Erhöhe alle Volumina
                MarketData.bids.forEach(order => {
                    order.volume *= 2 + Math.random() * 2;
                });
                
                MarketData.asks.forEach(order => {
                    order.volume *= 2 + Math.random() * 2;
                });
                
                // Füge große Orders auf beiden Seiten hinzu
                for (let i = 0; i < 5; i++) {
                    const bidOrder = {
                        price: basePrice - (Math.random() * 5),
                        volume: 100 + Math.random() * 200,
                        orderType: Math.random() > 0.7 ? 'market' : 'limit'
                    };
                    
                    const askOrder = {
                        price: basePrice + (Math.random() * 5),
                        volume: 100 + Math.random() * 200,
                        orderType: Math.random() > 0.7 ? 'market' : 'limit'
                    };
                    
                    MarketData.bids.push(bidOrder);
                    MarketData.asks.push(askOrder);
                }
                
                // Sortiere neu
                MarketData.bids.sort((a, b) => b.price - a.price);
                MarketData.asks.sort((a, b) => a.price - b.price);
                
                DOMRenderer.UI.showToast('Volatiles Marktszenario generiert', 'success');
                break;
                
            case 'quiet':
                // Ruhiges Szenario: Wenig Volumen, ausgeglichen
                this.generateRandomMarketData(25, 25, basePrice);
                
                // Reduziere alle Volumina
                MarketData.bids.forEach(order => {
                    order.volume /= 2;
                });
                
                MarketData.asks.forEach(order => {
                    order.volume /= 2;
                });
                
                DOMRenderer.UI.showToast('Ruhiges Marktszenario generiert', 'success');
                break;
                
            default:
                // Standard-Szenario
                this.generateRandomMarketData(50, 50, basePrice);
                DOMRenderer.UI.showToast('Standard-Marktszenario generiert', 'info');
        }
        
        // Berechne Spread neu
        MarketData.calculateSpread();
        
        // Rendere mit neuen Daten
        DOMRenderer.Rendering.render();
    }
};