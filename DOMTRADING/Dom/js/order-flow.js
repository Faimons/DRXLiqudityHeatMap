/**
 * OrderFlowAnalyzer
 * Analysiert den Orderflow und erkennt Muster im DOM
 */

const OrderFlowAnalyzer = {
    // Konfiguration
    config: {
        // Schwellenwerte für Mustererkennung
        thresholds: {
            volumeChange: 5,           // Signifikante Volumenänderung
            bigPlayerThreshold: 25,    // Schwellenwert für "Big Player"
            icebergThreshold: 5,       // Minimale Volumenänderung für Eisberg-Erkennung
            volumeClusterThreshold: 50 // Minimales Gesamtvolumen für einen Volumencluster
        },
        
        // Einstellungen für die Analyse
        settings: {
            enableIcebergDetection: true,      // Erkennung von Eisberg-Orders
            enableVolumeClusterDetection: true, // Erkennung von Volumenclustern
            enableBigPlayerDetection: true,     // Erkennung von großen Spielern
            enableMarketTrendAnalysis: true     // Analyse von Markttrends
        }
    },
    
    // Speicher für zuletzt gesehene Daten
    memory: {
        lastBidTotals: {},    // Letzte kumulative Summen für Bids
        lastAskTotals: {},    // Letzte kumulative Summen für Asks
        volumeProfileHistory: [], // Historischer Volumenverlauf
        priceHistory: [],     // Historischer Preisverlauf
        detectedPatterns: []  // Erkannte Muster
    },
    
    /**
     * Initialisiere den OrderFlowAnalyzer
     */
    initialize: function() {
        console.log('OrderFlowAnalyzer wird initialisiert...');
        
        // Leere historischen Speicher
        this.memory.lastBidTotals = {};
        this.memory.lastAskTotals = {};
        this.memory.volumeProfileHistory = [];
        this.memory.priceHistory = [];
        this.memory.detectedPatterns = [];
        
        console.log('OrderFlowAnalyzer erfolgreich initialisiert.');
        
        return true;
    },
    
    /**
     * Analysiere aktuelle Marktdaten im Vergleich zu vorherigen Daten
     * @param {Object} currentData - Aktuelle Marktdaten
     * @param {Object} previousData - Vorherige Marktdaten
     * @returns {Object} Analyseergebnisse
     */
    analyze: function(currentData, previousData) {
        if (!previousData) {
            return { changes: null, detections: [] };
        }
        
        // Speichere Preis im Verlauf
        this.memory.priceHistory.push({
            price: currentData.lastPrice,
            time: new Date()
        });
        
        // Beschränke Historie auf 1000 Einträge
        if (this.memory.priceHistory.length > 1000) {
            this.memory.priceHistory.shift();
        }
        
        // Analysiere Volumenveränderungen
        const volumeChanges = this.analyzeVolumeChanges(currentData, previousData);
        
        // Erkenne Muster im Orderbuch
        const detections = [];
        
        // Erkenne Eisberg-Orders
        if (this.config.settings.enableIcebergDetection) {
            const icebergs = this.detectIcebergOrders(currentData, previousData);
            detections.push(...icebergs);
        }
        
        // Erkenne Volumencluster
        if (this.config.settings.enableVolumeClusterDetection) {
            const clusters = this.detectVolumeClusters(currentData);
            detections.push(...clusters);
        }
        
        // Erkenne Markttrend
        if (this.config.settings.enableMarketTrendAnalysis) {
            const trend = this.analyzeMarketTrend(currentData);
            if (trend) {
                detections.push(trend);
            }
        }
        
        // Speichere erkannte Muster
        this.memory.detectedPatterns = detections;
        
        // Rückgabe der Analyseergebnisse
        return {
            changes: volumeChanges,
            detections: detections
        };
    },
    
    /**
     * Analysiere Volumenveränderungen zwischen aktuellen und vorherigen Daten
     * @param {Object} currentData - Aktuelle Marktdaten
     * @param {Object} previousData - Vorherige Marktdaten
     * @returns {Object} Änderungen im Volumen
     */
    analyzeVolumeChanges: function(currentData, previousData) {
        const changes = {
            bid: [],
            ask: [],
            bigChanges: []
        };
        
        // Analysiere Bid-Änderungen
        currentData.bids.forEach(currentOrder => {
            const prevOrder = previousData.bids.find(order => 
                Math.abs(order.price - currentOrder.price) < 0.001);
            
            if (prevOrder) {
                const volumeDiff = currentOrder.volume - prevOrder.volume;
                
                // Wenn signifikante Änderung
                if (Math.abs(volumeDiff) >= this.config.thresholds.volumeChange) {
                    changes.bid.push({
                        price: currentOrder.price,
                        prevVolume: prevOrder.volume,
                        newVolume: currentOrder.volume,
                        volumeDiff: volumeDiff
                    });
                    
                    // Wenn sehr große Änderung
                    if (Math.abs(volumeDiff) >= this.config.thresholds.volumeChange * 2) {
                        changes.bigChanges.push({
                            side: 'bid',
                            price: currentOrder.price,
                            volumeDiff: volumeDiff
                        });
                    }
                }
            }
        });
        
        // Analysiere Ask-Änderungen
        currentData.asks.forEach(currentOrder => {
            const prevOrder = previousData.asks.find(order => 
                Math.abs(order.price - currentOrder.price) < 0.001);
            
            if (prevOrder) {
                const volumeDiff = currentOrder.volume - prevOrder.volume;
                
                // Wenn signifikante Änderung
                if (Math.abs(volumeDiff) >= this.config.thresholds.volumeChange) {
                    changes.ask.push({
                        price: currentOrder.price,
                        prevVolume: prevOrder.volume,
                        newVolume: currentOrder.volume,
                        volumeDiff: volumeDiff
                    });
                    
                    // Wenn sehr große Änderung
                    if (Math.abs(volumeDiff) >= this.config.thresholds.volumeChange * 2) {
                        changes.bigChanges.push({
                            side: 'ask',
                            price: currentOrder.price,
                            volumeDiff: volumeDiff
                        });
                    }
                }
            }
        });
        
        return changes;
    },
    
    /**
     * Erkenne Eisberg-Orders (große Orders, die in kleine Teile aufgeteilt sind)
     * @param {Object} currentData - Aktuelle Marktdaten
     * @param {Object} previousData - Vorherige Marktdaten
     * @returns {Array} Erkannte Eisberg-Orders
     */
    detectIcebergOrders: function(currentData, previousData) {
        const icebergs = [];
        
        // Für Eisbergerkennung benötigen wir häufige kleine Volumenaktualisierungen am selben Preis
        const suspiciousPrices = {};
        
        // Prüfe Bids
        currentData.bids.forEach(currentOrder => {
            const prevOrder = previousData.bids.find(order => 
                Math.abs(order.price - currentOrder.price) < 0.001);
            
            if (prevOrder && currentOrder.volume > prevOrder.volume) {
                const volumeDiff = currentOrder.volume - prevOrder.volume;
                
                // Wenn die Volumenänderung über dem Schwellenwert liegt
                if (volumeDiff >= this.config.thresholds.icebergThreshold) {
                    if (!suspiciousPrices[currentOrder.price]) {
                        suspiciousPrices[currentOrder.price] = {
                            side: 'bid',
                            price: currentOrder.price,
                            increaseCount: 0,
                            totalVolume: 0
                        };
                    }
                    
                    suspiciousPrices[currentOrder.price].increaseCount++;
                    suspiciousPrices[currentOrder.price].totalVolume += volumeDiff;
                }
            }
        });
        
        // Prüfe Asks
        currentData.asks.forEach(currentOrder => {
            const prevOrder = previousData.asks.find(order => 
                Math.abs(order.price - currentOrder.price) < 0.001);
            
            if (prevOrder && currentOrder.volume > prevOrder.volume) {
                const volumeDiff = currentOrder.volume - prevOrder.volume;
                
                // Wenn die Volumenänderung über dem Schwellenwert liegt
                if (volumeDiff >= this.config.thresholds.icebergThreshold) {
                    if (!suspiciousPrices[currentOrder.price]) {
                        suspiciousPrices[currentOrder.price] = {
                            side: 'ask',
                            price: currentOrder.price,
                            increaseCount: 0,
                            totalVolume: 0
                        };
                    }
                    
                    suspiciousPrices[currentOrder.price].increaseCount++;
                    suspiciousPrices[currentOrder.price].totalVolume += volumeDiff;
                }
            }
        });
        
        // Filtere potentielle Eisberg-Orders
        Object.values(suspiciousPrices).forEach(priceData => {
            if (priceData.increaseCount >= 2 && priceData.totalVolume >= this.config.thresholds.bigPlayerThreshold) {
                icebergs.push({
                    type: 'iceberg',
                    side: priceData.side,
                    price: priceData.price,
                    volume: priceData.totalVolume
                });
            }
        });
        
        return icebergs;
    },
    
    /**
     * Erkenne Volumencluster (hohe Liquiditätskonzentration)
     * @param {Object} currentData - Aktuelle Marktdaten
     * @returns {Array} Erkannte Volumencluster
     */
    detectVolumeClusters: function(currentData) {
        const clusters = [];
        
        // Finde Bereiche mit hohem Volumen in Bids
        let bidPrices = [];
        let bidVolume = 0;
        let inBidCluster = false;
        
        for (let i = 0; i < currentData.bids.length; i++) {
            const order = currentData.bids[i];
            
            if (order.volume >= this.config.thresholds.bigPlayerThreshold / 2) {
                if (!inBidCluster) {
                    inBidCluster = true;
                    bidPrices = [order.price];
                    bidVolume = order.volume;
                } else {
                    bidPrices.push(order.price);
                    bidVolume += order.volume;
                }
            } else if (inBidCluster) {
                // Ende des Clusters
                if (bidVolume >= this.config.thresholds.volumeClusterThreshold) {
                    clusters.push({
                        type: 'volumeCluster',
                        side: 'bid',
                        prices: bidPrices,
                        volume: bidVolume
                    });
                }
                
                inBidCluster = false;
            }
        }
        
        // Prüfe letzten Bid-Cluster
        if (inBidCluster && bidVolume >= this.config.thresholds.volumeClusterThreshold) {
            clusters.push({
                type: 'volumeCluster',
                side: 'bid',
                prices: bidPrices,
                volume: bidVolume
            });
        }
        
        // Finde Bereiche mit hohem Volumen in Asks
        let askPrices = [];
        let askVolume = 0;
        let inAskCluster = false;
        
        for (let i = 0; i < currentData.asks.length; i++) {
            const order = currentData.asks[i];
            
            if (order.volume >= this.config.thresholds.bigPlayerThreshold / 2) {
                if (!inAskCluster) {
                    inAskCluster = true;
                    askPrices = [order.price];
                    askVolume = order.volume;
                } else {
                    askPrices.push(order.price);
                    askVolume += order.volume;
                }
            } else if (inAskCluster) {
                // Ende des Clusters
                if (askVolume >= this.config.thresholds.volumeClusterThreshold) {
                    clusters.push({
                        type: 'volumeCluster',
                        side: 'ask',
                        prices: askPrices,
                        volume: askVolume
                    });
                }
                
                inAskCluster = false;
            }
        }
        
        // Prüfe letzten Ask-Cluster
        if (inAskCluster && askVolume >= this.config.thresholds.volumeClusterThreshold) {
            clusters.push({
                type: 'volumeCluster',
                side: 'ask',
                prices: askPrices,
                volume: askVolume
            });
        }
        
        return clusters;
    },
    
    /**
     * Analysiere den Markttrend
     * @param {Object} currentData - Aktuelle Marktdaten
     * @returns {Object|null} Erkannter Markttrend
     */
    analyzeMarketTrend: function(currentData) {
        const totalBidVolume = currentData.totalBidVolume;
        const totalAskVolume = currentData.totalAskVolume;
        
        // Berechne Verhältnis
        const ratio = totalBidVolume / totalAskVolume;
        
        if (ratio > 1.5) {
            return {
                type: 'marketTrend',
                trend: 'bullish',
                ratio: ratio.toFixed(2),
                description: 'Starker Kaufdruck (bullish)'
            };
        } else if (ratio < 0.67) {
            return {
                type: 'marketTrend',
                trend: 'bearish',
                ratio: ratio.toFixed(2),
                description: 'Starker Verkaufsdruck (bearish)'
            };
        }
        
        return null;
    },
    
    /**
     * Hole die wichtigsten Liquiditätsniveaus
     * @param {number} count - Anzahl der zu liefernden Niveaus
     * @returns {Array} Liste der wichtigsten Liquiditätsniveaus
     */
    getTopLiquidityLevels: function(count = 3) {
        const levels = [];
        
        // Sammle alle Preise und Volumen aus Bids und Asks
        MarketData.bids.forEach(order => {
            levels.push({
                price: order.price,
                volume: order.volume,
                side: 'bid'
            });
        });
        
        MarketData.asks.forEach(order => {
            levels.push({
                price: order.price,
                volume: order.volume,
                side: 'ask'
            });
        });
        
        // Sortiere nach Volumen (absteigend)
        levels.sort((a, b) => b.volume - a.volume);
        
        // Gib die Top-N-Levels zurück
        return levels.slice(0, count);
    },
    
    /**
     * Erkenne wichtige Preisstufen im historischen Verlauf
     * @returns {Array} Liste der wichtigen Preisstufen
     */
    detectKeyLevels: function() {
        if (this.memory.priceHistory.length < 10) {
            return [];
        }
        
        // Vereinfachte Version: Finde lokale Extrema
        const keyLevels = [];
        const pricePoints = this.memory.priceHistory.map(p => p.price);
        
        // Mindestens 10 Datenpunkte für Analyse
        for (let i = 5; i < pricePoints.length - 5; i++) {
            const current = pricePoints[i];
            
            // Prüfe auf lokales Minimum
            let isMin = true;
            for (let j = i - 5; j <= i + 5; j++) {
                if (j !== i && pricePoints[j] < current) {
                    isMin = false;
                    break;
                }
            }
            
            // Prüfe auf lokales Maximum
            let isMax = true;
            for (let j = i - 5; j <= i + 5; j++) {
                if (j !== i && pricePoints[j] > current) {
                    isMax = false;
                    break;
                }
            }
            
            if (isMin) {
                keyLevels.push({
                    type: 'support',
                    price: current,
                    time: this.memory.priceHistory[i].time
                });
            } else if (isMax) {
                keyLevels.push({
                    type: 'resistance',
                    price: current,
                    time: this.memory.priceHistory[i].time
                });
            }
        }
        
        return keyLevels;
    },
    
    /**
     * Liefere aktuelle Marktübersicht
     * @returns {Object} Marktübersicht
     */
    getMarketOverview: function() {
        // Berechne Gesamtvolumen
        const totalBidVolume = MarketData.bids.reduce((sum, order) => sum + order.volume, 0);
        const totalAskVolume = MarketData.asks.reduce((sum, order) => sum + order.volume, 0);
        
        // Berechne Bid/Ask-Ratio
        const bidAskRatio = totalBidVolume / totalAskVolume;
        
        // Bestimme Marktneigung
        let marketBias = 'neutral';
        if (bidAskRatio > 1.2) {
            marketBias = 'bullish';
        } else if (bidAskRatio < 0.8) {
            marketBias = 'bearish';
        }
        
        // Erkenne wichtige Preisstufen
        const keyLevels = this.detectKeyLevels();
        
        return {
            totalBidVolume: totalBidVolume,
            totalAskVolume: totalAskVolume,
            bidAskRatio: bidAskRatio.toFixed(2),
            marketBias: marketBias,
            spread: MarketData.spread.toFixed(2),
            keyLevels: keyLevels,
            patterns: this.memory.detectedPatterns
        };
    }
};