# Script para verificar que los servicios estén funcionando
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificando Servicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Esperar un poco para que los servicios terminen de iniciar
Write-Host "Esperando 5 segundos para que los servicios inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Verificar Backend
Write-Host "Verificando Backend (puerto 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Backend está funcionando correctamente" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  URL: http://localhost:8000/docs" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Backend no está respondiendo" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Verificar Frontend
Write-Host "Verificando Frontend (puerto 3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Frontend está funcionando correctamente" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  URL: http://localhost:3000" -ForegroundColor Cyan
} catch {
    Write-Host "⚠ Frontend puede estar aún iniciando..." -ForegroundColor Yellow
    Write-Host "  El frontend puede tardar más en iniciar (30-60 segundos)" -ForegroundColor Yellow
    Write-Host "  Intenta acceder a http://localhost:3000 en tu navegador" -ForegroundColor Cyan
}
Write-Host ""

# Verificar procesos
Write-Host "Verificando procesos activos..." -ForegroundColor Yellow
$pythonProcs = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*venv*" -or $_.Path -like "*backend*" }
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue

if ($pythonProcs) {
    Write-Host "✓ Proceso Python del Backend activo" -ForegroundColor Green
    Write-Host "  Procesos encontrados: $($pythonProcs.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ No se encontró proceso Python del Backend" -ForegroundColor Red
}

if ($nodeProcs) {
    Write-Host "✓ Proceso Node.js del Frontend activo" -ForegroundColor Green
    Write-Host "  Procesos encontrados: $($nodeProcs.Count)" -ForegroundColor Gray
} else {
    Write-Host "⚠ No se encontró proceso Node.js del Frontend" -ForegroundColor Yellow
    Write-Host "  Puede estar aún iniciando..." -ForegroundColor Gray
}
Write-Host ""

# Verificar puertos
Write-Host "Verificando puertos en uso..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "✓ Puerto 8000 está en uso (Backend)" -ForegroundColor Green
} else {
    Write-Host "✗ Puerto 8000 no está en uso" -ForegroundColor Red
}

if ($port3000) {
    Write-Host "✓ Puerto 3000 está en uso (Frontend)" -ForegroundColor Green
} else {
    Write-Host "⚠ Puerto 3000 no está en uso aún" -ForegroundColor Yellow
    Write-Host "  El frontend puede estar aún iniciando..." -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumen" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si algún servicio no responde, verifica las ventanas de PowerShell" -ForegroundColor Yellow
Write-Host "que se abrieron para ver si hay errores." -ForegroundColor Yellow
Write-Host ""



