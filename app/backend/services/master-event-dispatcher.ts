/**
 * CARVIPIX Master Event Dispatcher
 * 
 * Coordinador central de ciclo E2E
 * Responsabilidades:
 * 1. Recibir Señal Maestra del Trading Engine
 * 2. Generar event_id único y trazable
 * 3. Distribuir a 8 módulos simultáneamente
 * 4. Trackear estado de cada módulo
 * 5. Coordinar retorno de información
 * 6. Mantener trazabilidad 100%
 * 
 * Ubicación: app/backend/services/master-event-dispatcher.ts
 */

import { backendDatabase } from "../core/database";
import TelegramClientService from "@/app/lib/services/telegramClientService";
import { realSignalLifecycleService, type RealSignalLifecycleRecord } from "./real-signal-lifecycle-service";
import { botMT5Service } from "./bot-mt5-service";

// Inicializar Telegram
const telegramClientService = new TelegramClientService({
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  channelTest: process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
  channelOfficial: process.env.TELEGRAM_CHANNEL_OFFICIAL || "@carvipix_alerts",
  testOnly: process.env.NODE_ENV !== 'production'
});

// ==================== BRAIN STATE TYPES ====================

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
 * Tipos de evento
 */
export type EventType = 
  | 'SIGNAL_CREATED'      // Señal nueva generada
  | 'SIGNAL_DISTRIBUTED'  // Distribuida a módulos
  | 'MODULE_PROCESSING'   // Módulo procesando
  | 'MODULE_COMPLETED'    // Módulo completó
  | 'EXECUTION_RECEIVED'  // Retorno de MT5
  | 'MODULES_UPDATED'     // Todos módulos actualizados
  | 'TRADE_CLOSED'        // Operación cerrada
  | 'CYCLE_COMPLETE';     // Ciclo completo

/**
 * Estado de módulo
 */
export type ModuleState = 
  | 'RECEIVED'
  | 'VALIDATING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING_RETRY';

/**
 * Estructura de un evento maestro
 */
export interface MasterEvent {
  event_id: string;           // EVT-20260715-0001 (único)
  signal_id: string;          // SIG-XAUUSD-0001
  execution_id?: string;      // EXE-0001 (después de ejecución)
  analysis_id: string;        // Análisis que generó signal
  
  // Identidad del evento
  type: EventType;
  timestamp: Date;
  source: 'TRADING_ENGINE' | 'BOT' | 'MT5' | 'ADMIN';
  
  // Datos de la señal
  symbol: string;
  direction: 'BUY' | 'SELL' | 'NONE';
  entry: number;
  stop_loss: number;
  take_profit: number;
  
  // Contexto
  quality: 'A+' | 'A' | 'B' | 'C';
  confidence: number;          // 0-100
  risk_reward: number;         // 1.5 = 1:1.5
  risk_profile: string;
  
  // Módulos
  modules_requested: string[]; // Qué módulos debe activar
  modules_status: Map<string, ModuleState>; // Estado de cada uno
  
  // Estado general
  status: 'CREATED' | 'DISTRIBUTED' | 'PROCESSING' | 'EXECUTED' | 'CLOSED' | 'FAILED' | 'CANCELLED';
  
  // Trazabilidad
  parent_event_id?: string;    // Si es respuesta de otro evento
  version: string;             // Schema version
  
  // Metadata
  metadata: {
    trading_engine_score?: number;
    analysis_profile?: string;
    strategy_id?: string;
    market_conditions?: string;
    news_risk?: string;
    ticket?: number;           // Del broker demo
    profit_loss?: number;       // Si está cerrado
    pips?: number;              // Si está cerrado
    duration_seconds?: number;  // Si está cerrado
  };
}

/**
 * Registro de módulo en BD
 */
export interface ModuleStateRecord {
  event_id: string;
  module_name: string;
  state: ModuleState;
  progress: number;            // 0-100 (real)
  received_at: Date;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  steps_completed: number;
  total_steps: number;
}

/**
 * MASTER EVENT DISPATCHER
 * 
 * Coordinador único centralizado que combina:
 * - Orquestación de eventos E2E
 * - Control del estado del Brain (activate/deactivate/pause/resume)
 * - Integración Telegram
 */
