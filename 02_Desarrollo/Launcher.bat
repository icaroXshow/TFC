@echo off
setlocal
title TFC Lavanderia - Launcher
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: PowerShell no encontrado. Profe tienes un problema te toca hacerlo manual :( .
  pause
  exit /b 1
)
rem ejecutar con admin que sino se quiebra con docker
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\demo\auto_deploy.ps1" %*
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo El launcher termino con codigo %EXITCODE%.
)

echo.
pause
exit /b %EXITCODE%
