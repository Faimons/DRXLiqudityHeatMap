/**
 * DOM-Renderer UI-Modul
 * Verantwortlich für UI-Elemente, Steuerelemente und Hilfeelemente
 */

// Stelle sicher, dass DOMRenderer existiert
if (typeof DOMRenderer === 'undefined') {
    throw new Error('DOMRenderer ist nicht definiert. Bitte dom-renderer-core.js zuerst einbinden.');
}

// Implementiere das UI-Modul
DOMRenderer.UI = {
    // Referenz zum Hauptobjekt
    domRenderer: null,
    
    // IDs für generierte Elemente, um doppelte Erzeugung zu vermeiden
    elementIds: {
        priceLevelsInput: 'dom-price-levels-input',
        tickSizeInput: 'dom-tick-size-input',
        centerPriceToggle: 'dom-center-price-toggle',
        viewModeSelect: 'dom-view-mode-select',
        zoomIn: 'dom-zoom-in-btn',
        zoomOut: 'dom-zoom-out-btn',
        refreshView: 'dom-refresh-view-btn',
        centerView: 'dom-center-view-btn',
        toggleHelp: 'dom-toggle-help-btn'
    },

    /**
     * Initialisiere UI-Modul
     * @param {Object} domRenderer - Referenz zum Hauptobjekt
     */
    initialize: function(domRenderer) {
        this.domRenderer = domRenderer;
        console.log('UI-Modul: Initialisierung gestartet');
        
        // Entferne zunächst alle bestehenden Steuerelemente
        this.removeExistingControls();
        
        // Füge UI-Elemente hinzu
        this.addViewControls();
        this.addSinglePriceRangeControl();
        
        // Setze Ansichtsmodus
        this.setViewMode(domRenderer.priceRange.viewMode);
        
        console.log('UI-Modul: Initialisierung abgeschlossen');
    },
    
    /**
     * Entferne alle vorhandenen Steuerelemente, um Duplikate zu vermeiden
     */
    removeExistingControls: function() {
        // Entferne bestehende Range-Controls
        const existingRangeControls = document.querySelectorAll('.price-range-controls');
        existingRangeControls.forEach(control => {
            console.log('UI-Modul: Entferne bestehendes Range-Control', control);
            control.remove();
        });
        
        // Entferne bestehende Zoom-Controls
        const existingZoomControls = document.querySelectorAll('.zoom-controls');
        existingZoomControls.forEach(control => {
            console.log('UI-Modul: Entferne bestehendes Zoom-Control', control);
            control.remove();
        });
        
        // Entferne bestehende Viewport-Controls
        const existingViewportControls = document.querySelectorAll('.viewport-controls');
        existingViewportControls.forEach(control => {
            console.log('UI-Modul: Entferne bestehendes Viewport-Control', control);
            control.remove();
        });
        
        // Entferne alle bekannten Element-IDs
        Object.values(this.elementIds).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log('UI-Modul: Entferne Element mit ID', id);
                element.remove();
            }
        });
    },

    /**
     * Füge ein einziges, zentrales Preisspan-Steuerelement hinzu
     */
    addSinglePriceRangeControl: function() {
        console.log('UI-Modul: Erstelle zentrales Preisspan-Steuerelement');
        
        // Erstelle ein einziges, zentrales Control-Element
        const controls = document.createElement('div');
        controls.className = 'price-range-controls central-controls';
        controls.innerHTML = `
            <span class="price-range-label">Preisspanne:</span>
            <input type="number" id="${this.elementIds.priceLevelsInput}" class="price-range-input" 
                   value="${this.domRenderer.priceRange.totalLevels}" min="10" max="100" step="5">
            <span class="price-range-label">Tick-Größe:</span>
            <input type="number" id="${this.elementIds.tickSizeInput}" class="price-range-input" 
                   value="${this.domRenderer.priceRange.tickSize}" min="0.01" max="1" step="0.01">
            <label class="toggle-label">
                <span>Zentrieren</span>
                <input type="checkbox" id="${this.elementIds.centerPriceToggle}" 
                       ${this.domRenderer.priceRange.centerOnPrice ? 'checked' : ''}>
            </label>
            <select id="${this.elementIds.viewModeSelect}">
                <option value="compact" ${this.domRenderer.priceRange.viewMode === 'compact' ? 'selected' : ''}>Kompakt</option>
                <option value="normal" ${this.domRenderer.priceRange.viewMode === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="expanded" ${this.domRenderer.priceRange.viewMode === 'expanded' ? 'selected' : ''}>Erweitert</option>
            </select>
        `;
        
        // Füge in den Header ein, wenn vorhanden
        const header = document.querySelector('.header');
        if (header) {
            console.log('UI-Modul: Füge Steuerelemente zum Header hinzu');
            const headerControls = document.createElement('div');
            headerControls.className = 'header-controls';
            headerControls.appendChild(controls);
            header.appendChild(headerControls);
        } else {
            // Fallback: Füge direkt über dem DOM-Container ein
            console.log('UI-Modul: Header nicht gefunden, füge Steuerelemente über DOM-Container ein');
            const domContainer = this.domRenderer.container;
            if (domContainer && domContainer.parentNode) {
                domContainer.parentNode.insertBefore(controls, domContainer);
            }
        }
        
        // Event-Listener für Preisspannen-Kontrollen
        document.getElementById(this.elementIds.priceLevelsInput).addEventListener('change', (e) => {
            this.domRenderer.priceRange.totalLevels = parseInt(e.target.value);
            this.domRenderer.Rendering.render();
        });
        
        document.getElementById(this.elementIds.tickSizeInput).addEventListener('change', (e) => {
            this.domRenderer.priceRange.tickSize = parseFloat(e.target.value);
            this.domRenderer.Rendering.render();
        });
        
        document.getElementById(this.elementIds.centerPriceToggle).addEventListener('change', (e) => {
            this.domRenderer.priceRange.centerOnPrice = e.target.checked;
            this.domRenderer.Rendering.render();
        });
        
        document.getElementById(this.elementIds.viewModeSelect).addEventListener('change', (e) => {
            this.setViewMode(e.target.value);
            this.domRenderer.Rendering.render();
        });
    },

    /**
     * Füge Ansichtsbediener hinzu (Zoom-Kontrollen, etc.)
     */
    addViewControls: function() {
        console.log('UI-Modul: Erstelle Ansichtssteuerelemente');
        
        // Erstelle Zoom-Kontrollen
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="${this.elementIds.zoomIn}" class="zoom-btn" title="Vergrößern">+</button>
            <button id="${this.elementIds.zoomOut}" class="zoom-btn" title="Verkleinern">-</button>
        `;
        
        // Füge Zoom-Kontrollen dem DOM-Container hinzu
        const domContainer = this.domRenderer.container;
        if (domContainer) {
            // Füge am Container an
            domContainer.appendChild(zoomControls);
            
            // Positioniere mit CSS absolut
            zoomControls.style.position = 'absolute';
            zoomControls.style.right = '10px';
            zoomControls.style.bottom = '10px';
            zoomControls.style.zIndex = '50';
        }
        
        // Füge Viewport-Steuerelemente zum Hauptcontainer hinzu
        const viewportControls = document.createElement('div');
        viewportControls.className = 'viewport-controls';
        viewportControls.innerHTML = `
            <button id="${this.elementIds.refreshView}" class="control-btn" title="Ansicht aktualisieren">↻</button>
            <button id="${this.elementIds.centerView}" class="control-btn" title="Zum aktuellen Preis scrollen">⟿</button>
            <button id="${this.elementIds.toggleHelp}" class="control-btn" title="Hilfe anzeigen">?</button>
        `;
        
        // Füge Viewport-Controls dem DOM-Container hinzu
        if (domContainer) {
            domContainer.appendChild(viewportControls);
            
            // Positioniere mit CSS absolut
            viewportControls.style.position = 'absolute';
            viewportControls.style.left = '10px';
            viewportControls.style.bottom = '10px';
            viewportControls.style.zIndex = '50';
        }
        
        // Event-Listener für Zoom-Buttons und Viewport-Steuerelemente
        document.getElementById(this.elementIds.zoomIn).addEventListener('click', () => this.zoom(1.1));
        document.getElementById(this.elementIds.zoomOut).addEventListener('click', () => this.zoom(0.9));
        document.getElementById(this.elementIds.refreshView).addEventListener('click', () => this.domRenderer.Rendering.render());
        document.getElementById(this.elementIds.centerView).addEventListener('click', () => this.domRenderer.Rendering.scrollToCurrentPrice());
        document.getElementById(this.elementIds.toggleHelp).addEventListener('click', () => this.toggleHelpDialog());
    },

    /**
     * Setze den Ansichtsmodus für den DOM
     * @param {string} mode - 'compact', 'normal', 'expanded'
     */
    setViewMode: function(mode) {
        this.domRenderer.priceRange.viewMode = mode;
        
        // Entferne alle Ansichtsklassen
        if (this.domRenderer.container) {
            this.domRenderer.container.classList.remove('dom-view-compact', 'dom-view-normal', 'dom-view-expanded');
            
            // Füge neue Ansichtsklasse hinzu
            this.domRenderer.container.classList.add(`dom-view-${mode}`);
        }
    },

    /**
     * Zoom-Funktion
     * @param {number} factor - Zoom-Faktor (z.B. 1.2 für Vergrößerung, 0.8 für Verkleinerung)
     */
    zoom: function(factor) {
        if (!this.domRenderer) return;
        
        this.domRenderer.zoomLevel *= factor;
        
        // Beschränke Zoom-Level auf sinnvolle Werte
        this.domRenderer.zoomLevel = Math.max(0.25, Math.min(4, this.domRenderer.zoomLevel));
        
        // Rendere mit neuem Zoom-Level
        if (this.domRenderer.Rendering) {
            this.domRenderer.Rendering.render();
        }
        
        // Event auslösen für Zoom-Änderung
        if (this.domRenderer.Events) {
            this.domRenderer.Events.triggerEvent('zoomChange', { zoomLevel: this.domRenderer.zoomLevel });
        }
        
        // Zeige Zoom-Level-Indikator an
        this.showZoomIndicator(this.domRenderer.zoomLevel);
    },

    /**
     * Zeige temporären Zoom-Level-Indikator
     * @param {number} level - Aktueller Zoom-Level
     */
    showZoomIndicator: function(level) {
        let indicator = document.getElementById('zoom-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'zoom-indicator';
            indicator.className = 'zoom-indicator';
            document.body.appendChild(indicator);
        }
        
        // Aktualisiere Anzeige
        indicator.textContent = `Zoom: ${Math.round(level * 100)}%`;
        indicator.classList.add('visible');
        
        // Verstecke nach kurzer Zeit
        clearTimeout(this.zoomIndicatorTimeout);
        this.zoomIndicatorTimeout = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 1500);
    },

    /**
     * Zeige/Verstecke Hilfe-Dialog für Tastaturkürzel
     */
    toggleHelpDialog: function() {
        // Prüfe, ob der Dialog bereits existiert
        let helpDialog = document.getElementById('dom-help-dialog');
        
        if (helpDialog) {
            // Dialog existiert bereits, schalte Sichtbarkeit um
            helpDialog.style.display = helpDialog.style.display === 'none' ? 'block' : 'none';
            return;
        }
        
        // Erstelle neuen Dialog
        helpDialog = document.createElement('div');
        helpDialog.id = 'dom-help-dialog';
        helpDialog.className = 'help-dialog';
        helpDialog.innerHTML = `
            <div class="help-dialog-header">
                <h3>Tastaturkürzel und Bedienung</h3>
                <button id="close-help-dialog" class="close-button">×</button>
            </div>
            <div class="help-dialog-content">
                <table>
                    <tr><th>Tastenkombination</th><th>Funktion</th></tr>
                    <tr><td>+</td><td>Vergrößern (Zoom in)</td></tr>
                    <tr><td>-</td><td>Verkleinern (Zoom out)</td></tr>
                    <tr><td>c</td><td>Zentrieren an/aus</td></tr>
                    <tr><td>1</td><td>Kompakte Ansicht</td></tr>
                    <tr><td>2</td><td>Normale Ansicht</td></tr>
                    <tr><td>3</td><td>Erweiterte Ansicht</td></tr>
                    <tr><td>r</td><td>Aktualisieren</td></tr>
                    <tr><td>h</td><td>Hilfe ein-/ausblenden</td></tr>
                </table>
                <p>Verwenden Sie die Maus zum Scrollen, Klicken zum Platzieren einer Order und Doppelklicken für erweiterte Funktionen.</p>
            </div>
        `;
        
        // Stilisiere den Dialog
        helpDialog.style.position = 'fixed';
        helpDialog.style.top = '50%';
        helpDialog.style.left = '50%';
        helpDialog.style.transform = 'translate(-50%, -50%)';
        helpDialog.style.backgroundColor = '#fff';
        helpDialog.style.border = '1px solid #ccc';
        helpDialog.style.borderRadius = '5px';
        helpDialog.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        helpDialog.style.zIndex = '1000';
        helpDialog.style.maxWidth = '500px';
        helpDialog.style.width = '90%';
        
        // Füge zum DOM hinzu
        document.body.appendChild(helpDialog);
        
        // Event-Handler für Schließen-Button
        document.getElementById('close-help-dialog').addEventListener('click', () => {
            helpDialog.style.display = 'none';
        });
    },

    /**
     * Rendere einen Fortschrittsbalken für die Ladezeit
     * @param {number} percent - Prozent der Ladung (0-100)
     */
    renderLoadingBar: function(percent) {
        // Finde oder erstelle den Ladebalken
        let loadingBar = document.getElementById('dom-loading-bar');
        
        if (!loadingBar) {
            // Erstelle Container und Ladebalken
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'loading-container';
            
            loadingBar = document.createElement('div');
            loadingBar.id = 'dom-loading-bar';
            loadingBar.className = 'loading-bar';
            
            loadingContainer.appendChild(loadingBar);
            
            // Füge zum DOM hinzu, wenn Container vorhanden
            if (this.domRenderer && this.domRenderer.container) {
                this.domRenderer.container.appendChild(loadingContainer);
            }
        }
        
        // Aktualisiere Fortschritt
        if (loadingBar) {
            loadingBar.style.width = `${percent}%`;
            
            // Entferne bei 100%
            if (percent >= 100) {
                setTimeout(() => {
                    if (loadingBar.parentNode) {
                        loadingBar.parentNode.remove();
                    }
                }, 500);
            }
        }
    },

    /**
     * Zeige eine Toast-Benachrichtigung
     * @param {string} message - Anzuzeigende Nachricht
     * @param {string} type - Typ der Nachricht ('info', 'success', 'warning', 'error')
     * @param {number} duration - Anzeigedauer in Millisekunden
     */
    showToast: function(message, type = 'info', duration = 3000) {
        // Erstelle Toast-Element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        // Füge zum DOM hinzu
        document.body.appendChild(toast);
        
        // Animation beim Einblenden
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Entferne nach der angegebenen Zeit
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },

    /**
     * Erstellt eine Schaltfläche zum Umschalten zwischen Demo- und Live-Daten
     */
    createDataSourceToggle: function() {
        // Entferne bestehenden Toggle, falls vorhanden
        const existingToggle = document.querySelector('.data-source-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }
        
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'data-source-toggle';
        toggleContainer.innerHTML = `
            <span class="toggle-label">Datenquelle:</span>
            <div class="toggle-switch">
                <input type="checkbox" id="data-source-toggle" class="toggle-input">
                <label for="data-source-toggle" class="toggle-label">
                    <span class="toggle-option left">Demo</span>
                    <span class="toggle-option right">Live</span>
                </label>
            </div>
        `;
        
        // Füge zur Steuerleiste hinzu
        const controlsElement = document.querySelector('.controls');
        if (controlsElement) {
            controlsElement.appendChild(toggleContainer);
        } else {
            // Fallback: Füge zum Header oder Container-Parent hinzu
            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(toggleContainer);
            } else if (this.domRenderer && this.domRenderer.container && this.domRenderer.container.parentNode) {
                this.domRenderer.container.parentNode.insertBefore(toggleContainer, this.domRenderer.container);
            }
        }
        
        // Event-Listener für den Toggle
        const toggleInput = document.getElementById('data-source-toggle');
        if (toggleInput) {
            toggleInput.addEventListener('change', (e) => {
                const isLive = e.target.checked;
                
                if (this.domRenderer && this.domRenderer.Events) {
                    this.domRenderer.Events.triggerEvent('dataSourceChange', { isLive });
                }
                
                // Visuelles Feedback zur Datenquelle
                this.showToast(`Wechsel zu ${isLive ? 'Live' : 'Demo'}-Daten`, 'info');
                
                if (isLive) {
                    // Live-Datenmodus aktivieren
                    if (this.domRenderer && this.domRenderer.Demo) {
                        this.domRenderer.Demo.stopDemoSimulation();
                    }
                    // Hier könnte ein API-Connector gestartet werden
                } else {
                    // Demo-Datenmodus aktivieren
                    if (this.domRenderer && this.domRenderer.Demo) {
                        this.domRenderer.Demo.startDemoSimulation();
                    }
                }
            });
        }
    }
};