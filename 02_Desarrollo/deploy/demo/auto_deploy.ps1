#requires -Version 5.1
<#!
.SYNOPSIS
Despliegue local de la demo del TFC en Windows.

.DESCRIPTION
- Comprueba Python, Node.js, npm y Docker.
- Arranca Docker Desktop si hace falta y espera al daemon.
- Levanta MariaDB y Adminer con docker compose.
- Espera a que la base de datos esté lista y verifica el usuario demo.
- Compila y arranca el backend en segundo plano.
- Arranca el frontend con python -m http.server.
- Espera a /health antes de abrir el navegador.
#>

[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$ErrorActionPreference = 'Stop'

function Write-Section([string]$Text) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
}

function Write-Ok([string]$Text) { Write-Host "[v] $Text" -ForegroundColor Green }
function Write-WarnMsg([string]$Text) { Write-Host "[!] $Text" -ForegroundColor Yellow }
function Write-ErrMsg([string]$Text) { Write-Host "[X] $Text" -ForegroundColor Red }

function Get-ScriptRoot {
    if ($PSScriptRoot) { return $PSScriptRoot }
    return (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

$ScriptRoot   = Get-ScriptRoot
$ProjectRoot  = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
$BackendPath  = (Resolve-Path (Join-Path $ProjectRoot "app\backend")).Path
$FrontendPath = (Resolve-Path (Join-Path $ProjectRoot "app\frontend\public")).Path
$LogsPath     = Join-Path $ScriptRoot ".logs"
$ComposeFile  = Join-Path $ScriptRoot "docker-compose.yml"
$SeedFile     = Join-Path $ScriptRoot "db\init\02_seed.sql"

New-Item -ItemType Directory -Force -Path $LogsPath | Out-Null

$BackendStdOut = Join-Path $LogsPath "backend.stdout.log"
$BackendStdErr = Join-Path $LogsPath "backend.stderr.log"
$FrontendStdOut = Join-Path $LogsPath "frontend.stdout.log"
$FrontendStdErr = Join-Path $LogsPath "frontend.stderr.log"

function Test-CommandExists([string]$Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-ToolIfMissing([string]$FriendlyName, [string[]]$Commands, [string]$WingetId) {
    foreach ($commandName in $Commands) {
        if (Test-CommandExists $commandName) {
            Write-Ok "$FriendlyName ya está instalado."
            return
        }
    }

    Write-WarnMsg "$FriendlyName no está instalado. Instalando vía winget..."
    if (-not (Test-CommandExists 'winget')) {
        throw "No se ha encontrado winget para instalar $FriendlyName automáticamente."
    }

    & winget install --id $WingetId --exact --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo instalando $FriendlyName con winget."
    }

    foreach ($commandName in $Commands) {
        if (Test-CommandExists $commandName) {
            Write-Ok "$FriendlyName instalado correctamente."
            return
        }
    }

    throw "$FriendlyName se ha instalado, pero esta consola aún no lo detecta. Cierra PowerShell, ábrelo de nuevo y vuelve a lanzar el script."
}

function Get-NodeMajorVersion {
    try {
        $versionText = (& node -v 2>$null).Trim()
        if (-not $versionText) { return $null }
        return [int](($versionText -replace '^v','').Split('.')[0])
    } catch {
        return $null
    }
}

function Assert-NodeCompatible {
    $major = Get-NodeMajorVersion
    if ($null -eq $major) {
        throw 'No se ha podido leer la versión de Node.js.'
    }
    if ($major -lt 20) {
        throw "Este proyecto necesita Node.js moderno para usar --env-file. Detectado Node $major. Instala Node 20 o superior."
    }
    Write-Ok "Node.js compatible detectado (v$major)."
}

function Test-DockerDaemon {
    try {
        $serverVersion = (& docker version --format '{{.Server.Version}}' 2>$null | Out-String).Trim()
        return ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($serverVersion))
    } catch {
        return $false
    }
}

function Start-DockerDesktopAndWait([int]$TimeoutSeconds = 180) {
    if (Test-DockerDaemon) {
        Write-Ok 'Docker daemon operativo.'
        return
    }

    $dockerDesktopExe = Join-Path $Env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerDesktopExe) {
        Write-WarnMsg 'Docker no respondió al primer intento. Abriendo Docker Desktop y reintentando...'
        Start-Process -FilePath $dockerDesktopExe | Out-Null
    } else {
        Write-WarnMsg 'Docker no respondió al primer intento y no se encontró Docker Desktop.exe. Reintentando de todos modos...'
    }

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        if (Test-DockerDaemon) {
            Write-Ok 'Docker daemon operativo.'
            return
        }
    }

    throw 'Docker está instalado, pero el daemon no responde desde esta consola. Reinicia Docker Desktop o abre una nueva consola de PowerShell y vuelve a intentarlo.'
}

