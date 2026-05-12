@echo off
chcp 65001 > nul
title Cotisation Pro - Lancement

echo.
echo  ==========================================
echo    COTISATION PRO - Demarrage en cours...
echo  ==========================================
echo.

:: Liberer les ports si deja occupes
echo  Nettoyage des ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /PID %%a /F > nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " 2^>nul') do taskkill /PID %%a /F > nul 2>&1
timeout /t 1 /nobreak > nul

:: Demarrer le backend (Express)
echo  [1/3] Backend en cours de demarrage (port 3000)...
start "Backend Cotisation Pro" cmd /k "cd /d "%~dp0backend" && node server.js"

:: Demarrer le frontend (Vite)
echo  [2/3] Frontend en cours de demarrage (port 5173)...
start "Frontend Cotisation Pro" cmd /k "cd /d "%~dp0" && npm run dev"

:: Attendre que les serveurs soient prets
echo  [3/3] Attente du demarrage (6 secondes)...
timeout /t 6 /nobreak > nul

:: Ouvrir Chrome directement (pas le navigateur par defaut, Chrome explicitement)
echo  Ouverture de Chrome...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"

echo.
echo  ==========================================
echo    Application lancee !
echo    - Frontend : http://localhost:5173
echo    - Backend  : http://localhost:3000
echo  ==========================================
echo.
echo  Vous pouvez fermer cette fenetre.
echo  Pour arreter l'application, fermez les
echo  fenetres "Backend" et "Frontend".
echo.
pause
