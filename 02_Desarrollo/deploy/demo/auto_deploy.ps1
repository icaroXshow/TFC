#requires -Version 5.1
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot

function Show-Menu {
    Clear-Host
    Write-Host "=== TFC Lavanderia Demo - Menu Principal ===" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Gray
    Write-Host " 1. INSTALAR/LANZAR" -ForegroundColor Green
    Write-Host " 2. ACTUALIZAR DOCKERS (pull + up) (Requiere WSL+DOCKER)" -ForegroundColor Yellow
    Write-Host " 3. ACTUALIZAR BD (down -v + up)" -ForegroundColor Magenta
    Write-Host " 4. TEST (Requiere Git)" -ForegroundColor Green
    Write-Host " 5. ESTADO" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Gray
    Write-Host " Q - SALIR" -ForegroundColor red
    Write-Host "" -ForegroundColor Gray
    $choice = Read-Host "Elige opcion (0-5)"
    $choice = $choice.Trim()
    return $choice
}

function Ensure-Dependencies {
    # WSL
    if (-not (Get-Command wsl -ErrorAction SilentlyContinue)) {
        Write-Host 'Instalando WSL...' -ForegroundColor Yellow
        wsl --install
        Read-Host 'Reinicia PC, instala Docker Desktop, presiona Enter'
    }
    # Docker Desktop check
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Start-Process 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
        Read-Host 'Instala Docker Desktop (ejecuta el instalador), reinicia si pide, presiona Enter'
    }
    # Bash para tests (Git Bash o WSL)
    if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
        Write-Host 'Instala Git para bash: https://git-scm.com/download/win' -ForegroundColor Yellow
        Read-Host 'Instala Git, presiona Enter'
    }
    docker compose version > $null 2>$null | Out-Null
    if (-not $?) {
        throw 'Docker Compose no listo. Reinicia tu maquina.'
    }
    if (-not (Test-Path 'docker-compose.yml')) {
        throw 'docker-compose.yml no encontrado.'
    }
    if (-not (Test-Path '.env')) {
        if (Test-Path '.env.example') {
            Copy-Item '.env.example' '.env' -Force
            Write-Host '[INFO] .env creado' -ForegroundColor Green
        } else {
            throw '.env.example no encontrado.'
        }
    }
}

function Invoke-DockerCompose {
    param([string[]]$Args)
    & docker compose @Args
    if ($LASTEXITCODE -ne 0) { 
        docker compose logs --tail=100
        throw "docker compose @Args fallo."
    }
}

function Wait-Health {
    $backendOk = Wait-Url 'http://127.0.0.1:8080/health' 180
    $frontendOk = Wait-Url 'http://127.0.0.1:8081/index.html' 90
    if (-not $backendOk -or -not $frontendOk) {
        docker compose logs --tail=100 core-node core-nginx mariadb
        throw 'Health check fallo.'
    }
    Write-Host '✓ Todos servicios OK' -ForegroundColor Green
}

function Wait-Url {
    param([string]$Url, [int]$TimeoutSec = 180)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 | Out-Null
            return $true
        } catch { Start-Sleep 2 }
    }
    return $false
}

function Show-URLs {
    Write-Host 'Demo lista!' -ForegroundColor Green
    Write-Host 'Frontend: http://127.0.0.1:8081/index.html' -ForegroundColor Cyan
    Write-Host 'Backend: http://127.0.0.1:8080/health' -ForegroundColor Cyan
    Write-Host 'Adminer: http://127.0.0.1:8082' -ForegroundColor Cyan
    Write-Host 'MQTT: mqtt://127.0.0.1:1883' -ForegroundColor Cyan
    Write-Host 'Redis: redis://127.0.0.1:6379' -ForegroundColor Cyan
    Write-Host ''
    Read-Host 'Presiona Enter para abrir en navegador...'
    Start-Process 'http://127.0.0.1:8081/index.html'
    Start-Process 'http://127.0.0.1:8083'
    Start-Process 'http://127.0.0.1:8080/health'
    Start-Process 'http://127.0.0.1:8082'
}

function Run-SmokeTests {
    $scripts = @('scripts\soft_load_test.sh', 'scripts\timer_drift_check.sh', 'scripts\machine_regression_check.sh')
    $found = $false
    foreach ($rel in $scripts) {
        $script = Join-Path $ScriptRoot $rel
        if (Test-Path $script) {
            $found = $true
            Write-Host "[TEST] $rel" -ForegroundColor Yellow
            try {
                bash $script
            } catch {
                Write-Warning "Fallo $rel (bash/script error)"
            }
        }
    }
    if (-not $found) { Write-Warning 'No se encontraron los scripts de testeo' }
}

# Menu principal
while ($true) {
    try {
        $choice = Show-Menu

        switch ($choice) {
            '1' { 
                Ensure-Dependencies
                docker compose down -v
                docker compose up -d --build
                Wait-Health
                Show-URLs
            }
            '2' { 
                Ensure-Dependencies
                Invoke-DockerCompose pull
                Invoke-DockerCompose up, '-d'
                Wait-Health
                Show-URLs
            }
            '3' { 
                Ensure-Dependencies
                Invoke-DockerCompose down, '-v'
                Invoke-DockerCompose up, '-d', '--build'
                Wait-Health
                Show-URLs 
            }
            '4' { 
                Ensure-Dependencies
                Run-SmokeTests
                Read-Host 'Tests finalizados'
            }
'5' { 
                docker compose ps
                docker compose logs --tail=20
                Show-URLs 
            }
            'Q' { exit }
            default { Write-Host 'Opcion invalida' -ForegroundColor Red; Start-Sleep 1 }
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host 'Presiona Enter para volver al menu...'
    }
}

