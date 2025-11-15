/**
 * DOM-Renderer Hauptanwendung
 * Beispiel für die Integration und Verwendung des DOM-Renderers
 */

// Stelle sicher, dass alle notwendigen Module geladen sind
if (typeof DOMRenderer === 'undefined' || 
    typeof DOMRenderer.Rendering === 'undefined' || 
    typeof DOMRenderer.Visualization === 'undefined') {
    console.error('DOMRenderer oder seine Module sind nicht verfügbar. Bitte stellen Sie sicher, dass alle Skripte korrekt geladen wurden.');
}

// Dummy MarketData-Objekt für Testzwecke
// In einer realen Anwendung würde dies durch echte Marktdaten ersetzt
if (typeof MarketData === 'undefined') {
    window.MarketData = {
        lastPrice: 1928.45,
        spread: 0.3,
        
        // Dummy Bid-Orders
        bids: [],
        
        // Dummy Ask-Orders
        asks: [],
        
        // Funktion zum Berechnen des Spreads
        calculateSpread: function() {
            if (this.asks.length > 0 && this.bids.length > 0) {
                const lowestAsk = this.asks[0].price;
                const highestBid = this.bids[0].price;
                this.spread = lowestAsk - highestBid;
            } else {
                this.spread = 0.3; // Default-Wert wenn keine Orders vorhanden
            }
        }
    };
}

// Initialisierungsfunktion für die Anwendung
function initializeApplication() {
    // Generiere Demo-Daten
    DOMRenderer.Demo.generateRandomMarketData();
    
    // Initialisiere DOM-Renderer mit DOM-Container
    DOMRenderer.initialize('dom-container', {
        dom: {
            highlightCurrentPrice: true,
            animationDuration: 500,
            useColors: true,
            showTooltips: true
        }
    });
    
    // Befülle Auswahllisten und weitere UI-Elemente
    setupUIControls();
    
    // Event-Listener für Anwendungssteuerung
    registerAppEventListeners();
    
    // Aktualisiere Statistiken und Aktivitätslog
    updateStatistics();
    addActivityLogEntry('Anwendung initialisiert');
    
    console.log('DOM-Trading Anwendung erfolgreich initialisiert.');
}

// Funktion zum Einrichten der UI-Steuerelemente
function setupUIControls() {
    // Setze Event-Listener für Verbindungs-Button
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            if (this.textContent === 'Verbinden') {
                this.textContent = 'Trennen';
                this.classList.add('connected');
                
                // Starte Demo-Simulation
                DOMRenderer.Demo.startDemoSimulation();
                
                addActivityLogEntry('Verbindung hergestellt');
                updateStatistics();
            } else {
                this.textContent = 'Verbinden';
                this.classList.remove('connected');
                
                // Stoppe Demo-Simulation
                DOMRenderer.Demo.stopDemoSimulation();
                
                addActivityLogEntry('Verbindung getrennt');
            }
        });
    }
    
    // Setze Event-Listener für Aktualisierungsrate
    const refreshRate = document.getElementById('refresh-rate');
    if (refreshRate) {
        refreshRate.addEventListener('change', function() {
            addActivityLogEntry(`Aktualisierungsrate auf ${this.options[this.selectedIndex].text} gesetzt`);
        });
    }
    
    // Setze Event-Listener für Datenquelle
    const dataSource = document.getElementById('data-source');
    if (dataSource) {
        dataSource.addEventListener('change', function() {
            const selectedSource = this.options[this.selectedIndex].text;
            addActivityLogEntry(`Datenquelle auf ${selectedSource} gewechselt`);
            
            // Bei simulierten Daten ein Szenario wählen
            if (selectedSource === 'Simulierte Daten') {
                showScenarioSelector();
            }
        });
    }
}

// Funktion zum Registrieren von Event-Listenern für die Anwendung
function registerAppEventListeners() {
    // Event-Listener für Preisänderungen
    DOMRenderer.Events.on('priceChange', function(data) {
        // Aktualisiere Preisanzeige
        const lastPriceElement = document.getElementById('last-price');
        if (lastPriceElement) {
            lastPriceElement.textContent = data.newPrice.toFixed(2);
            
            // Füge Klasse basierend auf Preisrichtung hinzu
            lastPriceElement.classList.remove('price-up', 'price-down');
            if (data.newPrice > data.oldPrice) {
                lastPriceElement.classList.add('price-up');
            } else if (data.newPrice < data.oldPrice) {
                lastPriceElement.classList.add('price-down');
            }
        }
        
        // Aktualisiere Statistiken
        updateStatistics();
    });
    
    // Event-Listener für Zeilen-Klicks (Orders platzieren)
    DOMRenderer.Events.on('rowClick', function(data) {
        // Hier könnte ein Order-Dialog geöffnet werden
        addActivityLogEntry(`Order-Klick: ${data.isAsk ? 'Ask' : 'Bid'} bei ${data.price}`);
    });
    
    // Event-Listener für Hover (zeigt zusätzliche Details)
    DOMRenderer.Events.on('rowHover', function(data) {
        // Hier könnten zusätzliche Informationen angezeigt werden
    });
}

