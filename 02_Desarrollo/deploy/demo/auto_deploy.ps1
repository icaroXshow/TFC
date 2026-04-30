#requires -Version 5.1
<##
Launcher Windows para la demo del TFC.

Objetivo:
- Separar instalacion y arranque para evitar bloqueos innecesarios.
- Opcion 1: instalar/activar WSL y Docker Desktop, sin levantar contenedores.
- Opcion 2: arrancar Docker Desktop y lanzar la demo, sin tocar WSL si Docker ya esta instalado.
- Ignorar avisos blkio no bloqueantes de WSL cuando Docker ya permite ejecutar comandos.
##>

param(
    # Ejecuta solo la instalación/verificación de prerequisitos.
    [switch]$InstallOnly,
    # Ejecuta solo el arranque de la demo.
    [switch]$LaunchOnly,
    # Compatibilidad: instala (si falta) y lanza en una sola ejecución.
    [switch]$InstallAndRun,
    # Fuerza reinicio completo de la BD (down -v) antes de arrancar.
    [switch]$ResetDb,
    # Evita abrir URLs en el navegador al finalizar.
    [switch]$SinAbrir,
    # Marca usada tras reinicio automático para retomar instalación.
    [switch]$ResumeAfterReboot
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Rutas del launcher y del proyecto
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot
$ProjectRoot = (Resolve-Path (Join-Path $ScriptRoot '..\..')).Path
$ResumeTaskName = 'TFC-Lavanderia-Continuar-Instalacion'
$RunDir = Join-Path $ScriptRoot '.run'
$LogFile = Join-Path $RunDir 'launcher-windows.log'

# Log en archivo para  incidencias
if (-not (Test-Path $RunDir)) { New-Item -ItemType Directory -Path $RunDir -Force | Out-Null }
try { Start-Transcript -Path $LogFile -Append -ErrorAction SilentlyContinue | Out-Null } catch { }

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

    $args = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', ('"{0}"' -f $PSCommandPath)
    ) + $ExtraArgs

    # relanza el propio script elevado para operaciones que requieren admin
    Write-Warn 'La instalacion automatica requiere PowerShell como Administrador.'
    Write-Info 'Se abrira una ventana elevada. Acepta el aviso de Windows/UAC si aparece.'
    Start-Process -FilePath 'powershell.exe' -ArgumentList ($args -join ' ') -Verb RunAs -WorkingDirectory $ScriptRoot
}

function Invoke-NativeWait {
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [int]$TimeoutSec = 60,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    if (-not $Quiet) {
        Write-Info ("Ejecutando con timeout {0}s: {1} {2}" -f $TimeoutSec, $FilePath, ($Arguments -join ' '))
    }

    $stdout = Join-Path $RunDir ("native-{0}-out.log" -f ([Guid]::NewGuid().ToString('N')))
    $stderr = Join-Path $RunDir ("native-{0}-err.log" -f ([Guid]::NewGuid().ToString('N')))

    try {
        $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -NoNewWindow -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        if (-not $process.WaitForExit($TimeoutSec * 1000)) {
            try { $process.Kill() } catch { }
            $textTimeout = "Comando bloqueado tras $TimeoutSec segundos: $FilePath $($Arguments -join ' ')"
            if (-not $AllowFailure) { throw $textTimeout }
            return [pscustomobject]@{ Code = 124; Text = $textTimeout }
        }

        $text = ''
        if (Test-Path $stdout) { $text += Get-Content $stdout -Raw -ErrorAction SilentlyContinue }
        if (Test-Path $stderr) { $text += Get-Content $stderr -Raw -ErrorAction SilentlyContinue }
        $code = $process.ExitCode

        if (($code -ne 0) -and (-not $AllowFailure)) {
            throw "Comando fallido ($code): $FilePath $($Arguments -join ' ') $text"
        }

        return [pscustomobject]@{ Code = $code; Text = (($text -replace "`r", ' ' -replace "`n", ' ').Trim()) }
    } finally {
        Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue
    }
}

