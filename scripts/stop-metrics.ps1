$ErrorActionPreference = "Stop"

Get-Process prometheus, grafana-server, grafana -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Output "Prometheus and Grafana stopped."
