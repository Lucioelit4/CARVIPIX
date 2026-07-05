# Runbook: Backup and Restore

## Backup verification checklist
1. Backup job completed on schedule.
2. Latest dump file exists and is non-empty.
3. Retention policy is enforced.

## Manual backup
```powershell
npm run backup:prod
```

## Restore steps
1. Announce maintenance window.
2. Stop write traffic.
3. Run restore command.
4. Run validation queries.
5. Re-enable traffic.

```powershell
npm run restore:prod -- -BackupFile backups/manual/prod_postgres_YYYYMMDD_HHMMSS.sql
```

## Validation queries
- SELECT 1;
- Row counts on core tables.
- Last business transaction checksum comparison.

## DR drill
```powershell
npm run dr:drill:prod
```

## Success criteria
- Restore completed within RTO target.
- Data recovered within RPO target.
- Health endpoint returns 200.
