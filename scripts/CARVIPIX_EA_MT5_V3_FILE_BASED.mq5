//+------------------------------------------------------------------+
//| CARVIPIX EA MT5 V3 - FILE BASED (Sin WebRequest)
//| Solución alternativa: Lee señales de archivos
//+------------------------------------------------------------------+
#property copyright "CARVIPIX 2026"
#property link      "https://carvipix.com"
#property version   "3.0.0"
#property strict

//+------------------------------------------------------------------+
// INPUTS
//+------------------------------------------------------------------+

input double FIXED_LOT = 0.01;                            // Lote fijo por operación
input int    POLLING_SECONDS = 3;                         // Frecuencia de polling (segundos)
input int    MAGIC_NUMBER = 20260716;                     // Magic number para órdenes

//+------------------------------------------------------------------+
// CONSTANTES
//+------------------------------------------------------------------+

#define SIGNAL_FILE "signal_pending.txt"                  // Archivo de señales
#define EXECUTED_FILE "signal_executed.txt"               // Archivo de confirmación

//+------------------------------------------------------------------+
// VARIABLES GLOBALES
//+------------------------------------------------------------------+

string g_processed_signals[500];
int    g_processed_count = 0;

//+------------------------------------------------------------------+
// ON INIT
//+------------------------------------------------------------------+

