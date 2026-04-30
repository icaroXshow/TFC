@echo off
setlocal
title TFC Lavanderia - Launcher
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: PowerShell no esta disponible en este sistema.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\demo\auto_deploy.ps1" %*
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo El launcher termino con codigo %EXITCODE%.
)

echo.
pause
exit /b %EXITCODE%
EOF
python3 - <<'PY'
from pathlib import Path
p=Path('/mnt/data/tfc_work/Launcher.bat')
data=p.read_bytes().replace(b'\n', b'\r\n')
p.write_bytes(data)
PY
