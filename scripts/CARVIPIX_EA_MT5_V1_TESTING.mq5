//+------------------------------------------------------------------+
//| CARVIPIX_EA_MT5_V1_IMPROVED.mq5
//| Expert Advisor oficial para MetaTrader 5
//| Version: 1.01 (Testing & Debugging)
//| Build: 20260715
//| Mejoras: Logging exhaustivo, validaciones robustas, panel gráfico
//+------------------------------------------------------------------+

#property copyright "CARVIPIX 2026"
#property link "https://carvipix.com"
#property version "1.01"
#property strict
#property description "EA CARVIPIX - v1.01 Testing - Logging exhaustivo"

//+------------------------------------------------------------------+
// INPUTS
//+------------------------------------------------------------------+

input string CARVIPIX_LICENSE_KEY = "";                      // Licencia DEMO
input string CARVIPIX_API_URL = "https://carvipix.com/api/bot/mt5";
input string RISK_MODE = "FIXED_LOT";
input double FIXED_LOT = 0.01;
input double MAX_RISK_PERCENT = 2.0;
input int MAX_OPEN_TRADES = 1;
input int MAX_DAILY_TRADES = 10;
input double MAX_DAILY_LOSS_PERCENT = 5.0;
input int POLLING_SECONDS = 5;
input int MAX_SLIPPAGE_POINTS = 5;
input bool ALLOW_BUY = true;
input bool ALLOW_SELL = true;
input bool ALLOW_NEW_TRADES = true;
input bool SHOW_PANEL = true;
input string EA_VERSION = "1.01";

//+------------------------------------------------------------------+
// ESTRUTURA Y ENUMS
//+------------------------------------------------------------------+

struct Signal {
  string signal_id;
  string symbol;
  string decision;
  double entry;
  double stop_loss;
  double take_profit;
  double risk_reward;
  string expires_at;
  string signature;
};

enum EA_STATUS {
  STATUS_INITIALIZING = 0,
  STATUS_WAITING_LICENSE = 1,
  STATUS_VALIDATING = 2,
  STATUS_READY = 3,
  STATUS_ERROR = 4,
  STATUS_NETWORK_ERROR = 5,
  STATUS_LICENSE_INVALID = 6,
  STATUS_READ_ONLY = 7
};

//+------------------------------------------------------------------+
// VARIABLES GLOBALES
//+------------------------------------------------------------------+

string g_license_id = "";
string g_api_url = "";
string g_installation_id = "";
string g_account_hash = "";
ulong g_magic_number = 0;
EA_STATUS g_status = STATUS_INITIALIZING;

// Logging y debugging
int g_timer_cycles = 0;
datetime g_last_heartbeat_sent = 0;
int g_heartbeat_sent_count = 0;
datetime g_last_api_error_time = 0;
string g_last_error_message = "";

// Deduplicación mejorada
string g_processed_signals[1000];
int g_processed_count = 0;

// Panel
string g_panel_object_name = "CARVIPIX_PANEL";

//+------------------------------------------------------------------+
// EVENTO INIT
//+------------------------------------------------------------------+

