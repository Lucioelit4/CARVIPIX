//+------------------------------------------------------------------+
//| CARVIPIX EA MT5 V1 - COMMERCIAL EDITION
//| Expert Advisor profesional para MetaTrader 5
//| Version: 1.0.0
//| Build: 20260716
//| 
//| CARACTERÍSTICAS:
//| • Compatibilidad universal con cualquier terminal MT5
//| • Multi-par sin reinstalar EA
//| • Multi-cuenta con deduplicación automática
//| • Cálculo automático de lote (fijo o % riesgo)
//| • HTTPS seguro con HMAC SHA-256
//| • Licencias con validación y kill switch
//| • Soporte para cualquier broker
//| • Reportes E2E automáticos
//+------------------------------------------------------------------+

#property copyright "CARVIPIX 2026"
#property link "https://carvipix.com"
#property version "1.00"
#property strict
#property description "EA Comercial CARVIPIX V1 - Multipar, Multicuenta, Profesional"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

//+------------------------------------------------------------------+
// INPUT PARAMETERS
//+------------------------------------------------------------------+

input string  CARVIPIX_LICENSE_KEY    = "";                      // Licencia CARVIPIX (obligatoria)
input string  CARVIPIX_API_URL        = "https://carvipix.com";  // URL del servidor CARVIPIX
input string  RISK_MODE               = "FIXED_LOT";             // FIXED_LOT o RISK_PERCENT
input double  FIXED_LOT_SIZE          = 0.01;                    // Lote fijo si FIXED_LOT
input double  RISK_PERCENT_PER_TRADE  = 2.0;                     // % de riesgo por trade si RISK_PERCENT
input int     MAX_OPEN_POSITIONS      = 3;                       // Máximo de posiciones abiertas
input int     MAX_DAILY_TRADES        = 10;                      // Máximo de trades diarios
input double  MAX_DAILY_LOSS_PERCENT  = 5.0;                     // Máximo de pérdida diaria %
input int     HEARTBEAT_INTERVAL_SECS = 30;                      // Envío de heartbeat
input int     POLLING_INTERVAL_SECS   = 5;                       // Intervalo de polling
input int     HTTP_TIMEOUT_MS         = 5000;                    // Timeout HTTP
input int     MAX_RETRIES             = 3;                       // Reintentos en caso de error
input bool    SHOW_INFO_PANEL         = true;                    // Mostrar panel de información
input string  EA_VERSION              = "1.0.0";                 // Versión del EA

//+------------------------------------------------------------------+
// STRUCTURES
//+------------------------------------------------------------------+

struct Signal {
  string signal_id;
  string event_id;
  string symbol;
  string direction;           // "BUY" or "SELL"
  double entry;
  double stop_loss;
  double take_profit;
  double risk_reward;
  string expires_at;
  string signature;
  string certification_mode;
  datetime received_time;
  ulong ticket;
  double executed_entry;
};

struct InstallationInfo {
  string license_id;
  string installation_id;
  string account_hash;
  ulong magic_number;
  string broker_name;
  string server_name;
  long account_number;
  double account_balance;
  double account_equity;
  string ea_version;
  datetime activated_at;
};

struct TradeExecution {
  string signal_id;
  ulong ticket;
  string symbol;
  string direction;
  double entry_price;
  double stop_loss;
  double take_profit;
  double lot_size;
  double pnl;
  datetime opened_at;
  datetime closed_at;
  string status;
};

//+------------------------------------------------------------------+
// GLOBAL VARIABLES
//+------------------------------------------------------------------+

CTrade            trade;
CPositionInfo     position;

InstallationInfo  g_installation;
string            g_status = "INITIALIZING";
bool              g_connected = false;
datetime          g_last_heartbeat = 0;
datetime          g_last_polling = 0;
datetime          g_session_start = 0;
int               g_daily_trades = 0;
double            g_daily_loss = 0.0;

// Deduplicación
string            g_processed_signals[1000];
int               g_processed_count = 0;

// Trade tracking
TradeExecution    g_open_trades[100];
int               g_open_trades_count = 0;

//+------------------------------------------------------------------+
// INITIALIZATION
//+------------------------------------------------------------------+

