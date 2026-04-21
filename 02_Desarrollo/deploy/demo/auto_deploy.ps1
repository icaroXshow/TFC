<#
.SYNOPSIS
Script para configurar el entorno de desarrollo en Windows, instalando Python y Docker si son necesarios,
y levantando el servidor del frontend.
#>

# Forzar codificación UTF-8 para ver bien los acentos
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Iniciando configuración del entorno" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Comprobar e instalar Python
$pythonInstalado = (Get-Command "python" -ErrorAction SilentlyContinue) -or (Get-Command "py" -ErrorAction SilentlyContinue)

if (-not $pythonInstalado) {
    Write-Host "[!] Python no está instalado. Instalando vía winget..." -ForegroundColor Yellow
    winget install --id Python.Python.3.11 --exact --source winget --accept-package-agreements --accept-source-agreements
    Write-Host "[v] Python instalado." -ForegroundColor Green
} else {
    Write-Host "[v] Python ya está instalado." -ForegroundColor Green
}

# 2. Comprobar e instalar Docker
$dockerInstalado = Get-Command "docker" -ErrorAction SilentlyContinue

if (-not $dockerInstalado) {
    Write-Host "[!] Docker no está instalado. Instalando Docker Desktop vía winget..." -ForegroundColor Yellow
    winget install --id Docker.DockerDesktop --exact --source winget --accept-package-agreements --accept-source-agreements
    Write-Host "[!] ADVERTENCIA: Es posible que necesites reiniciar el ordenador para que Docker Desktop funcione correctamente." -ForegroundColor Red
} else {
Write-Host "[v] Docker ya está instalado." -ForegroundColor Green
Write-Host ""
Write-Host "Levantando servicios Docker (DB + Adminer)..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
docker compose up -d
Write-Host "[v] DB/Adminer listos en puerto 3307/8082." -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Configurando Backend (Node.js)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$BackendPath = Join-Path $PSScriptRoot "..\..\app\backend"
Set-Location $BackendPath
npm ci
npm run build
Write-Host "[v] Backend listo en puerto 8080."
Start-Process powershell.exe -ArgumentList "-ExecutionPolicy","Bypass", "-NoExit", "-Command", "Set-Location '$BackendPath'; node --env-file=.env dist/server.js"
Set-Location $PSScriptRoot

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Levantando servidor web (Frontend)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 3. Levantar el servidor de desarrollo
$FrontendPath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\app\frontend\public"

if (Test-Path $FrontendPath) {
    Write-Host "-> Cambiando al directorio del frontend..."
    Set-Location -Path $FrontendPath
    
    $puerto = 8081
    Write-Host "-> Iniciando servidor en el puerto $puerto en segundo plano..."
    
    # Intentar con py primero, luego python
    if (Get-Command "py" -ErrorAction SilentlyContinue) {
        Start-Process -NoNewWindow -FilePath "py" -ArgumentList "-m http.server $puerto --bind 0.0.0.0"
        Write-Host "[v] Servidor iniciado en http://localhost:$puerto" -ForegroundColor Green
    } elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
        Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m http.server $puerto --bind 0.0.0.0"
        Write-Host "[v] Servidor iniciado en http://localhost:$puerto" -ForegroundColor Green
    } else {
        Write-Host "[X] Error: No se ha podido ejecutar Python." -ForegroundColor Red
        Write-Host "Si acaba de instalarse, por favor cierra y vuelve a abrir esta terminal (o reinicia el equipo)." -ForegroundColor Yellow
    }
} else {
    Write-Host "[X] No se encontró el directorio del frontend en: $FrontendPath" -ForegroundColor Red
}

Start-Sleep -Seconds 5
Write-Host ""
Write-Host "Abriendo aplicación web en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:8081/index.html"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "¡DESPLIEGUE COMPLETADO!" -ForegroundColor Green
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:8081/index.html (admin@gmail.com / admin)" -ForegroundColor Cyan
Write-Host "  - Backend: http://localhost:8080/health" -ForegroundColor Cyan
Write-Host "  - DB Adminer: http://localhost:8082" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Presiona Ctrl+C en terminales para parar." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
