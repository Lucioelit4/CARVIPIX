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
input string CARVIPIX_API_ENVIRONMENT = "PRODUCTION";   // DEVELOPMENT, STAGING, PRODUCTION
input bool FORCE_LOCALHOST_DEV = false;           // Forzar localhost para pruebas locales
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
input bool ENABLE_MULTIPAIR_SELFTEST = true;      // Pruebas de resolución sin ejecutar órdenes
input bool DRY_RUN_NO_ORDERS = true;              // Si true, enruta y valida señales pero no envía órdenes reales

string EA_BUILD_ID = "LOCAL-RUNTIME-20260730";

//+------------------------------------------------------------------+
// VARIABLES GLOBALES
//+------------------------------------------------------------------+

struct Signal {
  string signal_id;
  string analysis_id;
  string symbol;
  string canonical_symbol;
  string broker_symbol;
  string decision;
  double entry;
  double stop_loss;
  double take_profit;
  double risk_reward;
  string expires_at;
  string signature;
  string signal_mode;
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
string g_mode = "INITIALIZING";  // INITIALIZING, WAITING_LICENSE, VALIDATING, READY, READ_ONLY, SUSPENDED, CONNECTIVITY_WARNING
string g_last_signal_id = "";
int g_daily_trades_count = 0;
double g_daily_loss = 0.0;
datetime g_session_start = 0;
bool g_connected = false;
bool g_webrequest_warning_printed = false;
string g_chart_symbol = "";
string g_chart_canonical_symbol = "";
string g_coordinator_key = "";
bool g_is_coordinator = false;
bool g_has_coordinator_lock = false;
datetime g_last_tick_trace_at = 0;
int g_handshake_fail_count = 0;
int g_handshake_http_last = 0;
string g_handshake_error_last = "";
string g_handshake_error_signature_last = "";
datetime g_next_handshake_retry_at = 0;
int g_handshake_max_attempts = 3;
bool g_transport_verified = false;
int g_transport_fail_count = 0;
int g_transport_http_last = 0;
string g_transport_error_last = "";
string g_transport_error_signature_last = "";
datetime g_next_transport_retry_at = 0;
int g_transport_max_attempts = 3;

// Archivo local para licencia fallback (MQL5/Files)
string g_license_file_name = "carvipix_license.key";
string g_runtime_trace_file_name = "carvipix_runtime_trace.log";
string g_processed_file_name = "carvipix_processed_signals.txt";

// Universo canónico permitido
string g_allowed_canonicals[4] = {"XAUUSD", "BTCUSD", "EURUSD", "GBPUSD"};
string g_resolved_broker_symbols[4] = {"", "", "", ""};
string g_symbol_resolution_status[4] = {"", "", "", ""};
string g_symbol_resolution_detail[4] = {"", "", "", ""};

// Array para deduplicación
string g_processed_signals[100];
int g_processed_count = 0;

//+------------------------------------------------------------------+
// EVENTO INIT
//+------------------------------------------------------------------+

int OnInit() {
  TraceRuntime("RUNTIME_ONINIT_START", "build=" + EA_BUILD_ID + ",chart=" + Symbol());
  Print("[CARVIPIX] RUNTIME_ONINIT_START build=" + EA_BUILD_ID + " version=" + EA_VERSION + " chart=" + Symbol());
  Print("[CARVIPIX] Inicializando EA v" + EA_VERSION);
  
  // Validar licencia
  string configured_license = CARVIPIX_LICENSE_KEY;
  StringTrimLeft(configured_license);
  StringTrimRight(configured_license);

  if (configured_license == "") {
    string file_license = LoadLicenseFromFile();
    if (file_license == "") {
      TraceRuntime("LICENSE_LOAD_EMPTY", "source=file");
      Print("[CARVIPIX] LICENSE_LOAD_EMPTY source=file");
      Print("[WARNING] Licencia no configurada. Por favor ingresa CARVIPIX_LICENSE_KEY en las propiedades del EA.");
      g_mode = "WAITING_LICENSE";
      g_license_id = "NOT_CONFIGURED";
    } else {
      TraceRuntime("LICENSE_LOAD_OK", "source=file,masked=" + MaskLicense(g_license_id));
      g_license_id = file_license;
      Print("[CARVIPIX] LICENSE_LOAD_OK source=file masked=" + MaskLicense(g_license_id));
      Print("[CARVIPIX] Licencia cargada desde MQL5/Files/" + g_license_file_name + ".");
    }
  } else {
    g_license_id = configured_license;
    TraceRuntime("LICENSE_LOAD_OK", "source=input,masked=" + MaskLicense(g_license_id));
    Print("[CARVIPIX] LICENSE_LOAD_OK source=input masked=" + MaskLicense(g_license_id));
  }
  
  // Resolver URL del API según configuración
  Print("[CARVIPIX] ENV_SELECTION requested_env=" + CARVIPIX_API_ENVIRONMENT + " force_localhost=" + (FORCE_LOCALHOST_DEV ? "true" : "false"));
  g_api_url = ResolveApiUrl(API_BASE_URL, CARVIPIX_API_ENVIRONMENT);
  if (StringFind(g_api_url, "http://localhost:3000") == 0) {
    TraceRuntime("ENV_LOCALHOST_OK", "url=" + g_api_url);
    Print("[CARVIPIX] ENV_LOCALHOST_OK url=" + g_api_url);
  } else {
    TraceRuntime("ENV_NON_LOCALHOST", "url=" + g_api_url);
    Print("[CARVIPIX] ENV_NON_LOCALHOST url=" + g_api_url);
  }

  // Resolver símbolo del gráfico actual (solo para referencia y logging).
  g_chart_symbol = Symbol();
  g_chart_canonical_symbol = ResolveCanonicalSymbol(g_chart_symbol);
  if (g_chart_canonical_symbol == "") {
    g_chart_canonical_symbol = "UNMAPPED";
    Print("[WARNING] Símbolo del gráfico no mapeado como canónico: " + g_chart_symbol + " (se usará solo como host del coordinador).");
  }
  
  // Generar IDs únicos para esta instalación
  g_installation_id = GenerateInstallationID();
  g_account_hash = GenerateAccountHash();
  g_magic_number = GenerateMagicNumber(g_license_id, g_installation_id);
  g_session_start = TimeCurrent();
  g_processed_file_name = "carvipix_processed_" + g_installation_id + ".txt";
  LoadProcessedSignals();
  
  Print("[CARVIPIX] Installation ID: " + g_installation_id);
  Print("[CARVIPIX] Magic Number: " + IntegerToString(g_magic_number));
  Print("[CARVIPIX] Account Hash: " + g_account_hash);
  Print("[CARVIPIX] Chart Symbol: " + g_chart_symbol);
  Print("[CARVIPIX] Canonical Symbol: " + g_chart_canonical_symbol);

  g_coordinator_key = "CVPX_COORD|" + g_license_id + "|" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "|" + AccountInfoString(ACCOUNT_SERVER);
  g_has_coordinator_lock = AcquireCoordinatorLock();
  g_is_coordinator = g_has_coordinator_lock;
  Print("[CARVIPIX] Coordinator: " + (g_is_coordinator ? "YES" : "NO") + " (key=" + g_coordinator_key + ")");
  Print("[CARVIPIX] Entorno: " + CARVIPIX_API_ENVIRONMENT);
  Print("[CARVIPIX] API URL: " + g_api_url);

  if (!InitBrokerSymbolCatalog()) {
    Print("[WARNING] No se pudo inicializar el catálogo multipar completo. El coordinador seguirá online y operará solo símbolos resueltos.");
  }

  if (ENABLE_MULTIPAIR_SELFTEST) {
    RunMultipairSelfTest();
  }

  if (!g_is_coordinator) {
    g_mode = "SUSPENDED";
    Print("[CARVIPIX] RUNTIME_ONINIT_END return=INIT_SUCCEEDED reason=NON_COORDINATOR");
    Print("[CARVIPIX] Instancia no coordinadora en " + g_chart_symbol + ". Se suspende polling/handshake para evitar ráfaga duplicada.");
    return INIT_SUCCEEDED;
  }

  ResetConnectivityRetryState("manual_init_or_restart", true);
  
  // Iniciar timer para polling
  bool timer_ok = EventSetTimer(POLLING_SECONDS);
  TraceRuntime("TIMER_REGISTER", "seconds=" + IntegerToString(POLLING_SECONDS) + ",result=" + (timer_ok ? "true" : "false"));
  Print("[CARVIPIX] TIMER_REGISTER requested_seconds=" + IntegerToString(POLLING_SECONDS) + " result=" + (timer_ok ? "true" : "false"));
  
  // Si licencia está configurada, intentar handshake
  if (g_mode != "WAITING_LICENSE") {
    g_mode = "VALIDATING";
    TraceRuntime("HANDSHAKE_ATTEMPT", "phase=OnInit,url=" + g_api_url + "/handshake");
    Print("[CARVIPIX] HANDSHAKE_ATTEMPT phase=OnInit url=" + g_api_url + "/handshake");
    Print("[CARVIPIX] Iniciando handshake...");
    
    // Performar handshake
    if (!PerformHandshake()) {
      g_mode = "CONNECTIVITY_WARNING";
      g_connected = false;
      Print("[WARNING] Handshake inicial fallido. El EA seguirá activo y reintentará conexión automáticamente.");
    } else {
      g_mode = "READY";
      Print("[CARVIPIX] EA READY. Esperando señales...");
    }
  } else {
    Print("[CARVIPIX] EA cargado en modo WAITING_LICENSE. Configura la licencia en propiedades.");
  }

  TraceRuntime("RUNTIME_ONINIT_END", "return=INIT_SUCCEEDED,mode=" + g_mode + ",connected=" + (g_connected ? "true" : "false"));
  Print("[CARVIPIX] RUNTIME_ONINIT_END return=INIT_SUCCEEDED mode=" + g_mode + " connected=" + (g_connected ? "true" : "false"));
  
  return INIT_SUCCEEDED;
}

void OnTick() {
  datetime now = TimeCurrent();
  if (now - g_last_tick_trace_at >= 30) {
    g_last_tick_trace_at = now;
    TraceRuntime("RUNTIME_ONTICK", "build=" + EA_BUILD_ID + ",mode=" + g_mode + ",symbol=" + Symbol());
    Print("[CARVIPIX] RUNTIME_ONTICK build=" + EA_BUILD_ID + " mode=" + g_mode + " symbol=" + Symbol());
  }
}

string ReadLicenseFileWithFlags(const int flags) {
  int handle = FileOpen(g_license_file_name, flags);
  if (handle == INVALID_HANDLE) {
    return "";
  }

  string raw = FileReadString(handle);
  FileClose(handle);

  StringTrimLeft(raw);
  StringTrimRight(raw);
  return raw;
}

string LoadLicenseFromFile() {
  int base_flags = FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ;

  // Evita condición de carrera al iniciar múltiples charts en paralelo.
  for (int i = 0; i < 5; i++) {
    string local_raw = ReadLicenseFileWithFlags(base_flags);
    if (local_raw != "") {
      return local_raw;
    }

    string common_raw = ReadLicenseFileWithFlags(base_flags | FILE_COMMON);
    if (common_raw != "") {
      return common_raw;
    }

    Sleep(25);
  }

  return "";
}

//+------------------------------------------------------------------+
// EVENTO DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason) {
  EventKillTimer();
  SaveProcessedSignals();
  ReleaseCoordinatorLock();
  TraceRuntime("TIMER_RELEASE", "reason=" + IntegerToString(reason));
  Print("[CARVIPIX] TIMER_RELEASE reason=" + IntegerToString(reason));
  Print("[CARVIPIX] EA detenido. Razón: " + IntegerToString(reason));
}

