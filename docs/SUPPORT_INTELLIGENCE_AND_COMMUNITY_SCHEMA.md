# Support Intelligence and Community Schema

## Objetivo
Extender la etapa 2 con persistencia para comunidad moderada sin romper funcionalidades existentes.

## Tablas

### community_messages
- id (PK)
- channel_id
- user_id (FK users.id)
- user_name
- user_role
- content
- moderated
- moderation_reason
- created_at

Indice:
- idx_community_messages_channel_created_at(channel_id, created_at DESC)

### community_message_reports
- id (PK)
- message_id
- channel_id
- reported_by (FK users.id)
- reason
- created_at

Indice:
- idx_community_reports_channel_created_at(channel_id, created_at DESC)

### community_moderation_logs
- id (PK)
- user_id (FK users.id)
- channel_id
- action
- reason
- metadata (JSONB)
- created_at

Indice:
- idx_community_moderation_channel_created_at(channel_id, created_at DESC)

## Seguridad y aislamiento
- Cada accion de moderacion queda registrada en community_moderation_logs.
- Los reportes de miembros se registran en community_message_reports.
- Los endpoints de comunidad usan sesion autenticada para identidad de usuario.
- Si la base no esta disponible o falta migracion, el sistema usa fallback local en data/community-state.json para no romper UX.
