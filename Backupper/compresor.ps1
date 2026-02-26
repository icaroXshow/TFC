# =============================
# Backup del directorio padre
# Guarda los zips en /compresor/CopiasSeguridad
# =============================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetDir = Split-Path $scriptDir -Parent
$projectName = Split-Path $targetDir -Leaf

# Carpeta destino dentro del compresor
$backupDir = Join-Path $scriptDir "CopiasSeguridad"

# Crear carpeta si no existe
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Fecha segura para Windows
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$zipName = "${projectName}_$timestamp.zip"
$zipPath = Join-Path $backupDir $zipName

# Leer ignore.txt
$ignoreFile = Join-Path $scriptDir "ignore.txt"
$ignorePatterns = @()

if (Test-Path $ignoreFile) {
    $ignorePatterns = Get-Content $ignoreFile |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -ne "" -and -not $_.StartsWith("#") }
}

# Ignorar automáticamente:
$ignorePatterns += (Split-Path $scriptDir -Leaf)  # compresor
$ignorePatterns += "CopiasSeguridad"

function Normalize-RelPath([string]$p) {
    $q = $p -replace '/', '\'
    if ($q.StartsWith(".\")) { $q = $q.Substring(2) }
    return $q
}

function Should-Ignore([string]$relativePath, [string[]]$patterns) {
    $rel = Normalize-RelPath $relativePath
    $name = Split-Path $rel -Leaf

    foreach ($raw in $patterns) {
        $pat = Normalize-RelPath $raw
        if ([string]::IsNullOrWhiteSpace($pat)) { continue }

        if ($rel -like $pat) { return $true }
        if ($name -like $pat) { return $true }

        if ($pat -notmatch '[\*\?]') {
            if ($rel -eq $pat) { return $true }
            if ($rel -like ($pat + '\*')) { return $true }
        }
    }
    return $false
}

# Carpeta temporal
$staging = Join-Path $scriptDir ("_staging_" + [Guid]::NewGuid().ToString("N"))

try {
    New-Item -ItemType Directory -Path $staging | Out-Null

    $files = Get-ChildItem -Path $targetDir -Recurse -File -Force

    foreach ($f in $files) {
        $rel = $f.FullName.Substring($targetDir.Length + 1)

        if (Should-Ignore $rel $ignorePatterns) { continue }

        $destFile = Join-Path $staging (Normalize-RelPath $rel)
        $destDir = Split-Path $destFile -Parent

        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $f.FullName -Destination $destFile -Force
    }

    Compress-Archive -Path (Join-Path $staging "*") `
        -DestinationPath $zipPath `
        -CompressionLevel Optimal

    Write-Host "Backup creado en: $zipPath"
}
finally {
    if (Test-Path $staging) {
        Remove-Item $staging -Recurse -Force
    }
}