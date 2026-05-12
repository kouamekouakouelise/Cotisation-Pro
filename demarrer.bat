@echo off
chcp 65001 > nul
title Cotisation Pro - Lancement

echo.
echo  ==========================================
echo    COTISATION PRO - Demarrage en cours...
echo  ==========================================
echo.

:: Liberer les ports si deja occupes
echo  Nettoyage des ports 3000 et 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 "') do (
  if not "%%a"=="0" taskkill /PID %%a /F > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 "') do (
  if not "%%a"=="0" taskkill /PID %%a /F > nul 2>&1
)
timeout /t 2 /nobreak > nul

:: Demarrer le backend (Express - port 3000)
echo  [1/3] Backend en cours de demarrage (port 3000)...
start "Backend Cotisation Pro" cmd /k "cd /d "%~dp0backend" && node server.js"

:: Demarrer le frontend (Vite - port 5173)
echo  [2/3] Frontend en cours de demarrage (port 5173)...
start "Frontend Cotisation Pro" cmd /k "cd /d "%~dp0" && npm run dev"

:: Attendre que les serveurs soient prets
echo  [3/3] Attente du demarrage (7 secondes)...
timeout /t 7 /nobreak > nul

:: Ouvrir Chrome DIRECTEMENT avec son chemin complet (bypass VS Code)
echo  Ouverture de Chrome sur http://localhost:5173...
"C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"

echo.
echo  ==========================================
echo    Application lancee dans Chrome !
echo    - Frontend : http://localhost:5173
echo    - Backend  : http://localhost:3000
echo  ==========================================
echo.
