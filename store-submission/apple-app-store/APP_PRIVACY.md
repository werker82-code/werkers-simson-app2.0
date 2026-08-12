# Apple App Privacy – Vorschlag

Der vorbereitete Release enthält keine Analytics-, Werbe-, Tracking- oder Login-SDKs.
Fahrzeugdaten, FIN, Reparaturen, Kosten, Fotos und Dokumente werden lokal gespeichert
und nicht automatisch an den Entwickler übertragen.

Für App Store Connect ist daher voraussichtlich **Data Not Collected** passend, sofern
der finale Xcode-Build unverändert bleibt.

Wichtig:
- App Privacy muss den finalen Build einschließlich aller Drittanbieter-SDKs abbilden.
- Externe Links, die der Nutzer bewusst im Browser öffnet, sind getrennt von der lokalen App-Verarbeitung zu betrachten.
- Falls später Cloud-Backup, Benutzerkonto, Crash Analytics, Werbung oder Push hinzukommt, neu bewerten.
