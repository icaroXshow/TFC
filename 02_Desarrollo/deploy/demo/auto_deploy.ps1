#requires -Version 5.1
<#
Launcher Windows para la demo del TFC.
- Opcion 1 instala/activa WSL y Docker Desktop desde PowerShell elevado.
- Si Windows exige reinicio para WSL, crea una tarea temporal para continuar tras iniciar sesion.
- Lanza Docker Desktop y espera a que `docker info` responda antes de levantar docker compose.
#>

param(
    [switch]$InstallAndRun,
    [switch]$ResetDb,
    [switch]$Smoke,
    [switch]$SinAbrir,
    [switch]$ResumeAfterReboot
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot
$ProjectRoot = Resolve-Path (Join-Path $ScriptRoot '..\..')
$LauncherBat = Join-Path $ProjectRoot 'Launcher.bat'
$ResumeTaskName = 'TFC-Lavanderia-Continuar-Instalacion'

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[AVISO] $Message" -ForegroundColor Yellow }
function Write-Err([string]$Message) { Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Test-Windows {
    return ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT)
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-ElevatedSelf {
    param([string[]]$ExtraArgs)

    $psArgs = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', ('"{0}"' -f $PSCommandPath)
    ) + $ExtraArgs

    Write-Warn 'La instalacion automatica requiere PowerShell como Administrador.'
    Write-Info 'Se abrira una ventana elevada. Acepta el aviso de Windows/UAC si aparece.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList ($psArgs -join ' ') -Verb RunAs -WorkingDirectory $ScriptRoot
}

function Invoke-Native {
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [switch]$AllowFailure
    )

    Write-Info ("Ejecutando: {0} {1}" -f $FilePath, ($Arguments -join ' '))
    & $FilePath @Arguments
    $code = $LASTEXITCODE
    if (($code -ne 0) -and (-not $AllowFailure)) {
        throw "Comando fallido ($code): $FilePath $($Arguments -join ' ')"
    }
    return $code
}

function Ensure-Winget {
    if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
        Write-Ok 'winget disponible.'
        return
    }
    throw 'winget no esta disponible. Actualiza/App Installer desde Microsoft Store o instala Docker Desktop manualmente.'
}

function Get-DockerCliPath {
    $cmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $candidates = @(
        "$Env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "$Env:ProgramFiles\Docker\Docker\resources\cli-plugins\docker.exe",
        "$Env:ProgramFiles\Docker\Docker\Docker CLI.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Get-DockerDesktopExe {
    $candidates = @(
        "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$Env:LocalAppData\Docker\Docker Desktop.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Test-DockerDesktopInstalled {
    if (Get-DockerDesktopExe) { return $true }
    $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $winget) { return $false }
    try {
        $list = & winget.exe list --id Docker.DockerDesktop -e --accept-source-agreements 2>$null
        return (($LASTEXITCODE -eq 0) -and (($list -join "`n") -match 'Docker Desktop'))
    } catch { return $false }
}

function Ensure-Wsl {
    Write-Info 'Comprobando WSL/Virtual Machine Platform...'

    $rebootRequired = $false
    $features = @('Microsoft-Windows-Subsystem-Linux', 'VirtualMachinePlatform')
    foreach ($feature in $features) {
        $state = (dism.exe /online /Get-FeatureInfo /FeatureName:$feature 2>$null | Select-String 'State|Estado') -join ' '
        if ($state -notmatch 'Enabled|Habilitado') {
            $code = Invoke-Native -FilePath 'dism.exe' -Arguments @('/online','/enable-feature',"/featurename:$feature",'/all','/norestart') -AllowFailure
            if ($code -eq 3010) { $rebootRequired = $true }
        } else {
            Write-Ok "$feature habilitado."
        }
    }

    if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
        $code = Invoke-Native -FilePath 'wsl.exe' -Arguments @('--install','--no-distribution') -AllowFailure
        if ($code -eq 3010) { $rebootRequired = $true }
    } else {
        Write-Ok 'wsl.exe disponible.'
    }

    if (Get-Command wsl.exe -ErrorAction SilentlyContinue) {
        Invoke-Native -FilePath 'wsl.exe' -Arguments @('--set-default-version','2') -AllowFailure | Out-Null
        Invoke-Native -FilePath 'wsl.exe' -Arguments @('--update','--web-download') -AllowFailure | Out-Null
    }

    if ($rebootRequired) {
        Register-ResumeTask
        Write-Warn 'Windows requiere reinicio para terminar de activar WSL.'
        Write-Info 'He creado una tarea temporal para continuar automaticamente al volver a iniciar sesion.'
        Write-Info 'Reiniciando en 20 segundos...'
        shutdown.exe /r /t 20 /c 'TFC Lavanderia: reinicio necesario para terminar WSL y continuar instalacion Docker.' | Out-Null
        exit 3010
    }

    Write-Ok 'WSL preparado.'
}

function Register-ResumeTask {
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -InstallAndRun -ResumeAfterReboot' -f $PSCommandPath) -WorkingDirectory $ScriptRoot
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $userForTask = if ($Env:USERDOMAIN) { "$Env:USERDOMAIN\$Env:USERNAME" } else { $Env:USERNAME }
    $principal = New-ScheduledTaskPrincipal -UserId $userForTask -RunLevel Highest -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    Register-ScheduledTask -TaskName $ResumeTaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
}