function Invoke-DockerCompose([string[]]$Arguments) {
    Push-Location $ScriptRoot
    try {
        & docker compose @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose $($Arguments -join ' ') devolvió código $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

function Wait-MariaDb([int]$TimeoutSeconds = 180) {
    Write-WarnMsg 'Esperando a que MariaDB esté lista...'
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            & docker exec kwl_demo_mariadb mariadb-admin ping -uroot -pdemo --silent *> $null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok 'MariaDB operativa.'
                return
            }
        } catch {}
        Start-Sleep -Seconds 3
    }
    throw 'MariaDB no ha quedado lista dentro del tiempo esperado.'
}

function Test-DemoUserExists {
    try {
        $result = & docker exec kwl_demo_mariadb mariadb -N -uroot -pdemo -D kwl_lavanderia -e "SELECT login FROM usuario WHERE login='admin@gmail.com' LIMIT 1;" 2>$null
        return (($result | Out-String).Trim() -eq 'admin@gmail.com')
    } catch {
        return $false
    }
}

function Install-DemoSeedIfMissing {
    if (Test-DemoUserExists) {
        Write-Ok 'Usuario demo detectado en la base de datos.'
        return
    }

    Write-WarnMsg 'No se encontró el usuario demo. Reaplicando seed...'
    if (-not (Test-Path $SeedFile)) {
        throw "No se encontró el archivo seed en: $SeedFile"
    }

    $seedLinuxPath = '/tmp/02_seed.sql'
    & docker cp $SeedFile "kwl_demo_mariadb:$seedLinuxPath"
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo copiar el seed al contenedor MariaDB.'
    }

    & docker exec kwl_demo_mariadb sh -lc "mariadb -uroot -pdemo -D kwl_lavanderia < $seedLinuxPath"
    if ($LASTEXITCODE -ne 0) {
        throw 'Fallo reaplicando el seed en MariaDB.'
    }

    if (-not (Test-DemoUserExists)) {
        throw 'Se reaplicó el seed, pero el usuario demo sigue sin existir.'
    }

    Write-Ok 'Seed demo aplicado correctamente.'
}

function Get-ProcessIdsByPort([int]$Port) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        return ($connections | Select-Object -ExpandProperty OwningProcess -Unique)
    } catch {
        return @()
    }
}

function Stop-ProcessesListeningOnPort([int]$Port, [string]$Label) {
    $pids = @(Get-ProcessIdsByPort $Port)
    if ($pids.Count -eq 0) { return }

    foreach ($pidValue in $pids) {
        try {
            $proc = Get-Process -Id $pidValue -ErrorAction Stop
            Write-WarnMsg "Cerrando proceso existente en puerto $Port ($Label): $($proc.ProcessName) PID=$pidValue"
            Stop-Process -Id $pidValue -Force -ErrorAction Stop
        } catch {
            Write-WarnMsg "No se pudo cerrar el PID $pidValue del puerto $Port."
        }
    }
    Start-Sleep -Seconds 1
}

function Start-Backend {
    Write-Section 'Configurando Backend (Node.js)'
    Stop-ProcessesListeningOnPort -Port 8080 -Label 'backend'
    Remove-Item $BackendStdOut, $BackendStdErr -Force -ErrorAction SilentlyContinue

    Push-Location $BackendPath
    try {
        & npm ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci ha fallado en el backend.' }

        & npm run build
        if ($LASTEXITCODE -ne 0) { throw 'npm run build ha fallado en el backend.' }
    } finally {
        Pop-Location
    }

    $command = "Set-Location '$BackendPath'; node --env-file=.env dist/server.js"
    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$command) -WindowStyle Hidden -RedirectStandardOutput $BackendStdOut -RedirectStandardError $BackendStdErr -PassThru
    Write-Ok "Backend lanzado en segundo plano. PID=$($process.Id)"
}

function Start-Frontend {
    Write-Section 'Levantando servidor web (Frontend)'
    Stop-ProcessesListeningOnPort -Port 8081 -Label 'frontend'
    Remove-Item $FrontendStdOut, $FrontendStdErr -Force -ErrorAction SilentlyContinue

    $pythonCommand = if (Test-CommandExists 'py') { 'py' } elseif (Test-CommandExists 'python') { 'python' } else { $null }
    if (-not $pythonCommand) {
        throw 'No se ha encontrado Python para lanzar el frontend.'
    }

    $frontendCmd = if ($pythonCommand -eq 'py') {
        "Set-Location '$FrontendPath'; py -m http.server 8081 --bind 127.0.0.1"
    } else {
        "Set-Location '$FrontendPath'; python -m http.server 8081 --bind 127.0.0.1"
    }

    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$frontendCmd) -WindowStyle Hidden -RedirectStandardOutput $FrontendStdOut -RedirectStandardError $FrontendStdErr -PassThru
    Write-Ok "Frontend lanzado en segundo plano. PID=$($process.Id)"
}

