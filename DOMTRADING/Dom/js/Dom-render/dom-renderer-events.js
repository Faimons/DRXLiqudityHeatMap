/**
 * DOM-Renderer Events-Modul
 * Verantwortlich für Event-Handling und Benutzerinteraktionen
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das Events-Modul
DOMRenderer.Events = {
    // Referenz zum Hauptobjekt
    domRenderer: null,

    // Event-Listener-Speicher
    listeners: {},

    /**
     * Initialisiere Events-Modul
     * @param {Object} domRenderer - Referenz zum Hauptobjekt
     */
    initialize: function(domRenderer) {
        this.domRenderer = domRenderer;
        
        // Event-Listener registrieren
        this.registerDOMEventListeners();
        this.registerKeyboardEventListeners();
    },

    /**
     * Registriere Event-Listener für DOM-Elemente
     */
    registerDOMEventListeners: function() {
        const container = this.domRenderer.container;
        if (!container) return;
        
        // Mausrad-Event für Zoomen
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Zoome basierend auf Scroll-Richtung
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            this.domRenderer.UI.zoom(factor);
        });
        
        // Hover-Events für Order-Details
        container.addEventListener('mouseover', (e) => {
            const row = e.target.closest('.dom-row');
            if (row) {
                row.classList.add('hovered');
                
                // Finde den Preis für die Zeile
                const price = parseFloat(row.getAttribute('data-price'));
                
                // Löse Event aus für Hover
                this.triggerEvent('rowHover', { price, row });
            }
        });
        
        container.addEventListener('mouseout', (e) => {
            const row = e.target.closest('.dom-row');
            if (row) {
                row.classList.remove('hovered');
                
                // Finde den Preis für die Zeile
                const price = parseFloat(row.getAttribute('data-price'));
                
                // Löse Event aus für Hover-Ende
                this.triggerEvent('rowHoverEnd', { price, row });
            }
        });
        
        // Klick-Events für Order-Aktionen (z.B. Platzieren einer Order)
        container.addEventListener('click', (e) => {
            const row = e.target.closest('.dom-row');
            if (row && !row.classList.contains('spread-row')) {
                const price = parseFloat(row.getAttribute('data-price'));
                const isAsk = row.classList.contains('ask-row');
                
                // Löse Event aus für Order-Platzierung
                this.triggerEvent('rowClick', { price, isAsk, row });
                
                // Hier kann eine Funktion für Order-Platzierung aufgerufen werden
                // z.B. OrderManager.placeOrder(price, isAsk ? 'buy' : 'sell');
                console.log(`Order platzieren: ${isAsk ? 'Kauf' : 'Verkauf'} bei ${price}`);
            }
        });
        
        // Doppelklick für erweiterte Aktionen
        container.addEventListener('dblclick', (e) => {
            const row = e.target.closest('.dom-row');
            if (row && !row.classList.contains('spread-row')) {
                const price = parseFloat(row.getAttribute('data-price'));
                const isAsk = row.classList.contains('ask-row');
                
                // Löse Event aus für Doppelklick
                this.triggerEvent('rowDblClick', { price, isAsk, row });
                
                // Hier kann eine Funktion für erweiterte Aktionen aufgerufen werden
                // z.B. OrderManager.showDetailedOrderDialog(price, isAsk);
                console.log(`Order-Dialog öffnen: ${isAsk ? 'Kauf' : 'Verkauf'} bei ${price}`);
            }
        });
    },

    /**
     * Registriere globale Tastaturkürzel
     */
    registerKeyboardEventListeners: function() {
        document.addEventListener('keydown', this.handleKeyboardInput.bind(this));
    },

    /**
     * Verarbeite Tastatureingaben für DOM-Steuerung
     * @param {KeyboardEvent} event - Keyboard-Event
     */
    handleKeyboardInput: function(event) {
        // Ignoriere, wenn Eingabeelemente im Fokus sind
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' || 
            document.activeElement.tagName === 'SELECT') {
            return;
        }
        
        switch (event.key) {
            case '+':
                this.domRenderer.UI.zoom(1.1); // Vergrößern
                event.preventDefault();
                break;
            case '-':
                this.domRenderer.UI.zoom(0.9); // Verkleinern
                event.preventDefault();
                break;
            case 'c':
                this.domRenderer.priceRange.centerOnPrice = !this.domRenderer.priceRange.centerOnPrice;
                this.domRenderer.Rendering.render();
                event.preventDefault();
                break;
            case '1':
                this.domRenderer.UI.setViewMode('compact');
                this.domRenderer.Rendering.render();
                event.preventDefault();
                break;
            case '2':
                this.domRenderer.UI.setViewMode('normal');
                this.domRenderer.Rendering.render();
                event.preventDefault();
                break;
            case '3':
                this.domRenderer.UI.setViewMode('expanded');
                this.domRenderer.Rendering.render();
                event.preventDefault();
                break;
            case 'r':
                // Aktualisieren der Ansicht
                this.domRenderer.Rendering.render();
                event.preventDefault();
                break;
            case 'h':
                // Zeige/Verstecke Hilfe-Dialog
                this.domRenderer.UI.toggleHelpDialog();
                event.preventDefault();
                break;
        }
    },

    /**
     * Löse ein Event aus
     * @param {string} eventName - Name des Events
     * @param {Object} data - Daten für das Event
     */
    triggerEvent: function(eventName, data = {}) {
        // Erstelle ein neues Custom Event
        const event = new CustomEvent(`dom-renderer-${eventName}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        
        // Löse das Event am Container aus
        this.domRenderer.container.dispatchEvent(event);
        
        // Rufe registrierte Callbacks auf
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                callback(data);
            });
        }
    },

    /**
     * Registriere einen Event-Listener
     * @param {string} eventName - Name des Events
     * @param {Function} callback - Callback-Funktion
     */
    on: function(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        
        this.listeners[eventName].push(callback);
    },

    /**
     * Entferne einen Event-Listener
     * @param {string} eventName - Name des Events
     * @param {Function} callback - Callback-Funktion
     */
    off: function(eventName, callback) {
        if (!this.listeners[eventName]) return;
        
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
};