[CmdletBinding()]
param(
    [switch]$SoloFrontend,
    [switch]$SoloBackend,
    [switch]$ResetDB,
    [switch]$AbrirNavegador = $true
)

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

function Write-Info([string]$Texto) { Write-Host "[*] $Texto" -ForegroundColor Cyan }
function Write-Ok([string]$Texto)   { Write-Host "[v] $Texto" -ForegroundColor Green }
function Write-WarnMsg([string]$Texto) { Write-Host "[!] $Texto" -ForegroundColor Yellow }
function Write-Fail([string]$Texto) { Write-Host "[X] $Texto" -ForegroundColor Red }

function Test-Comando([string]$Nombre) {
    return $null -ne (Get-Command $Nombre -ErrorAction SilentlyContinue)
}

function Assert-ExisteRuta([string]$Ruta, [string]$Descripcion) {
    if (-not (Test-Path $Ruta)) {
        throw "No se encontró $Descripcion en: $Ruta"
    }
}

function Test-DockerDaemon {
    try {
        $serverVersion = & docker version --format "{{.Server.Version}}" 2>$null
        return ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($serverVersion | Out-String).Trim()))
    } catch {
        return $false
    }
}

function Start-DockerDesktopAndWait {
    if (-not (Test-Comando 'docker')) {
        throw 'Docker no está instalado. Ejecuta antes auto_deploy.ps1.'
    }

    if (Test-DockerDaemon) {
        Write-Ok 'Docker daemon operativo.'
        return
    }

    $dockerDesktopExe = Join-Path $Env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerDesktopExe) {
        Write-WarnMsg 'Docker no respondió al primer intento. Abriendo Docker Desktop...'
        Start-Process -FilePath $dockerDesktopExe | Out-Null
    } else {
        Write-WarnMsg 'Docker Desktop.exe no se encontró. Reintentando con el daemon actual...'
    }

    $limite = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $limite) {
        Start-Sleep -Seconds 3
        if (Test-DockerDaemon) {
            Write-Ok 'Docker daemon operativo.'
            return
        }
    }

    throw 'Docker está instalado, pero el daemon no responde. Abre Docker Desktop manualmente y vuelve a ejecutar el script.'
}

function Wait-TcpPort([string]$Host, [int]$Puerto, [int]$TimeoutSegundos = 60) {
    $limite = (Get-Date).AddSeconds($TimeoutSegundos)
    while ((Get-Date) -lt $limite) {
        try {
            $cliente = [System.Net.Sockets.TcpClient]::new()
            $iar = $cliente.BeginConnect($Host, $Puerto, $null, $null)
            $ok = $iar.AsyncWaitHandle.WaitOne(1200, $false)
            if ($ok -and $cliente.Connected) {
                $cliente.EndConnect($iar)
                $cliente.Dispose()
                return $true
            }
            $cliente.Dispose()
        } catch {}
        Start-Sleep -Milliseconds 800
    }
    return $false
}