function Unregister-ResumeTask {
    try {
        $task = Get-ScheduledTask -TaskName $ResumeTaskName -ErrorAction SilentlyContinue
        if ($task) { Unregister-ScheduledTask -TaskName $ResumeTaskName -Confirm:$false }
    } catch { }
}

function Add-DockerUsersGroup {
    try {
        $qualifiedUser = if ($Env:USERDOMAIN) { "$Env:USERDOMAIN\$Env:USERNAME" } else { $Env:USERNAME }
        net localgroup docker-users $qualifiedUser /add *> $null
        Write-Ok "Usuario agregado/verificado en grupo docker-users: $qualifiedUser"
    } catch {
        Write-Warn "No se pudo agregar el usuario a docker-users automaticamente: $($_.Exception.Message)"
    }
}

function Install-DockerDesktop {
    Ensure-Winget

    if (Test-DockerDesktopInstalled) {
        Write-Ok 'Docker Desktop ya esta instalado.'
        Add-DockerUsersGroup
        return
    }

    Write-Info 'Instalando Docker Desktop con winget en modo machine/admin...'
    $args = @(
        'install',
        '--id','Docker.DockerDesktop',
        '-e',
        '--source','winget',
        '--scope','machine',
        '--silent',
        '--accept-package-agreements',
        '--accept-source-agreements'
    )
    $code = Invoke-Native -FilePath 'winget.exe' -Arguments $args -AllowFailure

    if ($code -ne 0) {
        Write-Warn 'La instalacion silenciosa con --scope machine fallo. Reintentando sin --scope...'
        $args = @(
            'install','--id','Docker.DockerDesktop','-e','--source','winget','--silent',
            '--accept-package-agreements','--accept-source-agreements'
        )
        Invoke-Native -FilePath 'winget.exe' -Arguments $args | Out-Null
    }

    $dockerBin = "$Env:ProgramFiles\Docker\Docker\resources\bin"
    if (Test-Path $dockerBin) {
        $Env:Path = "$dockerBin;$Env:Path"
    }

    if (-not (Test-DockerDesktopInstalled)) {
        throw 'Docker Desktop no aparece instalado tras winget.'
    }
    Add-DockerUsersGroup
    Write-Ok 'Docker Desktop instalado.'
}

function Start-DockerDesktop {
    $dockerExe = Get-DockerDesktopExe
    if (-not $dockerExe) { throw 'No encuentro Docker Desktop.exe.' }

    $process = Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue
    if (-not $process) {
        Write-Info 'Iniciando Docker Desktop...'
        Start-Process -FilePath $dockerExe -WindowStyle Minimized
    } else {
        Write-Ok 'Docker Desktop ya esta iniciado.'
    }
}

function Wait-DockerReady {
    param([int]$TimeoutSec = 600)

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $lastError = ''
    while ((Get-Date) -lt $deadline) {
        $docker = Get-DockerCliPath
        if ($docker) {
            try {
                & $docker info *> $null
                if ($LASTEXITCODE -eq 0) {
                    & $docker compose version *> $null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Ok 'Docker y Docker Compose estan listos.'
                        return $true
                    }
                    $lastError = 'docker compose version no responde todavia.'
                } else {
                    $lastError = 'docker info no responde todavia.'
                }
            } catch { $lastError = $_.Exception.Message }
        } else {
            $lastError = 'docker.exe no esta todavia en PATH.'
        }
        Start-Sleep -Seconds 5
    }

    throw "Docker Desktop no quedo listo a tiempo. Ultimo estado: $lastError"
}

function Ensure-DemoEnv {
    if (-not (Test-Path 'docker-compose.yml')) { throw 'docker-compose.yml no encontrado en deploy/demo.' }
    if (-not (Test-Path '.env')) {
        if (Test-Path '.env.example') {
            Copy-Item '.env.example' '.env' -Force
            Write-Ok '.env creado desde .env.example.'
        } else {
            throw '.env.example no encontrado.'
        }
    }
}

function Ensure-Dependencies {
    if (-not (Test-Windows)) { throw 'Este launcher automatico es solo para Windows.' }
    if (-not (Test-Admin)) { throw 'Esta operacion debe ejecutarse como Administrador.' }
    Ensure-Wsl
    Install-DockerDesktop
    Start-DockerDesktop
    Wait-DockerReady
    Ensure-DemoEnv
    Unregister-ResumeTask
}

function Invoke-DockerCompose {
    param([string[]]$ComposeArgs)

    $docker = Get-DockerCliPath
    if (-not $docker) { throw 'docker.exe no encontrado.' }

    & $docker compose @ComposeArgs
    if ($LASTEXITCODE -ne 0) {
        & $docker compose logs --tail=100
        throw "docker compose $($ComposeArgs -join ' ') fallo."
    }
}

function Wait-Url {
    param([string]$Url, [int]$TimeoutSec = 180)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 | Out-Null
            return $true
        } catch { Start-Sleep -Seconds 2 }
    }
    return $false
}