//+------------------------------------------------------------------+
// FUNCIONES DE CONFIGURACIÓN
//+------------------------------------------------------------------+

string ResolveApiUrl(string customUrl, string environment) {
  // Si usuario especificó una URL personalizada, usarla
  if (customUrl != "") {
    Print("[CARVIPIX] URL_BUILD custom=true value=" + customUrl);
    Print("[CARVIPIX] Usando URL personalizada: " + customUrl);
    return customUrl;
  }

  if (FORCE_LOCALHOST_DEV) {
    Print("[CARVIPIX] URL_BUILD custom=false force_localhost=true value=http://127.0.0.1:3000/api/bot/mt5");
    Print("[CARVIPIX] FORCE_LOCALHOST_DEV activo: usando 127.0.0.1:3000.");
    return "http://127.0.0.1:3000/api/bot/mt5";
  }
  
  // Si no, usar según el entorno
  if (environment == "DEVELOPMENT") {
    Print("[CARVIPIX] URL_BUILD env=DEVELOPMENT value=http://127.0.0.1:3000/api/bot/mt5");
    return "http://127.0.0.1:3000/api/bot/mt5";
  } else if (environment == "STAGING") {
    Print("[CARVIPIX] URL_BUILD env=STAGING value=https://mt5-staging-carvipix.vercel.app/api/bot/mt5");
    return "https://mt5-staging-carvipix.vercel.app/api/bot/mt5";
  } else if (environment == "PRODUCTION") {
    Print("[CARVIPIX] URL_BUILD env=PRODUCTION value=https://carvipix.com/api/bot/mt5");
    return "https://carvipix.com/api/bot/mt5";
  } else {
    // Default a producción si es desconocido
    Print("[CARVIPIX] URL_BUILD env=INVALID value=https://carvipix.com/api/bot/mt5");
    return "https://carvipix.com/api/bot/mt5";
  }
}

//+------------------------------------------------------------------+
// EVENTO TIMER (POLLING)
//+------------------------------------------------------------------+

