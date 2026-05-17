@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0create_shortcut.ps1"
cd /d "%~dp0.."
call boot.bat
