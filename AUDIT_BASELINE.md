# Werkers Simson App – Android/iOS Audit

Arbeitsbasis: 5.0.1 / Build 50001

Ziel: gemeinsamer, konsistenter Release-Stand für Android und iOS.

Prüfpunkte:
- Web-App Start und Navigation
- Android Zurück-Navigation
- FIN-Prüfung (Modell/Baujahr/Export/Bildzuordnung)
- 3D-Konfigurator und GLB-Assets
- Offline-Verhalten und lokale Assets
- Android Build/Signing
- iOS Build/TestFlight-Konfiguration
- Versionsabgleich zwischen Web, Android und iOS

Erste Korrekturen:
- Versionsmetadaten auf 5.0.1 / Build 50001 vereinheitlicht.
- Android-Dateiauswahl verarbeitet nun auch mehrere ausgewählte Dateien (ClipData).
- WebView/File-Chooser werden beim Beenden sauber freigegeben.

Noch zu verifizieren:
- SPA-Navigation muss Browser-History erzeugen, damit Android Back zuverlässig zwischen Ansichten arbeitet.
- FIN-Logik und Datenbasis müssen gegen Modell/Baujahr/Export-Mapping geprüft werden.
- GLB-Dateipfade, Loader und Offline-Abhängigkeiten müssen vollständig geprüft werden.
- iOS-Projekt/Workflow muss auf Version, Bundle-ID, Signing und TestFlight-Build geprüft werden.

Änderungen werden zunächst auf fix/app-audit-2026-09-16 geprüft und erst anschließend nach main übernommen.
