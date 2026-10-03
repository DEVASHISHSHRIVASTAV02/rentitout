$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Output "Building the latest app..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "Build failed. The previous app was left as it was."
  exit $LASTEXITCODE
}

pm2 delete all 2>$null
pm2 start ecosystem.config.js
if ($LASTEXITCODE -ne 0) {
  Write-Error "PM2 did not start the app."
  exit $LASTEXITCODE
}

pm2 save
pm2 status
