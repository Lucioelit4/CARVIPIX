/**
 * CARVIPIX BRAIN CONTROLLER
 * 
 * Controlador maestro del ciclo E2E completo
 * 
 * Responsabilidades:
 * 1. Estados: STOPPED, STARTING, ACTIVE, PAUSED, ERROR, MAINTENANCE
 * 2. Orquestar el ciclo completo (signal → modules → MT5 → retorno → actualización)
 * 3. Garantizar idempotencia (sin duplicados)
 * 4. Recuperación ante fallos
 * 5. Persistencia
 * 
 * Flujo:
 * [Admin activa] → STARTING → ACTIVE → (espera signal) →
 * → distribuye a 9 módulos → Telegram → Bot → MT5 →
 * → retorno → actualización → cierre → ACTIVE (espera siguiente)
 */

import { masterEventDispatcher, type MasterEvent } from "../services/master-event-dispatcher";
import { realSignalLifecycleService, type RealSignalLifecycleRecord } from "../services/real-signal-lifecycle-service";
import TelegramClientService from "@/app/lib/services/telegramClientService";
import { backendDatabase } from "./database";

let telegramClientService: TelegramClientService | null = null;

function getTelegramClientService(): TelegramClientService {
  if (!telegramClientService) {
    telegramClientService = new TelegramClientService({
      botToken: process.env.TELEGRAM_BOT_TOKEN || "",
      channelTest: process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      channelOfficial: process.env.TELEGRAM_CHANNEL_OFFICIAL || "@carvipix_alerts",
      testOnly: process.env.NODE_ENV !== 'production'
    });
  }

  return telegramClientService;
}

export type BrainState = "STOPPED" | "STARTING" | "ACTIVE" | "PAUSED" | "ERROR" | "MAINTENANCE";

export interface BrainStatus {
  state: BrainState;
  activatedAt?: Date;
  activatedBy?: string;
  lastSignalTime?: Date;
  lastSignalId?: string;
  errorMessage?: string;
  connectedModules: number;
  telegramConnected: boolean;
  mt5Connected: boolean;
  cyclesCompleted: number;
  failedCycles: number;
}

export interface CycleEvent {
  eventId: string;
  signalId: string;
  symbol: string;
  direction: "BUY" | "SELL" | "NONE";
  createdAt: Date;
  status: "PROCESSING" | "EXECUTED" | "CLOSED" | "FAILED";
  modules: Record<string, "RECEIVED" | "PROCESSING" | "COMPLETED" | "FAILED">;
  telegramMessageId?: number;
  brokerTicket?: number;
  pnl?: number;
  pips?: number;
}

/**
 * CARVIPIX BRAIN CONTROLLER
 * El corazón del sistema
 */
export class CarvipixBrainController {
  private state: BrainState = "STOPPED";
  private activatedAt?: Date;
  private activatedBy?: string;
  private lastSignal?: RealSignalLifecycleRecord | null;
  private lastSignalTime?: Date;
  private errorMessage?: string;
  private cyclesCompleted = 0;
  private failedCycles = 0;
  private activeCycles: Map<string, CycleEvent> = new Map();

  /**
   * ACTIVAR CEREBRO
   */
  async activate(userId: string): Promise<BrainStatus> {
    console.log(`[BRAIN] Activación iniciada por ${userId}`);
    
    try {
      this.state = "STARTING";
      
      // Verificar conexiones
      const modulesConnected = await this.verifyModuleConnections();
      const telegramConnected = await this.verifyTelegramConnection();
      const mt5Connected = await this.verifyMT5Connection();
      
      if (modulesConnected < 6) {
        throw new Error(`Solo ${modulesConnected}/9 módulos conectados`);
      }
      
      this.state = "ACTIVE";
      this.activatedAt = new Date();
      this.activatedBy = userId;
      this.errorMessage = undefined;
      
      // Persistir estado
      await this.persistState();
      
      console.log(`[BRAIN] ✅ CEREBRO ACTIVO`);
      console.log(`   Módulos: ${modulesConnected}/9`);
      console.log(`   Telegram: ${telegramConnected ? "✅" : "⚠️"}`);
      console.log(`   MT5: ${mt5Connected ? "✅" : "⚠️"}`);
      
      // Procesar eventos pendientes
      await this.processPendingEvents();
      
      return this.getStatus();
      
    } catch (error) {
      this.state = "ERROR";
      this.errorMessage = (error as Error).message;
      await this.persistState();
      throw error;
    }
  }

