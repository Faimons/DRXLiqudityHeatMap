# DOM Trading Visualisierung

Dieses Projekt ist eine fortschrittliche DOM (Depth of Market) Trading-Visualisierung für Gold (XAU/USD), die in reinem JavaScript, HTML und CSS implementiert wurde. Sie bietet eine detaillierte und interaktive Ansicht des Orderbooks und der Markttiefe.

## Funktionen

- **Echtzeit-DOM-Visualisierung**: Zeigt Bid- und Ask-Orders mit Volumen-Balken an
- **Separate Container**: Klare Trennung zwischen Bid-, Ask- und Spread-Bereichen
- **Ordertyp-Differenzierung**: Visuelle Unterscheidung zwischen Market-, Limit-, Stop- und Iceberg-Orders
- **Volumen-Profil**: Visualisierung der Volumenverteilung am rechten Rand
- **Preisänderungs-Animationen**: Dynamische Animationen für Preisbewegungen
- **Liquiditätsfluss-Visualisierung**: Anzeige des Geldflusses zwischen Käufern und Verkäufern
- **Marktneigung-Indikatoren**: Visuelle Hinweise auf Marktdruck (bullish/bearish)
- **Verschiedene Ansichtsmodi**: Kompakt, Normal, Erweitert
- **Tastatursteuerung**: Schnelle Navigation und Steuerung über Tastaturkürzel
- **Aktivitätslog**: Protokollierung wichtiger Marktaktivitäten
- **Responsives Design**: Anpassung an verschiedene Bildschirmgrößen

## Projektstruktur

```
C:\dev\DOMTRADING\Dom\
│
├── index.html                # Hauptdatei
│
├── css/
│   ├── main.css              # Allgemeine Stil-Definitionen
│   └── dom.css               # DOM-spezifische Stile
│
├── js/
│   ├── config.js             # Konfigurationseinstellungen
│   ├── data.js               # Marktdaten-Verwaltung
│   ├── api-connector.js      # Datenquellen-Verbindung
│   ├── dom-renderer.js       # DOM-Visualisierungslogik
│   ├── order-flow.js         # Orderflow-Analyse
│   └── main.js               # Hauptanwendungslogik
│
└── README.md                 # Projektdokumentation
```

## Installation und Ausführung

1. Klone das Repository oder lade die Dateien herunter
2. Öffne die `index.html` Datei in einem modernen Webbrowser
3. Klicke auf "Verbinden", um die Simulation zu starten

Da das Projekt in reinem JavaScript geschrieben ist, sind keine zusätzlichen Abhängigkeiten oder Installationsschritte erforderlich.

## Benutzung

- **Verbinden**: Klicke auf den "Verbinden"-Button, um die Datenquelle zu aktivieren
- **Einstellungen**: Passe Preisstufen, Tick-Größe und Aktualisierungsrate an
- **Ansicht**: Wähle zwischen kompakter, normaler und erweiterter Ansicht
- **Tastaturkürzel**:
  - `+/-`: Erhöhe/verringere die DOM-Tiefe
  - `C`: Aktiviere/deaktiviere Zentrierung auf aktuellen Preis
  - `1/2/3`: Wechsle zwischen Ansichtsmodi

## Datenquellen

Diese Version verwendet simulierte Daten für Demo-Zwecke. Die Anwendung ist jedoch so konzipiert, dass sie leicht an verschiedene Datenquellen (OANDA, FXCM, IG, etc.) angepasst werden kann. Die API-Connector-Schnittstelle bietet Platzhalter für echte API-Implementierungen.

## Funktionalitäten im Detail

### DOM-Renderer

Der DOM-Renderer visualisiert das Orderbuch in separaten Containern für Bid, Ask und Spread. Dies ermöglicht eine klare und übersichtliche Darstellung der Markttiefe. Er unterstützt verschiedene Ansichtsmodi und reagiert auf Preisänderungen mit Animationen.

### Orderflow-Analyse

Die Orderflow-Analyse-Komponente ermöglicht:
- Erkennung von Eisberg-Orders
- Identifikation von Volumen-Clustern
- Berechnung von Marktneigung
- Erkennung wichtiger Liquiditätsniveaus

### Marktdaten-Verwaltung

Die Marktdaten-Komponente verwaltet das virtuelle Orderbuch und bietet Funktionen zum:
- Hinzufügen und Entfernen von Orders
- Berechnen von kumulativen Summen
- Simulieren von Preisänderungen
- Berechnen von Spread und anderen Marktdaten

## Weitere Entwicklung

Mögliche Erweiterungen:
- Implementierung echter API-Verbindungen
- Hinzufügen von Ordereingabe-Funktionalität
- Integration von technischen Indikatoren
- Erweiterung um Charting-Funktionen
- Einbindung von Risikomanagement-Tools
- Unterstützung für weitere Finanzinstrumente

## Lizenz

Dieses Projekt steht unter einer offenen Lizenz zur Verfügung.

## Autor

Entwickelt als DOM-Trading-Visualisierungsprojekt.