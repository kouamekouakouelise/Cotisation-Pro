$root = "C:\Users\kouam\Desktop\cotisation-pro"
$backend = "$root\backend"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "    COTISATION PRO - Demarrage en cours..." -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

# ── Libérer les ports ──────────────────────────────────────
Write-Host "  Nettoyage des ports 3000 et 5173..." -ForegroundColor Yellow
foreach ($port in @(3000, 5173)) {
    $lines = netstat -ano | Select-String ":$port "
    foreach ($line in $lines) {
        $procId = ($line.ToString() -split '\s+')[-1]
        if ($procId -match '^\d+$' -and [int]$procId -ne 0) {
            Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 2

# ── Backend avec auto-redémarrage ──────────────────────────
Write-Host "  [1/3] Demarrage du backend (port 3000)..." -ForegroundColor Yellow

$backendScript = @"
@echo off
title Backend Cotisation Pro
:loop
cd /d "$backend"
echo [Backend] Demarrage...
node server.js
echo.
echo [Backend] Arret detecte. Relancement dans 3 secondes...
timeout /t 3 /nobreak > nul
goto loop
"@
$backendBat = "$env:TEMP\start_backend.bat"
$backendScript | Out-File -FilePath $backendBat -Encoding ASCII

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "`"$backendBat`"" `
    -WindowStyle Normal

# Attendre que le backend réponde réellement (pas seulement que le port soit ouvert)
$backendOk = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -TimeoutSec 3 -ErrorAction Stop
        $json = $response.Content | ConvertFrom-Json
        if ($json.status -eq "ok") { $backendOk = $true; break }
    } catch {}
}

if (-not $backendOk) {
    Write-Host ""
    Write-Host "  ERREUR : Le backend n'a pas demarre correctement !" -ForegroundColor Red
    Write-Host "  Verifiez la fenetre 'Backend Cotisation Pro' pour voir l'erreur." -ForegroundColor Red
    Write-Host "  Verifiez aussi que MySQL est bien demarre sur votre machine." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Appuyez sur Entree pour fermer"
    exit 1
}
Write-Host "  Backend pret ! (DB connectee)" -ForegroundColor Green

# ── Frontend (Vite) ───────────────────────────────────────
Write-Host "  [2/3] Demarrage du frontend (port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title Frontend Cotisation Pro && cd /d `"$root`" && npm run dev" `
    -WindowStyle Normal

# Attendre que le port 5173 soit actif (max 40s)
$frontendOk = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 2
    $listening = netstat -ano | Select-String ":5173 " | Select-String "LISTENING"
    if ($listening) { $frontendOk = $true; break }
}

if (-not $frontendOk) {
    Write-Host ""
    Write-Host "  ERREUR : Le frontend n'a pas demarre !" -ForegroundColor Red
    Write-Host "  Verifiez la fenetre 'Frontend Cotisation Pro' pour voir l'erreur." -ForegroundColor Red
    Write-Host ""
    Read-Host "  Appuyez sur Entree pour fermer"
    exit 1
}
Write-Host "  Frontend pret !" -ForegroundColor Green
Start-Sleep -Seconds 1

# ── Ouvrir Chrome ──────────────────────────────────────────
Write-Host "  [3/3] Ouverture de Chrome..." -ForegroundColor Yellow

if (Test-Path $chrome) {
    Start-Process -FilePath $chrome -ArgumentList "--new-window", "http://localhost:5173"
} else {
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "    Application lancee !" -ForegroundColor Green
Write-Host "    Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "    Backend  : http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "    Sante    : http://127.0.0.1:3000/api/health" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT : Ne fermez pas les fenetres Backend et Frontend !" -ForegroundColor Yellow
Write-Host ""