void OnTimer() {
  TraceRuntime("RUNTIME_ONTIMER", "build=" + EA_BUILD_ID + ",mode=" + g_mode + ",coordinator=" + (g_is_coordinator ? "true" : "false") + ",connected=" + (g_connected ? "true" : "false"));
  Print("[CARVIPIX] RUNTIME_ONTIMER build=" + EA_BUILD_ID + " mode=" + g_mode + " coordinator=" + (g_is_coordinator ? "true" : "false") + " connected=" + (g_connected ? "true" : "false"));
  if (g_mode == "SUSPENDED" || !g_is_coordinator) {
    Print("[CARVIPIX] RUNTIME_ONTIMER_SKIP reason=" + (g_mode == "SUSPENDED" ? "SUSPENDED" : "NOT_COORDINATOR"));
    return;
  }

  if (g_mode == "WAITING_LICENSE") {
    string file_license = LoadLicenseFromFile();
    if (file_license == "") {
      TraceRuntime("LICENSE_LOAD_WAITING", "still_empty=true");
      Print("[CARVIPIX] LICENSE_LOAD_WAITING still_empty=true");
      return;
    }

    g_license_id = file_license;
    g_mode = "VALIDATING";
    TraceRuntime("LICENSE_LOAD_OK", "source=runtime,masked=" + MaskLicense(g_license_id));
    Print("[CARVIPIX] LICENSE_LOAD_OK source=runtime masked=" + MaskLicense(g_license_id));
    TraceRuntime("HANDSHAKE_ATTEMPT", "phase=OnTimer_WAITING_LICENSE,url=" + g_api_url + "/handshake");
    Print("[CARVIPIX] HANDSHAKE_ATTEMPT phase=OnTimer_WAITING_LICENSE url=" + g_api_url + "/handshake");
    Print("[CARVIPIX] Licencia detectada en runtime. Iniciando handshake...");

    if (PerformHandshake()) {
      g_connected = true;
      g_mode = "READY";
      Print("[CARVIPIX] EA READY. Esperando señales...");
    } else {
      g_mode = "CONNECTIVITY_WARNING";
      g_connected = false;
      Print("[WARNING] Handshake fallido tras carga dinámica de licencia. Se reintentará automáticamente.");
    }
    return;
  }

  // Reintentar conexión si el handshake inicial falló por red/WebRequest.
  if (!g_connected || g_mode == "CONNECTIVITY_WARNING") {
    if (TimeCurrent() < g_next_handshake_retry_at) {
      Print("[CARVIPIX] HANDSHAKE_RETRY_DELAY until=" + TimeToString(g_next_handshake_retry_at, TIME_DATE | TIME_SECONDS));
      return;
    }

    if (PerformHandshake()) {
      g_connected = true;
      g_mode = "READY";
      g_handshake_fail_count = 0;
      g_next_handshake_retry_at = 0;
      Print("[CARVIPIX] Conexión restablecida. EA READY.");
    } else {
      g_mode = "CONNECTIVITY_WARNING";
      return;
    }
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
  TraceRuntime("HANDSHAKE_ATTEMPT", "build=" + EA_BUILD_ID + ",installation_id=" + g_installation_id + ",mode=" + g_mode);
  Print("[CARVIPIX] HANDSHAKE_ATTEMPT build=" + EA_BUILD_ID + " installation_id=" + g_installation_id + " mode=" + g_mode);
  if (!PerformTransportPing()) {
    g_connected = false;
    g_mode = "CONNECTIVITY_WARNING";
    return false;
  }

  long account_login = AccountInfoInteger(ACCOUNT_LOGIN);
  string broker_server = AccountInfoString(ACCOUNT_SERVER);
  string broker_company = AccountInfoString(ACCOUNT_COMPANY);
  long trade_mode = AccountInfoInteger(ACCOUNT_TRADE_MODE);
  long margin_mode = AccountInfoInteger(ACCOUNT_MARGIN_MODE);
  long terminal_build = TerminalInfoInteger(TERMINAL_BUILD);

  string payload = "{"
    + "\"action\":\"handshake\"," 
    + "\"license_id\":\"" + EscapeJsonString(g_license_id) + "\"," 
    + "\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\"," 
    + "\"account_hash\":\"" + EscapeJsonString(g_account_hash) + "\"," 
    + "\"account_number\":" + Int64ToString(account_login) + ","
    + "\"broker_server\":\"" + EscapeJsonString(broker_server) + "\"," 
    + "\"broker_company\":\"" + EscapeJsonString(broker_company) + "\"," 
    + "\"account_trade_mode\":" + Int64ToString(trade_mode) + ","
    + "\"account_margin_mode\":" + Int64ToString(margin_mode) + ","
    + "\"broker_symbol\":\"" + EscapeJsonString(g_chart_symbol) + "\"," 
    + "\"canonical_symbol\":\"MULTI\"," 
    + "\"magic_number\":" + IntegerToString(g_magic_number) + ","
    + "\"ea_version\":\"" + EscapeJsonString(EA_VERSION) + "\"," 
    + "\"terminal_build\":" + Int64ToString(terminal_build)
    + "}";
  
  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/handshake";
  
  int timeout = 10000; // 10 segundos
  int web_request_error = 0;
  int http_code = SendJsonRequest("HANDSHAKE", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  g_handshake_http_last = http_code;
  TraceRuntime("HANDSHAKE_RESPONSE", "code=" + IntegerToString(http_code) + ",body_len=" + IntegerToString(StringLen(response_body)));
  Print("[CARVIPIX] HANDSHAKE_RESPONSE code=" + IntegerToString(http_code) + " body_len=" + IntegerToString(StringLen(response_body)));
  
  if (http_code == 200 || http_code == 201) {
    TraceRuntime("HANDSHAKE_SUCCESS", "code=" + IntegerToString(http_code));
    Print("[CARVIPIX] HANDSHAKE_SUCCESS code=" + IntegerToString(http_code));
    Print("[CARVIPIX] Handshake exitoso.");
    g_connected = true;
    g_mode = "READY";
    g_handshake_fail_count = 0;
    g_next_handshake_retry_at = 0;
    g_handshake_error_last = "";
    g_handshake_error_signature_last = "";
    Print("[CARVIPIX] connected=true");
    return true;
  } else {
    string err = "HTTP_" + IntegerToString(http_code);
    if (http_code == -1) {
      err = "WEBREQUEST_" + IntegerToString(web_request_error) + ":" + ExplainWebRequestError(web_request_error);
    } else if (response_body != "") {
      err = response_body;
    }

    g_handshake_error_last = err;
    g_handshake_fail_count = MathMin(g_handshake_fail_count + 1, g_handshake_max_attempts);
    g_next_handshake_retry_at = TimeCurrent() + HandshakeRetryDelaySeconds(http_code, g_handshake_fail_count);
    string handshake_signature = IntegerToString(http_code) + "|" + err;
    if (handshake_signature != g_handshake_error_signature_last) {
      Print("[ERROR] Handshake fallido. HTTP " + IntegerToString(http_code) + " causa=" + err + " retry_in=" + IntegerToString(HandshakeRetryDelaySeconds(http_code, g_handshake_fail_count)) + "s");
      g_handshake_error_signature_last = handshake_signature;
    }
    g_connected = false;
    return false;
  }
}

bool PerformTransportPing() {
  if (g_transport_verified) {
    return true;
  }

  if (g_next_transport_retry_at > 0 && (g_next_transport_retry_at - TimeCurrent()) > 30) {
    ResetConnectivityRetryState("stale_transport_delay_guard", false);
  }

  if (TimeCurrent() < g_next_transport_retry_at) {
    Print("[CARVIPIX] TRANSPORT_PING_RETRY_DELAY until=" + TimeToString(g_next_transport_retry_at, TIME_DATE | TIME_SECONDS));
    return false;
  }

  string url = g_api_url + "/health";
  string request_headers = "User-Agent: CARVIPIX-EA/1.0\r\n";
  uchar response[];
  string result_headers;
  string response_body = "";
  string payload = "";
  int timeout = 5000;
  int web_request_error = 0;

  int ping_attempt = MathMin(g_transport_fail_count + 1, g_transport_max_attempts);
  TraceRuntime("PING_ATTEMPT", "build=" + EA_BUILD_ID + ",url=" + url + ",timeout=" + IntegerToString(timeout) + ",attempt=" + IntegerToString(ping_attempt));
  Print("[CARVIPIX] PING_ATTEMPT build=" + EA_BUILD_ID + " url=" + url + " timeout=" + IntegerToString(timeout) + " attempt=" + IntegerToString(ping_attempt));

  int http_code = SendJsonRequest("PING", "GET", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  g_transport_http_last = http_code;
  string response_headers_lc = result_headers;
  StringToLower(response_headers_lc);
  string response_body_lc = response_body;
  StringToLower(response_body_lc);
  bool looks_like_html = (StringLen(response_body_lc) > 0 && (StringFind(response_body_lc, "<!doctype html") >= 0 || StringFind(response_body_lc, "<html") >= 0 || StringGetCharacter(response_body_lc, 0) == '<'));
  bool is_html_response = (StringFind(response_headers_lc, "content-type: text/html") >= 0 || StringFind(response_headers_lc, "content-type:text/html") >= 0 || looks_like_html);
  string ping_body_log = response_body;
  if (http_code == 404) {
    g_transport_fail_count = MathMin(g_transport_fail_count + 1, g_transport_max_attempts);
    int not_found_retry_delay = TransportRetryDelaySeconds(g_transport_fail_count);
    g_next_transport_retry_at = TimeCurrent() + not_found_retry_delay;
    g_transport_error_last = "CONNECTIVITY_ENDPOINT_NOT_FOUND";
    string not_found_signature = IntegerToString(http_code) + "|" + IntegerToString(web_request_error) + "|" + g_transport_error_last;
    if (not_found_signature != g_transport_error_signature_last) {
      Print("[WARNING] PING falló. HTTP 404 detail=CONNECTIVITY_ENDPOINT_NOT_FOUND retry_in=" + IntegerToString(not_found_retry_delay) + "s");
      g_transport_error_signature_last = not_found_signature;
    }
    return false;
  }

  if (is_html_response) {
    ping_body_log = "UNEXPECTED_HTML_RESPONSE";
  } else if (StringLen(ping_body_log) > 240) {
    ping_body_log = StringSubstr(ping_body_log, 0, 240) + "...";
  }

  TraceRuntime("PING_RESPONSE", "code=" + IntegerToString(http_code) + ",last_error=" + IntegerToString(web_request_error) + ",body=" + EscapeJsonString(ping_body_log));
  Print("[CARVIPIX] PING_RESPONSE code=" + IntegerToString(http_code) + " last_error=" + IntegerToString(web_request_error) + " body=" + ping_body_log);

  if (is_html_response) {
    g_transport_fail_count = MathMin(g_transport_fail_count + 1, g_transport_max_attempts);
    int html_retry_delay = TransportRetryDelaySeconds(g_transport_fail_count);
    g_next_transport_retry_at = TimeCurrent() + html_retry_delay;
    g_transport_error_last = "UNEXPECTED_HTML_RESPONSE";
    string html_signature = IntegerToString(http_code) + "|" + IntegerToString(web_request_error) + "|" + g_transport_error_last;
    if (html_signature != g_transport_error_signature_last) {
      Print("[WARNING] PING falló. HTTP " + IntegerToString(http_code) + " last_error=" + IntegerToString(web_request_error) + " detail=UNEXPECTED_HTML_RESPONSE retry_in=" + IntegerToString(html_retry_delay) + "s");
      g_transport_error_signature_last = html_signature;
    }
    return false;
  }

  if (http_code == 200 && StringFind(response_body, "\"ok\":true") >= 0) {
    g_transport_verified = true;
    g_transport_fail_count = 0;
    g_next_transport_retry_at = 0;
    g_transport_error_last = "";
    g_transport_error_signature_last = "";
    TraceRuntime("PING_SUCCESS", "code=200,body_len=" + IntegerToString(StringLen(response_body)));
    Print("[CARVIPIX] PING_SUCCESS code=200");
    Print("[CARVIPIX] PING_HTTP_200");
    Print("[CARVIPIX] PING_LAST_ERROR_0");
    return true;
  }

  if (http_code == -1) {
    g_transport_error_last = "WEBREQUEST_" + IntegerToString(web_request_error) + ":" + ExplainWebRequestError(web_request_error);
  } else {
    g_transport_error_last = response_body;
    if (StringLen(g_transport_error_last) > 180) {
      g_transport_error_last = StringSubstr(g_transport_error_last, 0, 180) + "...";
    }
  }

  g_transport_fail_count = MathMin(g_transport_fail_count + 1, g_transport_max_attempts);
  int retry_delay = TransportRetryDelaySeconds(g_transport_fail_count);
  g_next_transport_retry_at = TimeCurrent() + retry_delay;
  string ping_signature = IntegerToString(http_code) + "|" + IntegerToString(web_request_error) + "|" + g_transport_error_last;
  if (ping_signature != g_transport_error_signature_last) {
    Print("[WARNING] PING falló. HTTP " + IntegerToString(http_code) + " last_error=" + IntegerToString(web_request_error) + " detail=" + g_transport_error_last + " retry_in=" + IntegerToString(retry_delay) + "s");
    g_transport_error_signature_last = ping_signature;
  }
  return false;
}

Signal GetPendingSignal() {
  Signal empty;
  empty.signal_id = "";
  
  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/signal/next";
  string payload = "{\"license_id\":\"" + EscapeJsonString(g_license_id) + "\",\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\",\"account_hash\":\"" + EscapeJsonString(g_account_hash) + "\",\"canonical_symbol\":\"ALL\",\"broker_symbol\":\"" + EscapeJsonString(g_chart_symbol) + "\"}";
  
  int timeout = 5000;
  int web_request_error = 0;
  int http_code = SendJsonRequest("SIGNAL_POLL", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  
  if (http_code != 200) {
    if (http_code == 400 || http_code == 401 || http_code == 403) {
      LogHttpForensics("SIGNAL_POLL", "POST", url, timeout, request_headers, payload, http_code, web_request_error, result_headers, response_body, "chart=" + g_chart_symbol);
    }
    Print("[WARNING] GET signals falló. HTTP " + IntegerToString(http_code));
    return empty;
  }
  
  // Parse JSON response
  // Para simplificar, asumir respuesta de estructura conocida
  string resp_str = response_body;
  
  if (resp_str == "" || StringFind(resp_str, "\"has_signal\":false") >= 0 || StringFind(resp_str, "signal_id") < 0) {
    return empty;
  }
  
  // Extraer fields (implementación simplificada, en producción usar JSON parser)
  Signal signal;
  signal.signal_id = ExtractJsonString(resp_str, "signal_id");
  signal.analysis_id = ExtractJsonString(resp_str, "analysis_id");
  signal.symbol = ExtractJsonString(resp_str, "symbol");
  signal.canonical_symbol = ExtractJsonString(resp_str, "canonical_symbol");
  signal.broker_symbol = ExtractJsonString(resp_str, "broker_symbol");
  if (signal.canonical_symbol == "") {
    signal.canonical_symbol = ResolveCanonicalSymbol(signal.symbol);
  }
  signal.decision = ExtractJsonString(resp_str, "decision");
  signal.entry = ExtractJsonDouble(resp_str, "entry");
  signal.stop_loss = ExtractJsonDouble(resp_str, "stop_loss");
  signal.take_profit = ExtractJsonDouble(resp_str, "take_profit");
  signal.risk_reward = ExtractJsonDouble(resp_str, "risk_reward");
  signal.expires_at = ExtractJsonString(resp_str, "expires_at");
  signal.signature = ExtractJsonString(resp_str, "signature");
  signal.signal_mode = ExtractJsonString(resp_str, "signal_mode");
  
  return signal;
}

void ProcessSignal(Signal &signal) {
  string signal_canonical_symbol = signal.canonical_symbol;
  if (signal_canonical_symbol == "") {
    signal_canonical_symbol = ResolveCanonicalSymbol(signal.symbol);
  }

  if (!IsAllowedCanonical(signal_canonical_symbol)) {
    Print("[WARNING] SIGNAL_SYMBOL_MISMATCH canonical=" + signal_canonical_symbol + " raw=" + signal.symbol);
    SendACK(signal.signal_id, "SIGNAL_SYMBOL_MISMATCH");
    return;
  }

  int canonical_index = CanonicalIndex(signal_canonical_symbol);
  string broker_symbol = "";
  if (canonical_index >= 0) {
    broker_symbol = g_resolved_broker_symbols[canonical_index];
  }

  if (broker_symbol == "") {
    string reason = "SYMBOL_UNAVAILABLE";
    if (canonical_index >= 0 && g_symbol_resolution_status[canonical_index] == "SYMBOL_AMBIGUOUS") {
      reason = "SYMBOL_AMBIGUOUS";
    }
    Print("[WARNING] " + reason + " canonical=" + signal_canonical_symbol + " detail=" + (canonical_index >= 0 ? g_symbol_resolution_detail[canonical_index] : "index_not_found"));
    SendACK(signal.signal_id, reason);
    return;
  }

  for (int i = 0; i < ArraySize(g_allowed_canonicals); i++) {
    if (g_allowed_canonicals[i] != signal_canonical_symbol) {
      Print("[CARVIPIX] WAITING_FOR_MATCHING_SIGNAL canonical=" + g_allowed_canonicals[i]);
    }
  }

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
  string processed_key = BuildProcessedSignalKey(signal.signal_id, signal_canonical_symbol, broker_symbol);
  if (IsProcessed(processed_key) || PositionExistsForSignalTag(signal.signal_id, signal_canonical_symbol)) {
    Print("[WARNING] Señal duplicada: " + signal.signal_id);
    SendACK(signal.signal_id, "DUPLICATE");
    return;
  }

  signal.canonical_symbol = signal_canonical_symbol;
  signal.broker_symbol = broker_symbol;
  signal.symbol = broker_symbol;

  // Validar símbolo disponible
  if (!SymbolSelect(signal.symbol, true)) {
    Print("[ERROR] SYMBOL_UNAVAILABLE canonical=" + signal_canonical_symbol + " broker=" + signal.symbol);
    SendACK(signal.signal_id, "SYMBOL_UNAVAILABLE");
    return;
  }

  string market_reason = "";
  if (!ValidateSymbolTradingConditions(signal.symbol, market_reason)) {
    Print("[WARNING] " + market_reason + " canonical=" + signal_canonical_symbol + " broker=" + signal.symbol);
    SendACK(signal.signal_id, market_reason);
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
  
  ENUM_ORDER_TYPE order_type = (signal.decision == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  double lot_size = CalculateLotSize(signal);
  
  if (lot_size <= 0) {
    Print("[ERROR] Cálculo de lote inválido");
    SendACK(signal.signal_id, "INVALID_LOT_SIZE");
    return;
  }

  if (DRY_RUN_NO_ORDERS) {
    MqlTradeResult dry = {};
    dry.order = 0;
    dry.volume = lot_size;
    dry.price = SymbolInfoDouble(signal.symbol, signal.decision == "BUY" ? SYMBOL_ASK : SYMBOL_BID);
    AddProcessed(BuildProcessedSignalKey(signal.signal_id, signal.canonical_symbol, signal.symbol));
    g_last_signal_id = signal.signal_id;
    SendACK(signal.signal_id, "DRY_RUN_EXECUTED");
    Print("[CARVIPIX] DRY_RUN_EXECUTED signal=" + signal.signal_id + " canonical=" + signal.canonical_symbol + " broker=" + signal.symbol + " lot=" + DoubleToString(lot_size, 2));
    ReportExecution(signal, dry, "DRY_RUN_EXECUTED");
    return;
  }
  
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
  request.comment = BuildTradeComment(signal.signal_id, signal.canonical_symbol);
  
  // Enviar orden
  MqlTradeResult result = {};
  int retries = 0;
  bool success = false;
  
  while (retries < 3 && !success) {
    bool sent = OrderSend(request, result);
    bool broker_accepted = result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_DONE_PARTIAL;
    if (!sent || !broker_accepted) {
      Print("[ERROR] OrderSend falló. Intento " + IntegerToString(retries + 1) + " retcode=" + IntegerToString((int)result.retcode));
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
  AddProcessed(BuildProcessedSignalKey(signal.signal_id, signal.canonical_symbol, signal.symbol));
  g_last_signal_id = signal.signal_id;
  g_daily_trades_count++;
  
  SendACK(signal.signal_id, "EXECUTED");
  Print("[SUCCESS] Orden ejecutada. Ticket: " + IntegerToString(result.order));
  
  // Reportar ejecución
  ReportExecution(signal, result, "EXECUTED");
}

bool ValidateLicense() {
  string payload = "{\"license_id\":\"" + EscapeJsonString(g_license_id) + "\",\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\",\"canonical_symbol\":\"MULTI\"}";
  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";

  string url = g_api_url + "/validate-license";
  
  int timeout = 5000;
  int web_request_error = 0;
  int http_code = SendJsonRequest("VALIDATE_LICENSE", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);

  if (http_code == -1) {
    LogWebRequestError("VALIDATE_LICENSE", url, http_code, result_headers);
    if (!g_webrequest_warning_printed) {
      Print("[WARNING] WebRequest no disponible. Habilita Tools > Options > Expert Advisors > Allow WebRequest y agrega " + g_api_url);
      g_webrequest_warning_printed = true;
    }
    g_mode = "CONNECTIVITY_WARNING";
    return true;
  }
  
  if (http_code != 200) {
    // Errores transitorios de red/servidor no deben tumbar la sesión ni bloquear el EA.
    return true;
  }
  
  string resp_str = response_body;
  if (StringFind(resp_str, "\"valid\":true") >= 0) {
    g_webrequest_warning_printed = false;
    return true;
  }
  
  return false;
}

bool ValidateSignature(Signal &signal) {
  return StringFind(signal.signature, "SHA256:") == 0 && StringLen(signal.signature) == 71;
}

bool ValidateRisk(Signal &signal) {
  double risk_points = MathAbs(signal.entry - signal.stop_loss);
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
    double risk_points = MathAbs(signal.entry - signal.stop_loss);
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
  string payload = "{\"signal_id\":\"" + EscapeJsonString(signal_id) + "\",\"status\":\"" + EscapeJsonString(status) + "\",\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\"}";
  
  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/ack";
  int timeout = 3000;
  
  int web_request_error = 0;
  int http_code = SendJsonRequest("ACK", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  if (http_code != 200 && http_code != 201 && http_code != 204) {
    LogHttpForensics("ACK", "POST", url, timeout, request_headers, payload, http_code, web_request_error, result_headers, response_body, "signal_id=" + signal_id + ",status=" + status);
  }
}

void SendHeartbeat() {
  TraceRuntime("HEARTBEAT_ATTEMPT", "build=" + EA_BUILD_ID + ",mode=" + g_mode + ",installation_id=" + g_installation_id);
  Print("[CARVIPIX] HEARTBEAT_ATTEMPT build=" + EA_BUILD_ID + " mode=" + g_mode + " installation_id=" + g_installation_id);
  int open_trades = CountOpenTrades();
  double equity = AccountInfoDouble(ACCOUNT_EQUITY);
  double balance = AccountInfoDouble(ACCOUNT_BALANCE);
  
  string payload = "{\"installation_id\":\"" + g_installation_id + "\",\"license_id\":\"" + g_license_id + "\",\"account_hash\":\"" + g_account_hash + "\",\"ea_version\":\"" + EA_VERSION + "\",\"status\":\"" + g_mode + "\",\"open_positions\":" + IntegerToString(open_trades) + ",\"equity\":" + DoubleToString(equity, 2) + ",\"balance\":" + DoubleToString(balance, 2) + ",\"broker_server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",\"broker_symbol\":\"" + g_chart_symbol + "\",\"canonical_symbol\":\"MULTI\"}";
  
  payload = "{\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\",\"license_id\":\"" + EscapeJsonString(g_license_id) + "\",\"account_hash\":\"" + EscapeJsonString(g_account_hash) + "\",\"ea_version\":\"" + EscapeJsonString(EA_VERSION) + "\",\"status\":\"" + EscapeJsonString(g_mode) + "\",\"open_positions\":" + IntegerToString(open_trades) + ",\"equity\":" + DoubleToString(equity, 2) + ",\"balance\":" + DoubleToString(balance, 2) + ",\"broker_server\":\"" + EscapeJsonString(AccountInfoString(ACCOUNT_SERVER)) + "\",\"broker_symbol\":\"" + EscapeJsonString(g_chart_symbol) + "\",\"canonical_symbol\":\"MULTI\"}";

  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/heartbeat";
  int timeout = 3000;
  
  int web_request_error = 0;
  int http_code = SendJsonRequest("HEARTBEAT", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  TraceRuntime("HEARTBEAT_RESPONSE", "code=" + IntegerToString(http_code) + ",body_len=" + IntegerToString(StringLen(response_body)));
  Print("[CARVIPIX] HEARTBEAT_RESPONSE code=" + IntegerToString(http_code) + " body_len=" + IntegerToString(StringLen(response_body)));
  if (http_code == 200 || http_code == 201 || http_code == 204) {
    TraceRuntime("HEARTBEAT_SUCCESS", "code=" + IntegerToString(http_code));
    Print("[CARVIPIX] HEARTBEAT_SUCCESS");
  } else if (http_code != -1) {
    LogHttpForensics("HEARTBEAT", "POST", url, timeout, request_headers, payload, http_code, web_request_error, result_headers, response_body, "chart=" + g_chart_symbol);
  }
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
  
  string payload = "{\"signal_id\":\"" + signal.signal_id + "\",\"installation_id\":\"" + g_installation_id + "\",\"license_id\":\"" + g_license_id + "\",\"symbol\":\"" + signal.symbol + "\",\"direction\":\"" + signal.decision + "\",\"requested_entry\":" + DoubleToString(signal.entry, 5) + ",\"executed_entry\":" + DoubleToString(result.price, 5) + ",\"stop_loss\":" + DoubleToString(signal.stop_loss, 5) + ",\"take_profit\":" + DoubleToString(signal.take_profit, 5) + ",\"lot_size\":" + DoubleToString(result.volume, 2) + ",\"magic_number\":" + IntegerToString(g_magic_number) + ",\"broker_order_id\":" + IntegerToString(result.order) + ",\"status\":\"" + status + "\",\"pnl\":" + DoubleToString(pnl, 2) + "}";
  
  payload = "{\"signal_id\":\"" + EscapeJsonString(signal.signal_id) + "\",\"installation_id\":\"" + EscapeJsonString(g_installation_id) + "\",\"license_id\":\"" + EscapeJsonString(g_license_id) + "\",\"symbol\":\"" + EscapeJsonString(signal.symbol) + "\",\"direction\":\"" + EscapeJsonString(signal.decision) + "\",\"requested_entry\":" + DoubleToString(signal.entry, 5) + ",\"executed_entry\":" + DoubleToString(result.price, 5) + ",\"stop_loss\":" + DoubleToString(signal.stop_loss, 5) + ",\"take_profit\":" + DoubleToString(signal.take_profit, 5) + ",\"lot_size\":" + DoubleToString(result.volume, 2) + ",\"magic_number\":" + IntegerToString(g_magic_number) + ",\"broker_order_id\":" + IntegerToString(result.order) + ",\"status\":\"" + EscapeJsonString(status) + "\",\"pnl\":" + DoubleToString(pnl, 2) + "}";

  uchar response[];
  string result_headers;
  string response_body = "";
  string request_headers = "Content-Type: application/json\r\nAuthorization: Bearer " + g_license_id + "\r\nUser-Agent: CARVIPIX-EA/1.0\r\n";
  
  string url = g_api_url + "/executions";
  int timeout = 5000;
  
  int web_request_error = 0;
  int http_code = SendJsonRequest("REPORT_EXECUTION", "POST", url, request_headers, payload, timeout, response, result_headers, response_body, web_request_error);
  if (http_code != 200 && http_code != 201 && http_code != 204) {
    LogHttpForensics("REPORT_EXECUTION", "POST", url, timeout, request_headers, payload, http_code, web_request_error, result_headers, response_body, "signal_id=" + signal.signal_id + ",status=" + status);
  }
}

//+------------------------------------------------------------------+
// FUNCIONES AUXILIARES
//+------------------------------------------------------------------+

string GenerateInstallationID() {
  uint hash = 2166136261;
  string seed = g_license_id + "|" + AccountInfoString(ACCOUNT_SERVER) + "|" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "|MULTI";
  for (int i = 0; i < StringLen(seed); i++) {
    hash = hash ^ (uint)StringSubstr(seed, i, 1)[0];
    hash = hash * 16777619;
  }

  return "INST-" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "-MULTI-" + IntegerToString((int)(hash % 1000000));
}

string GenerateAccountHash() {
  // Hash simple de número de cuenta
  uint hash = 5381;
  ulong acc_num = AccountInfoInteger(ACCOUNT_LOGIN);
  
  while (acc_num > 0) {
    hash = ((hash << 5) + hash) + (uint)(acc_num % 10);
    acc_num /= 10;
  }
  
  return "ACC-" + IntegerToString(hash);
}

int GenerateMagicNumber(string license, string installation) {
  uint magic = 5381;
  string seed = license + "|" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "|MULTI";
  
  for (int i = 0; i < StringLen(seed); i++) {
    magic = ((magic << 5) + magic) + (uint)StringSubstr(seed, i, 1)[0];
  }
  
  return (int)(magic % 2000000000);
}

void AddProcessed(string signal_key) {
  if (signal_key == "" || IsProcessed(signal_key)) {
    return;
  }

  if (g_processed_count < 100) {
    g_processed_signals[g_processed_count] = signal_key;
    g_processed_count++;
    SaveProcessedSignals();
  }
}

bool IsProcessed(string signal_key) {
  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] == signal_key) {
      return true;
    }
  }
  return false;
}

bool AcquireCoordinatorLock() {
  if (g_coordinator_key == "") {
    return false;
  }

  double owner = (double)ChartID();
  if (!GlobalVariableCheck(g_coordinator_key)) {
    GlobalVariableSet(g_coordinator_key, owner);
    return true;
  }

  double current = GlobalVariableGet(g_coordinator_key);
  if (MathAbs(current - owner) < 0.0001) {
    return true;
  }

  return false;
}

void ReleaseCoordinatorLock() {
  if (!g_has_coordinator_lock || g_coordinator_key == "") {
    return;
  }

  if (!GlobalVariableCheck(g_coordinator_key)) {
    return;
  }

  double owner = (double)ChartID();
  double current = GlobalVariableGet(g_coordinator_key);
  if (MathAbs(current - owner) < 0.0001) {
    GlobalVariableDel(g_coordinator_key);
  }
}

string NormalizeSymbolToken(string raw_symbol) {
  string candidate = raw_symbol;
  StringToUpper(candidate);

  string normalized = "";
  for (int i = 0; i < StringLen(candidate); i++) {
    ushort ch = (ushort)StringGetCharacter(candidate, i);
    if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
      normalized += CharToString((uchar)ch);
    }
  }

  return normalized;
}

bool IsAllowedCanonical(string canonical_symbol) {
  return CanonicalIndex(canonical_symbol) >= 0;
}

int CanonicalIndex(string canonical_symbol) {
  for (int i = 0; i < ArraySize(g_allowed_canonicals); i++) {
    if (g_allowed_canonicals[i] == canonical_symbol) {
      return i;
    }
  }
  return -1;
}

string ResolveCanonicalSymbol(string raw_symbol) {
  string normalized = NormalizeSymbolToken(raw_symbol);

  if (StringFind(normalized, "XAUUSD") >= 0) return "XAUUSD";
  if (StringFind(normalized, "GOLD") >= 0) return "XAUUSD";
  if (StringFind(normalized, "BTCUSD") >= 0) return "BTCUSD";
  if (StringFind(normalized, "XBTUSD") >= 0) return "BTCUSD";
  if (StringFind(normalized, "BITCOIN") >= 0) return "BTCUSD";
  if (StringFind(normalized, "EURUSD") >= 0) return "EURUSD";
  if (StringFind(normalized, "GBPUSD") >= 0) return "GBPUSD";

  return "";
}

int ScoreSymbolCandidate(string canonical_symbol, string symbol_name, string symbol_description) {
  string normalized_name = NormalizeSymbolToken(symbol_name);
  string normalized_description = NormalizeSymbolToken(symbol_description);
  string canonical = canonical_symbol;
  StringToUpper(canonical);

  int score = 0;
  if (normalized_name == canonical) {
    score += 1000;
  }

  if (canonical == "XAUUSD") {
    if (StringFind(normalized_name, "XAUUSD") >= 0) score += 900;
    if (StringFind(normalized_name, "GOLD") >= 0) score += 850;
    if (StringFind(normalized_description, "GOLD") >= 0) score += 300;
  } else if (canonical == "BTCUSD") {
    if (StringFind(normalized_name, "BTCUSD") >= 0) score += 900;
    if (StringFind(normalized_name, "XBTUSD") >= 0) score += 850;
    if (StringFind(normalized_name, "BITCOIN") >= 0) score += 850;
    if (StringFind(normalized_description, "BITCOIN") >= 0 || StringFind(normalized_description, "BTC") >= 0) score += 300;
  } else {
    if (StringFind(normalized_name, canonical) >= 0) score += 900;
  }

  string base = SymbolInfoString(symbol_name, SYMBOL_CURRENCY_BASE);
  string quote = SymbolInfoString(symbol_name, SYMBOL_CURRENCY_PROFIT);
  string pair = NormalizeSymbolToken(base + quote);
  if (pair == canonical) {
    score += 500;
  }

  long trade_mode = SymbolInfoInteger(symbol_name, SYMBOL_TRADE_MODE);
  if (trade_mode == SYMBOL_TRADE_MODE_DISABLED) {
    score -= 500;
  }

  if (StringFind(normalized_name, "FUT") >= 0 || StringFind(normalized_name, "INDEX") >= 0) {
    score -= 200;
  }

  return score;
}

bool ResolveBrokerSymbol(string canonical_symbol, string &resolved_symbol, string &resolution_status, string &resolution_detail) {
  int total = SymbolsTotal(false);
  int best_score = -999999;
  int second_score = -999999;
  string best_symbol = "";
  string second_symbol = "";

  for (int i = 0; i < total; i++) {
    string candidate = SymbolName(i, false);
    if (candidate == "") {
      continue;
    }

    string desc = SymbolInfoString(candidate, SYMBOL_DESCRIPTION);
    int score = ScoreSymbolCandidate(canonical_symbol, candidate, desc);
    if (score > best_score) {
      second_score = best_score;
      second_symbol = best_symbol;
      best_score = score;
      best_symbol = candidate;
    } else if (score > second_score) {
      second_score = score;
      second_symbol = candidate;
    }
  }

  if (best_symbol == "" || best_score < 600) {
    resolved_symbol = "";
    resolution_status = "SYMBOL_UNAVAILABLE";
    resolution_detail = "no_candidate_score>=600";
    return false;
  }

  if (second_symbol != "" && second_score == best_score) {
    resolved_symbol = "";
    resolution_status = "SYMBOL_AMBIGUOUS";
    resolution_detail = best_symbol + "," + second_symbol;
    return false;
  }

  if (!SymbolSelect(best_symbol, true)) {
    resolved_symbol = "";
    resolution_status = "SYMBOL_UNAVAILABLE";
    resolution_detail = best_symbol + "|symbol_select_failed";
    return false;
  }

  double bid = SymbolInfoDouble(best_symbol, SYMBOL_BID);
  double ask = SymbolInfoDouble(best_symbol, SYMBOL_ASK);
  if (bid <= 0.0 || ask <= 0.0) {
    resolution_status = "SYMBOL_UNAVAILABLE";
    resolution_detail = best_symbol + "|no_valid_prices";
    resolved_symbol = "";
    return false;
  }

  resolved_symbol = best_symbol;
  resolution_status = "SYMBOL_RESOLVED";
  resolution_detail = "score=" + IntegerToString(best_score);
  return true;
}

bool InitBrokerSymbolCatalog() {
  bool any_resolved = false;
  for (int i = 0; i < ArraySize(g_allowed_canonicals); i++) {
    string canonical = g_allowed_canonicals[i];
    string resolved = "";
    string status = "";
    string detail = "";
    bool ok = ResolveBrokerSymbol(canonical, resolved, status, detail);

    g_resolved_broker_symbols[i] = resolved;
    g_symbol_resolution_status[i] = status;
    g_symbol_resolution_detail[i] = detail;

    if (ok) {
      any_resolved = true;
      Print("[CARVIPIX] SYMBOL_RESOLVED canonical=" + canonical + " broker=" + resolved);
    } else {
      Print("[CARVIPIX] " + status + " canonical=" + canonical + " detail=" + detail);
    }
  }

  return any_resolved;
}

bool ValidateSymbolTradingConditions(string broker_symbol, string &reason) {
  reason = "";
  if (!SymbolSelect(broker_symbol, true)) {
    reason = "SYMBOL_UNAVAILABLE";
    return false;
  }

  long trade_mode = SymbolInfoInteger(broker_symbol, SYMBOL_TRADE_MODE);
  if (trade_mode == SYMBOL_TRADE_MODE_DISABLED) {
    reason = "MARKET_CLOSED";
    return false;
  }

  double bid = SymbolInfoDouble(broker_symbol, SYMBOL_BID);
  double ask = SymbolInfoDouble(broker_symbol, SYMBOL_ASK);
  if (bid <= 0.0 || ask <= 0.0 || ask <= bid) {
    reason = "MARKET_CLOSED";
    return false;
  }

  double spread = ask - bid;
  if (spread <= 0.0) {
    reason = "MARKET_CLOSED";
    return false;
  }

  double vmin = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_MIN);
  double vmax = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_MAX);
  double vstep = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_STEP);
  if (vmin <= 0.0 || vmax <= 0.0 || vstep <= 0.0) {
    reason = "SYMBOL_UNAVAILABLE";
    return false;
  }

  reason = "SYMBOL_RESOLVED";
  return true;
}

bool PositionExistsForSignalTag(string signal_id, string canonical_symbol) {
  string tag = BuildTradeComment(signal_id, canonical_symbol);
  int total = PositionsTotal();
  for (int i = 0; i < total; i++) {
    ulong ticket = PositionGetTicket(i);
    if (ticket <= 0) {
      continue;
    }

    string comment = PositionGetString(POSITION_COMMENT);
    long magic = PositionGetInteger(POSITION_MAGIC);
    if (magic == g_magic_number && StringFind(comment, tag) == 0) {
      return true;
    }
  }
  return false;
}

string BuildTradeComment(string signal_id, string canonical_symbol) {
  int sid_len = StringLen(signal_id);
  string tail = signal_id;
  if (sid_len > 6) {
    tail = StringSubstr(signal_id, sid_len - 6, 6);
  }
  return "CVPX|" + canonical_symbol + "|SIG-" + tail;
}

string BuildProcessedSignalKey(string signal_id, string canonical_symbol, string broker_symbol) {
  return signal_id + "|" + g_license_id + "|" + g_installation_id + "|" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "|" + canonical_symbol + "|" + broker_symbol + "|" + IntegerToString(g_magic_number);
}

void LogSymbolProperties(string canonical, string broker_symbol) {
  bool selected = SymbolSelect(broker_symbol, true);
  double bid = SymbolInfoDouble(broker_symbol, SYMBOL_BID);
  double ask = SymbolInfoDouble(broker_symbol, SYMBOL_ASK);
  int digits = (int)SymbolInfoInteger(broker_symbol, SYMBOL_DIGITS);
  double point = SymbolInfoDouble(broker_symbol, SYMBOL_POINT);
  double tick_size = SymbolInfoDouble(broker_symbol, SYMBOL_TRADE_TICK_SIZE);
  double tick_value = SymbolInfoDouble(broker_symbol, SYMBOL_TRADE_TICK_VALUE);
  double contract_size = SymbolInfoDouble(broker_symbol, SYMBOL_TRADE_CONTRACT_SIZE);
  double vol_min = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_MIN);
  double vol_max = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_MAX);
  double vol_step = SymbolInfoDouble(broker_symbol, SYMBOL_VOLUME_STEP);
  long stops = SymbolInfoInteger(broker_symbol, SYMBOL_TRADE_STOPS_LEVEL);
  long freeze = SymbolInfoInteger(broker_symbol, SYMBOL_TRADE_FREEZE_LEVEL);
  long filling = SymbolInfoInteger(broker_symbol, SYMBOL_FILLING_MODE);
  long trade_mode = SymbolInfoInteger(broker_symbol, SYMBOL_TRADE_MODE);
  MqlTick tick = {};
  bool has_tick = SymbolInfoTick(broker_symbol, tick);

  Print("[CARVIPIX] SYMBOL_PROPS canonical=" + canonical
    + " broker=" + broker_symbol
    + " symbol_select=" + (selected ? "true" : "false")
    + " bid=" + DoubleToString(bid, digits)
    + " ask=" + DoubleToString(ask, digits)
    + " tick_recent=" + (has_tick ? "true" : "false")
    + " tick_time=" + IntegerToString((int)tick.time)
    + " digits=" + IntegerToString(digits)
    + " point=" + DoubleToString(point, 8)
    + " tick_size=" + DoubleToString(tick_size, 8)
    + " tick_value=" + DoubleToString(tick_value, 8)
    + " contract_size=" + DoubleToString(contract_size, 2)
    + " volume_min=" + DoubleToString(vol_min, 4)
    + " volume_max=" + DoubleToString(vol_max, 4)
    + " volume_step=" + DoubleToString(vol_step, 4)
    + " stops_level=" + IntegerToString((int)stops)
    + " freeze_level=" + IntegerToString((int)freeze)
    + " filling_mode=" + IntegerToString((int)filling)
    + " trading_mode=" + IntegerToString((int)trade_mode));
}

void RunRiskSimulationDiagnostics() {
  Print("[CARVIPIX] RISK_SIMULATION_START");
  for (int i = 0; i < ArraySize(g_allowed_canonicals); i++) {
    string canonical = g_allowed_canonicals[i];
    string broker = g_resolved_broker_symbols[i];
    if (broker == "") {
      Print("[CARVIPIX] RISK_SIMULATION_SKIP canonical=" + canonical + " reason=SYMBOL_UNAVAILABLE");
      continue;
    }

    double bid = SymbolInfoDouble(broker, SYMBOL_BID);
    double ask = SymbolInfoDouble(broker, SYMBOL_ASK);
    int digits = (int)SymbolInfoInteger(broker, SYMBOL_DIGITS);
    double point = SymbolInfoDouble(broker, SYMBOL_POINT);
    long stops = SymbolInfoInteger(broker, SYMBOL_TRADE_STOPS_LEVEL);
    double stop_distance_points = (double)MathMax((int)stops + 100, 200);
    double entry = ask > 0 ? ask : bid;
    double sl = entry - (stop_distance_points * point);
    double tp = entry + (stop_distance_points * point * 2.0);

    Signal s;
    s.signal_id = "RISK-DIAG-" + canonical;
    s.symbol = broker;
    s.canonical_symbol = canonical;
    s.decision = "BUY";
    s.entry = entry;
    s.stop_loss = sl;
    s.take_profit = tp;

    double lot = CalculateLotSize(s);
    double tick_value = SymbolInfoDouble(broker, SYMBOL_TRADE_TICK_VALUE);
    double contract_size = SymbolInfoDouble(broker, SYMBOL_TRADE_CONTRACT_SIZE);
    double vmin = SymbolInfoDouble(broker, SYMBOL_VOLUME_MIN);
    double vmax = SymbolInfoDouble(broker, SYMBOL_VOLUME_MAX);
    double vstep = SymbolInfoDouble(broker, SYMBOL_VOLUME_STEP);
    double margin_required = 0.0;
    bool margin_ok = OrderCalcMargin(ORDER_TYPE_BUY, broker, MathMax(lot, vmin), entry, margin_required);

    Print("[CARVIPIX] RISK_SIMULATION canonical=" + canonical
      + " broker=" + broker
      + " lot_normalized=" + DoubleToString(lot, 4)
      + " volume_min=" + DoubleToString(vmin, 4)
      + " volume_max=" + DoubleToString(vmax, 4)
      + " volume_step=" + DoubleToString(vstep, 4)
      + " tick_value=" + DoubleToString(tick_value, 8)
      + " contract_size=" + DoubleToString(contract_size, 2)
      + " sl_distance_points=" + DoubleToString(stop_distance_points, 1)
      + " stops_level=" + IntegerToString((int)stops)
      + " margin_required=" + DoubleToString(margin_required, 2)
      + " margin_calc_ok=" + (margin_ok ? "true" : "false")
      + " max_risk_percent=" + DoubleToString(MAX_RISK_PERCENT, 2));
  }
  Print("[CARVIPIX] RISK_SIMULATION_END");
}

void RunRoutingDiagnostics() {
  Print("[CARVIPIX] ROUTING_DIAGNOSTICS_START");

  for (int i = 0; i < ArraySize(g_allowed_canonicals); i++) {
    string canonical = g_allowed_canonicals[i];
    string broker = g_resolved_broker_symbols[i];
    if (broker == "") {
      Print("[CARVIPIX] ROUTING_TEST canonical=" + canonical + " status=SYMBOL_UNAVAILABLE");
      continue;
    }

    Print("[CARVIPIX] ROUTING_TEST canonical=" + canonical + " route_broker=" + broker + " status=ROUTE_OK");
    for (int j = 0; j < ArraySize(g_allowed_canonicals); j++) {
      if (j == i) {
        continue;
      }
      Print("[CARVIPIX] WAITING_FOR_MATCHING_SIGNAL canonical=" + g_allowed_canonicals[j] + " source_signal=" + canonical);
    }

    string market_reason = "";
    bool target_ok = ValidateSymbolTradingConditions(broker, market_reason);
    Print("[CARVIPIX] MARKET_INDEPENDENCE target=" + canonical + " broker=" + broker + " target_ok=" + (target_ok ? "true" : "false") + " reason=" + market_reason + " non_target_blocked=false");
  }

  string xau_broker = g_resolved_broker_symbols[CanonicalIndex("XAUUSD")];
  if (xau_broker != "") {
    string key = BuildProcessedSignalKey("SIM-DUP-001", "XAUUSD", xau_broker);
    bool before = IsProcessed(key);
    if (!before) {
      AddProcessed(key);
    }
    bool after = IsProcessed(key);
    SaveProcessedSignals();
    g_processed_count = 0;
    LoadProcessedSignals();
    bool after_reload = IsProcessed(key);
    Print("[CARVIPIX] DUPLICATE_TEST signal_id=SIM-DUP-001 first_accept=" + (before ? "false" : "true") + " second_reject=" + (after ? "true" : "false") + " after_restart_reject=" + (after_reload ? "true" : "false") + " key=" + key);
  } else {
    Print("[CARVIPIX] DUPLICATE_TEST signal_id=SIM-DUP-001 status=SKIPPED reason=XAUUSD_UNRESOLVED");
  }

  Print("[CARVIPIX] ROUTING_DIAGNOSTICS_END");
}

void RunMultipairSelfTest() {
  Print("[CARVIPIX] MULTIPAIR_SELFTEST_START");

  string cases[10] = {"XAUUSD", "xauusd", "XAUUSD.x", "EURUSD.l.v", "BTCUSDm", "m.GBPUSD", "GOLD", "NOEXIST", "m.BTCUSD.r", "gbpusd"};
  for (int i = 0; i < 10; i++) {
    string canonical = ResolveCanonicalSymbol(cases[i]);
    Print("[CARVIPIX] SELFTEST_CASE raw=" + cases[i] + " canonical=" + canonical);
  }

  int amb_score_a = ScoreSymbolCandidate("XAUUSD", "XAUUSD.a", "");
  int amb_score_b = ScoreSymbolCandidate("XAUUSD", "XAUUSD.b", "");
  if (amb_score_a == amb_score_b) {
    Print("[CARVIPIX] SELFTEST_CASE raw=AMBIGUOUS_SYNTHETIC status=SYMBOL_AMBIGUOUS detail=XAUUSD.a_vs_XAUUSD.b");
  }

  string no_symbol = "";
  string no_status = "";
  string no_detail = "";
  bool no_ok = ResolveBrokerSymbol("NOEXIST", no_symbol, no_status, no_detail);
  Print("[CARVIPIX] SELFTEST_CASE raw=NOEXIST status=" + no_status + " resolved=" + (no_ok ? "true" : "false") + " detail=" + no_detail);

  for (int j = 0; j < ArraySize(g_allowed_canonicals); j++) {
    Print("[CARVIPIX] SELFTEST_MAP canonical=" + g_allowed_canonicals[j] + " broker=" + g_resolved_broker_symbols[j] + " status=" + g_symbol_resolution_status[j] + " detail=" + g_symbol_resolution_detail[j]);
    if (g_resolved_broker_symbols[j] != "") {
      LogSymbolProperties(g_allowed_canonicals[j], g_resolved_broker_symbols[j]);
    }
  }

  RunRiskSimulationDiagnostics();
  RunRoutingDiagnostics();

  Print("[CARVIPIX] SELFTEST_SYNTHETIC exact=XAUUSD suffix=.x suffix=.l.v suffix=m prefix=m. alias=GOLD case=lower_upper missing=NOEXIST ambiguous=synthetic_tie");
  Print("[CARVIPIX] MULTIPAIR_SELFTEST_END");
}

void LoadProcessedSignals() {
  g_processed_count = 0;
  int handle = FileOpen(g_processed_file_name, FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE);
  if (handle == INVALID_HANDLE) {
    return;
  }

  while (!FileIsEnding(handle) && g_processed_count < 100) {
    string line = FileReadString(handle);
    StringTrimLeft(line);
    StringTrimRight(line);
    if (line != "" && !IsProcessed(line)) {
      g_processed_signals[g_processed_count] = line;
      g_processed_count++;
    }
  }
  FileClose(handle);
  Print("[CARVIPIX] DEDUP_LOAD count=" + IntegerToString(g_processed_count) + " file=" + g_processed_file_name);
}

void SaveProcessedSignals() {
  int handle = FileOpen(g_processed_file_name, FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ);
  if (handle == INVALID_HANDLE) {
    return;
  }

  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] != "") {
      FileWrite(handle, g_processed_signals[i]);
    }
  }
  FileClose(handle);
}