function Register-ResumeTask {
    # crea tarea programada temporal para continuar tras reinicio
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -InstallOnly -ResumeAfterReboot' -f $PSCommandPath) -WorkingDirectory $ScriptRoot
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $userForTask = if ($Env:USERDOMAIN) { "$Env:USERDOMAIN\$Env:USERNAME" } else { $Env:USERNAME }
    $principal = New-ScheduledTaskPrincipal -UserId $userForTask -RunLevel Highest -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    Register-ScheduledTask -TaskName $ResumeTaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
}

function Unregister-ResumeTask {
    # limpia la tarea temporal cuando ya no es necesaria
    try {
        $task = Get-ScheduledTask -TaskName $ResumeTaskName -ErrorAction SilentlyContinue
        if ($task) { Unregister-ScheduledTask -TaskName $ResumeTaskName -Confirm:$false }
    } catch { }
}

function Refresh-DockerPath {
    # Asegura docker y plugns
    $paths = @(
        "$Env:ProgramFiles\Docker\Docker\resources\bin",
        "$Env:ProgramFiles\Docker\Docker\resources\cli-plugins"
    )
    foreach ($p in $paths) {
        if ((Test-Path $p) -and ($Env:Path -notlike "*$p*")) {
            $Env:Path = "$p;$Env:Path"
        }
    }
}

function Get-DockerDesktopExe {
    # Detecta la ruta del ejecutable de Docker 
    $candidates = @(
        "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$Env:LocalAppData\Docker\Docker Desktop.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Get-DockerCliPath {
    # Obtiene el exe desde PATH o rutas 
    Refresh-DockerPath
    $cmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $candidates = @(
        "$Env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "$Env:ProgramFiles\Docker\Docker\resources\cli-plugins\docker.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Test-DockerDesktopInstalled {
    if (Get-DockerDesktopExe) { return $true }
    return $false
}

function Test-DockerDesktopInstalledWinget {
  
    if (Test-DockerDesktopInstalled) { return $true }
    if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) { return $false }

    $res = Invoke-NativeWait -FilePath 'winget.exe' -Arguments @('list','--id','Docker.DockerDesktop','-e','--accept-source-agreements') -TimeoutSec 25 -AllowFailure -Quiet
    return (($res.Code -eq 0) -and ($res.Text -match 'Docker Desktop|Docker\.DockerDesktop'))
}

function Ensure-Winget {
    if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
        Write-Ok 'winget disponible.'
        return
    }
    throw 'winget no esta disponible. Instala/actualiza App Installer desde Microsoft Store o instala Docker Desktop manualmente.'
}

function Get-WindowsFeatureEnabled {
    param([Parameter(Mandatory=$true)][string]$FeatureName)

    $res = Invoke-NativeWait -FilePath 'dism.exe' -Arguments @('/online','/Get-FeatureInfo',"/FeatureName:$FeatureName") -TimeoutSec 45 -AllowFailure -Quiet
    if ($res.Code -ne 0) { return $false }
    return ($res.Text -match 'State\s*:\s*Enabled|Estado\s*:\s*Habilitado|Enabled|Habilitado')
}

function Ensure-WslFeaturesForFreshInstall {
    # primera install
    Write-Info 'Docker Desktop no esta instalado. Comprobando requisitos WSL/Virtual Machine Platform...'

    $mustReboot = $false
    $features = @('Microsoft-Windows-Subsystem-Linux', 'VirtualMachinePlatform')

    foreach ($feature in $features) {
        if (Get-WindowsFeatureEnabled -FeatureName $feature) {
            Write-Ok "$feature habilitado."
            continue
        }

        Write-Info "Activando $feature..."
        $res = Invoke-NativeWait -FilePath 'dism.exe' -Arguments @('/online','/enable-feature',"/featurename:$feature",'/all','/norestart') -TimeoutSec 180 -AllowFailure
        if ($res.Code -eq 0 -or $res.Code -eq 3010) {
            Write-Ok "$feature activado."
            $mustReboot = $true
            if ($res.Code -eq 3010 -or $res.Text -match 'restart|reiniciar|reboot') { $mustReboot = $true }
        } else {
            throw "No se pudo activar $feature. Codigo $($res.Code). $($res.Text)"
        }
    }

    if ($mustReboot) {
        Register-ResumeTask
        Write-Warn 'Windows requiere reinicio para terminar de activar WSL/Virtual Machine Platform.'
        Write-Info 'He creado una tarea temporal para continuar automaticamente al volver a iniciar sesion.'
        Write-Info 'Reiniciando en 20 segundos...'
        shutdown.exe /r /t 20 /c 'TFC Lavanderia: reinicio necesario para terminar requisitos WSL y continuar instalacion Docker.' | Out-Null
        exit 3010
    }

    if (Get-Command wsl.exe -ErrorAction SilentlyContinue) {
        Write-Ok 'wsl.exe disponible.'
    } else {
        Write-Warn 'wsl.exe no aparece disponible aun. Docker Desktop intentara completar su configuracion al iniciar.'
    }

    Write-Ok 'Requisitos WSL revisados sin ejecutar wsl --status, wsl --update ni wsl --set-default-version.'
}

function Wait-DockerDesktopInstalled {
    param([int]$TimeoutSec = 180)

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-DockerDesktopInstalledWinget) { return $true }
        Start-Sleep -Seconds 5
    }
    return $false
}

