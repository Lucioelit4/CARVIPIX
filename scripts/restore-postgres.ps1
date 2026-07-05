param(
  [ValidateSet('local', 'staging', 'prod')]
  [string]$Environment = 'local',
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$DbUser = 'carvipix',
  [string]$DbName = 'carvipix'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$composeFile = "docker-compose.$Environment.yml"
if (-not (Test-Path $composeFile)) {
  throw "Compose file not found: $composeFile"
}

Write-Host "Restoring backup $BackupFile into $Environment/$DbName"
Get-Content -Path $BackupFile | docker compose -f $composeFile exec -T postgres psql -U $DbUser -d $DbName
Write-Host "Restore completed."
