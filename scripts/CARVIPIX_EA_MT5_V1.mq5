//+------------------------------------------------------------------+
//| CARVIPIX_EA_MT5_V1.mq5
//| Expert Advisor oficial para MetaTrader 5
//| Version: 1.0.0
//| Build: 20260715
//| Conecta a CARVIPIX para recibir señales y ejecutar automáticamente
//+------------------------------------------------------------------+

#property copyright "CARVIPIX 2026"
#property link "https://carvipix.com"
#property version "1.00"
#property strict
#property description "EA oficial CARVIPIX - Recibe señales y ejecuta automáticamente en MT5"

//+------------------------------------------------------------------+
// INPUTS
//+------------------------------------------------------------------+

input string CARVIPIX_LICENSE_KEY = "";           // Licencia
input string API_BASE_URL = "";                   // URL base personalizada (vacío = auto-detectar)
input string CARVIPIX_API_ENVIRONMENT = "PRODUCTION";  // DEVELOPMENT, STAGING, PRODUCTION
input string RISK_MODE = "FIXED_LOT";             // FIXED_LOT o RISK_PERCENT
input double FIXED_LOT = 0.1;                     // Lote fijo si FIXED_LOT
input double MAX_RISK_PERCENT = 2.0;              // Riesgo % por operación
input int MAX_OPEN_TRADES = 3;                    // Máximo de operaciones abiertas
input int MAX_DAILY_TRADES = 10;                  // Máximo de operaciones diarias
input double MAX_DAILY_LOSS_PERCENT = 5.0;        // Máximo de pérdida diaria %
input int POLLING_SECONDS = 5;                    // Frecuencia de polling
input int MAX_SLIPPAGE_POINTS = 5;                // Máximo de slippage
input bool ALLOW_BUY = true;                      // Permitir compras
input bool ALLOW_SELL = true;                     // Permitir ventas
input bool ALLOW_NEW_TRADES = true;               // Permitir nuevas operaciones
input string EA_VERSION = "1.0.0";                // Versión del EA

//+------------------------------------------------------------------+
// VARIABLES GLOBALES
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

struct Execution {
  string execution_id;
  string signal_id;
  string symbol;
  string direction;
  double executed_entry;
  double stop_loss;
  double take_profit;
  double lot_size;
  ulong broker_order_id;
  string status;
  datetime opened_at;
  datetime closed_at;
  double exit_price;
  double pnl;
};

// Estado global
string g_license_id = "";
string g_api_url = "";
string g_installation_id = "";
string g_account_hash = "";
int g_magic_number = 0;
string g_mode = "INITIALIZING";  // INITIALIZING, VALIDATING, READY, READ_ONLY, SUSPENDED, ERROR
string g_last_signal_id = "";
int g_daily_trades_count = 0;
double g_daily_loss = 0.0;
datetime g_session_start = 0;
bool g_connected = false;

// Array para deduplicación
string g_processed_signals[100];
int g_processed_count = 0;

//+------------------------------------------------------------------+
// EVENTO INIT
//+------------------------------------------------------------------+

int OnInit() {
  Print("[CARVIPIX] Inicializando EA v" + EA_VERSION);
  
  // Validar licencia
  if (CARVIPIX_LICENSE_KEY == "") {
    Print("[WARNING] Licencia no configurada. Por favor ingresa CARVIPIX_LICENSE_KEY en las propiedades del EA.");
    g_mode = "WAITING_LICENSE";
    g_license_id = "NOT_CONFIGURED";
  } else {
    g_license_id = CARVIPIX_LICENSE_KEY;
  }
  
  // Resolver URL del API según configuración
  g_api_url = ResolveApiUrl(API_BASE_URL, CARVIPIX_API_ENVIRONMENT);
  
  // Generar IDs únicos para esta instalación
  g_installation_id = GenerateInstallationID();
  g_account_hash = GenerateAccountHash();
  g_magic_number = GenerateMagicNumber(g_license_id, g_installation_id);
  g_session_start = TimeCurrent();
  
  Print("[CARVIPIX] Installation ID: " + g_installation_id);
  Print("[CARVIPIX] Magic Number: " + IntegerToString(g_magic_number));
  Print("[CARVIPIX] Account Hash: " + g_account_hash);
  Print("[CARVIPIX] Entorno: " + CARVIPIX_API_ENVIRONMENT);
  Print("[CARVIPIX] API URL: " + g_api_url);
  
  // Iniciar timer para polling
  EventSetTimer(POLLING_SECONDS);
  
  // Si licencia está configurada, intentar handshake
  if (g_mode != "WAITING_LICENSE") {
    g_mode = "VALIDATING";
    Print("[CARVIPIX] Iniciando handshake...");
    
    // Performar handshake
    if (!PerformHandshake()) {
      g_mode = "ERROR";
      Print("[ERROR] Handshake fallido. Verifica licencia y conexión.");
    } else {
      g_mode = "READY";
      Print("[CARVIPIX] EA READY. Esperando señales...");
    }
  } else {
    Print("[CARVIPIX] EA cargado en modo WAITING_LICENSE. Configura la licencia en propiedades.");
  }
  
  return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
// EVENTO DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason) {
  EventKillTimer();
  Print("[CARVIPIX] EA detenido. Razón: " + IntegerToString(reason));
}