int OnInit() {
  
  LogInfo("═════════════════════════════════════════════════════");
  LogInfo("EA CARVIPIX V" + EA_VERSION + " - INICIALIZANDO");
  LogInfo("Timestamp: " + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
  LogInfo("═════════════════════════════════════════════════════");
  
  // Validar licencia
  if (CARVIPIX_LICENSE_KEY == "") {
    LogWarn("LICENCIA NO CONFIGURADA");
    g_status = STATUS_WAITING_LICENSE;
    g_license_id = "[NOT_CONFIGURED]";
  } else {
    g_license_id = CARVIPIX_LICENSE_KEY;
    LogInfo("Licencia: " + g_license_id);
  }
  
  // Validar API URL
  if (CARVIPIX_API_URL == "") {
    LogWarn("API URL vacía. Usando valor por defecto.");
    g_api_url = "https://carvipix.com/api/bot/mt5";
  } else {
    g_api_url = CARVIPIX_API_URL;
  }
  
  LogInfo("API URL: " + g_api_url);
  
  // Generar IDs
  g_installation_id = "INST-" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "-" + IntegerToString(TimeCurrent());
  g_account_hash = "ACC-" + IntegerToString((uint)AccountInfoInteger(ACCOUNT_LOGIN));
  g_magic_number = GenerateMagicNumber(g_license_id, g_installation_id);
  
  LogInfo("Installation ID: " + g_installation_id);
  LogInfo("Magic Number: " + IntegerToString((int)g_magic_number));
  LogInfo("Account Hash: " + g_account_hash);
  LogInfo("Broker: " + AccountInfoString(ACCOUNT_COMPANY));
  LogInfo("Server: " + AccountInfoString(ACCOUNT_SERVER));
  LogInfo("Account: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)));
  
  // Timer
  EventSetTimer(POLLING_SECONDS);
  LogInfo("Timer iniciado: cada " + IntegerToString(POLLING_SECONDS) + " segundos");
  
  // Crear panel
  if (SHOW_PANEL) {
    CreatePanel();
  }
  
  // Handshake si licencia está configurada
  if (g_status != STATUS_WAITING_LICENSE) {
    g_status = STATUS_VALIDATING;
    LogInfo("Iniciando HANDSHAKE...");
    
    if (!PerformHandshake()) {
      g_status = STATUS_ERROR;
      LogError("Handshake FALLIDO");
    } else {
      g_status = STATUS_READY;
      LogSuccess("Handshake EXITOSO - EA READY");
    }
  } else {
    LogWarn("EA en modo WAITING_LICENSE. Configura licencia en inputs.");
  }
  
  LogInfo("OnInit() completado. Status: " + StatusToString(g_status));
  LogInfo("═════════════════════════════════════════════════════");
  
  return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
// EVENTO DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason) {
  EventKillTimer();
  LogInfo("OnDeinit() - Razón: " + IntegerToString(reason) + " (0=remove, 1=account, 2=symbol)");
  
  if (SHOW_PANEL) {
    DeletePanel();
  }
}

//+------------------------------------------------------------------+
// EVENTO TIMER (POLLING)
//+------------------------------------------------------------------+

void OnTimer() {
  
  g_timer_cycles++;
  
  // Log periódico (cada 12 ciclos = 60 seg si POLLING_SECONDS=5)
  if (g_timer_cycles % 12 == 0) {
    LogDebug("Timer cycle #" + IntegerToString(g_timer_cycles) + " - Status: " + StatusToString(g_status));
  }
  
  // Actualizar panel
  if (SHOW_PANEL) {
    UpdatePanel();
  }
  
  // Validaciones de seguridad
  if (g_status == STATUS_ERROR || g_status == STATUS_READ_ONLY || g_status == STATUS_LICENSE_INVALID) {
    LogDebug("EA en estado protegido: " + StatusToString(g_status));
    return;
  }
  
  if (g_status == STATUS_WAITING_LICENSE) {
    return;  // Esperando configuración
  }
  
  // Enviar heartbeat
  SendHeartbeat();
  
  // Validar licencia
  if (!ValidateLicense()) {
    g_status = STATUS_LICENSE_INVALID;
    LogError("Licencia inválida o expirada");
    return;
  }
  
  // Si trading está bloqueado
  if (!ALLOW_NEW_TRADES) {
    LogDebug("Trading bloqueado por input ALLOW_NEW_TRADES");
    return;
  }
  
  // Obtener señal
  if (g_status != STATUS_READY) {
    return;  // Solo procesar si está READY
  }
  
  Signal signal = GetPendingSignal();
  if (signal.signal_id == "") {
    return;  // Sin señal
  }
  
  LogInfo("Señal recibida: ID=" + signal.signal_id + " Symbol=" + signal.symbol + " Decision=" + signal.decision);
  
  // Procesar
  ProcessSignal(signal);
}

//+------------------------------------------------------------------+
// FUNCIONES PRINCIPALES
//+------------------------------------------------------------------+

bool PerformHandshake() {
  LogInfo("[HANDSHAKE] Iniciando...");
  
  string payload = "{\"license_id\":\"" + g_license_id + "\",\"installation_id\":\"" + g_installation_id + "\",\"account_hash\":\"" + g_account_hash + "\",\"ea_version\":\"" + EA_VERSION + "\",\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\"}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/handshake";
  int timeout = 10000;
  
  LogDebug("[HANDSHAKE] URL: " + url);
  LogDebug("[HANDSHAKE] Timeout: " + IntegerToString(timeout) + "ms");
  
  int http_code = WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
  
  LogDebug("[HANDSHAKE] HTTP Response: " + IntegerToString(http_code));
  
  if (http_code == 200 || http_code == 201) {
    LogSuccess("[HANDSHAKE] EXITOSO (HTTP " + IntegerToString(http_code) + ")");
    return true;
  } else {
    LogError("[HANDSHAKE] FALLIDO (HTTP " + IntegerToString(http_code) + ")");
    g_last_api_error_time = TimeCurrent();
    g_last_error_message = "HTTP " + IntegerToString(http_code);
    return false;
  }
}

Signal GetPendingSignal() {
  Signal empty;
  empty.signal_id = "";
  
  uchar response[];
  uchar empty_request[] = {};
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  string url = g_api_url + "/signals?installation_id=" + g_installation_id + "&account_hash=" + g_account_hash;
  int timeout = 5000;
  
  int http_code = WebRequest("GET", url, request_headers, timeout, empty_request, response, result_headers);
  
  if (http_code != 200) {
    if (g_timer_cycles % 12 == 0) {  // Log cada 60 seg
      LogDebug("[SIGNALS] GET falló. HTTP " + IntegerToString(http_code));
    }
    return empty;
  }
  
  // Parse JSON response
  string resp_str = CharArrayToString(response);
  
  if (resp_str == "" || StringFind(resp_str, "signal_id") < 0) {
    return empty;
  }
  
  // Extraer fields
  Signal signal;
  signal.signal_id = ExtractJsonString(resp_str, "signal_id");
  signal.symbol = ExtractJsonString(resp_str, "symbol");
  signal.decision = ExtractJsonString(resp_str, "decision");
  signal.entry = ExtractJsonDouble(resp_str, "entry");
  signal.stop_loss = ExtractJsonDouble(resp_str, "stop_loss");
  signal.take_profit = ExtractJsonDouble(resp_str, "take_profit");
  signal.risk_reward = ExtractJsonDouble(resp_str, "risk_reward");
  signal.expires_at = ExtractJsonString(resp_str, "expires_at");
  signal.signature = ExtractJsonString(resp_str, "signature");
  
  return signal;
}

void ProcessSignal(Signal &signal) {
  
  LogInfo("[PROCESS] Validando señal: " + signal.signal_id);
  
  // Validar firma
  if (!ValidateSignature(signal)) {
    LogError("[PROCESS] Firma inválida");
    SendACK(signal.signal_id, "REJECTED_SIGNATURE");
    return;
  }
  
  // Validar expiración
  if (TimeCurrent() > StringToTime(signal.expires_at)) {
    LogWarn("[PROCESS] Señal expirada");
    SendACK(signal.signal_id, "EXPIRED");
    return;
  }
  
  // Validar duplicado
  if (IsProcessed(signal.signal_id)) {
    LogWarn("[PROCESS] Señal DUPLICADA");
    SendACK(signal.signal_id, "DUPLICATE");
    return;
  }
  
  // Validar símbolo
  string resolved_symbol = ResolveSymbol(signal.symbol);
  if (resolved_symbol == "") {
    LogError("[PROCESS] Símbolo no encontrado: " + signal.symbol);
    SendACK(signal.signal_id, "SYMBOL_NOT_FOUND");
    return;
  }
  signal.symbol = resolved_symbol;
  LogDebug("[PROCESS] Símbolo resuelto: " + signal.symbol);
  
  // Validar decision
  if (signal.decision != "BUY" && signal.decision != "SELL") {
    LogError("[PROCESS] Decision inválida: " + signal.decision);
    SendACK(signal.signal_id, "INVALID_DECISION");
    return;
  }
  
  // Validar permisos
  if (signal.decision == "BUY" && !ALLOW_BUY) {
    LogWarn("[PROCESS] BUY deshabilitado");
    SendACK(signal.signal_id, "BUY_DISABLED");
    return;
  }
  
  if (signal.decision == "SELL" && !ALLOW_SELL) {
    LogWarn("[PROCESS] SELL deshabilitado");
    SendACK(signal.signal_id, "SELL_DISABLED");
    return;
  }
  
  // Validar límites
  if (CountOpenTrades() >= MAX_OPEN_TRADES) {
    LogWarn("[PROCESS] Máx operaciones abiertas alcanzado");
    SendACK(signal.signal_id, "MAX_OPEN_TRADES_EXCEEDED");
    return;
  }
  
  // Validar margen
  if (!ValidateMargin()) {
    LogWarn("[PROCESS] Margen insuficiente");
    SendACK(signal.signal_id, "INSUFFICIENT_MARGIN");
    return;
  }
  
  LogSuccess("[PROCESS] Todas las validaciones pasadas");
  
  // Confirmar recepción
  SendACK(signal.signal_id, "RECEIVED");
  
  // Ejecutar orden
  ExecuteSignal(signal);
}

void ExecuteSignal(Signal &signal) {
  LogInfo("[EXECUTE] Ejecutando señal: " + signal.signal_id);
  
  int order_type = (signal.decision == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  double lot_size = FIXED_LOT;
  
  if (lot_size <= 0) {
    LogError("[EXECUTE] Lote inválido: " + DoubleToString(lot_size, 2));
    SendACK(signal.signal_id, "INVALID_LOT_SIZE");
    return;
  }
  
  LogDebug("[EXECUTE] Lote: " + DoubleToString(lot_size, 2) + " | Type: " + (signal.decision == "BUY" ? "BUY" : "SELL"));
  LogDebug("[EXECUTE] SL: " + DoubleToString(signal.stop_loss, 5) + " | TP: " + DoubleToString(signal.take_profit, 5));
  
  // Preparar trade request
  MqlTradeRequest request = {};
  request.action = TRADE_ACTION_DEAL;
  request.symbol = signal.symbol;
  request.volume = lot_size;
  request.type = order_type;
  request.price = SymbolInfoDouble(signal.symbol, order_type == ORDER_TYPE_BUY ? SYMBOL_ASK : SYMBOL_BID);
  request.sl = signal.stop_loss;
  request.tp = signal.take_profit;
  request.deviation = MAX_SLIPPAGE_POINTS;
  request.magic = g_magic_number;
  request.comment = "CARVIPIX-" + signal.signal_id;
  
  // Validar SL y TP
  if (!SymbolSelect(signal.symbol, true)) {
    LogError("[EXECUTE] No se puede seleccionar símbolo: " + signal.symbol);
    SendACK(signal.signal_id, "SYMBOL_ERROR");
    return;
  }
  
  double stops_level = SymbolInfoDouble(signal.symbol, SYMBOL_TRADE_STOPS_LEVEL);
  if (stops_level > 0) {
    double min_dist = stops_level * SymbolInfoDouble(signal.symbol, SYMBOL_POINT);
    LogDebug("[EXECUTE] SYMBOL_TRADE_STOPS_LEVEL: " + DoubleToString(min_dist, 5));
    
    if (signal.decision == "BUY") {
      if ((request.price - request.sl) < min_dist) {
        LogError("[EXECUTE] SL muy cercano al precio");
        SendACK(signal.signal_id, "INVALID_SL");
        return;
      }
    } else {
      if ((request.sl - request.price) < min_dist) {
        LogError("[EXECUTE] SL muy cercano al precio");
        SendACK(signal.signal_id, "INVALID_SL");
        return;
      }
    }
  }
  
  // Enviar orden
  MqlTradeResult result = {};
  int retries = 0;
  bool success = false;
  
  while (retries < 3 && !success) {
    if (!OrderSend(request, result)) {
      LogWarn("[EXECUTE] Intento " + IntegerToString(retries + 1) + " falló. Error: " + IntegerToString(GetLastError()));
      Sleep(1000);
      retries++;
    } else {
      success = true;
    }
  }
  
  if (!success) {
    LogError("[EXECUTE] Orden NO ejecutada después de 3 intentos");
    SendACK(signal.signal_id, "EXECUTION_FAILED");
    return;
  }
  
  // Registrar como procesada
  AddProcessed(signal.signal_id);
  LogSuccess("[EXECUTE] Orden ejecutada. Ticket: " + IntegerToString(result.order));
  
  SendACK(signal.signal_id, "EXECUTED");
}

//+------------------------------------------------------------------+
// FUNCIONES DE VALIDACIÓN
//+------------------------------------------------------------------+

bool ValidateLicense() {
  if (g_license_id == "[NOT_CONFIGURED]" || g_license_id == "") {
    return false;
  }
  
  uchar response[];
  uchar empty_request[] = {};
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  string url = g_api_url + "/validate?installation_id=" + g_installation_id;
  int timeout = 5000;
  
  int http_code = WebRequest("GET", url, request_headers, timeout, empty_request, response, result_headers);
  
  if (http_code != 200) {
    if (g_timer_cycles % 12 == 0) {
      LogDebug("[VALIDATE] HTTP " + IntegerToString(http_code));
    }
    return false;
  }
  
  return true;
}

bool ValidateSignature(Signal &signal) {
  if (signal.signature == "") {
    return false;
  }
  // TODO: Implementar HMAC SHA256
  return true;
}

bool ValidateMargin() {
  double free_margin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
  double min_margin = AccountInfoDouble(ACCOUNT_BALANCE) * 0.1;
  
  if (free_margin < min_margin) {
    LogWarn("Margen insuficiente: " + DoubleToString(free_margin, 2) + " < " + DoubleToString(min_margin, 2));
    return false;
  }
  
  return true;
}

string ResolveSymbol(string symbol_in) {
  // Normalizar símbolo
  string symbol = symbol_in;
  
  // Intentar encontrar exacto
  if (SymbolSelect(symbol, true)) {
    return symbol;
  }
  
  // Intentar variaciones comunes
  string variations[5] = {symbol + ".sml", symbol + ".a", symbol + "m", "X" + symbol, symbol};
  
  for (int i = 0; i < 5; i++) {
    if (SymbolSelect(variations[i], true)) {
      LogInfo("Símbolo normalizado: " + symbol_in + " → " + variations[i]);
      return variations[i];
    }
  }
  
  return "";
}

int CountOpenTrades() {
  int count = 0;
  int total = PositionsTotal();
  
  for (int i = 0; i < total; i++) {
    ulong ticket = PositionGetTicket(i);
    if (ticket > 0 && PositionGetInteger(POSITION_MAGIC) == g_magic_number) {
      count++;
    }
  }
  
  return count;
}

//+------------------------------------------------------------------+
// FUNCIONES DE COMUNICACIÓN
//+------------------------------------------------------------------+

void SendACK(string signal_id, string status) {
  string payload = "{\"signal_id\":\"" + signal_id + "\",\"status\":\"" + status + "\",\"installation_id\":\"" + g_installation_id + "\"}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/ack";
  int timeout = 3000;
  
  int http_code = WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
  LogDebug("[ACK] " + status + " (HTTP " + IntegerToString(http_code) + ")");
}

void SendHeartbeat() {
  if (TimeCurrent() - g_last_heartbeat_sent < POLLING_SECONDS) {
    return;  // No enviar dos veces en el mismo ciclo
  }
  
  g_last_heartbeat_sent = TimeCurrent();
  g_heartbeat_sent_count++;
  
  int open_trades = CountOpenTrades();
  double equity = AccountInfoDouble(ACCOUNT_EQUITY);
  double balance = AccountInfoDouble(ACCOUNT_BALANCE);
  
  string status_str = StatusToString(g_status);
  
  string payload = "{\"installation_id\":\"" + g_installation_id + "\",\"license_id\":\"" + g_license_id + "\",\"account_hash\":\"" + g_account_hash + "\",\"ea_version\":\"" + EA_VERSION + "\",\"status\":\"" + status_str + "\",\"open_positions\":" + IntegerToString(open_trades) + ",\"equity\":" + DoubleToString(equity, 2) + ",\"balance\":" + DoubleToString(balance, 2) + "}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/" + EA_VERSION + "\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/heartbeat";
  int timeout = 3000;
  
  int http_code = WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
  
  if (http_code == 200) {
    if (g_timer_cycles % 12 == 0) {
      LogDebug("[HEARTBEAT] Enviado (#" + IntegerToString(g_heartbeat_sent_count) + ")");
    }
  }
}

//+------------------------------------------------------------------+
// FUNCIONES DE CONTROL DE DUPLICADOS
//+------------------------------------------------------------------+

void AddProcessed(string signal_id) {
  if (g_processed_count < 1000) {
    g_processed_signals[g_processed_count] = signal_id;
    g_processed_count++;
    LogDebug("Señal registrada como procesada (" + IntegerToString(g_processed_count) + " en memoria)");
  }
}

bool IsProcessed(string signal_id) {
  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] == signal_id) {
      return true;
    }
  }
  return false;
}