int OnInit()
{
  Print("══════════════════════════════════════════════════════════════════");
  Print("[INIT] CARVIPIX EA V3 (FILE-BASED) iniciado");
  Print("[INIT] Version: 3.0.0 — Build 20260716");
  Print("[INIT] Lote: ", FIXED_LOT);
  Print("[INIT] Magic Number: ", MAGIC_NUMBER);
  Print("[INIT] Frecuencia polling: ", POLLING_SECONDS, " segundos");
  Print("[INIT] Método: FILE-BASED (sin WebRequest)");
  Print("[INIT] Lee señales de: ", SIGNAL_FILE);
  Print("══════════════════════════════════════════════════════════════════");
  Print("");
  
  // Configurar timer para polling
  EventSetTimer(POLLING_SECONDS);
  
  return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
// ON TIMER - Main Loop
//+------------------------------------------------------------------+

void OnTimer()
{
  // Intentar leer y ejecutar señal
  CheckAndExecuteSignal();
}

//+------------------------------------------------------------------+
// ON DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason)
{
  EventKillTimer();
  Print("[DEINIT] EA detenido. Razón: ", reason);
}

//+------------------------------------------------------------------+
// CHECK AND EXECUTE SIGNAL
//+------------------------------------------------------------------+

void CheckAndExecuteSignal()
{
  static int last_check = 0;
  int current_time = (int)TimeCurrent();
  
  if (current_time - last_check < POLLING_SECONDS) return;
  last_check = current_time;
  
  Print("[POLLING] Buscando archivos de señal...");
  
  // Intentar leer archivo
  int handle = FileOpen(SIGNAL_FILE, FILE_READ | FILE_ANSI);
  if (handle == INVALID_HANDLE) {
    Print("[POLLING] No hay archivo: ", SIGNAL_FILE);
    return;
  }
  
  Print("[POLLING] ✅ Archivo encontrado");
  
  // Leer línea
  string signal_json = FileReadString(handle);
  FileClose(handle);
  
  if (signal_json == "" || signal_json == NULL) {
    Print("[POLLING] Archivo vacío");
    return;
  }
  
  Print("[SIGNAL RECEIVED] JSON: ", signal_json);
  
  // Parsear JSON manualmente (MQL5 no tiene JSON nativo)
  string signal_id = ExtractJsonString(signal_json, "signal_id");
  string symbol = ExtractJsonString(signal_json, "symbol");
  string decision = ExtractJsonString(signal_json, "decision");
  double entry = ExtractJsonDouble(signal_json, "entry");
  double stop_loss = ExtractJsonDouble(signal_json, "stop_loss");
  double take_profit = ExtractJsonDouble(signal_json, "take_profit");
  
  Print("[SIGNAL RECEIVED] Signal ID: ", signal_id);
  Print("[SIGNAL RECEIVED] Symbol: ", symbol);
  Print("[SIGNAL RECEIVED] Decision: ", decision);
  
  // Verificar si ya fue procesada
  if (IsAlreadyProcessed(signal_id)) {
    Print("[VALIDATION] ⚠️  Señal ya procesada");
    return;
  }
  
  // Resolver símbolo para broker
  string broker_symbol = NormalizeSymbol(symbol);
  Print("[SYMBOL RESOLVED] ", symbol, " → ", broker_symbol);
  
  // Validar mercado abierto
  if (!SymbolSelect(broker_symbol, true)) {
    Print("[MARKET CHECK] ⚠️  No se puede seleccionar símbolo");
    return;
  }
  
  if (!IsMarketOpen(broker_symbol)) {
    Print("[MARKET CHECK] Mercado cerrado");
    return;
  }
  
  Print("[MARKET CHECK] ✅ Mercado abierto");
  
  // Ejecutar orden
  ExecuteOrder(signal_id, broker_symbol, decision, entry, stop_loss, take_profit);
}

//+------------------------------------------------------------------+
// EXECUTE ORDER
//+------------------------------------------------------------------+

void ExecuteOrder(string signal_id, string symbol, string decision, double entry, double sl, double tp)
{
  MqlTradeRequest request = {};
  MqlTradeResult result = {};
  
  request.action = TRADE_ACTION_DEAL;
  request.symbol = symbol;
  request.volume = FIXED_LOT;
  request.type = (decision == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  request.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
  request.sl = sl;
  request.tp = tp;
  request.deviation = 10;
  request.magic = MAGIC_NUMBER;
  request.comment = "CARVIPIX_" + signal_id;
  
  Print("[ORDER REQUEST]");
  Print("  Symbol: ", symbol);
  Print("  Type: ", (decision == "BUY" ? "BUY" : "SELL"));
  Print("  Volume: ", FIXED_LOT);
  Print("  Price: ", request.price);
  Print("  SL: ", sl);
  Print("  TP: ", tp);
  
  if (!OrderSend(request, result)) {
    Print("[BROKER RETCODE] ❌ ERROR: ", result.retcode);
    return;
  }
  
  Print("[BROKER RETCODE] ", result.retcode);
  
  if (result.retcode == TRADE_RETCODE_DONE) {
    Print("[TICKET] ✅ OPERACIÓN EJECUTADA");
    Print("[TICKET] Ticket: ", result.order);
    Print("[TICKET] Entry Price: ", result.price);
    
    // Registrar en array de procesadas
    g_processed_signals[g_processed_count] = signal_id;
    g_processed_count++;
    if (g_processed_count >= 500) g_processed_count = 0;
    
    // Escribir confirmación a archivo
    WriteExecutionConfirm(signal_id, result.order);
  } else {
    Print("[VALIDATION] ❌ No se pudo abrir orden. Retcode: ", result.retcode);
  }
}

//+------------------------------------------------------------------+
// WRITE EXECUTION CONFIRM
//+------------------------------------------------------------------+

void WriteExecutionConfirm(string signal_id, ulong ticket)
{
  int handle = FileOpen(EXECUTED_FILE, FILE_WRITE | FILE_ANSI);
  if (handle != INVALID_HANDLE) {
    string confirm = "{\"signal_id\":\"" + signal_id + "\",\"ticket\":" + IntegerToString(ticket) + ",\"executed_at\":\"" + TimeToString(TimeCurrent()) + "\"}";
    FileWriteString(handle, confirm);
    FileClose(handle);
    Print("[EXECUTION CONFIRM] Confirmación escrita a archivo");
  }
}

//+------------------------------------------------------------------+
// HELPER FUNCTIONS
//+------------------------------------------------------------------+

string ExtractJsonString(string json, string key)
{
  string search = "\"" + key + "\":\"";
  int pos = StringFind(json, search);
  if (pos == -1) return "";
  
  int start = pos + StringLen(search);
  int end = StringFind(json, "\"", start);
  if (end == -1) return "";
  
  return StringSubstr(json, start, end - start);
}

double ExtractJsonDouble(string json, string key)
{
  string search = "\"" + key + "\":";
  int pos = StringFind(json, search);
  if (pos == -1) return 0;
  
  int start = pos + StringLen(search);
  int end = StringFind(json, ",", start);
  if (end == -1) end = StringFind(json, "}", start);
  if (end == -1) return 0;
  
  string value_str = StringSubstr(json, start, end - start);
  return StringToDouble(value_str);
}

bool IsAlreadyProcessed(string signal_id)
{
  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] == signal_id) return true;
  }
  return false;
}

string NormalizeSymbol(string symbol)
{
  if (symbol == "XAUUSD") return "XAUUSD.sml";
  return symbol;
}

bool IsMarketOpen(string symbol)
{
  double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
  double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
  return (ask > 0 && bid > 0);
}
