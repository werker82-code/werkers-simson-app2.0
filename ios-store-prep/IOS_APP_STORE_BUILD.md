# iOS / App Store Build

**App:** Werkers Simson  
**Bundle ID:** `com.werkerswerkstatt.simson`  
**Version:** `3.8.1`  
**Minimum iOS target for Capacitor 8:** iOS 15  
**Required build environment for 2026 submission:** Xcode 26 / iOS 26 SDK or later.

On a Mac:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then in Xcode:

1. Select your Apple Developer Team under **Signing & Capabilities**.
2. Confirm Bundle Identifier `com.werkerswerkstatt.simson`.
3. Set Version `3.8.1` and a build number.
4. Set iOS Deployment Target to 15.0 or later.
5. Test file/photo selection, backup import/export, local storage, external links and rotation.
6. Add/check `PrivacyInfo.xcprivacy` if Xcode or a plugin requires reason APIs.
7. Product → Archive.
8. Distribute App → App Store Connect → Upload.
9. Select the uploaded build in App Store Connect and submit for review.

No `.ipa` can be produced here because Apple requires Xcode/macOS and your Apple Developer signing identity.