function Add-DockerUsersGroup {
    # añadir el user que sino se pone pesado
    $qualifiedUser = if ($Env:USERDOMAIN) { "$Env:USERDOMAIN\$Env:USERNAME" } else { $Env:USERNAME }

    $check = Invoke-NativeWait -FilePath 'cmd.exe' -Arguments @('/c','net localgroup docker-users') -TimeoutSec 15 -AllowFailure -Quiet
    if ($check.Code -ne 0) {
        Write-Warn 'El grupo docker-users aun no existe. Docker Desktop puede crearlo al primer arranque.'
        return
    }

    $add = Invoke-NativeWait -FilePath 'cmd.exe' -Arguments @('/c',"net localgroup docker-users `"$qualifiedUser`" /add") -TimeoutSec 20 -AllowFailure -Quiet
    if ($add.Code -eq 0) {
        Write-Ok "Usuario agregado al grupo docker-users: $qualifiedUser"
        return
    }

    if (($add.Code -eq 2 -or $add.Code -eq 1378) -and ($add.Text -match '1378|already|pertenece|miembro|member')) {
        Write-Ok "Usuario ya pertenece al grupo docker-users: $qualifiedUser"
        return
    }

    Write-Warn "No se pudo agregar/verificar docker-users automaticamente. Codigo: $($add.Code). $($add.Text)"
}

function Install-DockerDesktop {
    # Instalacion si o si
    Ensure-Winget

    if (Test-DockerDesktopInstalledWinget) {
        Write-Ok 'Docker Desktop ya esta instalado.'
        Refresh-DockerPath
        Add-DockerUsersGroup
        return
    }

    Write-Info 'Instalando Docker Desktop con winget en modo machine/admin...'
    $machineArgs = @(
        'install',
        '--id','Docker.DockerDesktop',
        '-e',
        '--source','winget',
        '--scope','machine',
        '--silent',
        '--accept-package-agreements',
        '--accept-source-agreements'
    )
    $machine = Invoke-NativeWait -FilePath 'winget.exe' -Arguments $machineArgs -TimeoutSec 1200 -AllowFailure

    if ($machine.Code -ne 0) {
        Write-Warn "winget devolvio codigo $($machine.Code) durante la instalacion machine/admin. Compruebo si Docker quedo instalado igualmente."
        if (-not (Wait-DockerDesktopInstalled -TimeoutSec 180)) {
            Write-Warn 'No se detecta Docker Desktop. Reintentando sin --scope machine...'
            $userArgs = @(
                'install','--id','Docker.DockerDesktop','-e','--source','winget','--silent',
                '--accept-package-agreements','--accept-source-agreements'
            )
            $user = Invoke-NativeWait -FilePath 'winget.exe' -Arguments $userArgs -TimeoutSec 1200 -AllowFailure
            if ($user.Code -ne 0) {
                Write-Warn "winget tambien devolvio codigo $($user.Code) sin --scope. Verifico instalacion final antes de fallar."
            }
        } else {
            Write-Ok 'Docker Desktop aparece instalado pese al codigo de error de winget. Continuo.'
        }
    }

    Refresh-DockerPath

    if (-not (Wait-DockerDesktopInstalled -TimeoutSec 240)) {
        throw 'Docker Desktop no aparece instalado tras winget. Revisa deploy/demo/.run/launcher-windows.log o instalalo manualmente.'
    }

    Add-DockerUsersGroup
    Write-Ok 'Docker Desktop instalado/verificado.'
}

function Start-DockerDesktop {
    # LAnza Docker  Desktop si no esta abierto
    $dockerExe = Get-DockerDesktopExe
    if (-not $dockerExe) { throw 'No encuentro Docker Desktop.exe.' }

    $process = Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue
    if ($process) { return }

    Write-Info 'Iniciando Docker Desktop...'
    Start-Process -FilePath $dockerExe -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

function Ensure-DockerService {
    # Intenta arrancar servicios de Docker por si quedaron detenidos
    foreach ($name in @('com.docker.service','Docker Desktop Service')) {
        try {
            $service = Get-Service -Name $name -ErrorAction SilentlyContinue
            if ($service -and $service.Status -ne 'Running') {
                Write-Info "Iniciando servicio Docker: $name"
                Start-Service -Name $name -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3
            }
        } catch { }
    }
}

function Invoke-DockerTimed {
    # Wrapper docker
    param(
        [string[]]$DockerArgs,
        [int]$TimeoutSec = 20
    )

    $docker = Get-DockerCliPath
    if (-not $docker) { return [pscustomobject]@{ Code = 127; Text = 'docker.exe no encontrado' } }

    return Invoke-NativeWait -FilePath $docker -Arguments $DockerArgs -TimeoutSec $TimeoutSec -AllowFailure -Quiet
}

function Short-LauncherText {
    # Compacta para no petar a texto la conso
    param(
        [string]$Text,
        [int]$Max = 220
    )

    if (-not $Text) { return '' }

    $clean = ($Text -replace "`r", ' ' -replace "`n", ' ' -replace '\s+', ' ').Trim()
    $clean = ($clean -replace 'WARNING: No blkio throttle\.[^W]+support', 'WARNING blkio WSL no bloqueante')
    $clean = ($clean -replace 'WARNING: Support for cgroup v1[^W]+', 'WARNING cgroup v1 no bloqueante')

    if ($clean.Length -gt $Max) {
        return $clean.Substring(0, $Max) + '...'
    }
    return $clean
}

function Test-DockerEngineReadyOnce {
    # IMPORRTANTE DIEGOOOO
    # En Docker Desktop + WSL2 pueden aparecer avisos blkio/cgroup por stderr aunque el motor funcione
    # No deben bloquear el launche si el engine responde a docker ps/info da igual

    $ps = Invoke-DockerTimed -DockerArgs @('ps','--format','{{.Names}}') -TimeoutSec 15
    if ($ps.Code -eq 0) {
        $compose = Invoke-DockerTimed -DockerArgs @('compose','version') -TimeoutSec 15
        if ($compose.Code -eq 0 -or $compose.Text -match 'Docker Compose|Compose version|v\d+\.\d+') {
            return [pscustomobject]@{ Ready = $true; Last = 'Docker Engine y Docker Compose responden.' }
        }

        # Si docker ps funciona, el motor esta listo. Si Compose fallase de verdad,
        # docker compose up dara un error claro despues, pero no bloqueamos aqui.
        return [pscustomobject]@{ Ready = $true; Last = "Docker Engine responde; Compose no se pudo verificar en la comprobacion rapida: $(Short-LauncherText $compose.Text)" }
    }

    $info = Invoke-DockerTimed -DockerArgs @('info') -TimeoutSec 15
    $infoLooksReady = ($info.Code -eq 0) -or ($info.Text -match 'Server Version:|Containers:\s*\d+|Operating System:\s*Docker Desktop|Docker Root Dir:')
    if ($infoLooksReady) {
        $compose2 = Invoke-DockerTimed -DockerArgs @('compose','version') -TimeoutSec 15
        if ($compose2.Code -eq 0 -or $compose2.Text -match 'Docker Compose|Compose version|v\d+\.\d+') {
            return [pscustomobject]@{ Ready = $true; Last = 'Docker info y Docker Compose responden.' }
        }

        return [pscustomobject]@{ Ready = $true; Last = "Docker info responde; se continua aunque Compose no se verifico aun: $(Short-LauncherText $compose2.Text)" }
    }

    $version = Invoke-DockerTimed -DockerArgs @('version') -TimeoutSec 15
    $versionLooksReady = ($version.Code -eq 0) -or ($version.Text -match 'Server:\s+|Server Version:|Operating System:\s*Docker Desktop')
    if ($versionLooksReady) {
        return [pscustomobject]@{ Ready = $true; Last = 'Docker version muestra servidor disponible.' }
    }

    if ($ps.Code -eq 124 -or $info.Code -eq 124 -or $version.Code -eq 124) {
        return [pscustomobject]@{ Ready = $false; Last = 'Docker Desktop esta abierto, pero el motor aun no responde.' }
    }

    $txt = (($ps.Text + ' ' + $info.Text + ' ' + $version.Text).Trim())

    if ($txt -match 'Cannot connect|error during connect|daemon is not running|pipe docker_engine|No se puede conectar|no se puede conectar') {
        return [pscustomobject]@{ Ready = $false; Last = (Short-LauncherText $txt) }
    }

    if ($txt -match 'No blkio throttle|blkio|cgroup v1') {
        return [pscustomobject]@{ Ready = $false; Last = 'Docker emitio avisos WSL blkio/cgroup, pero aun no hay respuesta clara del engine.' }
    }

    return [pscustomobject]@{ Ready = $false; Last = (Short-LauncherText $txt) }
}

function Wait-DockerReady {
    # espera a engine Docker y reinicia si tarda mucho
    param([int]$TimeoutSec = 600)

    Write-Info 'Esperando a Docker Desktop y Docker Engine. En primer arranque puede tardar varios minutos.'
    $start = Get-Date
    $lastPrint = (Get-Date).AddSeconds(-60)
    $last = 'pendiente'
    $restarted = $false

    while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSec) {
        Refresh-DockerPath
        Ensure-DockerService
        Start-DockerDesktop

        $probe = Test-DockerEngineReadyOnce
        if ($probe.Ready) {
            Write-Ok $probe.Last
            Write-Ok 'Docker esta listo para lanzar contenedores.'
            return $true
        }

        $last = $probe.Last
        $elapsed = [int](New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds

        if (-not $restarted -and $elapsed -gt 180) {
            $restarted = $true
            Write-Warn 'Docker tarda mas de lo normal. Reinicio Docker Desktop una vez para desbloquear el motor.'
            try { Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch { }
            Start-Sleep -Seconds 5
            Start-DockerDesktop
        }

        if ((New-TimeSpan -Start $lastPrint -End (Get-Date)).TotalSeconds -ge 15) {
            Write-Info "Esperando Docker... ${elapsed}s/${TimeoutSec}s. $last"
            $lastPrint = Get-Date
        }

        Start-Sleep -Seconds 5
    }

    throw "Docker Desktop no quedo listo a tiempo. Ultimo estado: $last. Abre Docker Desktop por si hay pantalla inicial pendiente, reinicia Windows si Docker acaba de instalarse o revisa Settings > Resources > WSL integration. Log: deploy/demo/.run/launcher-windows.log"
}

function Ensure-DemoEnv {
    # busca que esten los ficheros importantes y sino crea el env
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

function Install-PrerequisitesOnly {
    # Solo verifica las depen no lanza para que no rompa
    if (-not (Test-Windows)) { throw 'Este instalador automatico es solo para Windows.' }
    if (-not (Test-Admin)) { throw 'La instalacion debe ejecutarse como Administrador.' }

    Refresh-DockerPath
    Ensure-Winget

    if (Test-DockerDesktopInstalledWinget) {
        Write-Ok 'Docker Desktop ya esta instalado. No se toca WSL y no se lanzan contenedores.'
        Add-DockerUsersGroup
        Ensure-DemoEnv
        Unregister-ResumeTask
        Write-Ok 'Instalacion verificada. Ahora usa la opcion 2 para lanzar el proyecto.'
        return
    }

    Ensure-WslFeaturesForFreshInstall
    Install-DockerDesktop
    Ensure-DemoEnv
    Unregister-ResumeTask
    Write-Ok 'Instalacion finalizada. Ahora usa la opcion 2 para lanzar el proyecto.'
}

function Ensure-LaunchPrerequisites {
    # Flujo previo verifica las depen
    if (-not (Test-Windows)) { throw 'Este launcher automatico es solo para Windows.' }

    Refresh-DockerPath

    if (-not (Test-DockerDesktopInstalledWinget)) {
        throw 'Docker Desktop no esta instalado. Ejecuta primero la opcion 1: INSTALAR WSL + DOCKER.'
    }

    Write-Ok 'Docker Desktop ya esta instalado. Se omiten comprobaciones WSL para no bloquear el arranque.'
    Add-DockerUsersGroup
    Start-DockerDesktop
    Wait-DockerReady -TimeoutSec 600 | Out-Null
    Ensure-DemoEnv
}

# compatibilidad con versiones anteriores del launcher: instala si falta algo y despues lanza
function Ensure-Dependencies {
    if (-not (Test-DockerDesktopInstalledWinget)) {
        Install-PrerequisitesOnly
    }
    Ensure-LaunchPrerequisites
}

function Invoke-DockerCompose {
    # levanta docker compose y si falla saca logs 
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
    # poll para esperar disponibilidad
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
    # valida salud tras el arranque.
    $backendOk = Wait-Url 'http://127.0.0.1:8080/health' 240
    $frontendOk = Wait-Url 'http://127.0.0.1:8081/index.html' 120
    if (-not $backendOk -or -not $frontendOk) {
        Invoke-DockerCompose @('logs','--tail=120','core-node','core-nginx','mariadb')
        throw 'Health check fallo.'
    }
    Write-Ok 'Todos los servicios principales responden.'
}

function Show-URLs {
    # muestra endpoints y abre nav
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

function Start-Demo {
    # Flujo principal 
    param([switch]$Reset)
    Ensure-LaunchPrerequisites
    $docker = Get-DockerCliPath
    if (-not $docker) { throw 'docker.exe no encontrado.' }

    # Si hay contenedores ya levantados, se recrean para refrescar backend/BD
    $running = & $docker compose ps --services --filter status=running 2>$null
    if ($running -and $running.Count -gt 0) {
        Write-Info 'Se detectan contenedores en ejecucion. Reiniciando stack para actualizar backend y datos de BD...'
        Invoke-DockerCompose @('down')
    }

    if ($Reset) {
        Invoke-DockerCompose @('down','-v')
    }
    Invoke-DockerCompose @('up','-d','--build')
    Wait-Health
    Show-URLs
}

function Show-Menu {
    # MENU
    Clear-Host
    Write-Host '=== LAUNCHER - TFC KWL DEMO ===' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ' 1. INSTALAR WSL + DOCKER' -ForegroundColor Green
    Write-Host ' 2. LANZAR DEMO' -ForegroundColor Green
    Write-Host ' 3. ESTADO / LOGS' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ' Q - SALIR' -ForegroundColor Red
    Write-Host ''
    return (Read-Host 'Elige opcion').Trim().ToUpperInvariant()
}

if ($InstallOnly) {
    # Modo: solo instalacion
    try {
        if (-not (Test-Admin)) {
            Invoke-ElevatedSelf @('-InstallOnly')
            exit 0
        }
        Install-PrerequisitesOnly
        Read-Host 'Instalacion finalizada. Pulsa Enter para cerrar'
        exit 0
    } catch {
        Write-Err $_.Exception.Message
        Read-Host 'Pulsa Enter para cerrar'
        exit 1
    }
}

if ($LaunchOnly) {
    # Modo: solo arranque
    try {
        Start-Demo -Reset:$ResetDb
        exit 0
    } catch {
        Write-Err $_.Exception.Message
        Read-Host 'Pulsa Enter para cerrar'
        exit 1
    }
}


if ($InstallAndRun) {
    # Modo: instalar y arrancar
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
    # MENU PRINCIPAL
    try {
        $choice = Show-Menu
        switch ($choice) {
            '1' {
                if (-not (Test-Admin)) {
                    Invoke-ElevatedSelf @('-InstallOnly')
                    exit 0
                }
                Install-PrerequisitesOnly
                Read-Host 'Instalacion finalizada. Pulsa Enter para volver al menu'
            }
            '2' {
                Start-Demo
            }
            '3' {
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
