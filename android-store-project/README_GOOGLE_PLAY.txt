GOOGLE PLAY RELEASE
===================
Projektstatus:
- applicationId: com.werkerswerkstatt.simson
- versionName: 3.8.1
- versionCode: 381
- minSdk: 24
- targetSdk/compileSdk: 36 (Android 16)
- keine INTERNET-Berechtigung im nativen Release
- lokale WebView-Inhalte; externe Links werden an den Systembrowser übergeben
- Datei-/Fotoauswahl über Android-Dateiauswahl

Zum Erzeugen eines AAB:
1. Projekt in Android Studio Otter 2025.2.1 oder neuer öffnen.
2. JDK 21 verwenden.
3. Gradle-Sync durchführen.
4. Build > Generate Signed App Bundle or APK > Android App Bundle.
5. Upload-Key erstellen/auswählen und Release-AAB signieren.
6. AAB in Play Console hochladen.

Hinweis:
Die Gradle-Wrapper-Eigenschaft ist vorbereitet. Die binäre gradle-wrapper.jar ist
in dieser Umgebung nicht erzeugbar; Android Studio kann das Projekt importieren
und den Build/Wrapper vervollständigen.
