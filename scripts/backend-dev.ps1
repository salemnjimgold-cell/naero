$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$envPath = Join-Path $backendDir ".env"
$examplePath = Join-Path $backendDir ".env.development.example"

if (-not (Test-Path $envPath)) {
  Copy-Item $examplePath $envPath
  Write-Host "Created backend\.env from backend\.env.development.example"
}

Push-Location $backendDir
try {
  Write-Host "Starting Naero backend on http://127.0.0.1:8787"
  npm run dev
}
finally {
  Pop-Location
}