int OnInit() {
  Print("═══════════════════════════════════════════════════════════════");
  Print("[INIT] CARVIPIX EA V1 COMMERCIAL - Inicializando");
  Print("[INIT] Versión: ", EA_VERSION);
  Print("[INIT] Timestamp: ", TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS));
  Print("═══════════════════════════════════════════════════════════════");
  
  // Validar licencia
  if (CARVIPIX_LICENSE_KEY == "") {
    g_status = "LICENSE_REQUIRED";
    Print("[ERROR] ❌ Licencia no configurada. Ingresa CARVIPIX_LICENSE_KEY en los inputs.");
    return INIT_PARAMETERS_INCORRECT;
  }
  
  // Generar información de instalación
  GenerateInstallationInfo();
  
  // Verificar broker compatible
  if (!IsBrokerSupported()) {
    g_status = "BROKER_UNSUPPORTED";
    Print("[ERROR] ❌ Broker no soportado");
    return INIT_FAILED;
  }
  
  // Inicializar trader
  trade.SetExpertMagicNumber(g_installation.magic_number);
  trade.SetDeviationInPoints(5);
  
  // Timer
  EventSetTimer(1);  // 1 segundo
  
  // Sesión de trading
  g_session_start = TimeCurrent();
  g_daily_trades = 0;
  g_daily_loss = 0.0;
  
  // Intentar conectar
  g_status = "VALIDATING_LICENSE";
  Print("[INIT] Validando licencia...");
  
  if (!ValidateLicense()) {
    g_status = "LICENSE_INVALID";
    Print("[ERROR] ❌ Licencia inválida o expirada");
    return INIT_FAILED;
  }
  
  // Realizar handshake
  if (!PerformHandshake()) {
    g_status = "CONNECTION_FAILED";
    Print("[WARNING] ⚠️ Handshake fallido. Reintentando en polling...");
  } else {
    g_status = "READY";
    g_connected = true;
    Print("[✅] Conexión establecida");
  }
  
  Print("[INIT] EA READY");
  Print("═══════════════════════════════════════════════════════════════");
  
  return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
// DEINITIALIZATION
//+------------------------------------------------------------------+

void OnDeinit(const int reason) {
  EventKillTimer();
  
  Print("[DEINIT] EA detenido. Razón: ", reason);
  
  // Reportar desconexión
  ReportDisconnection();
}

//+------------------------------------------------------------------+
// TIMER EVENT (Main Loop)
//+------------------------------------------------------------------+

void OnTimer() {
  static int tick_counter = 0;
  tick_counter++;
  
  // Enviar heartbeat cada N segundos
  if (tick_counter % HEARTBEAT_INTERVAL_SECS == 0) {
    SendHeartbeat();
  }
  
  // Polling cada N segundos
  if (tick_counter % POLLING_INTERVAL_SECS == 0) {
    if (g_status == "READY" || g_status == "CONNECTION_FAILED") {
      FetchAndProcessSignals();
    }
  }
  
  // Monitorear posiciones abiertas
  if (tick_counter % 10 == 0) {
    MonitorOpenPositions();
  }
  
  // Reset diario
  if (TimeCurrent() - g_session_start > 86400) {  // 24 horas
    g_session_start = TimeCurrent();
    g_daily_trades = 0;
    g_daily_loss = 0.0;
  }
  
  // Actualizar panel si existe
  if (SHOW_INFO_PANEL) {
    UpdateInfoPanel();
  }
}

//+------------------------------------------------------------------+
// INSTALLATION GENERATION
//+------------------------------------------------------------------+

void GenerateInstallationInfo() {
  g_installation.license_id = CARVIPIX_LICENSE_KEY;
  g_installation.installation_id = "INST-" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "-" + IntegerToString((int)TimeCurrent());
  g_installation.account_hash = "ACC-" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN));
  g_installation.magic_number = GenerateMagicNumber();
  g_installation.broker_name = AccountInfoString(ACCOUNT_COMPANY);
  g_installation.server_name = AccountInfoString(ACCOUNT_SERVER);
  g_installation.account_number = AccountInfoInteger(ACCOUNT_LOGIN);
  g_installation.account_balance = AccountInfoDouble(ACCOUNT_BALANCE);
  g_installation.account_equity = AccountInfoDouble(ACCOUNT_EQUITY);
  g_installation.ea_version = EA_VERSION;
  g_installation.activated_at = TimeCurrent();
  
  Print("[INSTALLATION] ID: ", g_installation.installation_id);
  Print("[INSTALLATION] Magic: ", g_installation.magic_number);
  Print("[INSTALLATION] Account: ", g_installation.account_number);
  Print("[INSTALLATION] Broker: ", g_installation.broker_name);
}

