# Runbook: Incident Response

## Trigger conditions
- Health probe failing for > 2 minutes
- Elevated 5xx rate
- Multiple container restarts
- User-facing latency spikes

## Immediate actions
1. Confirm impact in Grafana dashboard.
2. Check app logs in Loki.
3. Verify container states with docker compose ps.
4. Attempt safe restart of app service only.

## Escalation path
1. On-call engineer handles first diagnosis.
2. If unresolved in 15 minutes, escalate to backend owner.
3. If data corruption risk is present, freeze writes and escalate to incident commander.

## Safe rollback
1. Identify previous stable image tag.
2. Update APP_IMAGE in env file.
3. Run deploy with previous tag.
4. Confirm health endpoint and key user flows.

## Post-incident
1. Capture timeline.
2. Export relevant logs/metrics.
3. Define corrective and preventive actions.
4. Schedule DR drill if incident involved data integrity.
