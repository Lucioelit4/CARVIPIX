param(
  [ValidateSet('local', 'staging', 'prod')]
  [string]$Environment = 'local',
  [string]$DbUser = 'carvipix',
  [string]$DbName = 'carvipix',
  [string]$OutputDirectory = 'backups/manual'
)

$ErrorActionPreference = 'Stop'

$composeFile = "docker-compose.$Environment.yml"
if (-not (Test-Path $composeFile)) {
  throw "Compose file not found: $composeFile"
}

if (-not (Test-Path $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = Join-Path $OutputDirectory "${Environment}_postgres_${timestamp}.sql"

Write-Host "Creating backup: $backupFile"
docker compose -f $composeFile exec -T postgres pg_dump -U $DbUser -d $DbName -Fp > $backupFile

if (-not (Test-Path $backupFile)) {
  throw "Backup failed: output file was not created."
}

Write-Host "Backup completed: $backupFile"
