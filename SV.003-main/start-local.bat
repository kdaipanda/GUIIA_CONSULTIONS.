@echo off
echo ========================================
echo   Savant Vet - Inicio Local
echo ========================================
echo.

REM Verificar si estamos en el directorio correcto
if not exist "backend" (
    echo ERROR: No se encuentra el directorio backend
    echo Por favor ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: No se encuentra el directorio frontend
    echo Por favor ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo [1/4] Verificando Python y Node.js...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    pause
    exit /b 1
)

echo OK - Python y Node.js disponibles
echo.

echo [2/4] Configurando Backend...
cd backend

REM Crear entorno virtual si no existe
if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
)

REM Activar entorno virtual e instalar dependencias
echo Instalando dependencias del backend...
call .venv\Scripts\activate.bat
pip install -r requirements_simple.txt --quiet

REM Crear .env si no existe
if not exist ".env" (
    echo Creando archivo .env...
    copy .env.example .env >nul 2>&1
)

echo Backend configurado correctamente
cd ..
echo.

echo [3/4] Configurando Frontend...
cd frontend

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias del frontend ^(puede tardar unos minutos^)...
    call npm install --legacy-peer-deps --silent
) else (
    echo Dependencias del frontend ya instaladas
)

REM Crear .env si no existe
if not exist ".env" (
    echo Creando archivo .env del frontend...
    echo REACT_APP_BACKEND_URL=http://127.0.0.1:8000 > .env
)

echo Frontend configurado correctamente
cd ..
echo.

echo [4/4] Iniciando servidores...
echo.
echo ========================================
echo   SERVIDORES LISTOS
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Docs API: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener los servidores
echo ========================================
echo.

REM Iniciar backend en una nueva ventana
start "Savant Vet - Backend" cmd /k "cd backend && .venv\Scripts\activate.bat && python server_simple.py"

REM Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar frontend en una nueva ventana
start "Savant Vet - Frontend" cmd /k "cd frontend && npm start"

echo.
echo Servidores iniciados en ventanas separadas
echo Cierra esta ventana cuando termines
echo.
pause
