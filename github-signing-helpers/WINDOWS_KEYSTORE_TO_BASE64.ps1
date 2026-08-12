param([string]$Keystore="werkers-upload-key.jks")
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $Keystore))) | Set-Content -NoNewline "keystore-base64.txt"
Write-Host "Fertig: keystore-base64.txt"
