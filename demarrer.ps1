$root    = "C:\Users\kouam\Music\cotisation-pro"
$backend = "$root\backend"
$chrome  = "C:\Program Files\Google\Chrome\Application\chrome.exe"

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

# ── Démarrer le backend ────────────────────────────────────
Write-Host "  [1/3] Demarrage du backend (port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title Backend Cotisation Pro && cd /d `"$backend`" && node server.js" `
    -WindowStyle Normal

# Attendre que le port 3000 soit actif (max 20s)
$ok = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 2
    $listening = netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
    if ($listening) { $ok = $true; break }
}

if (-not $ok) {
    Write-Host ""
    Write-Host "  ERREUR : Le backend n'a pas demarre !" -ForegroundColor Red
    Write-Host "  Verifiez la fenetre 'Backend Cotisation Pro' pour voir l'erreur." -ForegroundColor Red
    Write-Host ""
    Read-Host "  Appuyez sur Entree pour fermer"
    exit 1
}
Write-Host "  Backend pret !" -ForegroundColor Green

# ── Démarrer le frontend ───────────────────────────────────
Write-Host "  [2/3] Demarrage du frontend (port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "title Frontend Cotisation Pro && cd /d `"$root`" && npm run dev" `
    -WindowStyle Normal

# Attendre que le port 5173 soit actif (max 30s)
$ok = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    $listening = netstat -ano | Select-String ":5173 " | Select-String "LISTENING"
    if ($listening) { $ok = $true; break }
}

if (-not $ok) {
    Write-Host ""
    Write-Host "  ERREUR : Le frontend n'a pas demarre !" -ForegroundColor Red
    Write-Host "  Verifiez la fenetre 'Frontend Cotisation Pro' pour voir l'erreur." -ForegroundColor Red
    Write-Host ""
    Read-Host "  Appuyez sur Entree pour fermer"
    exit 1
}
Write-Host "  Frontend pret !" -ForegroundColor Green

# ── Ouvrir Chrome ──────────────────────────────────────────
Write-Host "  [3/3] Ouverture de Chrome..." -ForegroundColor Yellow
Start-Process -FilePath $chrome -ArgumentList "http://localhost:5173"

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "    Application lancee dans Chrome !" -ForegroundColor Green
Write-Host "    Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "    Backend  : http://localhost:3000" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""
