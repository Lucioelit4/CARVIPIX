# CARVIPIX DevOps Blueprint

This setup provides one architecture for local, staging, and production.
You can run heavy workloads locally and promote the same runtime to servers.

## 1. Environment model

- local: full stack with observability and optional heavy worker profile.
- staging: production-like stack for validation.
- production: hardened stack with backup retention and monitoring.

Compose files:
- docker-compose.local.yml
- docker-compose.staging.yml
- docker-compose.prod.yml

## 2. Local environment

Requirements:
- Docker Desktop
- Node.js 20+

Start local stack:

```powershell
copy .env.example .env.local
npm install
npm run infra:up:local
```

Start heavy worker profile (uses workstation CPU/memory):

```powershell
npm run infra:heavy
```

Services:
- App: http://localhost:3010
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Blackbox exporter: http://localhost:9115

## 3. Staging and production

Use server-side env files (do not commit real credentials):
- .env.staging
- .env.production

Deploy from local terminal:

```powershell
npm run deploy:staging
npm run deploy:prod
```

Use GitHub Actions with manual trigger:
- workflow_dispatch -> staging or production (explicit selection)

## 4. Logs and monitoring

Included stack:
- Prometheus for metrics
- Blackbox exporter for HTTP probes
- Loki for logs
- Promtail for log shipping
- Grafana for dashboards

Initial dashboard is provisioned automatically:
- CARVIPIX Overview

Alerts configured:
- Health endpoint down
- Host CPU sustained > 85%
- Container restart spike

## 5. Backups

Postgres backup container is scheduled by cron in staging/prod.
Manual backup:

```powershell
npm run backup:local
npm run backup:staging
npm run backup:prod
```

Restore:

```powershell
npm run restore:local -- -BackupFile backups/manual/local_postgres_YYYYMMDD_HHMMSS.sql
```

## 6. Disaster recovery

Periodic DR drill validates restore path:

```powershell
npm run dr:drill:local
npm run dr:drill:staging
npm run dr:drill:prod
```

Target policy:
- RPO <= 2h in production
- RTO <= 30m for app + db restore

## 7. CI/CD automation

Workflows:
- .github/workflows/ci.yml
- .github/workflows/deploy.yml

CI pipeline:
- npm ci
- npm run lint
- npm run build
- Build and push image to GHCR

CD pipeline:
- Resolve target environment from manual workflow input
- SSH deploy to server with docker compose
- Health probe verification after deploy

Required GitHub secrets:
- DEPLOY_HOST
- DEPLOY_PORT
- DEPLOY_USER
- DEPLOY_SSH_KEY
- DEPLOY_APP_DIR

If any of these secrets are missing, the deploy job is skipped and no real deployment is attempted.

## 8. Manual configuration before production

- Create `.env.production` on the target server using `.env.production.example` as template.
- Replace all `change-me` placeholders with strong secrets.
- Configure TLS certificate handling in front of Nginx (or via upstream reverse proxy).
- Set GitHub environment protections for `production` (required reviewers and branch policy).
- Validate backup restore with `npm run dr:drill:prod` in a maintenance window.

## 9. Scale path without architecture changes

This setup keeps container boundaries stable:
- Promote same app image across environments.
- Keep data services isolated behind URLs.
- Keep observability sidecars unchanged.

Future horizontal scale options:
- Move compose services to Kubernetes or Nomad.
- Replace local Postgres/Redis with managed services.
- Add load balancer + multiple app replicas.

No application architecture rewrite is required for these upgrades.

## 10. Enterprise operation checklists

Official checklists for preproduction and controlled go-live are in:
- `docs/checklists/PREPRODUCTION_CHECKLIST.md`
- `docs/checklists/GO_LIVE_CHECKLIST.md`
- `docs/checklists/RECOVERY_CHECKLIST.md`
- `docs/checklists/SCALABILITY_CHECKLIST.md`

These checklists enforce CARVIPIX operating philosophy:
- Heavy processing on local workstation.
- Production servers focused on customer-facing traffic.
