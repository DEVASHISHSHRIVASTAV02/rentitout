param(
  [ValidateSet("smoke", "browse", "capacity")]
  [string] $Profile = "smoke",
  [string] $BaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"
$k6 = "C:\Program Files\k6\k6.exe"
$script = Join-Path $PSScriptRoot "..\loadtests\public-pages.js"

if (-not (Test-Path $k6)) {
  Write-Error "k6 was not found at $k6"
}

$env:K6_PROMETHEUS_RW_SERVER_URL = "http://127.0.0.1:9090/api/v1/write"
$env:K6_PROMETHEUS_RW_TREND_STATS = "avg,med,max,p(95),p(99)"

Write-Output "Profile: $Profile"
Write-Output "Target:  $BaseUrl"
Write-Output "Grafana: http://127.0.0.1:3030"

& $k6 run --no-usage-report -o experimental-prometheus-rw -e "BASE_URL=$BaseUrl" -e "PROFILE=$Profile" $script
exit $LASTEXITCODE