//+------------------------------------------------------------------+
// FUNCIONES DE CONFIGURACIÓN
//+------------------------------------------------------------------+

string ResolveApiUrl(string customUrl, string environment) {
  // Si usuario especificó una URL personalizada, usarla
  if (customUrl != "") {
    Print("[CARVIPIX] Usando URL personalizada: " + customUrl);
    return customUrl;
  }
  
  // Si no, usar según el entorno
  if (environment == "DEVELOPMENT") {
    return "http://localhost:3000/api/bot/mt5";
  } else if (environment == "STAGING") {
    return "https://staging.carvipix.com/api/bot/mt5";
  } else if (environment == "PRODUCTION") {
    return "https://carvipix.com/api/bot/mt5";
  } else {
    // Default a producción si es desconocido
    return "https://carvipix.com/api/bot/mt5";
  }
}

//+------------------------------------------------------------------+
// EVENTO TIMER (POLLING)
//+------------------------------------------------------------------+

void OnTimer() {
  if (g_mode == "ERROR" || g_mode == "SUSPENDED") {
    return;
  }
  
  // Enviar heartbeat
  SendHeartbeat();
  
  // Verificar licencia (cada polling)
  if (!ValidateLicense()) {
    if (g_mode != "READ_ONLY") {
      g_mode = "READ_ONLY";
      Print("[WARNING] Licencia inválida o expirada. Entrando READ_ONLY.");
    }
    return;
  }
  
  // Si NO hay nuevas operaciones permitidas, solo enviar heartbeat
  if (!ALLOW_NEW_TRADES || g_mode == "READ_ONLY") {
    return;
  }
  
  // Obtener señal pendiente
  Signal signal = GetPendingSignal();
  
  if (signal.signal_id == "") {
    // Sin señal pendiente
    return;
  }
  
  // Validar y procesar señal
  ProcessSignal(signal);
}

//+------------------------------------------------------------------+
// FUNCIONES PRINCIPALES
//+------------------------------------------------------------------+

bool PerformHandshake() {
  string payload = "{\"license_id\":\"" + g_license_id + "\",\"installation_id\":\"" + g_installation_id + "\",\"account_hash\":\"" + g_account_hash + "\",\"ea_version\":\"" + EA_VERSION + "\",\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\"}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/handshake";
  
  int timeout = 10000; // 10 segundos
  int http_code = WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
  
  if (http_code == 200 || http_code == 201) {
    Print("[CARVIPIX] Handshake exitoso.");
    g_connected = true;
    return true;
  } else {
    Print("[ERROR] Handshake fallido. HTTP " + IntegerToString(http_code));
    g_connected = false;
    return false;
  }
}

