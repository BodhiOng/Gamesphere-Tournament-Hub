@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5286') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
start "GameSphere Backend" cmd /k "cd backend && dotnet run"
start "GameSphere Frontend" cmd /k "cd frontend && npm.cmd run dev -- --host 0.0.0.0"
