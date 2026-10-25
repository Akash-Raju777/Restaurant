# THE EMBER - Spring Boot Backend Starter
# Loads credentials from ../.env (project root) and launches Spring Boot
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  THE EMBER — Starting Spring Boot Backend (Port 8080)   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# ── 1. Set Java JDK ─────────────────────────────────────────────────
if (Test-Path "C:\Program Files\Java\jdk-26.0.1") {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
    $env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
}

# ── 2. Add Maven to PATH ─────────────────────────────────────────────
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    foreach ($candidate in @("C:\maven\apache-maven-3.9.16\bin", "C:\Users\$env:USERNAME\.maven\apache-maven-3.9.6\bin")) {
        if (Test-Path $candidate) {
            $env:PATH = "$candidate;" + $env:PATH
            break
        }
    }
}

# ── 3. Load .env from project root ───────────────────────────────────
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $loaded = 0
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $eqIdx = $line.IndexOf('=')
        if ($eqIdx -le 0) { return }
        $key = $line.Substring(0, $eqIdx).Trim()
        $val = $line.Substring($eqIdx + 1).Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
        [System.Environment]::SetEnvironmentVariable($key, $val, [System.EnvironmentVariableTarget]::Process)
        $loaded++
    }
    Write-Host "[OK] Loaded $loaded environment variables from .env" -ForegroundColor Green
} else {
    Write-Host "[WARN] No .env file found at: $envFile" -ForegroundColor Yellow
    Write-Host "       Please create .env from .env.example and set your credentials." -ForegroundColor Yellow
}

# ── 4. Start Spring Boot ──────────────────────────────────────────────
Set-Location "$PSScriptRoot\backend"
Write-Host "[INFO] Starting backend..." -ForegroundColor Green
mvn spring-boot:run
