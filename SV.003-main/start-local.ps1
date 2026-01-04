# Script para iniciar Backend y Frontend en modo local
# Uso: .\start-local.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Savant Vet - Inicio Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar directorios
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: No se encuentra el directorio backend" -ForegroundColor Red
    Write-Host "Por favor ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: No se encuentra el directorio frontend" -ForegroundColor Red
    Write-Host "Por favor ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    pause
    exit 1
}

# Verificar Python y Node.js
Write-Host "[1/4] Verificando Python y Node.js..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python no esta instalado" -ForegroundColor Red
    pause
    exit 1
}

try {
    $nodeVersion = node --version 2>&1
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js no esta instalado" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Configurar Backend
Write-Host "[2/4] Configurando Backend..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

# Verificar entorno virtual
if (-not (Test-Path "venv")) {
    Write-Host "  Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
}

# Activar entorno virtual e instalar dependencias
Write-Host "  Instalando dependencias del backend..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
pip install -q -r requirements_simple.txt

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "  Advertencia: No se encuentra archivo .env" -ForegroundColor Yellow
    Write-Host "  Asegurate de configurar las variables de entorno necesarias" -ForegroundColor Yellow
}

Write-Host "  Backend configurado correctamente" -ForegroundColor Green
Set-Location $PSScriptRoot
Write-Host ""

# Configurar Frontend
Write-Host "[3/4] Configurando Frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "  Instalando dependencias del frontend (puede tardar unos minutos)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --silent
} else {
    Write-Host "  Dependencias del frontend ya instaladas" -ForegroundColor Green
}

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "  Creando archivo .env del frontend..." -ForegroundColor Yellow
    "REACT_APP_BACKEND_URL=http://127.0.0.1:8000" | Out-File -FilePath ".env" -Encoding utf8
}

Write-Host "  Frontend configurado correctamente" -ForegroundColor Green
Set-Location $PSScriptRoot
Write-Host ""

# Iniciar servidores
Write-Host "[4/4] Iniciando servidores..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVIDORES LISTOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Docs API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los servidores" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar backend en una nueva ventana
$backendCmd = "cd '$backendDir'; .\venv\Scripts\Activate.ps1; python server_simple.py"
Start-Process -FilePath powershell.exe -ArgumentList '-NoExit','-Command',$backendCmd -WindowStyle Normal

# Esperar 3 segundos para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar frontend en una nueva ventana
$frontendCmd = "cd '$frontendDir'; npm start"
Start-Process -FilePath powershell.exe -ArgumentList '-NoExit','-Command',$frontendCmd -WindowStyle Normal

Write-Host ""
Write-Host "Servidores iniciados en ventanas separadas" -ForegroundColor Green
Write-Host "Cierra esta ventana cuando termines" -ForegroundColor Yellow
Write-Host ""
pause



