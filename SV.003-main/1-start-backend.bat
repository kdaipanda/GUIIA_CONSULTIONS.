@echo off
echo ========================================
echo   Iniciando Backend - Savant Vet
echo ========================================
echo.

cd backend

echo Activando entorno virtual...
call .venv\Scripts\activate.bat

echo.
echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener
echo ========================================
echo.

python server_simple.py

pause
