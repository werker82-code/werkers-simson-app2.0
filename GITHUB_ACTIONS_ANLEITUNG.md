# GitHub Actions – Werkers Simson

## Erster Test-Build ohne Android Studio
1. Inhalt dieses Ordners in dein GitHub-Repository hochladen.
2. Auf GitHub `Actions` öffnen.
3. `Build Werkers Simson AAB` auswählen.
4. `Run workflow`.
5. `Signiertes AAB ...?` zunächst AUS lassen.
6. Nach erfolgreichem Lauf unten unter `Artifacts` das `werkers-simson-UNSIGNED-aab` herunterladen.

Das prüft zuerst, ob das Projekt in GitHub sauber baut.

## Signiertes Google-Play-AAB
Dafür müssen unter:
`Settings` → `Secrets and variables` → `Actions`
diese vier Repository Secrets angelegt sein:

- ANDROID_KEYSTORE_BASE64
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Dann den Workflow erneut starten und `Signiertes AAB ...?` aktivieren.

Das Artefakt heißt anschließend:
`werkers-simson-SIGNED-aab`

## Wichtige Build-Daten
- App ID: com.werkerswerkstatt.simson
- Version: 3.8.1
- Version Code: 381
- compileSdk / targetSdk: 36
- minSdk: 24
- AGP: 8.13
- Gradle: 8.13
- Java: 17

WICHTIG:
Die .jks-Datei niemals direkt ins GitHub-Repository hochladen.