function Get-HealthJson {
    try {
        return Invoke-RestMethod -Uri 'http://127.0.0.1:8080/health' -Method Get -TimeoutSec 5
    } catch {
        return $null
    }
}

function Wait-BackendHealthy([int]$TimeoutSeconds = 120) {
    Write-WarnMsg 'Esperando a que el backend responda con la base de datos OK...'
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $health = Get-HealthJson
        if ($null -ne $health -and $health.ok -eq $true -and $health.db -eq 'ok') {
            Write-Ok 'Backend operativo y conectado a la base de datos.'
            return
        }
        Start-Sleep -Seconds 2
    }

    $stderrTail = ''
    if (Test-Path $BackendStdErr) {
        $stderrTail = (Get-Content $BackendStdErr -Tail 50 -ErrorAction SilentlyContinue | Out-String)
    }
    throw "El backend no llegó a estado sano. Revisa: $BackendStdErr`n$stderrTail"
}

try {
    Write-Section 'Iniciando configuración del entorno'
    Write-Ok "Carpeta del proyecto detectada: $ProjectRoot"

    if (-not (Test-Path $ComposeFile)) { throw "No se encontró docker-compose.yml en $ComposeFile" }
    if (-not (Test-Path $BackendPath)) { throw "No se encontró el backend en $BackendPath" }
    if (-not (Test-Path $FrontendPath)) { throw "No se encontró el frontend en $FrontendPath" }

    Install-ToolIfMissing -FriendlyName 'Python' -Commands @('py','python') -WingetId 'Python.Python.3.11'
    Install-ToolIfMissing -FriendlyName 'Node.js' -Commands @('node') -WingetId 'OpenJS.NodeJS.LTS'
    Install-ToolIfMissing -FriendlyName 'npm' -Commands @('npm') -WingetId 'OpenJS.NodeJS.LTS'
    Install-ToolIfMissing -FriendlyName 'Docker' -Commands @('docker') -WingetId 'Docker.DockerDesktop'
    Assert-NodeCompatible
    Start-DockerDesktopAndWait -TimeoutSeconds 180

    Write-Section 'Levantando servicios Docker (DB + Adminer)'
    Invoke-DockerCompose -Arguments @('up','-d')
    Write-Ok 'docker compose up -d ejecutado.'

    Wait-MariaDb -TimeoutSeconds 180
    Install-DemoSeedIfMissing

    Start-Backend
    Start-Frontend
    Wait-BackendHealthy -TimeoutSeconds 120

    Write-Host ''
    Write-Host 'Abriendo aplicación web en el navegador...' -ForegroundColor Cyan
    Start-Process 'http://127.0.0.1:8081/index.html'

    Write-Section '¡DESPLIEGUE COMPLETADO!'
    Write-Host 'URLs:' -ForegroundColor Cyan
    Write-Host '  - Frontend: http://127.0.0.1:8081/index.html (admin@gmail.com / admin)' -ForegroundColor Cyan
    Write-Host '  - Backend : http://127.0.0.1:8080/health' -ForegroundColor Cyan
    Write-Host '  - Adminer : http://127.0.0.1:8082' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Logs:' -ForegroundColor Cyan
    Write-Host "  - Backend stdout: $BackendStdOut" -ForegroundColor Cyan
    Write-Host "  - Backend stderr: $BackendStdErr" -ForegroundColor Cyan
    Write-Host "  - Frontend stdout: $FrontendStdOut" -ForegroundColor Cyan
    Write-Host "  - Frontend stderr: $FrontendStdErr" -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Si el login falla, prueba primero:' -ForegroundColor Yellow
    Write-Host '  http://127.0.0.1:8080/health' -ForegroundColor Yellow
} catch {
    Write-ErrMsg $_.Exception.Message
    if (Test-Path $BackendStdErr) {
        $backendErr = (Get-Content $BackendStdErr -Tail 30 -ErrorAction SilentlyContinue | Out-String).Trim()
        if ($backendErr) {
            Write-Host ''
            Write-Host '--- Últimas líneas backend.stderr.log ---' -ForegroundColor DarkYellow
            Write-Host $backendErr
        }
    }
    exit 1
}