string ExplainWebRequestError(int error_code) {
  if (error_code == 4014) return "Function not allowed or WebRequest URL not allowed in MT5 options";
  if (error_code == 4016) return "No connection to trade server / terminal offline context";
  if (error_code == 4029) return "Invalid URL format or unsupported protocol";
  if (error_code == 5202) return "HTTP timeout waiting for response";
  if (error_code == 5203) return "No route/connection to host (DNS, firewall, proxy, network)";
  if (error_code == 5204) return "SSL/TLS handshake or certificate validation failure";
  if (error_code == 5205) return "HTTP request failed at transport layer";
  return "Unknown MT5 network error; review Experts and Journal logs";
}

string EscapeJsonString(string value) {
  string s = value;
  StringReplace(s, "\\", "\\\\");
  StringReplace(s, "\"", "\\\"");
  StringReplace(s, "\r", "\\r");
  StringReplace(s, "\n", "\\n");
  StringReplace(s, "\t", "\\t");
  return s;
}

string MaskLicense(string license) {
  int len = StringLen(license);
  if (len <= 8) {
    return "****";
  }

  return StringSubstr(license, 0, 4) + "..." + StringSubstr(license, len - 4, 4);
}

string Int64ToString(long value) {
  return StringFormat("%I64d", value);
}

