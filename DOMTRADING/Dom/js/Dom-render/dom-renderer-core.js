/**
 * DOM-Renderer Kernmodul
 * Enthält die grundlegende Struktur und Kernfunktionalität des Renderers
 * @version 2.0
 */

// Hauptobjekt für den DOM-Renderer
const DOMRenderer = {
    // DOM-Container Element
    container: null,

    // Zoom-Level (1 = normal, 2 = 2x, 0.5 = halbe Größe)
    zoomLevel: 1,

    // Preisspannen-Konfiguration
    priceRange: {
        // Anzahl der Preisstufen
        totalLevels: 30,
        // Wertstufe je Preisniveau (für Gold meist 0.10)
        tickSize: 0.10,
        // Zentrieren auf aktuellen Preis
        centerOnPrice: true,
        // Ansichtsmodus: 'compact', 'normal', 'expanded'
        viewMode: 'normal'
    },

    // Konfiguration für DOM-Features und Einstellungen
    CONFIG: {
        dom: {
            highlightCurrentPrice: true,
            animationDuration: 500,
            useColors: true,
            showTooltips: true
        },
        
        dominanceFeatures: {
            thresholdDifference: 5,
            flowVisualization: true,
            trendIndicators: true
        },
        
        orderTypes: {
            showMarkers: true,
            defaultType: 'limit',
            colorCoding: true
        },
        
        performance: {
            useVirtualDOM: true,
            batchUpdates: true,
            debounceTime: 100
        }
    },

    /**
     * Initialisiere den Renderer
     * @param {string} containerId - ID des DOM-Containers
     * @param {Object} config - Optionale Konfiguration zum Überschreiben der Standardwerte
     * @returns {boolean} Erfolg der Initialisierung
     */
    initialize: function(containerId, config = {}) {
        console.log('DOMRenderer: Initialisierung gestartet');
        
        // Container finden
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('DOM-Container mit ID ' + containerId + ' nicht gefunden!');
            return false;
        }
        
        // Konfiguration überschreiben, wenn angegeben
        if (config) {
            this.CONFIG = this.mergeDeep(this.CONFIG, config);
        }
        
        // Container mit Basisklasse versehen
        this.container.classList.add('dom-renderer-container');
        
        // Sorge dafür, dass der Container positioniert ist
        const computedStyle = window.getComputedStyle(this.container);
        if (computedStyle.position === 'static') {
            this.container.style.position = 'relative';
        }
        
        // Module initialisieren
        // Wichtig: Reihenfolge beachten! Daten zuerst, UI und Events danach
        console.log('DOMRenderer: Initialisiere Datenmodul');
        if (this.Data && typeof this.Data.initialize === 'function') {
            this.Data.initialize();
        } else {
            console.warn('DOMRenderer: Datenmodul nicht gefunden oder initialize nicht implementiert');
        }
        
        console.log('DOMRenderer: Initialisiere UI-Modul');
        if (this.UI && typeof this.UI.initialize === 'function') {
            this.UI.initialize(this);
        } else {
            console.warn('DOMRenderer: UI-Modul nicht gefunden oder initialize nicht implementiert');
        }
        
        console.log('DOMRenderer: Initialisiere Events-Modul');
        if (this.Events && typeof this.Events.initialize === 'function') {
            this.Events.initialize(this);
        } else {
            console.warn('DOMRenderer: Events-Modul nicht gefunden oder initialize nicht implementiert');
        }
        
        // Erstmalige Darstellung
        console.log('DOMRenderer: Erstmalige Darstellung');
        this.render(); // Verwende die Kompatibilitäts-Methode
        
        console.log('DOMRenderer: Initialisierung abgeschlossen');
        return true;
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.render()
     * Diese Funktion existiert für Kompatibilität mit bestehendem Code
     */
    render: function() {
        console.log('DOMRenderer: render() wurde aufgerufen (Kompatibilitätsmodus)');
        if (this.Rendering && typeof this.Rendering.render === 'function') {
            return this.Rendering.render();
        } else {
            console.warn('DOMRenderer: Rendering-Modul nicht gefunden oder render nicht implementiert');
            return false;
        }
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.renderDOMRow()
     */
    renderDOMRow: function(price, askOrder, bidOrder, maxAskVolume, maxBidVolume, type) {
        if (this.Rendering && typeof this.Rendering.renderDOMRow === 'function') {
            return this.Rendering.renderDOMRow(price, askOrder, bidOrder, maxAskVolume, maxBidVolume, type);
        }
        return '';
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.renderCurrentPriceRow()
     */
    renderCurrentPriceRow: function(price, bidOrder, askOrder, maxBidVolume, maxAskVolume) {
        if (this.Rendering && typeof this.Rendering.renderCurrentPriceRow === 'function') {
            return this.Rendering.renderCurrentPriceRow(price, bidOrder, askOrder, maxBidVolume, maxAskVolume);
        }
        return '';
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.renderSpreadRow()
     */
    renderSpreadRow: function() {
        if (this.Rendering && typeof this.Rendering.renderSpreadRow === 'function') {
            return this.Rendering.renderSpreadRow();
        }
        return '';
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.getOrderTypeMarker()
     */
    getOrderTypeMarker: function(orderType) {
        if (this.Rendering && typeof this.Rendering.getOrderTypeMarker === 'function') {
            return this.Rendering.getOrderTypeMarker(orderType);
        }
        return '';
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.highlightCurrentPrice()
     */
    highlightCurrentPrice: function() {
        if (this.Rendering && typeof this.Rendering.highlightCurrentPrice === 'function') {
            return this.Rendering.highlightCurrentPrice();
        }
    },

    /**
     * KOMPATIBILITÄTSFUNKTION: Delegiert an Rendering.scrollToCurrentPrice()
     */
    scrollToCurrentPrice: function() {
        if (this.Rendering && typeof this.Rendering.scrollToCurrentPrice === 'function') {
            return this.Rendering.scrollToCurrentPrice();
        }
    },

    /**
     * Tiefes Zusammenführen zweier Objekte für die Konfiguration
     * @param {Object} target - Zielobjekt
     * @param {Object} source - Quellobojekt
     * @returns {Object} Zusammengeführtes Objekt
     */
    mergeDeep: function(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    },

    /**
     * Prüfe, ob ein Wert ein Objekt ist
     * @param {*} item - Zu prüfender Wert
     * @returns {boolean} Ist ein Objekt
     */
    isObject: function(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    },

    /**
     * Aktualisiere aktuelle Preiszeile und animiere Preisänderungen
     * @param {number} newPrice - Neuer aktueller Preis
     */
    updateCurrentPrice: function(newPrice) {
        const oldPrice = MarketData.lastPrice;
        
        // Speichere neuen Preis
        MarketData.lastPrice = newPrice;
        
        // Berechne Spread neu
        if (typeof MarketData.calculateSpread === 'function') {
            MarketData.calculateSpread();
        }
        
        // Aktualisiere DOM
        this.render(); // Verwende die Kompatibilitäts-Methode
        
        // Animiere Preisänderung, wenn signifikant
        if (Math.abs(newPrice - oldPrice) > 0.01) {
            // Finde die neue aktuelle Preiszeile
            const currentPriceRow = this.Rendering ? this.Rendering.currentPriceRow : null;
            
            if (currentPriceRow) {
                // Bestimme Richtung der Preisänderung
                const priceChangeClass = newPrice > oldPrice ? 'price-up-flash' : 'price-down-flash';
                
                // Füge Flash-Animation hinzu
                currentPriceRow.classList.add(priceChangeClass);
                
                // Entferne nach Animation
                setTimeout(() => {
                    currentPriceRow.classList.remove(priceChangeClass);
                }, this.CONFIG.dom.animationDuration || 1000);
            }
            
            // Animiere Flow-Balken basierend auf Preisbewegung
            if (this.Visualization && typeof this.Visualization.animatePriceMovement === 'function') {
                this.Visualization.animatePriceMovement(newPrice, oldPrice);
            }
        }
        
        // Event auslösen für Preisänderung
        this.triggerEvent('priceChange', { oldPrice, newPrice, change: newPrice - oldPrice });
    },

    /**
     * Löse ein Event aus (Hilfsfunktion)
     * @param {string} eventName - Name des Events
     * @param {Object} data - Daten für das Event
     */
    triggerEvent: function(eventName, data = {}) {
        if (this.Events && typeof this.Events.triggerEvent === 'function') {
            this.Events.triggerEvent(eventName, data);
        } else {
            // Fallback für Kompatibilität
            const event = new CustomEvent(`dom-renderer-${eventName}`, {
                detail: data,
                bubbles: true,
                cancelable: true
            });
            
            if (this.container) {
                this.container.dispatchEvent(event);
            }
        }
    }
};

// Module als Platzhalter definieren, die später befüllt werden
DOMRenderer.UI = {};
DOMRenderer.Rendering = {};
DOMRenderer.Events = {};
DOMRenderer.Visualization = {};
DOMRenderer.Demo = {};
DOMRenderer.Data = {};

// Exportiere den DOMRenderer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMRenderer;
}