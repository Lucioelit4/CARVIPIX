param(
  [ValidateSet('local', 'staging', 'prod')]
  [string]$Environment = 'local'
)

$ErrorActionPreference = 'Stop'

$composeFile = "docker-compose.$Environment.yml"
if (-not (Test-Path $composeFile)) {
  throw "Compose file not found: $composeFile"
}

Write-Host "Deploying CARVIPIX to $Environment using $composeFile"

if ($Environment -eq 'local') {
  docker compose -f $composeFile up -d --build --remove-orphans
} else {
  docker compose -f $composeFile pull
  docker compose -f $composeFile up -d --remove-orphans
}

$healthUrl = if ($Environment -eq 'local') { 'http://localhost:3010/api/health' } else { 'http://localhost/api/health' }
Start-Sleep -Seconds 5

try {
  $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10
  if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
    Write-Host "Health check passed at $healthUrl"
  } else {
    throw "Health check failed with status $($response.StatusCode)"
  }
} catch {
  Write-Error "Deployment succeeded but health check failed: $($_.Exception.Message)"
  exit 1
}

Write-Host "Deployment completed successfully."
