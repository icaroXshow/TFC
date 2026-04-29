@echo off
title "TFC - Launcher Demo Local"
echo ========================================
echo TFC Lavanderia - Despliegue Demo
echo ========================================
echo.
echo Cambiando a carpeta demo...
cd /d "%~dp0deploy\demo"
if errorlevel 1 (
  echo ERROR: No se pudo acceder a deploy\demo
  pause
  exit /b 1
)
echo OK: En deploy\demo
echo.
echo Iniciando script PowerShell...
powershell -ExecutionPolicy Bypass -File ".\auto_deploy.ps1" %*
echo.
echo Presiona cualquier tecla para salir.
pause >nul