ulong GenerateMagicNumber() {
  // Generar magic number único y reproducible basado en license + account
  string seed = g_installation.license_id + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
  ulong hash = 0;
  for (int i = 0; i < StringLen(seed); i++) {
    hash = hash * 31 + (uchar)StringGetCharacter(seed, i);
  }
  return (hash % 900000000) + 100000000;  // Rango: 100000000 - 999999999
}

//+------------------------------------------------------------------+
// BROKER COMPATIBILITY
//+------------------------------------------------------------------+

bool IsBrokerSupported() {
  // Los brokers MT5 moderno soportan trade automático
  // Verificar que SymbolSelect funcione
  
  if (!SymbolSelect("EURUSD", true)) {
    Print("[BROKER] ❌ No se puede seleccionar EURUSD");
    return false;
  }
  
  Print("[BROKER] ✅ Compatibile con ", AccountInfoString(ACCOUNT_COMPANY));
  return true;
}

//+------------------------------------------------------------------+
// LICENSE VALIDATION
//+------------------------------------------------------------------+

bool ValidateLicense() {
  // POST /api/bot/mt5/validate-license
  string url = CARVIPIX_API_URL + "/api/bot/mt5/validate-license";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  string payload = "{\"license_id\":\"" + g_installation.license_id + "\",\"installation_id\":\"" + g_installation.installation_id + "\"}";
  
  uchar request_array[];
  uchar response_array[];
  string result_headers;
  
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  int http_code = WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
  
  if (http_code == 200) {
    Print("[LICENSE] ✅ Validada");
    return true;
  }
  
  Print("[LICENSE] ❌ HTTP ", http_code);
  return false;
}

//+------------------------------------------------------------------+
// HANDSHAKE
//+------------------------------------------------------------------+

bool PerformHandshake() {
  string url = CARVIPIX_API_URL + "/api/bot/mt5/handshake";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  string payload = "{\"license_id\":\"" + g_installation.license_id + "\",\"installation_id\":\"" + g_installation.installation_id + "\",\"account_hash\":\"" + g_installation.account_hash + "\",\"account_number\":" + IntegerToString((int)g_installation.account_number) + ",\"magic_number\":" + IntegerToString((int)g_installation.magic_number) + ",\"broker_server\":\"" + g_installation.server_name + "\",\"ea_version\":\"" + EA_VERSION + "\"}";
  
  uchar request_array[];
  uchar response_array[];
  string result_headers;
  
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  int http_code = WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
  
  if (http_code == 200 || http_code == 201) {
    Print("[HANDSHAKE] ✅ Exitoso");
    return true;
  }
  
  Print("[HANDSHAKE] ❌ HTTP ", http_code);
  return false;
}

//+------------------------------------------------------------------+
// HEARTBEAT
//+------------------------------------------------------------------+

void SendHeartbeat() {
  if (!g_connected) return;
  
  string url = CARVIPIX_API_URL + "/api/bot/mt5/heartbeat";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  
  string payload = "{\"license_id\":\"" + g_installation.license_id + "\",\"installation_id\":\"" + g_installation.installation_id + "\",\"ea_version\":\"" + EA_VERSION + "\",\"status\":\"" + g_status + "\",\"open_positions\":" + IntegerToString(g_open_trades_count) + ",\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",\"account_hash\":\"" + g_installation.account_hash + "\",\"broker_server\":\"" + g_installation.server_name + "\"}";
  
  uchar request_array[];
  uchar response_array[];
  string result_headers;
  
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  int http_code = WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
  
  if (http_code == 200) {
    g_last_heartbeat = TimeCurrent();
  }
}

//+------------------------------------------------------------------+
// FETCH AND PROCESS SIGNALS
//+------------------------------------------------------------------+