int HandshakeRetryDelaySeconds(int http_code, int failures) {
  int f = MathMax(failures, 1);
  if (f <= 1) {
    return 15;
  }
  if (f == 2) {
    return 30;
  }
  return 60;
}

int TransportRetryDelaySeconds(int failures) {
  int f = MathMax(failures, 1);
  if (f <= 1) {
    return 15;
  }
  if (f == 2) {
    return 30;
  }
  return 60;
}

void ResetConnectivityRetryState(string reason, bool clear_mode_warning) {
  g_transport_verified = false;
  g_transport_fail_count = 0;
  g_transport_http_last = 0;
  g_transport_error_last = "";
  g_transport_error_signature_last = "";
  g_next_transport_retry_at = 0;

  g_handshake_fail_count = 0;
  g_handshake_http_last = 0;
  g_handshake_error_last = "";
  g_handshake_error_signature_last = "";
  g_next_handshake_retry_at = 0;

  if (clear_mode_warning && g_mode == "CONNECTIVITY_WARNING") {
    g_mode = "VALIDATING";
  }

  TraceRuntime("RETRY_STATE_RESET", "reason=" + reason + ",mode=" + g_mode);
  Print("[CARVIPIX] RETRY_STATE_RESET reason=" + reason + " mode=" + g_mode);
}

