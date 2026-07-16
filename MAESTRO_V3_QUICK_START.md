# ⚡ QUICK START — CERTIFICACIÓN MAESTRO V3 CON DATOS REALES

## 🎯 En 3 Pasos

### 1️⃣ Configure API Key (si no lo tiene)

```bash
# Edit or create .env.local in root
TWELVE_DATA_API_KEY=your_key_here
OPENAI_API_KEY=your_existing_key
```

> Sin Twelve Data API key: El sistema usará modo evaluación (datos parciales)

### 2️⃣ Inicie Servidor

```bash
npm run dev
```

### 3️⃣ Abra Observador

```
http://localhost:3000/admin/observer-v3
```

**Automáticamente**:
- ✅ Carga datos reales de Twelve Data
- ✅ Inicializa pipeline + indicadores
- ✅ Inicia Scheduler
- ✅ Comienza a mostrar análisis en vivo

---

## 👀 Qué Ver

### Admin UI Mostrará

1. **Stat Cards Superiores**
   - Total Análisis ejecutados
   - Costo USD acumulado
   - Balance de Paper Account
   - P&L del paper trading

2. **Paper Account Monitor**
   - Balance actual
   - Equity
   - Win Rate %
   - Trades abiertos/cerrados

3. **Tarjetas por Instrumento** (XAUUSD, EURUSD, GBPUSD, BTCUSD)
   ```
   Estado: COMPLETED
   Decisión: ENTER_BUY / WAIT / NO_TRADE
   Probabilidad: 73% | Convicción: 0.82
   Costo: $0.0052 | Latencia: 2341ms
   ```

4. **Expandir tarjeta para ver**:
   - Expediente completo (16 secciones)
   - Pregunta Maestra (prompt enviado)
   - Respuesta de ChatGPT
   - **Matriz de distribución** (9 destinos)

### Consola Mostrará

```
[RealDataIngestion] XAUUSD: 120 H1, 120 M30, 144 M5 candles loaded
[RealDataIngestion] Complete. 2176 total candles loaded.
[ObserverRunner] ✅ Scheduler ready to monitor. Awaiting first trigger...
```

---

## 📊 Monitorear en Vivo (opcional)

En otra terminal:

```bash
npm run observer:run
```

Muestra análisis nuevos cada 10 segundos.

---

## ✅ Certificación Completada Cuando

- [ ] Scheduler está activo (logs muestran "ready to monitor")
- [ ] 3 análisis COMPLETED con decisiones reales
- [ ] Decisiones mixtas (ENTER_BUY, WAIT, NO_TRADE - no forzadas)
- [ ] Costos reales (> $0)
- [ ] Latencia real (> 1000ms)
- [ ] Analysis IDs únicos para cada
- [ ] 9 destinos con status (DELIVERED/SKIPPED/FAILED)
- [ ] Tests: `npm run test:v3` = 40/40 passed

---

## 🔴 Si Algo Falla

### "No candles loaded"
- Verifica TWELVE_DATA_API_KEY en .env.local
- Reinicia servidor

### "Scheduler not active"
- Check logs en consola
- Recarga página en navegador

### "No new analyses appearing"
- Espera 5+ minutos (scheduler corre naturalmente)
- Ejecuta `npm run observer:status` para verificar

---

## 🎓 Qué Significa Esta Certificación

Después de confirmar 3 ciclos con datos reales:

✅ **Maestro V3 quedará CONGELADO**
- Sin cambios de prompt
- Sin cambios de scheduling
- Sin cambios de dispatcher
- Solo cambios futuros basados en evidencia estadística

✅ **Próximos bloques**:
- BOT ENGINE (ejecutar señales)
- TELEGRAM (alertas)
- Community Publisher

---

## 📚 Documentación Completa

Ver: `MAESTRO_V3_REAL_DATA_CERTIFICATION.md`

---

**ESTADO**: ✅ LISTO  
**TIEMPO ESTIMADO**: 15 minutos inicial + observar 3 ciclos (variable)  
**ESFUERZO**: 0 - Todo automático
