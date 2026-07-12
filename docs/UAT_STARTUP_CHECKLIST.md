# CARVIPIX UAT Startup Checklist

## Startup Gate
- Confirmar que el arranque falla si falta una variable critica.
- Confirmar mensaje explicito con variable faltante.

## Runtime
- Verificar estado de DB conectado.
- Verificar estado de bridge configurado.
- Verificar estado de OpenAI configurado.
- Verificar estado de pagos configurado.
- Verificar clasificacion de datos visible en UI.

## Access
- Cliente sin sesion redirige correctamente.
- Cliente sin plan no accede a modulos de membresia activa.
- Admin session valida permite panel admin.

## Stability
- Revisar warnings de arranque y registrar.
- Confirmar sin stack traces expuestos al cliente.
