/**
 * DOM-Renderer Rendering-Modul
 * Verantwortlich für das Rendern des DOM und der visuellen Elemente
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das Rendering-Modul
DOMRenderer.Rendering = {
    // Aktuelle Preiszeile
    currentPriceRow: null,

    /**
     * Rendere den kompletten DOM basierend auf den aktuellen Marktdaten
     */
    render: function() {
        const container = DOMRenderer.container;
        if (!container) return;
        
        // Generiere Preisstufen basierend auf Konfiguration
        const priceLevels = DOMRenderer.Data.generatePriceLevels();
        
        // Finde max Volume für Skalierung der Balken
        // Setze absolute Obergrenze für Volumen (max 10.000 Lots)
        let maxBidVolume = Math.max(...MarketData.bids.map(order => order.volume));
        let maxAskVolume = Math.max(...MarketData.asks.map(order => order.volume));
        
        // Skalierungsfaktor für große Volumina einbauen (max 10.000 Lots)
        const maxVolumeCap = 10000;
        maxBidVolume = Math.min(maxBidVolume, maxVolumeCap);
        maxAskVolume = Math.min(maxAskVolume, maxVolumeCap);
        
        // Erstelle die DOM-Zeilen direkt im Container
        const combinedRows = [];
        
        // Alle Preisstufen durchgehen und entsprechende Zeilen erstellen
        priceLevels.forEach(price => {
            // Finde passende Orders
            const askOrder = DOMRenderer.Data.findOrderByPrice(price, 'ask');
            const bidOrder = DOMRenderer.Data.findOrderByPrice(price, 'bid');
            
            // Bestimme Zeilentyp basierend auf Position zum aktuellen Preis
            const isAboveCurrentPrice = price > MarketData.lastPrice;
            const isCurrentPrice = Math.abs(price - MarketData.lastPrice) < 0.001;
            
            // Füge Zeile zum kombinierten Array hinzu
            combinedRows.push({
                price: price,
                askOrder: askOrder,
                bidOrder: bidOrder,
                isAboveCurrentPrice: isAboveCurrentPrice,
                isCurrentPrice: isCurrentPrice
            });
        });
        
        // Sortiere nach Preis (absteigend)
        combinedRows.sort((a, b) => b.price - a.price);
        
        // WICHTIG: DOM-Container leeren
        container.innerHTML = '';
        
        // Rendere alle Zeilen
        let html = '';
        combinedRows.forEach((row, index) => {
            // Prüfe auf Spread-Position
            const prevRow = index > 0 ? combinedRows[index - 1] : null;
            const isSpreadAbove = prevRow && prevRow.isAboveCurrentPrice !== row.isAboveCurrentPrice && row.isAboveCurrentPrice === false;
            
            // Füge Spread ein, wenn nötig
            if (isSpreadAbove) {
                html += this.renderSpreadRow();
            }
            
            // Rendere die Order-Zeile
            if (row.isCurrentPrice) {
                // Aktuelle Preiszeile
                html += this.renderCurrentPriceRow(row.price, row.bidOrder, row.askOrder, maxBidVolume, maxAskVolume);
            } else if (row.isAboveCurrentPrice) {
                // Ask-Zeile
                html += this.renderDOMRow(row.price, row.askOrder, null, maxAskVolume, maxBidVolume, 'ask');
            } else {
                // Bid-Zeile
                html += this.renderDOMRow(row.price, null, row.bidOrder, maxAskVolume, maxBidVolume, 'bid');
            }
        });
        
        // Füge alle Zeilen auf einmal hinzu für bessere Performance
        container.innerHTML = html;
        
        // Zusätzliche Rendering-Funktionen
        DOMRenderer.Visualization.renderFlowVisualizations(maxBidVolume, maxAskVolume);
        DOMRenderer.Visualization.renderPriceLevels();
        DOMRenderer.Visualization.renderVolumeProfile(maxBidVolume, maxAskVolume);
        DOMRenderer.Visualization.visualizeLiquidityFlow(maxBidVolume, maxAskVolume);
        
        // Finde und markiere die aktuelle Preiszeile
        this.highlightCurrentPrice();
        
        // Scrolle zur aktuellen Preiszeile
        this.scrollToCurrentPrice();
    },

    /**
     * Rendere eine DOM-Zeile mit einer Preisstufe
     * @param {number} price - Preis
     * @param {Object} askOrder - Ask-Order-Objekt (optional)
     * @param {Object} bidOrder - Bid-Order-Objekt (optional)
     * @param {number} maxAskVolume - Maximales Ask-Volumen
     * @param {number} maxBidVolume - Maximales Bid-Volumen
     * @param {string} type - 'bid' oder 'ask'
     * @returns {string} HTML für die DOM-Zeile
     */
    renderDOMRow: function(price, askOrder, bidOrder, maxAskVolume, maxBidVolume, type) {
        // Bestimme Zeilenklasse
        const rowClass = type === 'ask' ? 'ask-row' : 'bid-row';
        
        // Ask-Zelle
        let askHTML = '';
        if (askOrder) {
            const volumeBarWidth = (askOrder.volume / maxAskVolume * 100).toFixed(0);
            const orderTypeMarker = this.getOrderTypeMarker(askOrder.orderType);
            
            // Preisänderungsanimation
            let priceChangeClass = '';
            const changeDirection = DOMRenderer.Data.updatePriceHistory(price, askOrder.volume);
            if (changeDirection === 'up') {
                priceChangeClass = 'price-up-anim';
            } else if (changeDirection === 'down') {
                priceChangeClass = 'price-down-anim';
            }
            
            // Generiere HTML
            askHTML = `
                <div class="dom-cell dom-ask ${priceChangeClass}">
                    ${orderTypeMarker}
                    <span class="dom-volume">${askOrder.volume.toFixed(1)}</span>
                    <div class="volume-bar ask-volume-bar" style="width: ${volumeBarWidth}%;"></div>
                </div>
            `;
        } else {
            askHTML = '<div class="dom-cell dom-ask"></div>';
        }
        
        // Bid-Zelle
        let bidHTML = '';
        if (bidOrder) {
            const volumeBarWidth = (bidOrder.volume / maxBidVolume * 100).toFixed(0);
            const orderTypeMarker = this.getOrderTypeMarker(bidOrder.orderType);
            
            // Preisänderungsanimation
            let priceChangeClass = '';
            const changeDirection = DOMRenderer.Data.updatePriceHistory(price, bidOrder.volume);
            if (changeDirection === 'up') {
                priceChangeClass = 'price-up-anim';
            } else if (changeDirection === 'down') {
                priceChangeClass = 'price-down-anim';
            }
            
            // Generiere HTML
            bidHTML = `
                <div class="dom-cell dom-bid ${priceChangeClass}">
                    ${orderTypeMarker}
                    <span class="dom-volume">${bidOrder.volume.toFixed(1)}</span>
                    <div class="volume-bar bid-volume-bar" style="width: ${volumeBarWidth}%;"></div>
                </div>
            `;
        } else {
            bidHTML = '<div class="dom-cell dom-bid"></div>';
        }
        
        // Preis-Zelle
        const priceClass = type === 'ask' ? 'ask-price' : 'bid-price';
        
        // Tooltip hinzufügen, wenn aktiviert
        const tooltipHTML = DOMRenderer.CONFIG.dom.showTooltips ? `
            <div class="tooltip">
                Preis: ${price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                ${askOrder ? ` | Ask: ${askOrder.volume.toFixed(1)} Lots` : ''}
                ${bidOrder ? ` | Bid: ${bidOrder.volume.toFixed(1)} Lots` : ''}
            </div>
        ` : '';
        
        return `
            <div class="dom-row ${rowClass}" data-price="${price}">
                ${askHTML}
                <div class="dom-cell dom-price ${priceClass}">
                    ${price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
                ${bidHTML}
                ${tooltipHTML}
            </div>
        `;
    },

    /**
     * Rendere die aktuelle Preiszeile
     * @param {number} price - Aktueller Preis
     * @param {Object} bidOrder - Bid-Order-Objekt (optional)
     * @param {Object} askOrder - Ask-Order-Objekt (optional)
     * @param {number} maxBidVolume - Maximales Bid-Volumen
     * @param {number} maxAskVolume - Maximales Ask-Volumen
     * @returns {string} HTML für die aktuelle Preiszeile
     */
    renderCurrentPriceRow: function(price, bidOrder, askOrder, maxBidVolume, maxAskVolume) {
        // Ask-Zelle
        let askHTML = '';
        if (askOrder) {
            const volumeBarWidth = (askOrder.volume / maxAskVolume * 100).toFixed(0);
            const orderTypeMarker = this.getOrderTypeMarker(askOrder.orderType);
            
            askHTML = `
                <div class="dom-cell dom-ask">
                    ${orderTypeMarker}
                    <span class="dom-volume">${askOrder.volume.toFixed(1)}</span>
                    <div class="volume-bar ask-volume-bar" style="width: ${volumeBarWidth}%;"></div>
                </div>
            `;
        } else {
            askHTML = '<div class="dom-cell dom-ask"></div>';
        }
        
        // Bid-Zelle
        let bidHTML = '';
        if (bidOrder) {
            const volumeBarWidth = (bidOrder.volume / maxBidVolume * 100).toFixed(0);
            const orderTypeMarker = this.getOrderTypeMarker(bidOrder.orderType);
            
            bidHTML = `
                <div class="dom-cell dom-bid">
                    ${orderTypeMarker}
                    <span class="dom-volume">${bidOrder.volume.toFixed(1)}</span>
                    <div class="volume-bar bid-volume-bar" style="width: ${volumeBarWidth}%;"></div>
                </div>
            `;
        } else {
            bidHTML = '<div class="dom-cell dom-bid"></div>';
        }
        
        // Einfügen eines goldenen Punkts zur Hervorhebung
        const goldDot = '<span class="current-price-marker">•</span>';
        
        // Tooltip hinzufügen, wenn aktiviert
        const tooltipHTML = DOMRenderer.CONFIG.dom.showTooltips ? `
            <div class="tooltip">
                <strong>Aktueller Preis:</strong> ${price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                ${askOrder ? ` | Ask: ${askOrder.volume.toFixed(1)} Lots` : ''}
                ${bidOrder ? ` | Bid: ${bidOrder.volume.toFixed(1)} Lots` : ''}
            </div>
        ` : '';
        
        return `
            <div class="dom-row current-price-row" data-price="${price}">
                ${askHTML}
                <div class="dom-cell dom-price">
                    ${goldDot} ${price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${goldDot}
                </div>
                ${bidHTML}
                ${tooltipHTML}
            </div>
        `;
    },

    /**
     * Rendere eine Spread-Zeile
     * @returns {string} HTML für die Spread-Zeile
     */
    renderSpreadRow: function() {
        // Berechne Spread in Pips und USD
        const spreadPips = MarketData.spread.toFixed(1);
        const spreadUSD = (MarketData.spread * 100).toFixed(2);
        
        return `
            <div class="spread-container">
                <div class="spread-area">
                    <div class="spread-text">SPREAD: ${spreadPips} Pips (${spreadUSD})</div>
                    <div class="spread-arrows">
                        <div class="spread-arrow left">▼</div>
                        <div class="spread-arrow right">▼</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Liefert den Order-Typ-Marker basierend auf dem Order-Typ
     * @param {string} orderType - Order-Typ ('market', 'limit', 'stop', etc.)
     * @returns {string} HTML für den Order-Typ-Marker
     */
    getOrderTypeMarker: function(orderType) {
        if (!DOMRenderer.CONFIG.orderTypes.showMarkers) return '';
        
        switch (orderType) {
            case 'market':
                return '<span class="order-type-marker market-order">M</span>';
            case 'limit':
                return '<span class="order-type-marker limit-order">L</span>';
            case 'stop':
                return '<span class="order-type-marker stop-order">S</span>';
            case 'iceberg':
                return '<span class="order-type-marker iceberg-order">I</span>';
            default:
                return '';
        }
    },

    /**
     * Liefert den Order-Typ-Text basierend auf dem Order-Typ
     * @param {string} orderType - Order-Typ ('market', 'limit', 'stop', etc.)
     * @returns {string} Lesbarer Text für den Order-Typ
     */
    getOrderTypeText: function(orderType) {
        switch (orderType) {
            case 'market':
                return 'Market Order';
            case 'limit':
                return 'Limit Order';
            case 'stop':
                return 'Stop Order';
            case 'iceberg':
                return 'Iceberg Order';
            default:
                return 'Unbekannte Order';
        }
    },

    /**
     * Markiere die aktuelle Preiszeile und visualisiere Marktneigung
     */
    highlightCurrentPrice: function() {
        if (!DOMRenderer.CONFIG.dom.highlightCurrentPrice) return;
        
        const container = DOMRenderer.container;
        const currentPrice = MarketData.lastPrice;
        
        // Finde die nächste Zeile zum aktuellen Preis
        const rows = container.querySelectorAll('.dom-row');
        let closestRow = null;
        let minDiff = Number.MAX_VALUE;
        
        rows.forEach(row => {
            const price = parseFloat(row.getAttribute('data-price'));
            if (price && !isNaN(price)) {
                const diff = Math.abs(price - currentPrice);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestRow = row;
                }
            }
        });
        
        // Entferne bestehende Preisklassen von allen Zeilen
        rows.forEach(row => {
            row.classList.remove('current-price-row', 'near-price-row', 'strike-price-above', 'strike-price-below');
        });
        
        // Wenn eine passende Zeile gefunden wurde
        if (closestRow) {
            // Füge die Klasse zur aktuellen Preiszeile hinzu
            closestRow.classList.add('current-price-row');
            
            // Speichere die aktuelle Preiszeile
            this.currentPriceRow = closestRow;
            
            // Berechne Marktneigung (Aufwärts- oder Abwärtsüberhang)
            const bidVolume = DOMRenderer.Data.getTotalBidVolume();
            const askVolume = DOMRenderer.Data.getTotalAskVolume();
            
            // Visualisiere Marktneigung
            if (bidVolume > askVolume * 1.2) {
                // Bid-Überhang (Aufwärtsdruck)
                closestRow.classList.add('strike-price-above');
                container.classList.add('market-bullish');
                container.classList.remove('market-bearish', 'market-neutral');
            } else if (askVolume > bidVolume * 1.2) {
                // Ask-Überhang (Abwärtsdruck)
                closestRow.classList.add('strike-price-below');
                container.classList.add('market-bearish');
                container.classList.remove('market-bullish', 'market-neutral');
            } else {
                // Ausgeglichen
                container.classList.add('market-neutral');
                container.classList.remove('market-bullish', 'market-bearish');
            }
            
            // Markiere auch naheliegende Zeilen für bessere visuelle Hervorhebung
            const rowPrice = parseFloat(closestRow.getAttribute('data-price'));
            rows.forEach(row => {
                const price = parseFloat(row.getAttribute('data-price'));
                if (price && !isNaN(price)) {
                    const priceDiff = Math.abs(price - rowPrice);
                    if (priceDiff <= DOMRenderer.priceRange.tickSize * 2 && row !== closestRow) {
                        row.classList.add('near-price-row');
                    }
                }
            });
        }
    },

    /**
     * Scrolle zur aktuellen Preiszeile
     */
    scrollToCurrentPrice: function() {
        const container = DOMRenderer.container;
        
        // Finde die aktuelle Preiszeile
        const currentRow = container.querySelector('.current-price-row');
        if (currentRow) {
            // Berechne Position zum Scrollen (mittig im Viewport)
            const containerHeight = container.clientHeight;
            const rowPosition = currentRow.offsetTop;
            const rowHeight = currentRow.offsetHeight;
            
            // Setze Scroll-Position
            container.scrollTop = rowPosition - (containerHeight / 2) + (rowHeight / 2);
        }
    },

    /**
     * Rendere eine leere Zeile für eine Preisstufe
     * @param {number} price - Preis
     * @param {string} type - 'bid' oder 'ask'
     * @returns {string} HTML für die leere Zeile
     */
    renderEmptyRow: function(price, type) {
        const rowClass = type === 'ask' ? 'ask-row' : 'bid-row';
        const priceClass = type === 'ask' ? 'ask-price' : 'bid-price';
        
        return `
            <div class="dom-row ${rowClass}" data-price="${price}">
                <div class="total-cell"></div>
                <div class="volume-cell"></div>
                <div class="price-cell ${priceClass}">${price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                <div class="volume-cell"></div>
                <div class="total-cell"></div>
            </div>
        `;
    }
};