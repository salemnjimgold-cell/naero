$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendUrl = if ($args.Count -gt 0) { $args[0] } elseif ($env:BACKEND_URL) { $env:BACKEND_URL } else { "http://127.0.0.1:8787" }

Push-Location $backendDir
try {
  node scripts/healthcheck.js $backendUrl
}
finally {
  Pop-Location
}