Signal GetPendingSignal() {
  Signal empty;
  empty.signal_id = "";
  
  uchar response[];
  uchar empty_request[] = {};
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/signals?installation_id=" + g_installation_id + "&account_hash=" + g_account_hash;
  
  int timeout = 5000;
  int http_code = WebRequest("GET", url, request_headers, timeout, empty_request, response, result_headers);
  
  if (http_code != 200) {
    Print("[WARNING] GET signals falló. HTTP " + IntegerToString(http_code));
    return empty;
  }
  
  // Parse JSON response
  // Para simplificar, asumir respuesta de estructura conocida
  string resp_str = CharArrayToString(response);
  
  if (resp_str == "" || StringFind(resp_str, "signal_id") < 0) {
    return empty;
  }
  
  // Extraer fields (implementación simplificada, en producción usar JSON parser)
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
  // Validar firma
  if (!ValidateSignature(signal)) {
    Print("[ERROR] Firma inválida para señal " + signal.signal_id);
    SendACK(signal.signal_id, "REJECTED_SIGNATURE");
    return;
  }
  
  // Validar expiración
  if (TimeCurrent() > StringToTime(signal.expires_at)) {
    Print("[WARNING] Señal expirada: " + signal.signal_id);
    SendACK(signal.signal_id, "EXPIRED");
    return;
  }
  
  // Validar duplicado
  if (IsProcessed(signal.signal_id)) {
    Print("[WARNING] Señal duplicada: " + signal.signal_id);
    SendACK(signal.signal_id, "DUPLICATE");
    return;
  }
  
  // Validar símbolo disponible
  if (!SymbolSelect(signal.symbol, true)) {
    Print("[ERROR] Símbolo no disponible: " + signal.symbol);
    SendACK(signal.signal_id, "SYMBOL_UNAVAILABLE");
    return;
  }
  
  // Validar decision
  if (signal.decision != "BUY" && signal.decision != "SELL") {
    Print("[WARNING] Decision no reconocida: " + signal.decision);
    SendACK(signal.signal_id, "INVALID_DECISION");
    return;
  }
  
  // Validar permisos
  if (signal.decision == "BUY" && !ALLOW_BUY) {
    Print("[INFO] BUY deshabilitado");
    SendACK(signal.signal_id, "BUY_DISABLED");
    return;
  }
  
  if (signal.decision == "SELL" && !ALLOW_SELL) {
    Print("[INFO] SELL deshabilitado");
    SendACK(signal.signal_id, "SELL_DISABLED");
    return;
  }
  
  // Validar límites
  if (CountOpenTrades() >= MAX_OPEN_TRADES) {
    Print("[WARNING] Máximo de operaciones abiertas alcanzado");
    SendACK(signal.signal_id, "MAX_OPEN_TRADES_EXCEEDED");
    return;
  }
  
  if (g_daily_trades_count >= MAX_DAILY_TRADES) {
    Print("[WARNING] Máximo de operaciones diarias alcanzado");
    SendACK(signal.signal_id, "MAX_DAILY_TRADES_EXCEEDED");
    return;
  }
  
  // Validar riesgo
  if (!ValidateRisk(signal)) {
    Print("[WARNING] Riesgo excedido para señal " + signal.signal_id);
    SendACK(signal.signal_id, "RISK_EXCEEDED");
    return;
  }
  
  // Validar margen
  if (!ValidateMargin(signal)) {
    Print("[WARNING] Margen insuficiente para señal " + signal.signal_id);
    SendACK(signal.signal_id, "INSUFFICIENT_MARGIN");
    return;
  }
  
  // Confirmar recepción
  SendACK(signal.signal_id, "RECEIVED");
  
  // Ejecutar orden
  ExecuteSignal(signal);
}