string UcharArrayToString(uchar &array[]) {
  string result = "";
  for (int i = 0; i < ArraySize(array) && array[i] != 0; i++) {
    result += CharToString((uchar)array[i]);
  }
  return result;
}

void LogHttpForensics(string operation, string method, string url, int timeout, string request_headers, string payload, int http_code, int web_request_error, string response_headers, string response_body, string context) {
  string masked_payload = payload;
  if (g_license_id != "") {
    StringReplace(masked_payload, g_license_id, MaskLicense(g_license_id));
  }

  string masked_headers = request_headers;
  if (g_license_id != "") {
    StringReplace(masked_headers, g_license_id, MaskLicense(g_license_id));
  }

  string safe_response_body = response_body;
  string response_headers_lc = response_headers;
  StringToLower(response_headers_lc);
  string response_body_lc = response_body;
  StringToLower(response_body_lc);
  bool looks_like_html = (StringLen(response_body_lc) > 0 && (StringFind(response_body_lc, "<!doctype html") >= 0 || StringFind(response_body_lc, "<html") >= 0 || StringGetCharacter(response_body_lc, 0) == '<'));
  bool is_html_response = (StringFind(response_headers_lc, "content-type: text/html") >= 0 || StringFind(response_headers_lc, "content-type:text/html") >= 0 || looks_like_html);
  if (is_html_response) {
    safe_response_body = "UNEXPECTED_HTML_RESPONSE";
  } else if (operation == "PING" && http_code >= 400 && StringLen(safe_response_body) > 180) {
    safe_response_body = StringSubstr(safe_response_body, 0, 180) + "...";
  } else if (StringLen(safe_response_body) > 512) {
    safe_response_body = StringSubstr(safe_response_body, 0, 512) + "...";
  }

  string timestamp = TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS);
  Print("[HTTP_FORENSICS] timestamp=" + timestamp + " build=" + EA_BUILD_ID + " operation=" + operation + " method=" + method + " url=" + url + " timeout=" + IntegerToString(timeout) + " payload_len=" + IntegerToString(StringLen(payload)) + " code=" + IntegerToString(http_code) + " last_error=" + IntegerToString(web_request_error) + " context=" + context);
  Print("[HTTP_FORENSICS] request_headers=" + masked_headers);
  Print("[HTTP_FORENSICS] request_payload=" + masked_payload);
  if (response_headers != "") {
    Print("[HTTP_FORENSICS] response_headers=" + response_headers);
  }
  if (safe_response_body != "") {
    Print("[HTTP_FORENSICS] response_body=" + safe_response_body);
  }

  TraceRuntime(
    "HTTP_FORENSICS",
    "timestamp=" + timestamp +
      ",build=" + EA_BUILD_ID +
      ",operation=" + operation +
      ",method=" + method +
      ",url=" + url +
      ",timeout=" + IntegerToString(timeout) +
      ",payload_len=" + IntegerToString(StringLen(payload)) +
      ",code=" + IntegerToString(http_code) +
      ",last_error=" + IntegerToString(web_request_error) +
      ",context=" + EscapeJsonString(context) +
      ",request_headers=" + EscapeJsonString(masked_headers) +
      ",request_payload=" + EscapeJsonString(masked_payload) +
      ",response_headers=" + EscapeJsonString(response_headers) +
      ",response_body=" + EscapeJsonString(safe_response_body)
  );
}

