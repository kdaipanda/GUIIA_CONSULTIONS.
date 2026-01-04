# Reinicia Backend y Frontend en modo local:
# - Cierra lo que esté usando los puertos 8000 (backend) y 3000 (frontend)
# - Vuelve a iniciar ambos servicios en ventanas separadas
# - Abre el navegador en frontend y docs del backend
#
# Uso (desde la raíz del proyecto):
#   .\restart-local.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Savant Vet - Reinicio Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar directorios
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: No se encuentra el directorio backend" -ForegroundColor Red
    Write-Host "Por favor ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: No se encuentra el directorio frontend" -ForegroundColor Red
    Write-Host "Por favor ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

function Stop-ProcessesOnPort([int]$port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) { return @() }
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        try {
            $p = Get-Process -Id $procId -ErrorAction Stop
            Write-Host "Cerrando PID $procId ($($p.ProcessName)) en puerto $port..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host "No se pudo cerrar PID $procId en puerto ${port}: $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
    return $pids
}

Write-Host "[1/3] Cerrando servicios si ya están corriendo..." -ForegroundColor Yellow

# Si existe backend.pid, intentar detenerlo (por si quedó guardado)
if (Test-Path "backend.pid") {
    $pidText = (Get-Content "backend.pid" -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($pidText -match "^\d+$") {
        $pidFromFile = [int]$pidText
        try {
            $p = Get-Process -Id $pidFromFile -ErrorAction Stop
            Write-Host "Cerrando PID guardado en backend.pid: $pidFromFile ($($p.ProcessName))..." -ForegroundColor Yellow
            Stop-Process -Id $pidFromFile -Force -ErrorAction Stop
        } catch {
            # ignorar si no existe
        }
    }
}

Stop-ProcessesOnPort 8000 | Out-Null
Stop-ProcessesOnPort 3000 | Out-Null

Start-Sleep -Seconds 2
Write-Host "Servicios detenidos (si estaban activos)." -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Iniciando Backend y Frontend..." -ForegroundColor Yellow

$repoRoot = (Get-Location).Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

# Backend (usa el venv existente si está; si no, cae a python del sistema)
$backendPython = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path $backendPython)) {
    $backendPython = "python"
}
$backendCmd = "cd '$backendDir'; & '$backendPython' server_simple.py"
Start-Process -FilePath powershell.exe -ArgumentList "-NoExit", "-Command", $backendCmd -WorkingDirectory $backendDir

Start-Sleep -Seconds 3

# Frontend (evitar abrir navegador automático; lo abrimos nosotros al final)
# Asegurar que el frontend apunte al backend por IPv4 (Windows puede resolver localhost a IPv6)
$frontendEnvPath = Join-Path $frontendDir ".env"
if (Test-Path $frontendEnvPath) {
    $envContent = Get-Content $frontendEnvPath -ErrorAction SilentlyContinue
    $hasBackendUrl = $false
    $newLines = foreach ($line in $envContent) {
        if ($line -match '^\s*REACT_APP_BACKEND_URL=') {
            $hasBackendUrl = $true
            "REACT_APP_BACKEND_URL=http://127.0.0.1:8000"
        } else {
            $line
        }
    }
    if (-not $hasBackendUrl) {
        $newLines += "REACT_APP_BACKEND_URL=http://127.0.0.1:8000"
    }
    $newLines | Out-File -FilePath $frontendEnvPath -Encoding utf8
} else {
    "REACT_APP_BACKEND_URL=http://127.0.0.1:8000" | Out-File -FilePath $frontendEnvPath -Encoding utf8
}

$frontendCmd = "cd '$frontendDir'; `$env:BROWSER='none'; npm start"
Start-Process -FilePath powershell.exe -ArgumentList "-NoExit", "-Command", $frontendCmd -WorkingDirectory $frontendDir

Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Docs API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""

Write-Host "[3/3] Verificando y abriendo URLs..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    # Usamos 127.0.0.1 para evitar falsos negativos si 'localhost' resuelve a IPv6.
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Backend responde" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend aún no responde (puede estar iniciando). Revisa la ventana del backend." -ForegroundColor Yellow
}

try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Frontend responde" -ForegroundColor Green
} catch {
    Write-Host "⚠ Frontend aún no responde (puede tardar 30-60s). Revisa la ventana del frontend." -ForegroundColor Yellow
}

try { Start-Process "http://localhost:3000" } catch {}
try { Start-Process "http://127.0.0.1:8000/docs" } catch {}

Write-Host ""
Write-Host "Listo. Se abrieron ventanas separadas para backend y frontend." -ForegroundColor Green


