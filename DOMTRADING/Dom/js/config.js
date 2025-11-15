/**
 * Konfigurationsdatei für die DOM-Trading-Anwendung
 * Enthält alle globalen Einstellungen und Konfigurationen
 */

const CONFIG = {
    // Allgemeine Anwendungseinstellungen
    initialDepth: 100,            // Initiale Anzahl der angezeigten Preisstufen
    initialRefreshRate: 500,      // Initiale Aktualisierungsrate in ms
    
    // DOM-Trading-Einstellungen
    tradingApp: {
        initialPrice: 1928.45,    // Initiale Preisanzeige
        totalLevels: 100,         // Anzahl der Preisstufen
        tickSize: 0.10,           // Größe eines Preisticks
        centerOnPrice: true,      // Zentriere auf aktuellen Preis
        orderTypes: ['limit', 'stop', 'market', 'iceberg'],
        orderTypeProbability: [0.7, 0.15, 0.1, 0.05] // Wahrscheinlichkeiten für Ordertypen
    },
    
    // Einstellungen für DOM-Renderer
    renderer: {
        maxVolume: 50,            // Maximales Volumen für Skalierung der Balken
        viewMode: 'normal',       // Ansichtsmodus: 'compact', 'normal', 'expanded'
        colorScheme: 'standard',  // Farbschema: 'standard', 'highContrast', 'monochrome'
        showTooltips: true,       // Zeige Tooltips beim Hover
        animateChanges: true      // Animiere Preisänderungen
    },
    
    // Dominanz-Features für die Preisreihen
    dominanceFeatures: {
        enabled: true,             // Dominanz-Features aktivieren
        thresholdDifference: 5,    // Schwellenwert für Volumen-Dominanz
        flowVisualization: true,   // Fluss-Visualisierung aktivieren
        trendIndicators: true      // Trend-Indikatoren anzeigen
    },
    
    // Simulationseinstellungen für Demo
    simulation: {
        volatility: 0.5,           // Volatilität (0.1 - 1.0)
        volumeRange: [1, 40],      // Bereich für zufälliges Volumen
        bigPlayerThreshold: 25,    // Schwellenwert für "Big Player"
        updateProbability: 0.3     // Wahrscheinlichkeit für Updates pro Level
    },
    
    // API-Einstellungen
    api: {
        useMockData: true,         // Mock-Daten verwenden
        mockUpdateInterval: 500,   // Intervall für Mock-Updates
        endpoints: {
            OANDA: 'https://api.oanda.com/v3/',
            FXCM: 'https://api.fxcm.com/v2/',
            IG: 'https://api.ig.com/v3/'
        }
    },
    
    // DOM-Einstellungen
    dom: {
        highlightCurrentPrice: true,   // Aktuellen Preis hervorheben
        highlightBigPlayers: true,     // Große Orders hervorheben
        showOrderTypes: true,          // Ordertypen anzeigen
        showVolumeProfile: true,       // Volumenprofil anzeigen
        separateContainers: true       // Separate Container für Ask, Spread und Bid verwenden
    },
    
    // Eventuelle zukünftige Erweiterungen
    extensions: {
        enableKeyboardShortcuts: true, // Tastaturkürzel aktivieren
        enableOrderEntry: false,       // Ordereingabe aktivieren (für zukünftige Implementierung)
        enableAlerts: false,           // Alerts aktivieren (für zukünftige Implementierung)
        debugMode: false               // Debug-Modus (erweiterte Logs)
    }
};