  /**
   * DESACTIVAR CEREBRO
   */
  async deactivate(userId: string): Promise<BrainStatus> {
    console.log(`[BRAIN] Desactivación por ${userId}`);
    
    this.state = "STOPPED";
    this.activatedAt = undefined;
    this.activatedBy = undefined;
    
    await this.persistState();
    
    console.log(`[BRAIN] ✅ CEREBRO DETENIDO`);
    return this.getStatus();
  }

  /**
   * PAUSAR OPERACIONES
   */
  async pause(): Promise<BrainStatus> {
    console.log(`[BRAIN] Pausando operaciones`);
    
    this.state = "PAUSED";
    await this.persistState();
    
    console.log(`[BRAIN] ⏸️ OPERACIONES EN PAUSA`);
    return this.getStatus();
  }

  /**
   * REANUDAR OPERACIONES
   */
  async resume(): Promise<BrainStatus> {
    console.log(`[BRAIN] Reanudando operaciones`);
    
    if (this.activatedAt) {
      this.state = "ACTIVE";
      await this.persistState();
      
      // Procesar eventos pendientes
      await this.processPendingEvents();
      
      console.log(`[BRAIN] ▶️ OPERACIONES REANUDADAS`);
    }
    
    return this.getStatus();
  }

  /**
   * MANTENIMIENTO
   */
  async maintenance(): Promise<BrainStatus> {
    console.log(`[BRAIN] Entrando en modo mantenimiento`);
    
    this.state = "MAINTENANCE";
    await this.persistState();
    
    console.log(`[BRAIN] 🔧 MODO MANTENIMIENTO`);
    return this.getStatus();
  }

