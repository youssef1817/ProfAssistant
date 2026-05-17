@echo off
title ProfAssistant - Serveur Actif
color 0B

echo ===================================================
echo   ProfAssistant - Serveur Actif
echo ===================================================
echo.
echo   [OK] Le serveur est ACTIF sur: http://localhost:3000
echo.
echo   [!] S'il vous plait, NE FERMEZ PAS cette fenetre.
echo   [!] Vous pouvez reduire la fenetre pour la masquer.
echo.
echo ===================================================
echo   [+] Ouverture automatique de Google Chrome...
echo ===================================================
echo.

timeout /t 2 /nobreak >nul
start chrome http://localhost:3000
cd /d "%~dp0"

:: If user placed node.exe in the root, automatically move it to system/bin/ to keep root clean
if exist "%~dp0..\node.exe" (
    if not exist "%~dp0bin" mkdir "%~dp0bin"
    move "%~dp0..\node.exe" "%~dp0bin\node.exe" >nul
)

:: Check if local portable node.exe exists inside system/bin/
if exist "%~dp0bin\node.exe" (
    "%~dp0bin\node.exe" scripts/server.mjs
) else (
    node scripts/server.mjs
)
