@echo off
cd /d "%~dp0"
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"
