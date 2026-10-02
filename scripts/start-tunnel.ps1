$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$log = Join-Path $env:USERPROFILE ".cloudflared\tunnel.log"

if (Get-Process cloudflared -ErrorAction SilentlyContinue) {
  Write-Output "cloudflared is already running"
  exit 0
}

New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
$command = "cmd.exe /c `"`"$cloudflared`" tunnel run rentitout-laptop >> `"$log`" 2>&1`""
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $command }
if ($result.ReturnValue -ne 0) {
  Write-Error "Could not start the tunnel. Win32_Process.Create returned $($result.ReturnValue)"
  exit 1
}

Write-Output "Tunnel started apart from this window. Log: $log"