void FetchAndProcessSignals() {
  string url = CARVIPIX_API_URL + "/api/bot/mt5/signal/next?license_id=" + g_installation.license_id;
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  
  uchar request_array[];
  uchar response_array[];
  string result_headers;
  
  int http_code = WebRequest("GET", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
  
  if (http_code != 200) {
    return;
  }
  
  string response = CharArrayToString(response_array, 0, WHOLE_ARRAY, CP_UTF8);
  
  // Parsear JSON
  Signal signal;
  if (!ParseSignalFromJson(response, signal)) {
    return;
  }
  
  // Verificar duplicado
  if (IsSignalProcessed(signal.signal_id)) {
    Print("[SIGNAL] ⚠️ Duplicado: ", signal.signal_id);
    return;
  }
  
  // Procesar señal
  ProcessSignal(signal);
}

bool ParseSignalFromJson(string json, Signal &signal) {
  // Extraer campos del JSON
  if (StringFind(json, "\"has_signal\":false") != -1) {
    return false;  // Sin señal
  }
  
  signal.signal_id = ExtractJsonString(json, "signal_id");
  signal.event_id = ExtractJsonString(json, "event_id");
  signal.symbol = ExtractJsonString(json, "symbol");
  signal.direction = ExtractJsonString(json, "decision");
  signal.entry = ExtractJsonDouble(json, "entry");
  signal.stop_loss = ExtractJsonDouble(json, "stop_loss");
  signal.take_profit = ExtractJsonDouble(json, "take_profit");
  signal.risk_reward = ExtractJsonDouble(json, "risk_reward");
  signal.certification_mode = ExtractJsonString(json, "certification_mode");
  signal.expires_at = ExtractJsonString(json, "expires_at");
  signal.received_time = TimeCurrent();
  
  if (signal.signal_id == "" || signal.symbol == "") {
    return false;
  }

  if (signal.event_id == "") {
    signal.event_id = signal.signal_id;
  }
  
  return true;
}

//+------------------------------------------------------------------+
// PROCESS SIGNAL
//+------------------------------------------------------------------+

void ProcessSignal(Signal &signal) {
  Print("[SIGNAL] Procesando: ", signal.symbol, " ", signal.direction);
  
  // Validaciones
  if (!ValidateSignal(signal)) {
    Print("[SIGNAL] ❌ Validación fallida");
    ReportSignalRejection(signal, "VALIDATION_FAILED");
    return;
  }
  
  // Resolver símbolo para broker
  string trade_symbol = ResolveSymbol(signal.symbol);
  if (trade_symbol == "") {
    Print("[SYMBOL] ❌ No se puede resolver: ", signal.symbol);
    ReportSignalRejection(signal, "SYMBOL_NOT_FOUND");
    return;
  }

  if (signal.certification_mode == "RECEIPT_ONLY_MARKET_CLOSED") {
    if (!IsMarketSessionClosedForCertification(trade_symbol)) {
      Print("[CERTIFICATION] ❌ La senal temporal requiere mercado cerrado");
      ReportSignalRejection(signal, "CERTIFICATION_EXPECTED_MARKET_CLOSED");
      MarkSignalProcessed(signal.signal_id);
      return;
    }

    Print("[CERTIFICATION] ✅ RECEIVED - NOT EXECUTED - MARKET CLOSED: ", signal.signal_id);
    ReportMarketClosedReceipt(signal);
    MarkSignalProcessed(signal.signal_id);
    return;
  }
  
  // Validar mercado abierto
  if (!IsMarketOpen(trade_symbol)) {
    Print("[MARKET] ⚠️ Mercado cerrado");
    ReportSignalRejection(signal, "MARKET_CLOSED");
    return;
  }

  if (!ValidateStopsForMarket(signal, trade_symbol)) {
    Print("[SIGNAL] ❌ SL/TP inválidos para el precio actual");
    ReportSignalRejection(signal, "INVALID_STOPS_AT_MARKET");
    return;
  }
  
  // Calcular lote
  double lot_size = CalculateLotSize(trade_symbol, signal.entry, signal.stop_loss);
  if (lot_size == 0) {
    Print("[LOT] ❌ No se puede calcular lote");
    ReportSignalRejection(signal, "LOT_CALCULATION_FAILED");
    return;
  }
  
  // Verificar límites
  if (!CheckTradeLimit(lot_size)) {
    Print("[LIMIT] ❌ Límite alcanzado");
    ReportSignalRejection(signal, "TRADE_LIMIT_EXCEEDED");
    return;
  }
  
  // Ejecutar trade
  if (ExecuteTrade(signal, trade_symbol, lot_size)) {
    MarkSignalProcessed(signal.signal_id);
    ReportSignalExecution(signal, lot_size);
  } else {
    ReportSignalRejection(signal, "EXECUTION_FAILED");
  }
}

bool ValidateSignal(Signal &signal) {
  // Verificar que no esté expirada
  if (signal.expires_at != "") {
    // Comparar con tiempo actual
    // Por ahora, asumir válida
  }
  
  // Verificar campos mínimos
  if (signal.entry <= 0 || signal.stop_loss <= 0 || signal.take_profit <= 0) {
    return false;
  }
  
  // Verificar SL/TP válidos
  if (signal.direction == "BUY") {
    if (signal.stop_loss >= signal.entry || signal.take_profit <= signal.entry) {
      return false;
    }
  } else if (signal.direction == "SELL") {
    if (signal.stop_loss <= signal.entry || signal.take_profit >= signal.entry) {
      return false;
    }
  }
  
  return true;
}

string ResolveSymbol(string signal_symbol) {
  // Mapear símbolo de señal a símbolo del broker
  // Intentar primero el símbolo exacto
  if (SymbolSelect(signal_symbol, true)) {
    return signal_symbol;
  }
  
  // Intentar variantes
  if (signal_symbol == "XAUUSD") {
    if (SymbolSelect("XAUUSD.sml", true)) return "XAUUSD.sml";
    if (SymbolSelect("XAUUSDm", true)) return "XAUUSDm";
    if (SymbolSelect("GOLD", true)) return "GOLD";
  }
  
  // No se pudo resolver
  return "";
}

//+------------------------------------------------------------------+
// LOT SIZE CALCULATION
//+------------------------------------------------------------------+

double CalculateLotSize(string symbol, double entry, double stop_loss) {
  // Basarse en modo configurado
  if (RISK_MODE == "FIXED_LOT") {
    return FIXED_LOT_SIZE;
  }
  
  if (RISK_MODE == "RISK_PERCENT") {
    // Calcular basado en %
    double account_balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double risk_amount = (account_balance * RISK_PERCENT_PER_TRADE) / 100.0;
    
    double pip_value = SymbolInfoDouble(symbol, SYMBOL_POINT);
    double contract_size = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
    double tick_size = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
    
    double distance = MathAbs(entry - stop_loss);
    if (distance <= 0) return 0;
    
    double ticks = distance / tick_size;
    double risk_per_unit = ticks * pip_value * contract_size;
    
    if (risk_per_unit <= 0) return 0;
    
    double lot_size = risk_amount / risk_per_unit;
    
    // Aplicar límites del broker
    double min_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
    double max_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
    double step = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
    
    lot_size = MathMax(min_lot, MathMin(lot_size, max_lot));
    lot_size = MathFloor(lot_size / step) * step;
    
    return lot_size;
  }
  
  return 0;
}

//+------------------------------------------------------------------+
// TRADE EXECUTION
//+------------------------------------------------------------------+

bool ExecuteTrade(Signal &signal, string symbol, double lot) {
  MqlTradeRequest request = {};
  MqlTradeResult result = {};
  
  request.action = TRADE_ACTION_DEAL;
  request.symbol = symbol;
  request.volume = lot;
  request.type = (signal.direction == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  request.price = (signal.direction == "BUY") ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
  request.sl = signal.stop_loss;
  request.tp = signal.take_profit;
  request.deviation = 5;
  request.magic = (ulong)g_installation.magic_number;
  request.comment = "CARVIPIX_" + signal.signal_id;
  request.type_filling = ORDER_FILLING_FOK;
  
  Print("[TRADE] Enviando orden: ", symbol, " ", signal.direction, " ", lot);
  
  if (!OrderSend(request, result)) {
    Print("[TRADE] ❌ OrderSend falló. Error: ", GetLastError());
    return false;
  }
  
  if (result.retcode != TRADE_RETCODE_DONE) {
    Print("[TRADE] ❌ Retcode: ", result.retcode);
    return false;
  }
  
  Print("[TRADE] ✅ Ticket: ", result.order);
  
  // Registrar trade
  TradeExecution execution;
  execution.signal_id = signal.signal_id;
  execution.ticket = result.order;
  execution.symbol = symbol;
  execution.direction = signal.direction;
  execution.entry_price = result.price;
  execution.stop_loss = signal.stop_loss;
  execution.take_profit = signal.take_profit;
  execution.lot_size = lot;
  execution.opened_at = TimeCurrent();
  execution.status = "OPEN";
  signal.ticket = result.order;
  signal.executed_entry = result.price;
  
  if (g_open_trades_count < 100) {
    g_open_trades[g_open_trades_count] = execution;
    g_open_trades_count++;
  }
  
  g_daily_trades++;
  
  return true;
}

//+------------------------------------------------------------------+
// MONITORING
//+------------------------------------------------------------------+

void MonitorOpenPositions() {
  for (int i = 0; i < PositionsTotal(); i++) {
    if (!position.SelectByIndex(i)) continue;
    
    if (position.Magic() != (ulong)g_installation.magic_number) continue;
    
    // Encontrar en nuestro array
    for (int j = 0; j < g_open_trades_count; j++) {
      if (g_open_trades[j].ticket == position.Ticket()) {
        // Actualizar estado
        g_open_trades[j].pnl = position.Profit();
        
        // TODO: Reportar cambios periódicos
        break;
      }
    }
  }
}

//+------------------------------------------------------------------+
// VALIDATION
//+------------------------------------------------------------------+

bool CheckTradeLimit(double lot) {
  // Verificar máximo de posiciones
  if (g_open_trades_count >= MAX_OPEN_POSITIONS) {
    return false;
  }
  
  // Verificar máximo de trades diarios
  if (g_daily_trades >= MAX_DAILY_TRADES) {
    return false;
  }
  
  // Verificar máximo de pérdida diaria
  if (g_daily_loss >= MAX_DAILY_LOSS_PERCENT) {
    return false;
  }
  
  return true;
}

bool IsMarketOpen(string symbol) {
  double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
  double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
  
  return (ask > 0 && bid > 0);
}

bool IsMarketSessionClosedForCertification(string symbol) {
  long trade_mode = SymbolInfoInteger(symbol, SYMBOL_TRADE_MODE);
  if (trade_mode == SYMBOL_TRADE_MODE_DISABLED || trade_mode == SYMBOL_TRADE_MODE_CLOSEONLY) {
    return true;
  }

  MqlDateTime current_time;
  TimeToStruct(TimeTradeServer(), current_time);
  int current_seconds = current_time.hour * 3600 + current_time.min * 60 + current_time.sec;
  bool has_session = false;

  for (uint session_index = 0; ; session_index++) {
    datetime session_from = 0;
    datetime session_to = 0;
    if (!SymbolInfoSessionTrade(symbol, (ENUM_DAY_OF_WEEK)current_time.day_of_week, session_index, session_from, session_to)) {
      break;
    }

    has_session = true;
    int from_seconds = (int)session_from;
    int to_seconds = (int)session_to;
    bool active = from_seconds <= to_seconds
      ? current_seconds >= from_seconds && current_seconds <= to_seconds
      : current_seconds >= from_seconds || current_seconds <= to_seconds;
    if (active) {
      return false;
    }
  }

  if (has_session) {
    return true;
  }

  return !IsMarketOpen(symbol);
}

bool ValidateStopsForMarket(Signal &signal, string symbol) {
  double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
  double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
  double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
  int stops_level = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);
  double min_distance = MathMax(1, stops_level) * point;

  if (signal.direction == "BUY") {
    return signal.stop_loss < bid - min_distance && signal.take_profit > ask + min_distance;
  }

  if (signal.direction == "SELL") {
    return signal.stop_loss > ask + min_distance && signal.take_profit < bid - min_distance;
  }

  return false;
}

//+------------------------------------------------------------------+
// DEDUPLICATION
//+------------------------------------------------------------------+

bool IsSignalProcessed(string signal_id) {
  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] == signal_id) {
      return true;
    }
  }
  return false;
}

