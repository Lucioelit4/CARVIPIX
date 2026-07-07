# CARVIPIX

Plataforma Next.js de CARVIPIX con stack DevOps profesional para local, staging y produccion.

## Inicio rapido

1. Copiar variables de entorno:

```powershell
copy .env.example .env.local
```

2. Instalar dependencias:

```powershell
npm install
```

3. Levantar stack local de produccion con observabilidad:

```powershell
npm run infra:up:local
```

4. Abrir servicios:
- App: http://localhost:3010
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## Entornos

- local: `docker-compose.local.yml`
- staging: `docker-compose.staging.yml`
- produccion: `docker-compose.prod.yml`

Comandos de despliegue:

```powershell
npm run deploy:staging
npm run deploy:prod
```

## Backups y recuperacion

```powershell
npm run backup:local
npm run restore:local -- -BackupFile backups/manual/local_postgres_YYYYMMDD_HHMMSS.sql
npm run dr:drill:local
```

## Tareas pesadas en la estacion local

```powershell
npm run heavy:local -- npm run build
```

Esto ajusta memoria y pool de hilos para aprovechar CPU/RAM local sin cambiar la arquitectura de despliegue.

## Documentacion DevOps

Ver detalles operativos en `docs/DEPLOYMENT_DEVOPS.md`.

## Email transaccional

Guia de Brevo SMTP para registro y autenticacion de dominio en `docs/BREVO_SMTP_SETUP.md`.
