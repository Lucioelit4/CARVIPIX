# BROKER_INTEGRATION_REQUIREMENTS

## 1. Componentes que ya existen
- Runtime de ejecución de estrategias.
- Estado de safe mode.
- Cola de órdenes.
- Historial de posiciones.
- Estado de cuenta.
- Registro de auditoría.
- Sandbox de broker para pruebas internas.
- Panel administrativo que muestra el estado operativo.

## 2. Componentes todavía simulados
- Conector de broker en modo demo/sandbox.
- Estado `brokerMode: demo`.
- `SAFE_MODE` permanente mientras no exista bridge real.
- Precio, spread y slippage simulados.
- Posiciones y ejecuciones de laboratorio.
- Controles de recuperación sin integración broker real.

## 3. Bridge necesario para MT4 o MT5
Se necesita un bridge certificado, de tipo:
- EA en MT4/MT5 con comunicación HTTPS segura.
- Servicio intermedio con autenticación fuerte.
- Canal de órdenes con firma e idempotencia.
- Canal de confirmación de fill/close.

## 4. Cómo se comunicará CARVIPIX con el terminal
- CARVIPIX enviará órdenes al bridge.
- El bridge traducirá a comandos del terminal.
- El terminal responderá con aceptación o rechazo.
- CARVIPIX reconciliará cada cambio por `orderId` y `positionId`.

## 5. Cómo se autenticarán las cuentas
- Cuenta de prueba del broker.
- Identificador de cuenta.
- Secreto o token por canal seguro.
- Validación del bridge antes de aceptar órdenes.

## 6. Cómo se protegerán las credenciales
- Secret manager o vault.
- Nunca en frontend.
- Nunca en repositorio.
- Nunca en logs.
- Rotación y revocación documentadas.

## 7. Cómo se enviarán las órdenes
- Desde el motor a una cola o endpoint del bridge.
- Con idempotencia por orden.
- Con riesgo prevalidado antes de salir.
- Con timestamp y firma.

## 8. Cómo se confirmará que una orden fue aceptada
- ACK explícito del bridge.
- Estado confirmado por el terminal.
- Registro de `brokerOrderId`.
- Reconciliación posterior con posición abierta.

## 9. Cómo se reconciliarán posiciones y operaciones
- Comparar órdenes enviadas, fills y posiciones abiertas.
- Comparar PnL, swap y comisión.
- Persistir diferencias y alertas de divergencia.

## 10. Qué ocurrirá ante desconexión
- Mantener `SAFE_MODE`.
- Dejar de emitir nuevas órdenes.
- Reintentar según política de reintentos.
- Registrar evento de desconexión.
- Notificar al panel admin.

## 11. Cómo se evitarán órdenes duplicadas
- Idempotency key por orden.
- `orderId` único.
- Rechazo de reenvío idéntico.
- Reconciliación antes de reintentar.

## 12. Cómo funcionará el cierre de emergencia
- Kill switch por cliente y global.
- Cierre de posiciones abiertas si el broker lo permite.
- Cancelación de órdenes pendientes.
- Registro de auditoría obligatorio.

## 13. Cómo se gestionará el riesgo por cliente
- Límite de riesgo por cuenta.
- Límite de exposición y drawdown.
- Validación previa al envío.
- Bloqueo si el riesgo excede el umbral.

## 14. Pruebas necesarias antes de quitar SAFE_MODE
- Prueba de desconexión.
- Prueba de reintento.
- Prueba de duplicación.
- Prueba de spread.
- Prueba de slippage.
- Prueba de cierre de emergencia.
- Prueba de reconciliación.
- Prueba de firma/autenticación.
- Prueba de auditoría completa.

## 15. Información o decisiones que necesito de ti
- Broker elegido.
- Tipo exacto de bridge.
- Si el bridge será local, API o híbrido.
- Aprobación del esquema de autenticación.
- Límite de riesgo por cliente.
- Política de kill switch.
- Cuenta de prueba del broker.
- Windows de operación permitidos.

## 16. Pruebas demo obligatorias (MT4/MT5)
- Prueba demo MT4: apertura, modificación y cierre de orden por bridge.
- Prueba demo MT5: apertura, modificación y cierre de orden por bridge.
- Confirmación de `brokerOrderId` y `positionId` en cada operación.
- Validación de latencia máxima aceptable por tipo de orden.
- Validación de idempotencia en reintento de envío.
- Simulación de desconexión del terminal con recuperación controlada.

## 17. Condiciones necesarias para retirar SAFE_MODE
- Bridge MT4/MT5 certificado y estable en entorno de prueba.
- Autenticación y firma habilitadas extremo a extremo.
- Reconciliación automática validada sin divergencias críticas.
- Kill switch funcional (global y por cliente) con auditoría.
- Límites de riesgo activos y bloqueos automáticos verificados.
- Pruebas de desconexión, duplicación y cierre de emergencia aprobadas.
- Evidencia operativa y aprobación formal antes de habilitar operación real.

## Estado actual
- No se debe mover `SAFE_MODE`.
- No se debe habilitar operación real todavía.
- La arquitectura está preparada para integrar el bridge sin reconstrucción mayor.