//+------------------------------------------------------------------+
// FUNCIONES DE PANEL GRÁFICO
//+------------------------------------------------------------------+

void CreatePanel() {
  if (ObjectFind(0, g_panel_object_name) >= 0) {
    ObjectDelete(0, g_panel_object_name);
  }
  
  ObjectCreate(0, g_panel_object_name, OBJ_LABEL, 0, 0, 0);
  ObjectSetInteger(0, g_panel_object_name, OBJPROP_XDISTANCE, 10);
  ObjectSetInteger(0, g_panel_object_name, OBJPROP_YDISTANCE, 20);
  ObjectSetInteger(0, g_panel_object_name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, g_panel_object_name, OBJPROP_FONTSIZE, 10);
  ObjectSetString(0, g_panel_object_name, OBJPROP_FONT, "Courier New");
}

void UpdatePanel() {
  string panel_text = "CARVIPIX EA MT5 v" + EA_VERSION + "\n";
  panel_text += "━━━━━━━━━━━━━━━━━━━━━━\n";
  panel_text += "EA: " + StatusToString(g_status) + "\n";
  panel_text += "License: " + g_license_id + "\n";
  panel_text += "Open Trades: " + IntegerToString(CountOpenTrades()) + "/" + IntegerToString(MAX_OPEN_TRADES) + "\n";
  panel_text += "Heartbeats: " + IntegerToString(g_heartbeat_sent_count) + "\n";
  panel_text += "Signals Processed: " + IntegerToString(g_processed_count) + "\n";
  panel_text += "Last Error: " + g_last_error_message + "\n";
  
  ObjectSetString(0, g_panel_object_name, OBJPROP_TEXT, panel_text);
  
  // Color según status
  color text_color = clrWhite;
  if (g_status == STATUS_READY) text_color = clrLimeGreen;
  if (g_status == STATUS_ERROR) text_color = clrRed;
  if (g_status == STATUS_WAITING_LICENSE) text_color = clrOrange;
  
  ObjectSetInteger(0, g_panel_object_name, OBJPROP_COLOR, text_color);
}