int SendJsonRequest(string operation, string method, string url, string request_headers, string payload, int timeout, uchar &response[], string &result_headers, string &response_body, int &web_request_error) {
  uchar request[];
  if (payload != "") {
    StringToCharArray(payload, request, 0, StringLen(payload));
  } else {
    ArrayResize(request, 0);
  }

  ResetLastError();
  int http_code = WebRequest(method, url, request_headers, timeout, request, response, result_headers);
  web_request_error = GetLastError();
  response_body = UcharArrayToString(response);

  LogHttpForensics(operation, method, url, timeout, request_headers, payload, http_code, web_request_error, result_headers, response_body, "webrequest");

  if (http_code == -1) {
    string detail = ExplainWebRequestError(web_request_error);
    Print("[ERROR] " + operation + " WebRequest fallido. HTTP=" + IntegerToString(http_code) + " LastError=" + IntegerToString(web_request_error) + " Detail=" + detail + " URL=" + url);
    if (result_headers != "") {
      Print("[ERROR] " + operation + " ResponseHeaders=" + result_headers);
    }
  }

  return http_code;
}

void LogWebRequestError(string operation, string url, int http_code, string response_headers) {
  int last_error = GetLastError();
  string detail = ExplainWebRequestError(last_error);
  Print("[ERROR] " + operation + " WebRequest fallido. HTTP=" + IntegerToString(http_code) + " LastError=" + IntegerToString(last_error) + " Detail=" + detail + " URL=" + url);
  if (response_headers != "") {
    Print("[ERROR] " + operation + " ResponseHeaders=" + response_headers);
  }
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

void TraceRuntime(string tag, string details) {
  string line = TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS) + "|" + tag + "|" + details;
  int handle = FileOpen(g_runtime_trace_file_name, FILE_READ | FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE);
  if (handle == INVALID_HANDLE) {
    return;
  }

  FileSeek(handle, 0, SEEK_END);
  FileWrite(handle, line);
  FileClose(handle);
}

//+------------------------------------------------------------------+
// FIN EA
//+------------------------------------------------------------------+
