WERKERS SIMSON – STORE RELEASE 3.8.1
==============================================

Dieses Paket ist aus App-Version 3.8 hervorgegangen und für die Store-Einreichung
vorbereitet.

Enthalten:
- vollständige Web-/PWA-App
- Capacitor-8-Konfiguration für Android und iOS
- Android-Store-Projekt mit targetSdk/compileSdk 36
- iOS-Buildvorbereitung für Xcode 26
- Google-Play-Metadaten
- Apple-App-Store-Metadaten
- Datenschutz- und Supportseiten
- Data-Safety/App-Privacy-Vorschläge
- Store-Icon und Feature Graphic
- echte UI-Screenshots aus dem App-Build
- Store-Freigabecheckliste

WAS NOCH NICHT IM PAKET SEIN KANN
- signiertes Google-Play-AAB: benötigt deinen privaten Upload-Key / Entwickleraccount
- signiertes Apple-Archiv/IPA: benötigt macOS, Xcode 26 und dein Apple Developer Team
- tatsächlicher Upload in Play Console/App Store Connect

CAPACITOR 8
- Node.js 22+
- Android Studio Otter 2025.2.1+
- Android API 36
- iOS 15+ Deployment Target
- Xcode 26+

GOOGLE PLAY
Öffne `android-store-project` in Android Studio und erzeuge:
Build > Generate Signed App Bundle or APK > Android App Bundle

APPLE
Auf einem Mac:
npm install
npx cap add ios
npx cap sync ios
npx cap open ios

Vor dem Store-Upload die Dateien aus `store-submission/legal` auf deiner Website
öffentlich per HTTPS bereitstellen und die URLs in den Store-Einträgen prüfen.
