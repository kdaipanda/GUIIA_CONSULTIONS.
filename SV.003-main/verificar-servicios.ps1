Write-Host "Verificando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Verificar Backend
try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -UseBasicParsing -TimeoutSec 5
    Write-Host "Backend: OK - http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "Backend: No responde" -ForegroundColor Red
}

# Verificar Frontend
try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "Frontend: OK - http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "Frontend: No responde" -ForegroundColor Red
}

Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White