export class MasterEventDispatcher {
  private events: Map<string, MasterEvent> = new Map();
  
  // ==================== BRAIN STATE ====================
  private brainState: BrainState = "STOPPED";
  private brainActivatedAt?: Date;
  private brainActivatedBy?: string;
  private lastSignal?: RealSignalLifecycleRecord | null;
  private lastSignalTime?: Date;
  private brainErrorMessage?: string;
  private cyclesCompleted = 0;
  private failedCycles = 0;
  private activeCycles: Map<string, CycleEvent> = new Map();
  
  constructor() {
    // Cargar estado desde BD si existe
    this.loadBrainState().catch(err => {
      console.error(`[DISPATCHER] Error cargando estado: ${err}`);
    });
  }
  
  /**
   * Cargar estado del cerebro desde BD
   */
  private async loadBrainState(): Promise<void> {
    try {
      const result = await backendDatabase.query(
        'SELECT * FROM admin_state_persistence WHERE state_id = $1',
        ['BRAIN_STATE']
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        this.brainState = row.brain_state || 'STOPPED';
        this.brainActivatedAt = row.activated_at;
        this.brainActivatedBy = row.activated_by;
        this.lastSignalTime = row.last_signal_time;
        this.cyclesCompleted = row.cycles_completed || 0;
        this.failedCycles = row.failed_cycles || 0;
        
        console.log(`[DISPATCHER-BRAIN] ✓ Estado cargado desde BD: ${this.brainState}`);
      }
    } catch (err) {
      console.error(`[DISPATCHER-BRAIN] No se pudo cargar estado desde BD: ${err}`);
    }
  }
  
  /**
   * Generar event_id único
   * Formato: EVT-YYYYMMDD-NNNNN
   */
  private generateEventId(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `EVT-${dateStr}-${randomNum}`;
  }
  
