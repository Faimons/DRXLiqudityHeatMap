/**
 * DOM-Renderer Visualization-Modul
 * Verantwortlich für Visualisierungen und grafische Darstellungen
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das Visualization-Modul
DOMRenderer.Visualization = {
    // Liquiditätsfluss-Visualisierung
    liquidityFlow: {
        active: false,
        lastBidVolume: 0,
        lastAskVolume: 0
    },

    /**
     * Rendere wichtige Preisniveaus
     */
    renderPriceLevels: function() {
        const container = DOMRenderer.container;
        if (!container) return;
        
        // Lösche vorhandene Markierungen
        const existingMarkers = container.querySelectorAll('.price-level-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Funktion zum Hinzufügen einer Markierung
        const addMarker = (price, type) => {
            const rows = container.querySelectorAll('.dom-row');
            for (const row of rows) {
                const rowPrice = parseFloat(row.getAttribute('data-price'));
                if (rowPrice && Math.abs(rowPrice - price) < 0.01) {
                    const marker = document.createElement('div');
                    marker.className = `price-level-marker ${type}`;
                    marker.title = `${type === 'support-level' ? 'Support' : type === 'resistance-level' ? 'Resistance' : 'Key Level'}: ${price.toFixed(2)}`;
                    row.style.position = 'relative';
                    row.appendChild(marker);
                    break;
                }
            }
        };
        
        // Füge Support-Level-Markierungen hinzu
        DOMRenderer.Data.priceLevels.support.forEach(price => {
            addMarker(price, 'support-level');
        });
        
        // Füge Resistance-Level-Markierungen hinzu
        DOMRenderer.Data.priceLevels.resistance.forEach(price => {
            addMarker(price, 'resistance-level');
        });
        
        // Füge Key-Level-Markierungen hinzu
        DOMRenderer.Data.priceLevels.keyLevels.forEach(price => {
            addMarker(price, 'key-level');
        });
    },

    /**
     * Rendere Flow-Visualisierungen
     * @param {number} maxBidVolume - Maximales Bid-Volumen
     * @param {number} maxAskVolume - Maximales Ask-Volumen
     */
    renderFlowVisualizations: function(maxBidVolume, maxAskVolume) {
        // Berechne Gesamtvolumen
        const totalBidVolume = DOMRenderer.Data.getTotalBidVolume();
        const totalAskVolume = DOMRenderer.Data.getTotalAskVolume();
        
        // Finde Flow-Container
        const bidFlowContent = document.getElementById('bid-flow-content');
        const askFlowContent = document.getElementById('ask-flow-content');
        
        if (!bidFlowContent || !askFlowContent) return;
        
        // Berechne Flow-Barren-Höhen (0-100%)
        const bidVolumePct = Math.min(100, (totalBidVolume / (totalBidVolume + totalAskVolume) * 200));
        const askVolumePct = Math.min(100, (totalAskVolume / (totalBidVolume + totalAskVolume) * 200));
        
        // Bestimme Marktdruck
        const bidPressure = bidVolumePct > 55 ? 'Kaufdruck' : '';
        const askPressure = askVolumePct > 55 ? 'Verkaufsdruck' : '';
        
        // Rendere Bid-Flow
        bidFlowContent.innerHTML = `
            <div class="flow-bar-container">
                <div class="flow-bar" style="height: ${bidVolumePct}%;"></div>
                ${bidVolumePct > 60 ? '<div class="flow-direction up"></div>' : ''}
            </div>
            <div class="flow-pressure bid-pressure">${bidPressure}</div>
        `;
        
        // Rendere Ask-Flow
        askFlowContent.innerHTML = `
            <div class="flow-bar-container">
                <div class="flow-bar" style="height: ${askVolumePct}%;"></div>
                ${askVolumePct > 60 ? '<div class="flow-direction down"></div>' : ''}
            </div>
            <div class="flow-pressure ask-pressure">${askPressure}</div>
        `;
        
        // Aktualisiere gespeicherte Volumina
        this.liquidityFlow.lastBidVolume = totalBidVolume;
        this.liquidityFlow.lastAskVolume = totalAskVolume;
    },

    /**
     * Visualisiere Liquiditätsfluss zwischen Bid und Ask
     * @param {number} maxBidVolume - Maximales Bid-Volumen
     * @param {number} maxAskVolume - Maximales Ask-Volumen
     */
    visualizeLiquidityFlow: function(maxBidVolume, maxAskVolume) {
        const container = DOMRenderer.container;
        
        // Berechne Gesamtvolumen
        const totalBidVolume = DOMRenderer.Data.getTotalBidVolume();
        const totalAskVolume = DOMRenderer.Data.getTotalAskVolume();
        
        // Prüfe auf signifikante Änderungen
        const bidChange = totalBidVolume - this.liquidityFlow.lastBidVolume;
        const askChange = totalAskVolume - this.liquidityFlow.lastAskVolume;
        
        // Wenn signifikante Änderung, visualisiere Fluss
        if (Math.abs(bidChange) > 5 || Math.abs(askChange) > 5) {
            // Entferne vorherige Fluss-Elemente
            const existingFlows = container.querySelectorAll('.liquidity-flow');
            existingFlows.forEach(flow => flow.remove());
            
            // Bestimme Flussrichtung
            if (bidChange > askChange) {
                // Mehr Liquidität auf Bid-Seite -> Fluss von Ask zu Bid
                this.addLiquidityFlow('flow-to-bid');
            } else if (askChange > bidChange) {
                // Mehr Liquidität auf Ask-Seite -> Fluss von Bid zu Ask
                this.addLiquidityFlow('flow-to-ask');
            }
        }
        
        // Aktualisiere gespeicherte Volumina
        this.liquidityFlow.lastBidVolume = totalBidVolume;
        this.liquidityFlow.lastAskVolume = totalAskVolume;
    },

    /**
     * Füge Liquiditätsfluss-Element hinzu
     * @param {string} flowClass - CSS-Klasse für die Flussrichtung
     */
    addLiquidityFlow: function(flowClass) {
        const container = DOMRenderer.container;
        
        // Finde Spread-Container
        const spreadContainer = container.querySelector('.spread-container');
        if (!spreadContainer) return;
        
        // Erstelle Fluss-Element
        const flowElement = document.createElement('div');
        flowElement.className = `liquidity-flow ${flowClass}`;
        spreadContainer.appendChild(flowElement);
        
        // Entferne nach Animation
        setTimeout(() => {
            if (flowElement.parentNode) {
                flowElement.parentNode.removeChild(flowElement);
            }
        }, DOMRenderer.CONFIG.dom.animationDuration || 1000);
    },

    /**
     * Rendere das Volumen-Profil am rechten Rand
     * @param {number} maxBidVolume - Maximales Bid-Volumen
     * @param {number} maxAskVolume - Maximales Ask-Volumen
     */
    renderVolumeProfile: function(maxBidVolume, maxAskVolume) {
        const container = DOMRenderer.container;
        if (!container) return;
        
        // Lösche vorhandenes Volumen-Profil
        const existingProfile = container.querySelector('.volume-profile-container');
        if (existingProfile) {
            existingProfile.remove();
        }
        
        // Erstelle Container für das Volumen-Profil
        const profileContainer = document.createElement('div');
        profileContainer.className = 'volume-profile-container';
        container.appendChild(profileContainer);
        
        // Sammle Volumendaten pro Preisstufe
        const volumeByPrice = {};
        
        // Sammle Bid-Volumen
        MarketData.bids.forEach(order => {
            const price = order.price.toFixed(2);
            if (!volumeByPrice[price]) {
                volumeByPrice[price] = { bid: 0, ask: 0, total: 0 };
            }
            volumeByPrice[price].bid = order.volume;
            volumeByPrice[price].total += order.volume;
        });
        
        // Sammle Ask-Volumen
        MarketData.asks.forEach(order => {
            const price = order.price.toFixed(2);
            if (!volumeByPrice[price]) {
                volumeByPrice[price] = { bid: 0, ask: 0, total: 0 };
            }
            volumeByPrice[price].ask = order.volume;
            volumeByPrice[price].total += order.volume;
        });
        
        // Finde das maximale Gesamtvolumen
        const volumes = Object.values(volumeByPrice).map(v => v.total);
        const maxTotalVolume = volumes.length > 0 ? Math.max(...volumes) : 0;
        
        // Rendere Volumenbalken für jede Preisstufe
        Object.entries(volumeByPrice).forEach(([price, volume]) => {
            const rows = container.querySelectorAll('.dom-row');
            
            // Finde die passende Zeile für diesen Preis
            for (const row of rows) {
                const rowPrice = parseFloat(row.getAttribute('data-price'));
                if (rowPrice && Math.abs(rowPrice - parseFloat(price)) < 0.01) {
                    // Erstelle Volumenbalken
                    const volumeBar = document.createElement('div');
                    volumeBar.className = 'volume-profile-bar';
                    volumeBar.style.width = `${(volume.total / maxTotalVolume * 100)}%`;
                    
                    // Färbe je nach Dominanz
                    if (volume.bid > volume.ask * 1.5) {
                        volumeBar.classList.add('bid-dominant-profile');
                    } else if (volume.ask > volume.bid * 1.5) {
                        volumeBar.classList.add('ask-dominant-profile');
                    } else {
                        volumeBar.classList.add('neutral-profile');
                    }
                    
                    // Füge Tooltip mit Volume-Infos hinzu
                    volumeBar.title = `Preis: ${price}\nBid: ${volume.bid.toFixed(1)}\nAsk: ${volume.ask.toFixed(1)}\nTotal: ${volume.total.toFixed(1)}`;
                    
                    // Füge zum DOM hinzu
                    profileContainer.appendChild(volumeBar);
                    
                    // Positioniere relativ zur entsprechenden Zeile
                    volumeBar.style.top = `${row.offsetTop}px`;
                    volumeBar.style.height = `${row.offsetHeight}px`;
                    
                    break;
                }
            }
        });
    },

    /**
     * Renderer für Order-Details
     * @param {Object} order - Order-Objekt
     * @param {string} type - 'bid' oder 'ask'
     * @param {number} maxVolume - Maximales Volumen für Skalierung
     * @returns {Object} DOM-Informationen für die Orderdarstellung
     */
    renderOrderDetails: function(order, type, maxVolume) {
        const volumeBarWidth = (order.volume / maxVolume * 100).toFixed(0);
        const orderTypeMarker = DOMRenderer.Rendering.getOrderTypeMarker(order.orderType);
        
        // Preisänderungsanimation
        let priceChangeClass = '';
        const changeDirection = DOMRenderer.Data.updatePriceHistory(order.price, order.volume);
        if (changeDirection === 'up') {
            priceChangeClass = 'price-up-anim';
        } else if (changeDirection === 'down') {
            priceChangeClass = 'price-down-anim';
        }
        
        // Dominanz-Indikator
        let dominanceClass = '';
        let flowClass = '';
        
        // Simulierte Dominanz-Berechnung für die Demo
        const simulatedBidVolume = type === 'bid' ? order.volume : Math.random() * 30;
        const simulatedAskVolume = type === 'ask' ? order.volume : Math.random() * 30;
        const volumeDifference = simulatedBidVolume - simulatedAskVolume;
        
        // Wenn ein signifikanter Unterschied besteht, visualisiere Dominanz
        const threshold = DOMRenderer.CONFIG.dominanceFeatures?.thresholdDifference || 5;
        
        if (Math.abs(volumeDifference) > threshold) {
            if (volumeDifference > 0) {
                dominanceClass = 'bid-dominant'; // Bid-Seite dominiert
                if (DOMRenderer.CONFIG.dominanceFeatures?.flowVisualization && Math.random() > 0.7) {
                    flowClass = 'bid-flow';
                }
            } else {
                dominanceClass = 'ask-dominant'; // Ask-Seite dominiert
                if (DOMRenderer.CONFIG.dominanceFeatures?.flowVisualization && Math.random() > 0.7) {
                    flowClass = 'ask-flow';
                }
            }
        }
        
        // Trend-Indikator berechnen
        let trendIndicator = '';
        if ((DOMRenderer.CONFIG.dominanceFeatures?.trendIndicators || true) && Math.abs(volumeDifference) > 10) {
            if (volumeDifference > 0) {
                trendIndicator = '<div class="price-trend-indicator trend-up"></div>';
            } else {
                trendIndicator = '<div class="price-trend-indicator trend-down"></div>';
            }
        }
        
        return {
            volumeBarWidth,
            orderTypeMarker,
            priceChangeClass,
            dominanceClass,
            flowClass,
            trendIndicator
        };
    },

    /**
     * Animiere Orderausführung
     * @param {number} price - Preis der ausgeführten Order
     * @param {string} side - 'buy' oder 'sell'
     * @param {number} volume - Volumen der Order
     */
    animateOrderExecution: function(price, side, volume) {
        // Finde die entsprechende Zeile
        const rows = DOMRenderer.container.querySelectorAll('.dom-row');
        let targetRow = null;
        
        for (const row of rows) {
            const rowPrice = parseFloat(row.getAttribute('data-price'));
            if (Math.abs(rowPrice - price) < 0.01) {
                targetRow = row;
                break;
            }
        }
        
        if (!targetRow) return;
        
        // Animation hinzufügen
        const animClass = side === 'buy' ? 'order-executed-buy' : 'order-executed-sell';
        targetRow.classList.add(animClass);
        
        // Flash-Animation für verbesserte Sichtbarkeit
        const flash = document.createElement('div');
        flash.className = `execution-flash ${side === 'buy' ? 'buy-flash' : 'sell-flash'}`;
        flash.textContent = `${volume.toFixed(1)} @ ${price.toFixed(2)}`;
        targetRow.appendChild(flash);
        
        // Nach Animation aufräumen
        setTimeout(() => {
            targetRow.classList.remove(animClass);
            if (flash.parentNode) flash.parentNode.removeChild(flash);
        }, 800);
        
        // Spread-Animation auslösen
        this.animateSpread();
    },

    /**
     * Animiere den Spread basierend auf Preisänderungen
     */
    animateSpread: function() {
        const spreadContainer = DOMRenderer.container.querySelector('.spread-container');
        if (!spreadContainer) return;
        
        // Spread-Höhe basierend auf aktuellem Spread animieren
        const spreadHeight = Math.max(15, Math.min(40, MarketData.spread * 100)); // Skalierung anpassen
        
        // CSS-Animation anwenden
        spreadContainer.style.height = `${spreadHeight}px`;
        spreadContainer.classList.add('spread-animation');
        
        // Spread-Wert aktualisieren
        const spreadText = spreadContainer.querySelector('.spread-text');
        if (spreadText) {
            const spreadPips = MarketData.spread.toFixed(1);
            const spreadUSD = (MarketData.spread * 100).toFixed(2);
            spreadText.textContent = `SPREAD: ${spreadPips} Pips ($${spreadUSD})`;
            spreadText.classList.add('spread-value-change');
        }
        
        // Pfeile dynamisch animieren
        const arrows = spreadContainer.querySelectorAll('.spread-arrow');
        arrows.forEach(arrow => {
            arrow.classList.add('arrow-pulse');
        });
        
        // Animation zurücksetzen
        setTimeout(() => {
            spreadContainer.classList.remove('spread-animation');
            if (spreadText) spreadText.classList.remove('spread-value-change');
            arrows.forEach(arrow => arrow.classList.remove('arrow-pulse'));
        }, 500);
    },
    
    /**
     * Animiere Preisbewegungen mit Ask/Bid-Balken
     * @param {number} newPrice - Neuer Preis 
     * @param {number} oldPrice - Alter Preis
     */
    animatePriceMovement: function(newPrice, oldPrice) {
        // Preisrichtung bestimmen
        const direction = newPrice > oldPrice ? 'up' : 'down';
        
        // Ask- und Bid-Flow-Container finden
        const askFlow = document.getElementById('ask-flow-content');
        const bidFlow = document.getElementById('bid-flow-content');
        
        if (!askFlow || !bidFlow) return;
        
        // Balken animieren basierend auf Preisrichtung
        if (direction === 'up') {
            // Bei Preisanstieg: Bid-Flow verstärken, Ask-Flow verringern
            const bidBar = bidFlow.querySelector('.flow-bar');
            if (bidBar) {
                bidBar.classList.add('flow-bar-pulse-up');
                setTimeout(() => bidBar.classList.remove('flow-bar-pulse-up'), 500);
            }
        } else {
            // Bei Preisrückgang: Ask-Flow verstärken, Bid-Flow verringern
            const askBar = askFlow.querySelector('.flow-bar');
            if (askBar) {
                askBar.classList.add('flow-bar-pulse-down');
                setTimeout(() => askBar.classList.remove('flow-bar-pulse-down'), 500);
            }
        }
        
        // Spread neu berechnen und animieren
        this.animateSpread();
    }
};