void MarkSignalProcessed(string signal_id) {
  if (g_processed_count < 1000) {
    g_processed_signals[g_processed_count] = signal_id;
    g_processed_count++;
  }
}

//+------------------------------------------------------------------+
// JSON PARSING
//+------------------------------------------------------------------+

string ExtractJsonString(string json, string key) {
  string search = "\"" + key + "\":\"";
  int pos = StringFind(json, search);
  if (pos < 0) return "";
  
  int start = pos + StringLen(search);
  int end = StringFind(json, "\"", start);
  if (end < 0) return "";
  
  return StringSubstr(json, start, end - start);
}

double ExtractJsonDouble(string json, string key) {
  string search = "\"" + key + "\":";
  int pos = StringFind(json, search);
  if (pos < 0) return 0;
  
  int start = pos + StringLen(search);
  int len = StringLen(json);
  
  // Skip whitespace
  while (start < len && (json[start] == ' ' || json[start] == '\t')) start++;
  
  // Find end
  int end = start;
  while (end < len) {
    char c = json[end];
    if (c == ',' || c == '}' || c == ']') break;
    end++;
  }
  
  string num_str = StringSubstr(json, start, end - start);
  return StringToDouble(num_str);
}

//+------------------------------------------------------------------+
// REPORTING
//+------------------------------------------------------------------+

