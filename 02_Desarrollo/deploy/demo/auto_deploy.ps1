#requires -Version 5.1
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot

$resetDb = $args -contains '--reset-db'
$sinAbrir = $args -contains '--sin-abrir'

if ($resetDb) {
  docker compose down -v
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'docker compose up -d --build ha fallado.' }

function Wait-Url([string]$Url, [int]$TimeoutSec = 180) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 | Out-Null
      return $true
    } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

if (-not (Wait-Url -Url 'http://127.0.0.1:8080/health' -TimeoutSec 180)) {
  docker compose logs --tail=100 core-node core-nginx mariadb
  throw 'Backend no responde en /health.'
}

if (-not (Wait-Url -Url 'http://127.0.0.1:8081/index.html' -TimeoutSec 90)) {
  docker compose logs --tail=100 core-nginx
  throw 'Frontend no responde en /index.html.'
}

Write-Host 'Demo levantada correctamente.' -ForegroundColor Green
Write-Host 'Frontend: http://127.0.0.1:8081/index.html' -ForegroundColor Cyan
Write-Host 'Backend : http://127.0.0.1:8080/health' -ForegroundColor Cyan
Write-Host 'Adminer : http://127.0.0.1:8082' -ForegroundColor Cyan
Write-Host 'MQTT    : mqtt://127.0.0.1:1883' -ForegroundColor Cyan
Write-Host 'Redis   : redis://127.0.0.1:6379' -ForegroundColor Cyan

if (-not $sinAbrir) {
  Start-Process 'http://127.0.0.1:8081/index.html' | Out-Null
}