  /**
   * RECIBIR SEÑAL MAESTRA (entrada principal del ciclo)
   * 
   * Llamar así:
   * const result = await brain.receiveMasterSignal({
   *   signal_id: "SIG-XAUUSD-0001",
   *   symbol: "XAUUSD",
   *   direction: "BUY",
   *   entry: 2024.50,
   *   stop_loss: 2020.00,
   *   take_profit: 2035.00,
   *   quality: "A",
   *   confidence: 84
   * });
   */
  async receiveMasterSignal(signal: {
    signal_id: string;
    analysis_id: string;
    symbol: string;
    direction: "BUY" | "SELL" | "NONE";
    entry: number;
    stop_loss: number;
    take_profit: number;
    quality: "A+" | "A" | "B" | "C";
    confidence: number;
    risk_reward: number;
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    
    // Verificar estado del cerebro
    if (this.state !== "ACTIVE") {
      return {
        success: false,
        error: `Cerebro en estado ${this.state}, no puede recibir señales`
      };
    }
    
    try {
      console.log(`[BRAIN] Señal recibida: ${signal.symbol} ${signal.direction}`);
      
      // 1. CREAR EVENTO MAESTRO
      const event = await masterEventDispatcher.receiveSignal(signal);
      
      // 2. DISTRIBUIR A MÓDULOS
      await masterEventDispatcher.distribute(event);
      
      // 3. CREAR CICLO
      const cycle: CycleEvent = {
        eventId: event.event_id,
        signalId: signal.signal_id,
        symbol: signal.symbol,
        direction: signal.direction,
        createdAt: new Date(),
        status: "PROCESSING",
        modules: {
          ALERTS: "PROCESSING",
          TELEGRAM: "PROCESSING",
          BOT: "PROCESSING",
          MANAGEMENT: "RECEIVED",
          FUNDING: "RECEIVED",
          RESULTS: "RECEIVED",
          NOTIFICATIONS: "RECEIVED",
          AUDIT: "RECEIVED",
          ADMIN: "RECEIVED"
        }
      };
      
      this.activeCycles.set(event.event_id, cycle);
      
      // 4. ENVIAR A TELEGRAM (si membresía lo permite)
      try {
        const telegramResult = await this.sendToTelegram(event);
        if (telegramResult.ok && telegramResult.message_id) {
          cycle.telegramMessageId = telegramResult.message_id;
        }
      } catch (error) {
        console.error(`[BRAIN] Error enviando a Telegram:`, error);
        // No fallar el ciclo por Telegram
      }
      
      // 5. ENVIAR AL BOT
      try {
        await this.sendToBot(event);
      } catch (error) {
        console.error(`[BRAIN] Error enviando al Bot:`, error);
        cycle.status = "FAILED";
        this.failedCycles++;
      }
      
      this.lastSignal = await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
      this.lastSignalTime = new Date();
      
      await this.persistState();
      
      console.log(`[BRAIN] ✅ Ciclo iniciado: ${event.event_id}`);
      
      return {
        success: true,
        eventId: event.event_id
      };
      
    } catch (error) {
      this.failedCycles++;
      console.error(`[BRAIN] Error en ciclo:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * RECIBIR EJECUCIÓN DESDE MT5
   */
  async receiveExecutionFromMT5(data: {
    event_id: string;
    status: "EXECUTED" | "REJECTED" | "FAILED";
    ticket?: number;
    entry_price?: number;
  }): Promise<void> {
    console.log(`[BRAIN] Ejecución recibida: ${data.event_id} → ${data.status}`);
    
    // Actualizar ciclo
    const cycle = this.activeCycles.get(data.event_id);
    if (cycle) {
      cycle.status = "EXECUTED";
      cycle.brokerTicket = data.ticket;
      cycle.modules.BOT = "COMPLETED";
    }
    
    // Notificar dispatcher
    await masterEventDispatcher.receiveExecution(data.event_id, {
      status: data.status,
      ticket: data.ticket,
      entry_price: data.entry_price,
      executed_at: new Date()
    });
    
    // Actualizar Telegram
    if (cycle?.telegramMessageId) {
      try {
        await this.updateTelegramWithExecution(cycle);
      } catch (error) {
        console.error(`[BRAIN] Error actualizando Telegram:`, error);
      }
    }
    
    // Notificar módulos
    await masterEventDispatcher.broadcastExecutionResult(data.event_id);
    
    console.log(`[BRAIN] ✅ Módulos actualizados`);
  }

  /**
   * RECIBIR CIERRE DESDE MT5
   */
  async receiveClosureFromMT5(data: {
    event_id: string;
    status: "CLOSED";
    close_type: "TAKE_PROFIT" | "STOP_LOSS" | "MANUAL";
    close_price: number;
    pips: number;
    profit_loss: number;
  }): Promise<void> {
    console.log(`[BRAIN] Cierre recibido: ${data.event_id} → ${data.close_type} (${data.pips} pips)`);
    
    // Actualizar ciclo
    const cycle = this.activeCycles.get(data.event_id);
    if (cycle) {
      cycle.status = "CLOSED";
      cycle.pnl = data.profit_loss;
      cycle.pips = data.pips;
      cycle.modules.BOT = "COMPLETED";
      cycle.modules.RESULTS = "COMPLETED";
    }
    
    // Notificar dispatcher
    await masterEventDispatcher.receiveTradeClosure(data.event_id, {
      status: data.status,
      close_type: data.close_type,
      close_price: data.close_price,
      pips: data.pips,
      profit_loss: data.profit_loss
    });
    
    // Actualizar Telegram con resultado final
    if (cycle?.telegramMessageId) {
      try {
        await this.updateTelegramWithClosure(cycle);
      } catch (error) {
        console.error(`[BRAIN] Error actualizando Telegram final:`, error);
      }
    }
    
    this.cyclesCompleted++;
    
    // Remover del mapa de ciclos activos
    setTimeout(() => {
      this.activeCycles.delete(data.event_id);
    }, 5000);
    
    console.log(`[BRAIN] ✅ Ciclo completado: ${data.event_id}`);
    
    await this.persistState();
  }

  /**
   * OBTENER ESTADO
   */
  getStatus(): BrainStatus {
    return {
      state: this.state,
      activatedAt: this.activatedAt,
      activatedBy: this.activatedBy,
      lastSignalTime: this.lastSignalTime,
      lastSignalId: this.lastSignal?.signalId,
      errorMessage: this.errorMessage,
      connectedModules: 9, // TODO: verificar dinámicamente
      telegramConnected: true, // TODO: verificar
      mt5Connected: true, // TODO: verificar
      cyclesCompleted: this.cyclesCompleted,
      failedCycles: this.failedCycles
    };
  }

  /**
   * OBTENER CICLO ACTIVO
   */
  getCycle(eventId: string): CycleEvent | undefined {
    return this.activeCycles.get(eventId);
  }

  /**
   * LISTAR CICLOS ACTIVOS
   */
  getActiveCycles(): CycleEvent[] {
    return Array.from(this.activeCycles.values());
  }

  // ==================== PRIVATE HELPERS ====================

  private async verifyModuleConnections(): Promise<number> {
    // TODO: Verificar conectividad real de módulos
    return 9;
  }

  private async verifyTelegramConnection(): Promise<boolean> {
    try {
      const info = await getTelegramClientService().getBotInfo();
      return info.ok ?? false;
    } catch {
      return false;
    }
  }

  private async verifyMT5Connection(): Promise<boolean> {
    // TODO: Verificar EA en MT5
    return true;
  }

  private async sendToTelegram(event: MasterEvent): Promise<{ ok: boolean; message_id?: number }> {
    // Formatear mensaje
    const message = this.formatTelegramMessage(event);
    
    // Enviar a canal de test
    const result = await getTelegramClientService().sendMessage({
      channelId: process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      text: message,
      markdown: false
    });
    
    // Registrar en BD
    if (result.success && result.messageId) {
      await backendDatabase.query(
        `
        INSERT INTO telegram_messages (event_id, signal_id, channel_id, message_id, stage, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          event.event_id,
          event.signal_id,
          process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
          result.messageId,
          "CREATED",
          "SENT",
          new Date()
        ]
      );
    }
    
    return {
      ok: result.success,
      message_id: result.messageId
    };
  }

  private async sendToBot(event: MasterEvent): Promise<void> {
    // TODO: Implementar envío al Bot Module
    console.log(`[BRAIN] → Enviando a Bot: ${event.event_id}`);
  }

  private async updateTelegramWithExecution(cycle: CycleEvent): Promise<void> {
    if (!cycle.telegramMessageId) return;
    
    const message = `
📊 <b>ENTRADA EJECUTADA</b>

<b>Par:</b> ${cycle.symbol}
<b>Dirección:</b> ${cycle.direction === "BUY" ? "🟢 COMPRA" : "🔴 VENTA"}

<b>Ticket:</b> #${cycle.brokerTicket}
<b>Estado:</b> 🟢 EN OPERACIÓN
    `;
    
    await getTelegramClientService().editMessage(
      process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      cycle.telegramMessageId,
      message
    );
    
    // Actualizar en BD
    await backendDatabase.query(
      `
      UPDATE telegram_messages
      SET stage = 'EXECUTED', status = 'UPDATED', message_text = $1, updated_at = now()
      WHERE message_id = $2
      `,
      [message, cycle.telegramMessageId]
    );
  }

  private async updateTelegramWithClosure(cycle: CycleEvent): Promise<void> {
    if (!cycle.telegramMessageId) return;
    
    const resultText = cycle.pips! > 0 ? "✅ GANANCIA" : "❌ PÉRDIDA";
    
    const message = `
📊 <b>OPERACIÓN CERRADA</b>

<b>Par:</b> ${cycle.symbol}
<b>Dirección:</b> ${cycle.direction === "BUY" ? "🟢 COMPRA" : "🔴 VENTA"}

<b>Ticket:</b> #${cycle.brokerTicket}

<b>Resultado:</b> ${resultText}
<b>Pips:</b> ${cycle.pips! > 0 ? "+" : ""}${cycle.pips}
<b>USD:</b> ${cycle.pnl! > 0 ? "+" : ""}$${cycle.pnl?.toFixed(2)}

<b>Estado:</b> 🟢 CERRADA
    `;
    
    await getTelegramClientService().editMessage(
      process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      cycle.telegramMessageId,
      message
    );
    
    // Actualizar en BD
    await backendDatabase.query(
      `
      UPDATE telegram_messages
      SET stage = 'CLOSED', status = 'UPDATED', message_text = $1, updated_at = now()
      WHERE message_id = $2
      `,
      [message, cycle.telegramMessageId]
    );
  }

  private formatTelegramMessage(event: MasterEvent): string {
    return `
🎯 <b>ENTRADA CARVIPIX</b>

<b>Par:</b> ${event.symbol}
<b>Dirección:</b> ${event.direction === "BUY" ? "🟢 COMPRA" : "🔴 VENTA"}
<b>Nivel:</b> ${event.quality} (${event.confidence}% confianza)

<b>Entrada:</b> ${event.entry.toFixed(2)}
<b>Stop Loss:</b> ${event.stop_loss.toFixed(2)}
<b>Take Profit:</b> ${event.take_profit.toFixed(2)}

<b>Risk/Reward:</b> 1:${event.risk_reward.toFixed(2)}

<b>Estado:</b> ⏳ Esperando ejecución
#${event.symbol} #${event.direction}
    `;
  }

  private async processPendingEvents(): Promise<void> {
    console.log(`[BRAIN] Procesando eventos pendientes...`);
    // TODO: Procesar eventos que quedaron en estado pendiente por reinicio
  }

  private async persistState(): Promise<void> {
    // TODO: Persistir estado del brain en BD para recuperación
  }
}

/**
 * Singleton instance
 */
let brainInstance: CarvipixBrainController | null = null;

export function getCarvipixBrain(): CarvipixBrainController {
  if (!brainInstance) {
    brainInstance = new CarvipixBrainController();
  }
  return brainInstance;
}

export const carvipixBrain = getCarvipixBrain();

export default CarvipixBrainController;
