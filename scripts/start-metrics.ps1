$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$tools = Join-Path $env:USERPROFILE ".rentitout"
$promExe = Join-Path $tools "tools\prometheus-3.15.0.windows-amd64\prometheus.exe"
$promConfig = Join-Path $repo "loadtests\prometheus.yml"
$promData = Join-Path $tools "prometheus-data"
$promLog = Join-Path $tools "prometheus.log"
$grafanaData = Join-Path $tools "grafana-data"
$grafanaLogs = Join-Path $tools "grafana-logs"
$grafanaProvisioning = Join-Path $repo "loadtests\grafana\provisioning"

function Test-PortListening([int] $Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Start-Detached([string] $CommandLine) {
  $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $CommandLine }
  if ($result.ReturnValue -ne 0) {
    Write-Error "Could not start process. Win32_Process.Create returned $($result.ReturnValue)"
  }
}

function Write-Launcher([string] $Path, [string] $Body) {
  Set-Content -Path $Path -Value $Body -Encoding ascii
}

if (-not (Test-Path $promExe)) {
  Write-Error "Prometheus was not found at $promExe"
}

New-Item -ItemType Directory -Force -Path $promData, $grafanaData, $grafanaLogs, (Join-Path $repo "loadtests\grafana\dashboards"), (Join-Path $grafanaProvisioning "plugins"), (Join-Path $grafanaProvisioning "alerting") | Out-Null

if (Test-PortListening 9090) {
  Write-Output "Prometheus is already listening on 127.0.0.1:9090"
} else {
  $promLauncher = Join-Path $tools "start-prometheus.cmd"
  Write-Launcher $promLauncher @"
@echo off
"$promExe" --config.file="$promConfig" --web.listen-address=127.0.0.1:9090 --web.enable-remote-write-receiver --storage.tsdb.path="$promData" --storage.tsdb.retention.time=7d
"@
  Start-Detached "cmd.exe /c `"`"$promLauncher`" >> `"$promLog`" 2>&1`""
  Write-Output "Prometheus started. Log: $promLog"
}

$grafanaExe = @(
  "C:\Program Files\GrafanaLabs\grafana\bin\grafana-server.exe",
  "C:\Program Files\GrafanaLabs\grafana\bin\grafana.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $grafanaExe) {
  Write-Error "Grafana was not found under C:\Program Files\GrafanaLabs\grafana"
}

$grafanaIni = "C:\Program Files\GrafanaLabs\grafana\conf\custom.ini"
$grafanaPortLocked = $false
if (Test-Path $grafanaIni) {
  $grafanaPortLocked = [bool](Select-String -Path $grafanaIni -Pattern "^\s*http_port\s*=\s*3030\s*$" -Quiet)
}
if (-not $grafanaPortLocked) {
  Write-Error "Grafana is not locked to port 3030. Its installer default is port 3000, which belongs to the website."
}

$grafanaService = Get-Service -Name "Grafana" -ErrorAction SilentlyContinue
if ($grafanaService -and $grafanaService.Status -eq "Running") {
  try {
    Stop-Service -Name "Grafana" -Force -ErrorAction Stop
    Set-Service -Name "Grafana" -StartupType Manual -ErrorAction Stop
    Write-Output "Stopped the Grafana Windows service. The dashboard is started by this script on port 3030."
  } catch {
    Write-Output "The Grafana Windows service is running and this window could not stop it. Stop it in an Administrator PowerShell: Stop-Service Grafana -Force; Set-Service Grafana -StartupType Manual"
  }
}

if (Test-PortListening 3030) {
  Write-Output "Grafana is already listening on 127.0.0.1:3030"
} else {
  $grafanaHome = Split-Path (Split-Path $grafanaExe -Parent) -Parent
  $grafanaLauncher = Join-Path $tools "start-grafana.cmd"
  Write-Launcher $grafanaLauncher @"
@echo off
set GF_SERVER_HTTP_ADDR=127.0.0.1
set GF_SERVER_HTTP_PORT=3030
set GF_PATHS_DATA=$grafanaData
set GF_PATHS_LOGS=$grafanaLogs
set GF_PATHS_PROVISIONING=$grafanaProvisioning
set GF_AUTH_ANONYMOUS_ENABLED=true
set GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
set GF_ANALYTICS_REPORTING_ENABLED=false
set GF_ANALYTICS_CHECK_FOR_UPDATES=false
"$grafanaExe" server --homepath "$grafanaHome"
"@
  $grafanaLog = Join-Path $grafanaLogs "grafana.log"
  Start-Detached "cmd.exe /c `"`"$grafanaLauncher`" >> `"$grafanaLog`" 2>&1`""
  Write-Output "Grafana started at http://127.0.0.1:3030"
}

Write-Output "Dashboard folder: RentItOut. Prometheus: http://127.0.0.1:9090"