function Wait-HttpJsonField([string]$Uri, [string]$Campo, [string]$ValorEsperado, [int]$TimeoutSegundos = 90) {
    $limite = (Get-Date).AddSeconds($TimeoutSegundos)
    while ((Get-Date) -lt $limite) {
        try {
            $respuesta = Invoke-RestMethod -Uri $Uri -TimeoutSec 5
            $valor = $respuesta.$Campo
            if ($valor -eq $ValorEsperado) {
                return $true
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
    return $false
}

function Get-PidFromFile([string]$RutaPid) {
    if (-not (Test-Path $RutaPid)) { return $null }
    try {
        $contenido = (Get-Content $RutaPid -Raw).Trim()
        if ([string]::IsNullOrWhiteSpace($contenido)) { return $null }
        return [int]$contenido
    } catch {
        return $null
    }
}

function Stop-ProcessIfRunning([string]$RutaPid, [string]$NombreAmigable) {
    $pidValue = Get-PidFromFile $RutaPid
    if ($null -eq $pidValue) { return }

    $proceso = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($null -ne $proceso) {
        try {
            Stop-Process -Id $pidValue -Force -ErrorAction Stop
            Write-Ok "$NombreAmigable detenido (PID $pidValue)."
        } catch {
            Write-WarnMsg "No se pudo detener $NombreAmigable (PID $pidValue)."
        }
    }

    Remove-Item $RutaPid -Force -ErrorAction SilentlyContinue
}

function Start-Backend {
    param(
        [string]$BackendPath,
        [string]$RunPath,
        [string]$LogsPath
    )

    Write-Info 'Compilando backend...'
    Push-Location $BackendPath
    try {
        & npm run build | Out-Host
    } finally {
        Pop-Location
    }

    $pidFile = Join-Path $RunPath 'backend.pid'
    Stop-ProcessIfRunning -RutaPid $pidFile -NombreAmigable 'backend previo'

    $stdout = Join-Path $LogsPath 'backend.stdout.log'
    $stderr = Join-Path $LogsPath 'backend.stderr.log'
    if (Test-Path $stdout) { Remove-Item $stdout -Force }
    if (Test-Path $stderr) { Remove-Item $stderr -Force }

    Write-Info 'Arrancando backend en segundo plano...'
    $proc = Start-Process -FilePath 'node' `
        -ArgumentList @('--env-file=.env', 'dist/server.js') `
        -WorkingDirectory $BackendPath `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru

    Set-Content -Path $pidFile -Value $proc.Id -Encoding utf8

    if (-not (Wait-HttpJsonField -Uri 'http://127.0.0.1:8080/health' -Campo 'db' -ValorEsperado 'ok' -TimeoutSegundos 90)) {
        Write-WarnMsg 'El backend no confirmó db=ok a tiempo.'
        Write-WarnMsg "Revisa: $stderr"
        throw 'Backend no listo.'
    }

    Write-Ok 'Backend operativo en http://127.0.0.1:8080/health'
}

function Start-Frontend {
    param(
        [string]$FrontendPath,
        [string]$RunPath,
        [string]$LogsPath,
        [int]$Puerto = 8081
    )

    $pidFile = Join-Path $RunPath 'frontend.pid'
    Stop-ProcessIfRunning -RutaPid $pidFile -NombreAmigable 'frontend previo'

    $stdout = Join-Path $LogsPath 'frontend.stdout.log'
    $stderr = Join-Path $LogsPath 'frontend.stderr.log'
    if (Test-Path $stdout) { Remove-Item $stdout -Force }
    if (Test-Path $stderr) { Remove-Item $stderr -Force }

    $pythonCmd = if (Test-Comando 'py') { 'py' } elseif (Test-Comando 'python') { 'python' } else { $null }
    if ($null -eq $pythonCmd) {
        throw 'No se ha encontrado Python. Ejecuta antes auto_deploy.ps1.'
    }

    $args = if ($pythonCmd -eq 'py') {
        @('-m', 'http.server', "$Puerto", '--bind', '0.0.0.0')
    } else {
        @('-m', 'http.server', "$Puerto", '--bind', '0.0.0.0')
    }

    Write-Info 'Arrancando frontend estático en segundo plano...'
    $proc = Start-Process -FilePath $pythonCmd `
        -ArgumentList $args `
        -WorkingDirectory $FrontendPath `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru

    Set-Content -Path $pidFile -Value $proc.Id -Encoding utf8

    if (-not (Wait-TcpPort -Host '127.0.0.1' -Puerto $Puerto -TimeoutSegundos 30)) {
        Write-WarnMsg "El frontend no abrió el puerto $Puerto a tiempo."
        Write-WarnMsg "Revisa: $stderr"
        throw 'Frontend no listo.'
    }

    Write-Ok "Frontend operativo en http://127.0.0.1:$Puerto/index.html"
}

function Start-Database {
    param(
        [string]$DeployPath,
        [switch]$ResetDB
    )

    Push-Location $DeployPath
    try {
        if ($ResetDB) {
            Write-WarnMsg 'ResetDB activo: se eliminará el volumen de MariaDB y se recreará desde cero.'
            & docker compose down -v | Out-Host
        }

        Write-Info 'Levantando servicios Docker (MariaDB + Adminer)...'
        & docker compose up -d | Out-Host
    } finally {
        Pop-Location
    }

    if (-not (Wait-TcpPort -Host '127.0.0.1' -Puerto 3307 -TimeoutSegundos 90)) {
        throw 'MariaDB no abrió el puerto 3307 a tiempo.'
    }

    $limite = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $limite) {
        try {
            & docker exec kwl_demo_mariadb mariadb -uroot -pdemo -D kwl_lavanderia -e "SELECT 1;" *> $null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok 'MariaDB operativa.'
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
    }

    try {
        $usuarios = & docker exec kwl_demo_mariadb mariadb -N -B -uroot -pdemo -D kwl_lavanderia -e "SELECT COUNT(*) FROM usuario WHERE login='admin@gmail.com';"
        if (($usuarios | Out-String).Trim() -ne '1') {
            Write-WarnMsg 'No se encontró admin@gmail.com en la BD. Reaplicando seed demo...'
            $seedPath = Join-Path $DeployPath 'db\init\02_seed.sql'
            $seedLinux = '/tmp/02_seed.sql'
            & docker cp $seedPath "kwl_demo_mariadb:$seedLinux" | Out-Host
            & docker exec -i kwl_demo_mariadb mariadb -uroot -pdemo -D kwl_lavanderia -e "SOURCE $seedLinux;" | Out-Host
        }
    } catch {
        throw 'MariaDB está levantada, pero no se pudo verificar o reaplicar el usuario demo.'
    }

    Write-Ok 'Base de datos lista.'
}

try {
    $scriptRoot  = $PSScriptRoot
    $deployPath  = $scriptRoot
    $backendPath = Resolve-Path (Join-Path $scriptRoot '..\..\app\backend')
    $frontendPath = Resolve-Path (Join-Path $scriptRoot '..\..\app\frontend\public')
    $logsPath    = Join-Path $scriptRoot '.logs'
    $runPath     = Join-Path $scriptRoot '.run'

    Assert-ExisteRuta $deployPath 'la carpeta deploy/demo'
    Assert-ExisteRuta $backendPath 'el backend'
    Assert-ExisteRuta $frontendPath 'el frontend'

    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
    New-Item -ItemType Directory -Path $runPath -Force | Out-Null

    Write-Host '=============================================' -ForegroundColor Cyan
    Write-Host ' Actualización del entorno local del TFC' -ForegroundColor Cyan
    Write-Host '=============================================' -ForegroundColor Cyan

    if ($SoloFrontend -and $SoloBackend) {
        throw 'No puedes usar -SoloFrontend y -SoloBackend a la vez.'
    }

    if (-not $SoloFrontend) {
        Start-DockerDesktopAndWait
        Start-Database -DeployPath $deployPath -ResetDB:$ResetDB
        Start-Backend -BackendPath $backendPath -RunPath $runPath -LogsPath $logsPath
    }

    if (-not $SoloBackend) {
        Start-Frontend -FrontendPath $frontendPath -RunPath $runPath -LogsPath $logsPath -Puerto 8081
    }

    if ($AbrirNavegador) {
        Start-Process 'http://127.0.0.1:8081/index.html' | Out-Null
    }

    Write-Host ''
    Write-Host '=============================================' -ForegroundColor Green
    Write-Host ' ACTUALIZACIÓN COMPLETADA' -ForegroundColor Green
    Write-Host '=============================================' -ForegroundColor Green
    Write-Host 'Frontend: http://127.0.0.1:8081/index.html' -ForegroundColor Cyan
    Write-Host 'Backend:  http://127.0.0.1:8080/health' -ForegroundColor Cyan
    Write-Host 'Adminer:  http://127.0.0.1:8082' -ForegroundColor Cyan
    Write-Host 'Logs:     deploy/demo/.logs' -ForegroundColor Cyan
    Write-Host 'Usuario demo: admin@gmail.com / admin' -ForegroundColor Cyan
} catch {
    Write-Fail $_.Exception.Message
    exit 1
}
