<#
Start both backend and frontend in separate PowerShell windows for local development.

Usage: Run this script from the repository root in PowerShell:
  .\start-dev.ps1

This will open two new PowerShell windows:
- Backend: activates `backend/.venv` (if present) and runs uvicorn on port 8001
- Frontend: runs `yarn start` inside `frontend` (requires yarn installed)

Edit the script if your paths or commands differ.
#>

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend command
$backendDir = Join-Path $repoRoot 'backend'
$backendCmd = "cd '$backendDir'; if (Test-Path .\.venv) { .\.venv\Scripts\Activate.ps1 } ; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"

Start-Process -FilePath powershell.exe -ArgumentList '-NoExit','-Command',$backendCmd -WorkingDirectory $backendDir

# Frontend command
$frontendDir = Join-Path $repoRoot 'frontend'
$frontendCmd = "cd '$frontendDir'; yarn start"

Start-Process -FilePath powershell.exe -ArgumentList '-NoExit','-Command',$frontendCmd -WorkingDirectory $frontendDir

Write-Host 'Started backend and frontend in new PowerShell windows.' -ForegroundColor Green
Write-Host 'Backend: http://localhost:8001' -ForegroundColor Cyan
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'API Docs: http://localhost:8001/docs' -ForegroundColor Yellow
