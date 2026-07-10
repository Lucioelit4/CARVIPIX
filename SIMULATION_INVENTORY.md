# SIMULATION INVENTORY

| Archivo | Componente o línea aproximada | Tipo de simulación | Expuesto en producción | Nivel de riesgo | Acción realizada | Estado final |
|---|---|---|---|---|---|---|
| app/admin/components/AdminBot.tsx | `generateMockDataHealth()` y bloques demo | B: Demostración visual | Parcial (pantalla admin) | Medio | Requiere migrar a estado real o marcar no disponible | Pendiente de conversión |
| app/admin/utils/mockDataHealth.ts | Utilidad completa de datos demo | A/B | Sí, si admin lo consume | Alto | Aislar del runtime productivo | Aislamiento requerido |
| app/backend/system/broker-sandbox.ts | `mode: demo`, `SIMULATED_BROKER` | D: Simulación operativa | No (sandbox explícito) | Alto | Mantener en sandbox y fuera de producción real | Sandbox explícito |
| app/backend/system/execution-runtime.ts | `brokerMode: "demo"`, `simulateMarketTick` | D: Simulación operativa | Parcial | Alto | Mantener `SAFE_MODE` y bloqueo de operación real | Bloqueado |
| app/backend/adapters/trading-engine-gateway-adapter.ts | `getDemoScenarios()` | B/D | Parcial | Medio/Alto | Migrar a fuentes reales o restringir a pruebas | Pendiente de conversión |
| app/alertas/components/BacktestPanel.tsx | `mockResult`, trades simulados | B: Demostración visual | Sí (UI) | Medio | Etiquetar o cambiar a datos reales | Pendiente de clasificación final |
| app/alertas/components/BacktestPanelExpanded.tsx | `mockResult` | B: Demostración visual | Sí (UI) | Medio | Igual que panel principal | Pendiente |
| app/alertas/components/OptimizerPanel.tsx | `mockProgress`, `mockBestCandidates` | B: Demostración visual | Sí (UI) | Medio | Etiquetar simulación o conectar backend real | Pendiente |
| app/backend/payments/core/provider-adapter.ts | `PlaceholderAdapter` lanza error controlado | C: Fallback inseguro eliminado | Sí (flujo checkout) | Bajo/Controlado | Bloqueo explícito sin sesión mock | Bloqueado explícitamente |
| app/backend/payments/core/provider-adapter-logic.ts | `buildMockCheckoutSession` y mock webhook helpers | A/C | No (uso de pruebas/sandbox) | Medio | Mantener aislado para pruebas internas | Aislado para sandbox |
| app/checkout/CheckoutContent.tsx | `FALLBACK_PRODUCTS` | B: Demostración visual | Sí | Medio | Mantener temporal mientras no haya catálogo backend completo | Parcial |
| app/api/client/payments/route.ts | Endpoint legacy de compra | D: Simulación operativa | Sí (endpoint público) | Alto | Bloquear con `410` | Bloqueado explícitamente |
| app/soporte/page.tsx | `briefing` y mensajes IA | B: Demostración visual | Sí | Bajo/Medio | Mantener como asistencia informativa sin promesa financiera | Etiquetado |
| app/admin/components/AdminDataHealth.tsx | Mensajes anti-demo dependientes de runtime | B/C | Parcial | Medio | Conectar a `/api/admin/system` y transparentar estado | Convertido |
| app/admin/components/AdminUtilidades.tsx | Métricas derivadas con datos incompletos | C/B | Parcial | Medio | Vincular a endpoints reales; falta BD productiva | Convertido parcialmente |
| app/api/payments/webhook/route.ts | `x-mock-signature` en provider custom | A/C | No (debe quedar sandbox) | Medio | Mantener aislado y controlado | Aislado |
| app/engine/core/engineDataRuntime.ts | Estructura analítica sin ejecución real | B/C | Parcial | Medio/Alto | Mantener bloqueo hasta feeds reales certificados | Parcial |
| app/engine/warehouse/* | Conectores y warehouse de laboratorio | A/C | No (laboratorio/sandbox) | Medio | Separación explícita de producción | Sandbox/laboratorio |

## Clasificación resumida
- A. Pruebas internas legítimas: fixtures y helpers de test aislados.
- B. Demostraciones visuales: pantallas o mensajes que muestran una futura capacidad sin fingir producción.
- C. Fallbacks inseguros: cualquier degradación silenciosa a datos simulados o sustitución de integración real.
- D. Simulaciones operativas: cualquier componente que parezca operar dinero, broker o resultados reales sin hacerlo realmente.

## Estado actual
- Los flujos de pago ya no simulan éxito oculto; ahora bloquean explícitamente cuando falta infraestructura.
- El motor y los brokers siguen en sandbox/SAFE_MODE.
- Varias superficies admin y de backtesting aún requieren conversión o aislamiento final antes de llamarlas producción.