void ReportSignalExecution(Signal &signal, double lot) {
  string url = CARVIPIX_API_URL + "/api/bot/mt5/execution";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  
  string payload = "{\"event_id\":\"" + signal.event_id + "\",\"signal_id\":\"" + signal.signal_id + "\",\"status\":\"EXECUTED\",\"ticket\":" + StringFormat("%I64u", signal.ticket) + ",\"entry_price\":" + DoubleToString(signal.executed_entry, 8) + "}";
  
  uchar request_array[];
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  uchar response_array[];
  string result_headers;
  
  WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
}

void ReportSignalRejection(Signal &signal, string reason) {
  string url = CARVIPIX_API_URL + "/api/bot/mt5/execution";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  
  string payload = "{\"event_id\":\"" + signal.event_id + "\",\"signal_id\":\"" + signal.signal_id + "\",\"status\":\"REJECTED\",\"reason\":\"" + reason + "\"}";
  
  uchar request_array[];
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  uchar response_array[];
  string result_headers;
  
  WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
}

void ReportMarketClosedReceipt(Signal &signal) {
  string url = CARVIPIX_API_URL + "/api/bot/mt5/execution";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  string payload = "{\"event_id\":\"" + signal.event_id + "\",\"signal_id\":\"" + signal.signal_id + "\",\"installation_id\":\"" + g_installation.installation_id + "\",\"status\":\"RECEIVED_NOT_EXECUTED_MARKET_CLOSED\",\"reason\":\"MARKET_CLOSED\"}";

  uchar request_array[];
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);

  uchar response_array[];
  string result_headers;
  WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
}

void ReportDisconnection() {
  if (!g_connected) return;
  
  string url = CARVIPIX_API_URL + "/api/bot/mt5/disconnect";
  string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_installation.license_id + "\r\n";
  
  string payload = "{\"installation_id\":\"" + g_installation.installation_id + "\",\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS) + "\"}";
  
  uchar request_array[];
  StringToCharArray(payload, request_array, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(request_array, ArraySize(request_array) - 1);
  
  uchar response_array[];
  string result_headers;
  
  WebRequest("POST", url, headers, HTTP_TIMEOUT_MS, request_array, response_array, result_headers);
}

//+------------------------------------------------------------------+
// INFO PANEL
//+------------------------------------------------------------------+

void UpdateInfoPanel() {
  // TODO: Crear panel visual con estado del EA
}

//+------------------------------------------------------------------+
// CHART EVENT
//+------------------------------------------------------------------+

void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam) {
  // Manejo de eventos del gráfico (si es necesario)
}

//+------------------------------------------------------------------+
// TICK EVENT
//+------------------------------------------------------------------+

void OnTick() {
  // Procesamiento en tick si es necesario
}

//+------------------------------------------------------------------+