void ExecuteSignal(Signal &signal) {
  SendACK(signal.signal_id, "EXECUTION_STARTED");
  
  int order_type = (signal.decision == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  double lot_size = CalculateLotSize(signal);
  
  if (lot_size <= 0) {
    Print("[ERROR] Cálculo de lote inválido");
    SendACK(signal.signal_id, "INVALID_LOT_SIZE");
    return;
  }
  
  // Preparar trade request
  MqlTradeRequest request = {};
  request.action = TRADE_ACTION_DEAL;
  request.symbol = signal.symbol;
  request.volume = lot_size;
  request.type = order_type;
  request.price = SymbolInfoDouble(signal.symbol, SYMBOL_ASK);
  request.sl = signal.stop_loss;
  request.tp = signal.take_profit;
  request.deviation = MAX_SLIPPAGE_POINTS;
  request.magic = g_magic_number;
  request.comment = "CARVIPIX-" + signal.signal_id;
  
  // Enviar orden
  MqlTradeResult result = {};
  int retries = 0;
  bool success = false;
  
  while (retries < 3 && !success) {
    if (!OrderSend(request, result)) {
      Print("[ERROR] OrderSend falló. Intento " + IntegerToString(retries + 1));
      Sleep(1000);
      retries++;
    } else {
      success = true;
    }
  }
  
  if (!success) {
    Print("[ERROR] No se pudo ejecutar orden después de 3 intentos");
    SendACK(signal.signal_id, "EXECUTION_FAILED");
    ReportExecution(signal, result, "FAILED");
    return;
  }
  
  // Registrar signal como procesada
  AddProcessed(signal.signal_id);
  g_last_signal_id = signal.signal_id;
  g_daily_trades_count++;
  
  SendACK(signal.signal_id, "EXECUTED");
  Print("[SUCCESS] Orden ejecutada. Ticket: " + IntegerToString(result.order));
  
  // Reportar ejecución
  ReportExecution(signal, result, "EXECUTED");
}

bool ValidateLicense() {
  uchar response[];
  uchar empty_request[] = {};
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/validate?installation_id=" + g_installation_id;
  
  int timeout = 5000;
  int http_code = WebRequest("GET", url, request_headers, timeout, empty_request, response, result_headers);
  
  if (http_code != 200) {
    return false;
  }
  
  string resp_str = CharArrayToString(response);
  if (StringFind(resp_str, "\"valid\":true") >= 0) {
    return true;
  }
  
  return false;
}

bool ValidateSignature(Signal &signal) {
  // Implementación simplificada
  // En producción, usar HMAC SHA256
  if (signal.signature == "") {
    return false;
  }
  return true;
}

bool ValidateRisk(Signal &signal) {
  double risk_points = signal.entry - signal.stop_loss;
  if (risk_points <= 0) {
    return false;
  }
  
  double account_balance = AccountInfoDouble(ACCOUNT_BALANCE);
  double risk_amount = (account_balance * MAX_RISK_PERCENT) / 100.0;
  
  double pip_value = SymbolInfoDouble(signal.symbol, SYMBOL_TRADE_TICK_VALUE);
  double required_risk = risk_points / pip_value;
  
  if (required_risk > risk_amount) {
    return false;
  }
  
  return true;
}

bool ValidateMargin(Signal &signal) {
  double free_margin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
  double min_margin = AccountInfoDouble(ACCOUNT_BALANCE) * 0.1; // 10% mínimo
  
  return free_margin > min_margin;
}

double CalculateLotSize(Signal &signal) {
  if (RISK_MODE == "FIXED_LOT") {
    return FIXED_LOT;
  }
  
  if (RISK_MODE == "RISK_PERCENT") {
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double risk_amount = (balance * MAX_RISK_PERCENT) / 100.0;
    double risk_points = signal.entry - signal.stop_loss;
    double pip_value = SymbolInfoDouble(signal.symbol, SYMBOL_TRADE_TICK_VALUE);
    
    double lot_size = risk_amount / (risk_points * pip_value);
    
    // Validar step y limites del broker
    double min_lot = SymbolInfoDouble(signal.symbol, SYMBOL_VOLUME_MIN);
    double max_lot = SymbolInfoDouble(signal.symbol, SYMBOL_VOLUME_MAX);
    double lot_step = SymbolInfoDouble(signal.symbol, SYMBOL_VOLUME_STEP);
    
    lot_size = MathMax(lot_size, min_lot);
    lot_size = MathMin(lot_size, max_lot);
    lot_size = MathFloor(lot_size / lot_step) * lot_step;
    
    return lot_size;
  }
  
  return 0.0;
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

void SendACK(string signal_id, string status) {
  string payload = "{\"signal_id\":\"" + signal_id + "\",\"status\":\"" + status + "\",\"installation_id\":\"" + g_installation_id + "\"}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/ack";
  int timeout = 3000;
  
  WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
}

void SendHeartbeat() {
  int open_trades = CountOpenTrades();
  double equity = AccountInfoDouble(ACCOUNT_EQUITY);
  double balance = AccountInfoDouble(ACCOUNT_BALANCE);
  
  string payload = "{\"installation_id\":\"" + g_installation_id + "\",\"license_id\":\"" + g_license_id + "\",\"account_hash\":\"" + g_account_hash + "\",\"ea_version\":\"" + EA_VERSION + "\",\"status\":\"" + g_mode + "\",\"open_positions\":" + IntegerToString(open_trades) + ",\"equity\":" + DoubleToString(equity, 2) + ",\"balance\":" + DoubleToString(balance, 2) + "}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/heartbeat";
  int timeout = 3000;
  
  WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
}

void ReportExecution(Signal &signal, MqlTradeResult &result, string status) {
  double pnl = 0.0;
  if (result.price > 0) {
    double current_price = SymbolInfoDouble(signal.symbol, SYMBOL_BID);
    if (signal.decision == "BUY") {
      pnl = (current_price - result.price) * result.volume;
    } else {
      pnl = (result.price - current_price) * result.volume;
    }
  }
  
  string payload = "{\"signal_id\":\"" + signal.signal_id + "\",\"installation_id\":\"" + g_installation_id + "\",\"symbol\":\"" + signal.symbol + "\",\"direction\":\"" + signal.decision + "\",\"executed_entry\":" + DoubleToString(result.price, 5) + ",\"lot_size\":" + DoubleToString(result.volume, 2) + ",\"broker_order_id\":" + IntegerToString(result.order) + ",\"status\":\"" + status + "\",\"pnl\":" + DoubleToString(pnl, 2) + "}";
  
  uchar request[];
  uchar response[];
  string result_headers;
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  StringToCharArray(payload, request);
  
  string url = g_api_url + "/executions";
  int timeout = 5000;
  
  WebRequest("POST", url, request_headers, timeout, request, response, result_headers);
}

//+------------------------------------------------------------------+
// FUNCIONES AUXILIARES
//+------------------------------------------------------------------+

string GenerateInstallationID() {
  // Generar ID único basado en cuenta + timestamp
  return "INST-" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "-" + IntegerToString(TimeCurrent());
}

string GenerateAccountHash() {
  // Hash simple de número de cuenta
  uint hash = 5381;
  ulong acc_num = AccountInfoInteger(ACCOUNT_LOGIN);
  
  while (acc_num > 0) {
    hash = ((hash << 5) + hash) + (acc_num % 10);
    acc_num /= 10;
  }
  
  return "ACC-" + IntegerToString(hash);
}

int GenerateMagicNumber(string license, string installation) {
  // Generar magic number determinístico
  uint magic = 5381;
  
  for (int i = 0; i < StringLen(license); i++) {
    magic = ((magic << 5) + magic) + (uint)StringSubstr(license, i, 1)[0];
  }
  
  return (int)(magic % 2000000000);
}

void AddProcessed(string signal_id) {
  if (g_processed_count < 100) {
    g_processed_signals[g_processed_count] = signal_id;
    g_processed_count++;
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

string ExtractJsonString(string json, string key) {
  string search_key = "\"" + key + "\":\"";
  int start_pos = StringFind(json, search_key);
  
  if (start_pos < 0) {
    return "";
  }
  
  start_pos += StringLen(search_key);
  int end_pos = StringFind(json, "\"", start_pos);
  
  if (end_pos < 0) {
    return "";
  }
  
  return StringSubstr(json, start_pos, end_pos - start_pos);
}

double ExtractJsonDouble(string json, string key) {
  string search_key = "\"" + key + "\":";
  int start_pos = StringFind(json, search_key);
  
  if (start_pos < 0) {
    return 0.0;
  }
  
  start_pos += StringLen(search_key);
  int end_pos = StringFind(json, ",", start_pos);
  
  if (end_pos < 0) {
    end_pos = StringFind(json, "}", start_pos);
  }
  
  if (end_pos < 0) {
    return 0.0;
  }
  
  string value_str = StringSubstr(json, start_pos, end_pos - start_pos);
  return StringToDouble(value_str);
}

string CharArrayToString(char &array[]) {
  string result = "";
  for (int i = 0; i < ArraySize(array) && array[i] != 0; i++) {
    result += CharToString(array[i]);
  }
  return result;
}

//+------------------------------------------------------------------+
// FIN EA
//+------------------------------------------------------------------+
