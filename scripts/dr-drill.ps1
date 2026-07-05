param(
  [ValidateSet('local', 'staging', 'prod')]
  [string]$Environment = 'local',
  [string]$DbUser = 'carvipix',
  [string]$DbName = 'carvipix'
)

$ErrorActionPreference = 'Stop'

$backupDir = 'backups/dr-drills'
if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

& "$PSScriptRoot/backup-postgres.ps1" -Environment $Environment -DbUser $DbUser -DbName $DbName -OutputDirectory $backupDir

$latestBackup = Get-ChildItem -Path $backupDir -Filter "${Environment}_postgres_*.sql" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $latestBackup) {
  throw 'No backup file found for DR drill.'
}

Write-Host "Testing restore from $($latestBackup.FullName)"
& "$PSScriptRoot/restore-postgres.ps1" -Environment $Environment -BackupFile $latestBackup.FullName -DbUser $DbUser -DbName $DbName

$composeFile = "docker-compose.$Environment.yml"
$probe = docker compose -f $composeFile exec -T postgres psql -U $DbUser -d $DbName -t -c "SELECT 1;"
if ($probe -match '1') {
  Write-Host 'DR drill succeeded: restore validation query returned 1.'
} else {
  throw 'DR drill failed: validation query did not return expected value.'
}
