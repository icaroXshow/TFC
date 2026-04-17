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
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Levantando servidor web (Frontend)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 3. Levantar el servidor de desarrollo
$FrontendPath = Join-Path -Path $PSScriptRoot -ChildPath "app\frontend\public"

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

Write-Host ""
Write-Host "Proceso completado. Presiona cualquier tecla para salir..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