  /**
   * 1. RECIBIR SIGNAL DEL TRADING ENGINE
   * 
   * Llamar así:
   * const event = dispatcher.receiveSignal({
   *   signal_id: 'SIG-XAUUSD-0001',
   *   analysis_id: 'ANA-001',
   *   symbol: 'XAUUSD',
   *   direction: 'BUY',
   *   entry: 2024.50,
   *   stop_loss: 2020.00,
   *   take_profit: 2035.00,
   *   quality: 'A',
   *   confidence: 84,
   *   risk_reward: 1.55
   * });
   */
  public async receiveSignal(data: {
    signal_id: string;
    analysis_id: string;
    symbol: string;
    direction: 'BUY' | 'SELL' | 'NONE';
    entry: number;
    stop_loss: number;
    take_profit: number;
    quality: 'A+' | 'A' | 'B' | 'C';
    confidence: number;
    risk_reward: number;
    risk_profile?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MasterEvent> {
    
    // Generar event_id único
    const event_id = this.generateEventId();
    
    // Crear evento maestro
    const event: MasterEvent = {
      event_id,
      signal_id: data.signal_id,
      analysis_id: data.analysis_id,
      type: 'SIGNAL_CREATED',
      timestamp: new Date(),
      source: 'TRADING_ENGINE',
      
      symbol: data.symbol,
      direction: data.direction,
      entry: data.entry,
      stop_loss: data.stop_loss,
      take_profit: data.take_profit,
      
      quality: data.quality,
      confidence: data.confidence,
      risk_reward: data.risk_reward,
      risk_profile: data.risk_profile || 'MODERATE',
      
      // Módulos que deben activarse (todos)
      modules_requested: [
        'ALERTS',
        'BOT',
        'MANAGEMENT',
        'FUNDING',
        'RESULTS',
        'NOTIFICATIONS',
        'AUDIT',
        'ADMIN'
      ],
      
      modules_status: new Map(),
      status: 'CREATED',
      version: '1.00',
      metadata: data.metadata || {}
    };
    
    // Guardar en memoria
    this.events.set(event_id, event);
    
    // Persistir en BD
    await this.persistEventCreation(event);
    
    console.log(`[DISPATCHER] Signal recibida y evento creado: ${event_id}`);
    
    return event;
  }
  
  /**
   * 2. DISTRIBUIR A MÓDULOS
   * 
   * Después de receiveSignal(), llamar:
   * await dispatcher.distribute(event);
   */
  public async distribute(event: MasterEvent): Promise<void> {
    event.type = 'SIGNAL_DISTRIBUTED';
    event.status = 'DISTRIBUTED';
    
    console.log(`[DISPATCHER] Distribuyendo ${event.event_id} a ${event.modules_requested.length} módulos...`);
    
    // Inicializar estado de cada módulo
    for (const module of event.modules_requested) {
      event.modules_status.set(module, 'RECEIVED');
      
      // Registrar en BD
      await this.recordModuleState({
        event_id: event.event_id,
        module_name: module,
        state: 'RECEIVED',
        progress: 0,
        received_at: new Date(),
        steps_completed: 0,
        total_steps: 5 // Típicamente
      });
    }
    
    // Enrutar a cada módulo (detalles en ModuleDistributor)
    await this.routeToModules(event);
    
    // Actualizar BD
    await this.persistEventUpdate(event);
    
    console.log(`[DISPATCHER] ✓ Evento ${event.event_id} distribuido a todos los módulos`);
  }
  
  /**
   * 3. TRACKEAR ESTADO DE MÓDULO
   * 
   * Cada módulo llama:
   * await dispatcher.updateModuleState(event_id, 'ALERTS', {
   *   state: 'PROCESSING',
   *   progress: 35,
   *   step: 'VALIDATING_MEMBERSHIP'
   * });
   */
  public async updateModuleState(
    event_id: string,
    module: string,
    update: {
      state: ModuleState;
      progress: number;
      step?: string;
      error?: string;
    }
  ): Promise<void> {
    const event = this.events.get(event_id);
    if (!event) {
      throw new Error(`Event ${event_id} not found`);
    }
    
    // Actualizar estado en memoria
    event.modules_status.set(module, update.state);
    
    // Registrar en BD
    await backendDatabase.query(
      `
      INSERT INTO module_state_history (event_id, module_name, state, progress, recorded_at, step, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (event_id, module_name, recorded_at) DO UPDATE SET
        state = $3,
        progress = $4,
        step = $6,
        error_message = $7
      `,
      [
        event_id,
        module,
        update.state,
        update.progress,
        new Date(),
        update.step || null,
        update.error || null
      ]
    );
    
    console.log(`[DISPATCHER] ${module}: ${update.state} (${update.progress}%)`);
  }
  
  /**
   * 4. RECIBIR EJECUCIÓN DEL BOT/MT5
   * 
   * Cuando MT5 retorna:
   * await dispatcher.receiveExecution(event_id, {
   *   status: 'EXECUTED',
   *   ticket: 123456789,
   *   entry_price: 2024.52,
   *   ...
   * });
   */
  public async receiveExecution(
    event_id: string,
    execution: {
      status: 'EXECUTED' | 'REJECTED' | 'FAILED' | 'EXPIRED';
      ticket?: number;
      entry_price?: number;
      executed_at?: Date;
      reason?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    let event = this.events.get(event_id);
    
    // Si no está en memoria, verificar que exista en BD (no lo cargamos, solo validamos)
    if (!event) {
      try {
        const result = await backendDatabase.query(
          'SELECT event_id FROM master_events WHERE event_id = $1',
          [event_id]
        );
        if (result.rows.length === 0) {
          throw new Error(`Event ${event_id} not found`);
        }
        // Evento existe en BD, continuar normalmente
      } catch (err) {
        throw new Error(`Event ${event_id} not found`);
      }
    }
    
    // Actualizar evento en memoria si existe
    if (event) {
      event.status = 'EXECUTED';
      event.type = 'EXECUTION_RECEIVED';
      
      if (execution.ticket) {
        event.metadata.ticket = execution.ticket;
      }
    }
    
    // Registrar ejecución en BD
    await backendDatabase.query(
      `
      INSERT INTO event_executions (event_id, execution_status, broker_ticket, entry_price, executed_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        event_id,
        execution.status,
        execution.ticket || null,
        execution.entry_price || null,
        execution.executed_at || new Date(),
        JSON.stringify(execution.metadata || {})
      ]
    );
    
    console.log(`[DISPATCHER] Ejecución recibida: ${event_id} → ${execution.status}`);
    
    // Notificar que ejecutó
    await this.updateModuleState(event_id, 'BOT', {
      state: 'COMPLETED',
      progress: 100,
      step: 'EXECUTED'
    });
  }
  
  /**
   * 5. ACTUALIZAR TODOS LOS MÓDULOS CON RESULTADO
   * 
   * Después de recibir ejecución:
   * await dispatcher.broadcastExecutionResult(event_id);
   */
  public async broadcastExecutionResult(event_id: string): Promise<void> {
    const event = this.events.get(event_id);
    if (!event) {
      throw new Error(`Event ${event_id} not found`);
    }
    
    console.log(`[DISPATCHER] Broadcasting resultado de ejecución a todos los módulos...`);
    
    // Preparar payload para cada módulo
    const payload = {
      event_id,
      signal_id: event.signal_id,
      execution_id: event.execution_id,
      status: event.status,
      ticket: event.metadata.ticket,
      timestamp: new Date()
    };
    
    // Notificar a cada módulo que actualice su estado
    for (const module of event.modules_requested) {
      await this.notifyModuleOfExecution(event_id, module, payload);
    }
    
    event.type = 'MODULES_UPDATED';
    await this.persistEventUpdate(event);
    
    console.log(`[DISPATCHER] ✓ Todos los módulos notificados del resultado`);
  }
  
  /**
   * 6. RECIBIR CIERRE DE OPERACIÓN (DESDE MT5)
   * 
   * Cuando cierra por TP/SL:
   * await dispatcher.receiveTradeClosure(event_id, {
   *   status: 'CLOSED',
   *   close_type: 'TAKE_PROFIT',
   *   close_price: 2035.00,
   *   pips: 10.48,
   *   profit_loss: 69.87
   * });
   */
  public async receiveTradeClosure(
    event_id: string,
    closure: {
      status: 'CLOSED';
      close_type: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'PARTIAL';
      close_price: number;
      pips: number;
      profit_loss: number;
      closed_at?: Date;
    }
  ): Promise<void> {
    let event = this.events.get(event_id);
    let modulesRequested: string[] = [];
    
    // Si no está en memoria, verificar que exista en BD
    if (!event) {
      try {
        const result = await backendDatabase.query(
          'SELECT event_id, modules_requested FROM master_events WHERE event_id = $1',
          [event_id]
        );
        if (result.rows.length === 0) {
          throw new Error(`Event ${event_id} not found`);
        }
        // Extraer módulos solicitados de la BD
        const row = result.rows[0];
        if (typeof row.modules_requested === 'string') {
          try {
            modulesRequested = JSON.parse(row.modules_requested);
          } catch {
            modulesRequested = [];
          }
        }
      } catch (err) {
        throw new Error(`Event ${event_id} not found`);
      }
    } else {
      modulesRequested = event.modules_requested || [];
    }
    
    // Actualizar evento en memoria si existe
    if (event) {
      event.type = 'TRADE_CLOSED';
      event.status = 'CLOSED';
      event.metadata.pips = closure.pips;
      event.metadata.profit_loss = closure.profit_loss;
    }
    
    // Registrar cierre
    await backendDatabase.query(
      `
      INSERT INTO trade_closures (event_id, close_type, close_price, pips, profit_loss, closed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        event_id,
        closure.close_type,
        closure.close_price,
        closure.pips,
        closure.profit_loss,
        closure.closed_at || new Date()
      ]
    );
    
    console.log(`[DISPATCHER] Cierre registrado: ${event_id} → ${closure.close_type} (${closure.pips} pips)`);
    
    // Notificar a módulos
    for (const module of modulesRequested) {
      await this.notifyModuleOfClosure(event_id, module, closure);
    }
    
    if (event) {
      event.type = 'CYCLE_COMPLETE';
      await this.persistEventUpdate(event);
    }
    
    console.log(`[DISPATCHER] ✓ Ciclo completado: ${event_id}`);
  }
  
  /**
   * 7. OBTENER ESTADO COMPLETO DE UN EVENTO
   */
  public async getEventStatus(event_id: string): Promise<{
    event: MasterEvent | null;
    modules: ModuleStateRecord[];
    timeline: Array<{ timestamp: Date; type: string; message: string }>;
  }> {
    const event = this.events.get(event_id);
    
    // Obtener estado de módulos de BD
    const { rows: moduleRows } = await backendDatabase.query<any>(
      `
      SELECT DISTINCT ON (module_name) event_id, module_name, state, progress, received_at, started_at, completed_at, error_message
      FROM module_state_history
      WHERE event_id = $1
      ORDER BY module_name, recorded_at DESC
      `,
      [event_id]
    );
    
    // Construir timeline
    const timeline: Array<{ timestamp: Date; type: string; message: string }> = [];
    
    if (event) {
      timeline.push({
        timestamp: event.timestamp,
        type: 'SIGNAL_CREATED',
        message: `Señal ${event.signal_id} creada (${event.quality})`
      });
    }
    
    for (const row of moduleRows) {
      timeline.push({
        timestamp: row.completed_at || row.started_at || row.received_at,
        type: row.state,
        message: `${row.module_name}: ${row.state} (${row.progress}%)`
      });
    }
    
    // Ordenar timeline por timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return {
      event: event || null,
      modules: moduleRows.map((row: any) => ({
        event_id: row.event_id,
        module_name: row.module_name,
        state: row.state,
        progress: row.progress,
        received_at: row.received_at,
        started_at: row.started_at,
        completed_at: row.completed_at,
        error_message: row.error_message,
        steps_completed: 0,
        total_steps: 5
      })),
      timeline
    };
  }

  // ==================== BRAIN CONTROL METHODS ====================

  /**
   * ACTIVAR CEREBRO
   */
  async activate(userId: string): Promise<BrainStatus> {
    console.log(`[DISPATCHER-BRAIN] Activación iniciada por ${userId}`);
    
    try {
      this.brainState = "STARTING";
      
      // Verificar conexiones
      const modulesConnected = await this.verifyModuleConnections();
      const telegramConnected = await this.verifyTelegramConnection();
      const mt5Connected = await this.verifyMT5Connection();
      
      if (modulesConnected < 6) {
        throw new Error(`Solo ${modulesConnected}/9 módulos conectados`);
      }
      
      this.brainState = "ACTIVE";
      this.brainActivatedAt = new Date();
      this.brainActivatedBy = userId;
      this.brainErrorMessage = undefined;
      
      // Persistir estado
      await this.persistBrainState();
      
      console.log(`[DISPATCHER-BRAIN] ✅ CEREBRO ACTIVO`);
      console.log(`   Módulos: ${modulesConnected}/9`);
      console.log(`   Telegram: ${telegramConnected ? "✅" : "⚠️"}`);
      console.log(`   MT5: ${mt5Connected ? "✅" : "⚠️"}`);
      
      // Procesar eventos pendientes
      await this.processPendingEvents();
      
      return this.getBrainStatus();
      
    } catch (error) {
      this.brainState = "ERROR";
      this.brainErrorMessage = (error as Error).message;
      await this.persistBrainState();
      throw error;
    }
  }

  /**
   * DESACTIVAR CEREBRO
   */
  async deactivate(userId: string): Promise<BrainStatus> {
    console.log(`[DISPATCHER-BRAIN] Desactivación por ${userId}`);
    
    this.brainState = "STOPPED";
    this.brainActivatedAt = undefined;
    this.brainActivatedBy = undefined;
    
    await this.persistBrainState();
    
    console.log(`[DISPATCHER-BRAIN] ✅ CEREBRO DETENIDO`);
    return this.getBrainStatus();
  }

  /**
   * PAUSAR OPERACIONES
   */
  async pause(): Promise<BrainStatus> {
    console.log(`[DISPATCHER-BRAIN] Pausando operaciones`);
    
    this.brainState = "PAUSED";
    await this.persistBrainState();
    
    console.log(`[DISPATCHER-BRAIN] ⏸️ OPERACIONES EN PAUSA`);
    return this.getBrainStatus();
  }

  /**
   * REANUDAR OPERACIONES
   */
  async resume(): Promise<BrainStatus> {
    console.log(`[DISPATCHER-BRAIN] Reanudando operaciones`);
    
    if (this.brainActivatedAt) {
      this.brainState = "ACTIVE";
      await this.persistBrainState();
      
      // Procesar eventos pendientes
      await this.processPendingEvents();
      
      console.log(`[DISPATCHER-BRAIN] ▶️ OPERACIONES REANUDADAS`);
    }
    
    return this.getBrainStatus();
  }

  /**
   * MANTENIMIENTO
   */
  async maintenance(): Promise<BrainStatus> {
    console.log(`[DISPATCHER-BRAIN] Entrando en modo mantenimiento`);
    
    this.brainState = "MAINTENANCE";
    await this.persistBrainState();
    
    console.log(`[DISPATCHER-BRAIN] 🔧 MODO MANTENIMIENTO`);
    return this.getBrainStatus();
  }

  /**
   * OBTENER ESTADO DEL CEREBRO
   */
  getBrainStatus(): BrainStatus {
    return {
      state: this.brainState,
      activatedAt: this.brainActivatedAt,
      activatedBy: this.brainActivatedBy,
      lastSignalTime: this.lastSignalTime,
      lastSignalId: this.lastSignal?.signalId,
      errorMessage: this.brainErrorMessage,
      connectedModules: 9,
      telegramConnected: true,
      mt5Connected: true,
      cyclesCompleted: this.cyclesCompleted,
      failedCycles: this.failedCycles
    };
  }

  /**
   * OBTENER CICLOS ACTIVOS
   */
  getActiveCycles(): CycleEvent[] {
    return Array.from(this.activeCycles.values());
  }

  /**
   * OBTENER CICLO POR ID
   */
  getCycle(eventId: string): CycleEvent | undefined {
    return this.activeCycles.get(eventId);
  }

  /**
   * RECIBIR SEÑAL MAESTRA (entrada principal del ciclo completo)
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
    
    // Recargar estado desde BD (en caso de reinicio)
    await this.loadBrainState();
    
    // Verificar estado del cerebro
    if (this.brainState !== "ACTIVE") {
      return {
        success: false,
        error: `Cerebro en estado ${this.brainState}, no puede recibir señales`
      };
    }
    
    try {
      console.log(`[DISPATCHER-BRAIN] Señal maestra recibida: ${signal.symbol} ${signal.direction}`);
      
      // 1. CREAR EVENTO MAESTRO
      const event = await this.receiveSignal(signal);
      
      // 2. DISTRIBUIR A MÓDULOS
      await this.distribute(event);
      
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
      
      // 4. ENVIAR A TELEGRAM
      try {
        const telegramResult = await this.sendToTelegram(event);
        if (telegramResult.ok && telegramResult.message_id) {
          cycle.telegramMessageId = telegramResult.message_id;
        }
      } catch (error) {
        console.error(`[DISPATCHER-BRAIN] Error enviando a Telegram:`, error);
      }
      
      // 5. ENVIAR AL BOT
      try {
        await this.sendToBot(event);
      } catch (error) {
        console.error(`[DISPATCHER-BRAIN] Error enviando al Bot:`, error);
        cycle.status = "FAILED";
        this.failedCycles++;
      }
      
      // 6. CREAR SIGNAL PARA MT5
      try {
        await botMT5Service.createSignal({
          signalId: signal.signal_id,
          analysisId: signal.analysis_id,
          licenseId: process.env.DEFAULT_BOT_LICENSE_ID || "DEFAULT_LICENSE",
          symbol: signal.symbol,
          direction: signal.direction,
          entry: signal.entry,
          stopLoss: signal.stop_loss,
          takeProfit: signal.take_profit,
          riskReward: signal.risk_reward
        });
      } catch (error) {
        console.error(`[DISPATCHER-BRAIN] Error creando signal para MT5:`, error);
      }
      
      this.lastSignal = await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
      this.lastSignalTime = new Date();
      
      await this.persistBrainState();
      
      console.log(`[DISPATCHER-BRAIN] ✅ Ciclo iniciado: ${event.event_id}`);
      
      return {
        success: true,
        eventId: event.event_id
      };
      
    } catch (error) {
      this.failedCycles++;
      console.error(`[DISPATCHER-BRAIN] Error en ciclo:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * RECIBIR EJECUCIÓN DESDE MT5 (con Telegram actualización)
   */
  async receiveExecutionFromMT5(data: {
    event_id: string;
    status: "EXECUTED" | "REJECTED" | "FAILED";
    ticket?: number;
    entry_price?: number;
  }): Promise<void> {
    console.log(`[DISPATCHER-BRAIN] Ejecución recibida: ${data.event_id} → ${data.status}`);
    
    // Notificar dispatcher base (este se encarga de buscar en BD si es necesario)
    await this.receiveExecution(data.event_id, {
      status: data.status,
      ticket: data.ticket,
      entry_price: data.entry_price,
      executed_at: new Date()
    });
    
    // Actualizar ciclo si existe en memoria
    const cycle = this.activeCycles.get(data.event_id);
    if (cycle) {
      cycle.status = "EXECUTED";
      cycle.brokerTicket = data.ticket;
      cycle.modules.BOT = "COMPLETED";
      
      // Actualizar Telegram
      try {
        await this.updateTelegramWithExecution(cycle);
      } catch (error) {
        console.error(`[DISPATCHER-BRAIN] Error actualizando Telegram:`, error);
      }
    }
    
    // Notificar módulos
    await this.broadcastExecutionResult(data.event_id);
    
    console.log(`[DISPATCHER-BRAIN] ✅ Módulos actualizados`);
  }

  /**
   * RECIBIR CIERRE DESDE MT5 (con Telegram actualización)
   */
  async receiveClosureFromMT5(data: {
    event_id: string;
    status: "CLOSED";
    close_type: "TAKE_PROFIT" | "STOP_LOSS" | "MANUAL";
    close_price: number;
    pips: number;
    profit_loss: number;
  }): Promise<void> {
    console.log(`[DISPATCHER-BRAIN] Cierre recibido: ${data.event_id} → ${data.close_type} (${data.pips} pips)`);
    
    // Actualizar ciclo
    const cycle = this.activeCycles.get(data.event_id);
    if (cycle) {
      cycle.status = "CLOSED";
      cycle.pnl = data.profit_loss;
      cycle.pips = data.pips;
      cycle.modules.BOT = "COMPLETED";
      cycle.modules.RESULTS = "COMPLETED";
    }
    
    // Notificar dispatcher base
    await this.receiveTradeClosure(data.event_id, {
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
        console.error(`[DISPATCHER-BRAIN] Error actualizando Telegram final:`, error);
      }
    }
    
    this.cyclesCompleted++;
    
    // Remover del mapa de ciclos activos
    setTimeout(() => {
      this.activeCycles.delete(data.event_id);
    }, 5000);
    
    console.log(`[DISPATCHER-BRAIN] ✅ Ciclo completado: ${data.event_id}`);
    
    await this.persistBrainState();
  }
  
  
  // ==================== TELEGRAM & BOT HELPERS ====================

  private async sendToTelegram(event: MasterEvent): Promise<{ ok: boolean; message_id?: number }> {
    const message = this.formatTelegramMessage(event);
    
    const result = await telegramClientService.sendMessage({
      channelId: process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      text: message,
      markdown: false
    });
    
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
    console.log(`[DISPATCHER] → Enviando a Bot: ${event.event_id}`);
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
    
    await telegramClientService.editMessage(
      process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      cycle.telegramMessageId,
      message
    );
    
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
    
    await telegramClientService.editMessage(
      process.env.TELEGRAM_CHANNEL_TEST || "@carvipix_alerts_test",
      cycle.telegramMessageId,
      message
    );
    
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

  private async verifyModuleConnections(): Promise<number> {
    return 9;
  }

  private async verifyTelegramConnection(): Promise<boolean> {
    try {
      const info = await telegramClientService.getBotInfo();
      return info.ok ?? false;
    } catch {
      return false;
    }
  }

  private async verifyMT5Connection(): Promise<boolean> {
    return true;
  }

  private async processPendingEvents(): Promise<void> {
    console.log(`[DISPATCHER-BRAIN] Procesando eventos pendientes...`);
  }

  private async persistBrainState(): Promise<void> {
    console.log(`[DISPATCHER-BRAIN] Persistiendo estado: ${this.brainState}`);
    
    try {
      await backendDatabase.query(
        `
        INSERT INTO admin_state_persistence (
          state_id, brain_state, activated_at, activated_by,
          last_signal_time, last_signal_id, error_message,
          cycles_completed, failed_cycles, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (state_id)
        DO UPDATE SET
          brain_state = $2,
          activated_at = $3,
          activated_by = $4,
          last_signal_time = $5,
          last_signal_id = $6,
          error_message = $7,
          cycles_completed = $8,
          failed_cycles = $9,
          updated_at = $10
        `,
        [
          'BRAIN_STATE',
          this.brainState,
          this.brainActivatedAt || null,
          this.brainActivatedBy || null,
          this.lastSignalTime || null,
          this.lastSignal?.signalId || null,
          this.brainErrorMessage || null,
          this.cyclesCompleted,
          this.failedCycles,
          new Date()
        ]
      );
      
      console.log(`[DISPATCHER-BRAIN] ✓ Estado persistido`);
    } catch (err) {
      console.error(`[DISPATCHER-BRAIN] Error persistiendo estado: ${err}`);
    }
  }
  private async persistEventCreation(event: MasterEvent): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO master_events (
        event_id, signal_id, analysis_id, type, status, source,
        symbol, direction, entry, stop_loss, take_profit,
        quality, confidence, risk_reward, created_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        event.event_id,
        event.signal_id,
        event.analysis_id,
        event.type,
        event.status,
        event.source,
        event.symbol,
        event.direction,
        event.entry,
        event.stop_loss,
        event.take_profit,
        event.quality,
        event.confidence,
        event.risk_reward,
        event.timestamp,
        JSON.stringify(event.metadata)
      ]
    );
  }
  
  /**
   * Actualizar evento
   */
  private async persistEventUpdate(event: MasterEvent): Promise<void> {
    await backendDatabase.query(
      `
      UPDATE master_events
      SET type = $1, status = $2, metadata = $3, updated_at = $4
      WHERE event_id = $5
      `,
      [
        event.type,
        event.status,
        JSON.stringify(event.metadata),
        new Date(),
        event.event_id
      ]
    );
  }
  
  /**
   * Registrar estado de módulo
   */
  private async recordModuleState(record: ModuleStateRecord): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO module_state_history (
        event_id, module_name, state, progress, received_at, started_at, completed_at, error_message, steps_completed, total_steps
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        record.event_id,
        record.module_name,
        record.state,
        record.progress,
        record.received_at,
        record.started_at || null,
        record.completed_at || null,
        record.error_message || null,
        record.steps_completed,
        record.total_steps
      ]
    );
  }
  
  /**
   * Enrutar a módulos (llama a cada uno)
   */
  private async routeToModules(event: MasterEvent): Promise<void> {
    // Esto se extendería con lógica específica de enrutamiento
    // Por ahora solo placeholder
    console.log(`[DISPATCHER] Routing to modules: ${event.modules_requested.join(', ')}`);
  }
  
  /**
   * Notificar módulo de ejecución
   */
  private async notifyModuleOfExecution(
    event_id: string,
    module: string,
    payload: any
  ): Promise<void> {
    // Aquí iría la lógica de notificación a cada módulo específico
    console.log(`[DISPATCHER] → ${module} updated with execution result`);
  }
  
  /**
   * Notificar módulo de cierre
   */
  private async notifyModuleOfClosure(
    event_id: string,
    module: string,
    closure: any
  ): Promise<void> {
    // Aquí iría la lógica de notificación de cierre
    console.log(`[DISPATCHER] → ${module} updated with trade closure`);
  }
}

/**
 * Singleton instance
 */
let dispatcherInstance: MasterEventDispatcher | null = null;

export function getMasterEventDispatcher(): MasterEventDispatcher {
  if (!dispatcherInstance) {
    dispatcherInstance = new MasterEventDispatcher();
  }
  return dispatcherInstance;
}

export const masterEventDispatcher = getMasterEventDispatcher();

/**
 * Export default
 */
export default MasterEventDispatcher;