void DeletePanel() {
  ObjectDelete(0, g_panel_object_name);
}

//+------------------------------------------------------------------+
// FUNCIONES AUXILIARES
//+------------------------------------------------------------------+

ulong GenerateMagicNumber(string license, string installation) {
  ulong magic = 5381;
  
  for (int i = 0; i < StringLen(license); i++) {
    magic = ((magic << 5) + magic) + (ulong)StringSubstr(license, i, 1)[0];
  }
  
  return magic % 2000000000;
}

string ExtractJsonString(string json, string key) {
  string search_key = "\"" + key + "\":\"";
  int start_pos = StringFind(json, search_key);
  
  if (start_pos < 0) return "";
  
  start_pos += StringLen(search_key);
  int end_pos = StringFind(json, "\"", start_pos);
  
  if (end_pos < 0) return "";
  
  return StringSubstr(json, start_pos, end_pos - start_pos);
}

double ExtractJsonDouble(string json, string key) {
  string search_key = "\"" + key + "\":";
  int start_pos = StringFind(json, search_key);
  
  if (start_pos < 0) return 0.0;
  
  start_pos += StringLen(search_key);
  int end_pos = StringFind(json, ",", start_pos);
  if (end_pos < 0) end_pos = StringFind(json, "}", start_pos);
  if (end_pos < 0) end_pos = StringLen(json);
  
  string value = StringSubstr(json, start_pos, end_pos - start_pos);
  return StringToDouble(value);
}