// Funktion zum Aktualisieren der Statistiken
function updateStatistics() {
    // Aktualisiere Spread
    const spreadValue = document.getElementById('spread-value');
    if (spreadValue) {
        const spreadPips = MarketData.spread.toFixed(1);
        const spreadUSD = (MarketData.spread * 100).toFixed(2);
        spreadValue.textContent = `${spreadPips} Pips ($${spreadUSD})`;
    }
    
    // Aktualisiere Volumen
    const volumeValue = document.getElementById('volume-value');
    if (volumeValue) {
        const totalBidVolume = DOMRenderer.Data.getTotalBidVolume();
        const totalAskVolume = DOMRenderer.Data.getTotalAskVolume();
        const totalVolume = Math.round(totalBidVolume + totalAskVolume);
        volumeValue.textContent = `${totalVolume.toLocaleString()} Lots`;
    }
    
    // Aktualisiere Bid/Ask Ratio
    const ratioValue = document.getElementById('ratio-value');
    if (ratioValue) {
        const totalBidVolume = DOMRenderer.Data.getTotalBidVolume();
        const totalAskVolume = DOMRenderer.Data.getTotalAskVolume();
        
        if (totalAskVolume > 0) {
            const ratio = (totalBidVolume / totalAskVolume).toFixed(2);
            let ratioText = '';
            
            if (ratio > 1.2) {
                ratioText = `${ratio} (Kaufüberhang)`;
            } else if (ratio < 0.8) {
                ratioText = `${ratio} (Verkaufsüberhang)`;
            } else {
                ratioText = `${ratio} (Ausgeglichen)`;
            }
            
            ratioValue.textContent = ratioText;
        } else {
            ratioValue.textContent = 'N/A';
        }
    }
    
    // Aktualisiere letztes Update
    const lastUpdateTime = document.getElementById('last-update-time');
    if (lastUpdateTime) {
        const now = new Date();
        lastUpdateTime.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    }
}

// Funktion zum Hinzufügen von Einträgen zum Aktivitätslog
function addActivityLogEntry(message) {
    const activityLog = document.getElementById('activity-log');
    if (activityLog) {
        const now = new Date();
        const timeString = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const entry = document.createElement('div');
        entry.className = 'activity-entry';
        entry.innerHTML = `<span class="activity-time">${timeString}</span> ${message}`;
        
        // Am Anfang einfügen
        activityLog.insertBefore(entry, activityLog.firstChild);
        
        // Auf max. 100 Einträge begrenzen
        if (activityLog.children.length > 100) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }
}

// Funktion zum Anzeigen des Szenario-Auswahldialogs
function showScenarioSelector() {
    // Erstelle Dialog
    const dialog = document.createElement('div');
    dialog.className = 'scenario-dialog';
    dialog.innerHTML = `
        <div class="dialog-header">
            <h3>Marktszenario auswählen</h3>
            <button class="close-button">×</button>
        </div>
        <div class="dialog-content">
            <button data-scenario="bullish" class="scenario-btn bullish-btn">Bullisch</button>
            <button data-scenario="bearish" class="scenario-btn bearish-btn">Bärisch</button>
            <button data-scenario="volatile" class="scenario-btn volatile-btn">Volatil</button>
            <button data-scenario="quiet" class="scenario-btn quiet-btn">Ruhig</button>
            <button data-scenario="random" class="scenario-btn random-btn">Zufällig</button>
        </div>
    `;
    
    // Stilisiere den Dialog
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = '#fff';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    dialog.style.zIndex = '1000';
    dialog.style.width = '300px';
    
    // Füge zum DOM hinzu
    document.body.appendChild(dialog);
    
    // Event-Handler für Schließen-Button
    dialog.querySelector('.close-button').addEventListener('click', () => {
        dialog.remove();
    });
    
    // Event-Handler für Szenario-Buttons
    const buttons = dialog.querySelectorAll('.scenario-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const scenario = button.getAttribute('data-scenario');
            
            if (scenario === 'random') {
                DOMRenderer.Demo.generateRandomMarketData();
                addActivityLogEntry('Zufälliges Marktszenario generiert');
            } else {
                DOMRenderer.Demo.generateScenario(scenario);
                addActivityLogEntry(`${button.textContent} Marktszenario generiert`);
            }
            
            dialog.remove();
        });
    });
}

// Starte die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
    // Prüfe, ob MarketData und DOMRenderer verfügbar sind
    if (typeof MarketData !== 'undefined' && typeof DOMRenderer !== 'undefined') {
        initializeApplication();
    } else {
        console.error('Erforderliche Abhängigkeiten für die Anwendung fehlen');
    }
});