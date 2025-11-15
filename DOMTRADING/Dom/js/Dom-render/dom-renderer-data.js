/**
 * DOM-Renderer Datenmodul
 * Verantwortlich für Datenverwaltung, Preisstufen und Marktdaten
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das Datenmodul
DOMRenderer.Data = {
    // Wichtige Preisniveaus
    priceLevels: {
        support: [],
        resistance: [],
        keyLevels: []
    },

    // Mini-Kerzen für den Hintergrund
    miniCandles: [],

    // Preishistorie für Animationen
    priceHistory: {},

    /**
     * Initialisiere Datenmodul
     */
    initialize: function() {
        // Initialisiere simulierte Mini-Kerzen
        this.generateMiniCandles();
        
        // Initialisiere wichtige Preisniveaus (für Demo)
        this.initializePriceLevels();
    },

    /**
     * Generiere simulierte Mini-Kerzen
     */
    generateMiniCandles: function() {
        this.miniCandles = [];
        const basePrice = 1928.00;
        let currentPrice = basePrice;
        
        // Generiere 100 Kerzen
        for (let i = 0; i < 100; i++) {
            const open = currentPrice;
            const close = open + (Math.random() - 0.5) * 2;
            const high = Math.max(open, close) + Math.random() * 0.5;
            const low = Math.min(open, close) - Math.random() * 0.5;
            
            this.miniCandles.push({
                open: open,
                high: high,
                low: low,
                close: close,
                bullish: close > open
            });
            
            currentPrice = close;
        }
    },

    /**
     * Initialisiere wichtige Preisniveaus für die Demo
     */
    initializePriceLevels: function() {
        const basePrice = 1928.00;
        
        // Support-Levels
        this.priceLevels.support = [
            basePrice - 2,
            basePrice - 5,
            basePrice - 8.5
        ];
        
        // Resistance-Levels
        this.priceLevels.resistance = [
            basePrice + 1.5,
            basePrice + 4,
            basePrice + 7
        ];
        
        // Key-Levels (wichtige Preisniveaus)
        this.priceLevels.keyLevels = [
            basePrice - 10,
            basePrice + 10
        ];
    },

    /**
     * Generiere Preisstufen basierend auf Konfiguration
     * @returns {Array} Liste der Preisstufen
     */
    generatePriceLevels: function() {
        const priceLevels = [];
        const currentPrice = MarketData.lastPrice;
        const { totalLevels, tickSize, centerOnPrice } = DOMRenderer.priceRange;
        
        // Berechne Start- und Endpreis
        let startPrice, endPrice;
        
        if (centerOnPrice) {
            // Zentriere auf aktuellen Preis
            const halfLevels = Math.floor(totalLevels / 2);
            startPrice = currentPrice - (halfLevels * tickSize);
            endPrice = currentPrice + (halfLevels * tickSize);
        } else {
            // Basiere auf verfügbaren Daten
            const lowestBid = Math.min(...MarketData.bids.map(order => order.price));
            const highestAsk = Math.max(...MarketData.asks.map(order => order.price));
            
            startPrice = lowestBid - (5 * tickSize); // 5 Stufen unter niedrigstem Bid
            endPrice = highestAsk + (5 * tickSize);  // 5 Stufen über höchstem Ask
            
            // Begrenze auf konfigurierte Anzahl
            const range = endPrice - startPrice;
            const actualTickSize = range / totalLevels;
            
            startPrice = currentPrice - (totalLevels / 2 * actualTickSize);
            endPrice = currentPrice + (totalLevels / 2 * actualTickSize);
        }
        
        // Runde auf nächste Tick-Größe
        startPrice = Math.floor(startPrice / tickSize) * tickSize;
        
        // Generiere Preisstufen
        for (let i = 0; i < totalLevels; i++) {
            const price = startPrice + (i * tickSize);
            priceLevels.push(parseFloat(price.toFixed(2)));
        }
        
        return priceLevels;
    },

    /**
     * Berechne Gesamtvolumen für Bids
     * @returns {number} Gesamtvolumen aller Bids
     */
    getTotalBidVolume: function() {
        return MarketData.bids.reduce((sum, order) => sum + order.volume, 0);
    },

    /**
     * Berechne Gesamtvolumen für Asks
     * @returns {number} Gesamtvolumen aller Asks
     */
    getTotalAskVolume: function() {
        return MarketData.asks.reduce((sum, order) => sum + order.volume, 0);
    },

    /**
     * Finde passende Order für einen bestimmten Preis
     * @param {number} price - Der zu suchende Preis
     * @param {string} type - 'bid' oder 'ask'
     * @returns {Object|null} Die gefundene Order oder null
     */
    findOrderByPrice: function(price, type) {
        const orders = type === 'bid' ? MarketData.bids : MarketData.asks;
        return orders.find(order => Math.abs(order.price - price) < 0.001) || null;
    },

    /**
     * Aktualisiere die Preishistorie für einen bestimmten Preis
     * @param {number} price - Der Preis
     * @param {number} volume - Das neue Volumen
     * @returns {string} Richtung der Änderung: 'up', 'down' oder ''
     */
    updatePriceHistory: function(price, volume) {
        let direction = '';
        if (this.priceHistory[price]) {
            if (volume > this.priceHistory[price]) {
                direction = 'up';
            } else if (volume < this.priceHistory[price]) {
                direction = 'down';
            }
        }
        
        this.priceHistory[price] = volume;
        return direction;
    }
};