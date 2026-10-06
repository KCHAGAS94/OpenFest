@echo off
cd /d "%~dp0"
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

rem Espera o sistema subir e abre o Caixa que imprime direto na impressora do PC
timeout /t 8 /nobreak >nul
call abrir-caixa.bat