function Wait-Health {
    $backendOk = Wait-Url 'http://127.0.0.1:8080/health' 240
    $frontendOk = Wait-Url 'http://127.0.0.1:8081/index.html' 120
    if (-not $backendOk -or -not $frontendOk) {
        Invoke-DockerCompose @('logs','--tail=120','core-node','core-nginx','mariadb')
        throw 'Health check fallo.'
    }
    Write-Ok 'Todos los servicios principales responden.'
}

function Show-URLs {
    Write-Host ''
    Write-Ok 'Demo lista.'
    Write-Host 'Frontend:      http://127.0.0.1:8081/index.html' -ForegroundColor Cyan
    Write-Host 'Simulador GUI: http://127.0.0.1:8083' -ForegroundColor Cyan
    Write-Host 'Backend API:   http://127.0.0.1:8080/health' -ForegroundColor Cyan
    Write-Host 'Adminer:       http://127.0.0.1:8082' -ForegroundColor Cyan
    Write-Host 'MQTT:          mqtt://127.0.0.1:1883' -ForegroundColor Cyan
    Write-Host 'Redis:         redis://127.0.0.1:6379' -ForegroundColor Cyan
    Write-Host ''
    if (-not $SinAbrir) {
        Start-Process 'http://127.0.0.1:8081/index.html'
        Start-Process 'http://127.0.0.1:8083'
        Start-Process 'http://127.0.0.1:8080/health'
        Start-Process 'http://127.0.0.1:8082'
    }
}

function Run-SmokeTests {
    $scripts = @('scripts\soft_load_test.sh', 'scripts\timer_drift_check.sh', 'scripts\machine_regression_check.sh')
    $bash = Get-Command bash.exe -ErrorAction SilentlyContinue
    if (-not $bash) {
        Write-Warn 'bash no esta disponible. Se omiten smoke tests.'
        return
    }
    foreach ($rel in $scripts) {
        $script = Join-Path $ScriptRoot $rel
        if (Test-Path $script) {
            Write-Info "TEST $rel"
            & $bash.Source $script
            if ($LASTEXITCODE -ne 0) { Write-Warn "Fallo $rel" }
        }
    }
}

function Start-Demo {
    param([switch]$Reset)
    Ensure-Dependencies
    if ($Reset) {
        Invoke-DockerCompose @('down','-v')
    }
    Invoke-DockerCompose @('up','-d','--build')
    Wait-Health
    if ($Smoke) { Run-SmokeTests }
    Show-URLs
}

function Show-Menu {
    Clear-Host
    Write-Host '=== TFC Lavanderia Demo - Menu Principal ===' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ' 1. INSTALAR WSL + DOCKER Y LANZAR PROYECTO' -ForegroundColor Green
    Write-Host ' 2. ACTUALIZAR CONTENEDORES (pull + up)' -ForegroundColor Yellow
    Write-Host ' 3. REINICIAR BD DEMO (down -v + up)' -ForegroundColor Magenta
    Write-Host ' 4. TESTS SMOKE' -ForegroundColor Green
    Write-Host ' 5. ESTADO / LOGS' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ' Q - SALIR' -ForegroundColor Red
    Write-Host ''
    return (Read-Host 'Elige opcion').Trim().ToUpperInvariant()
}

if ($InstallAndRun) {
    try {
        if (-not (Test-Admin)) {
            Invoke-ElevatedSelf @('-InstallAndRun')
            exit 0
        }
        Start-Demo -Reset:$ResetDb
        exit 0
    } catch {
        Write-Err $_.Exception.Message
        Read-Host 'Pulsa Enter para cerrar'
        exit 1
    }
}

while ($true) {
    try {
        $choice = Show-Menu
        switch ($choice) {
            '1' {
                if (-not (Test-Admin)) {
                    Invoke-ElevatedSelf @('-InstallAndRun')
                    exit 0
                }
                Start-Demo
            }
            '2' {
                if (-not (Test-Admin)) { Invoke-ElevatedSelf @(); exit 0 }
                Ensure-Dependencies
                Invoke-DockerCompose @('pull')
                Invoke-DockerCompose @('up','-d')
                Wait-Health
                Show-URLs
            }
            '3' {
                if (-not (Test-Admin)) { Invoke-ElevatedSelf @(); exit 0 }
                Start-Demo -Reset
            }
            '4' {
                if (-not (Test-Admin)) { Invoke-ElevatedSelf @(); exit 0 }
                Ensure-Dependencies
                Run-SmokeTests
                Read-Host 'Tests finalizados. Pulsa Enter'
            }
            '5' {
                $docker = Get-DockerCliPath
                if (-not $docker) { throw 'docker.exe no encontrado.' }
                & $docker compose ps
                & $docker compose logs --tail=30
                Read-Host 'Pulsa Enter para volver al menu'
            }
            'Q' { exit 0 }
            default { Write-Warn 'Opcion invalida.'; Start-Sleep -Seconds 1 }
        }
    } catch {
        Write-Err $_.Exception.Message
        Read-Host 'Pulsa Enter para volver al menu'
    }
}
