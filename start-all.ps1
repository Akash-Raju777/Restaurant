# THE EMBER - Full Stack Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  THE EMBER — Launching Full-Stack Application           " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-frontend.ps1"

Write-Host "`nServers launched in background PowerShell windows:" -ForegroundColor Green
Write-Host "  * Frontend UI:    http://localhost:3000" -ForegroundColor White
Write-Host "  * Backend API:    http://localhost:8080" -ForegroundColor White
Write-Host "  * Health Check:   http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "`nUser Accounts:" -ForegroundColor Cyan
Write-Host "  * Customer:       customer@theember.com" -ForegroundColor White
Write-Host "  * Administrator:  admin@theember.com (configured via EMBER_ADMIN_PASSWORD in .env)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