string StatusToString(EA_STATUS status) {
  switch (status) {
    case STATUS_INITIALIZING: return "INITIALIZING";
    case STATUS_WAITING_LICENSE: return "WAITING_LICENSE";
    case STATUS_VALIDATING: return "VALIDATING";
    case STATUS_READY: return "READY";
    case STATUS_ERROR: return "ERROR";
    case STATUS_NETWORK_ERROR: return "NETWORK_ERROR";
    case STATUS_LICENSE_INVALID: return "LICENSE_INVALID";
    case STATUS_READ_ONLY: return "READ_ONLY";
    default: return "UNKNOWN";
  }
}

//+------------------------------------------------------------------+
// FUNCIONES DE LOGGING
//+------------------------------------------------------------------+

void LogInfo(string msg) {
  Print("[" + TimeToString(TimeCurrent(), TIME_SECONDS) + "] [INFO] " + msg);
}

void LogWarn(string msg) {
  Print("[" + TimeToString(TimeCurrent(), TIME_SECONDS) + "] [WARN] " + msg);
}

void LogError(string msg) {
  Print("[" + TimeToString(TimeCurrent(), TIME_SECONDS) + "] [ERROR] " + msg);
  g_last_error_message = msg;
}

void LogSuccess(string msg) {
  Print("[" + TimeToString(TimeCurrent(), TIME_SECONDS) + "] [SUCCESS] " + msg);
}

void LogDebug(string msg) {
  Print("[" + TimeToString(TimeCurrent(), TIME_SECONDS) + "] [DEBUG] " + msg);
}
