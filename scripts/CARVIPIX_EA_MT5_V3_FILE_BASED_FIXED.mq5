//+------------------------------------------------------------------+
//| CARVIPIX EA MT5 V3 - FILE BASED (Sin WebRequest) - FIXED
//+------------------------------------------------------------------+
#property copyright "CARVIPIX 2026"
#property link      "https://carvipix.com"
#property version   "3.0.1"
#property strict

//+------------------------------------------------------------------+
// INPUTS
//+------------------------------------------------------------------+

input double FIXED_LOT = 0.01;
input int    POLLING_SECONDS = 2;
input int    MAGIC_NUMBER = 20260716;

//+------------------------------------------------------------------+
// VARIABLES
//+------------------------------------------------------------------+

string g_processed_signals[500];
int    g_processed_count = 0;

//+------------------------------------------------------------------+
// ON INIT
//+------------------------------------------------------------------+

int OnInit()
{
  Print("═══════════════════════════════════════════════════════════");
  Print("[INIT] CARVIPIX EA V3.0.1 - FILE BASED");
  Print("[INIT] Lot: ", FIXED_LOT);
  Print("[INIT] Magic: ", MAGIC_NUMBER);
  Print("[INIT] Polling: ", POLLING_SECONDS, " sec");
  Print("═══════════════════════════════════════════════════════════");
  
  EventSetTimer(POLLING_SECONDS);
  return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
// ON TIMER
//+------------------------------------------------------------------+

void OnTimer()
{
  CheckAndExecuteSignal();
}

//+------------------------------------------------------------------+
// ON DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason)
{
  EventKillTimer();
  Print("[DEINIT] EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
// MAIN LOGIC
//+------------------------------------------------------------------+

void CheckAndExecuteSignal()
{
  static int last_check = 0;
  int current_time = (int)TimeCurrent();
  
  if (current_time - last_check < POLLING_SECONDS) return;
  last_check = current_time;
  
  Print("[POLLING] Buscando archivo...");
  
  int handle = FileOpen("signal_pending.txt", FILE_READ | FILE_ANSI);
  if (handle == INVALID_HANDLE) {
    Print("[POLLING] No existe signal_pending.txt");
    return;
  }
  
  string json_line = FileReadString(handle);
  FileClose(handle);
  
  if (json_line == "" || StringLen(json_line) < 10) {
    Print("[POLLING] Archivo vacío");
    return;
  }
  
  Print("[JSON] ", json_line);
  
  // Parsear con cuidado
  string signal_id = GetJsonString(json_line, "signal_id");
  string symbol = GetJsonString(json_line, "symbol");
  string decision = GetJsonString(json_line, "decision");
  
  double entry = GetJsonNumber(json_line, "entry");
  double stop_loss = GetJsonNumber(json_line, "stop_loss");
  double take_profit = GetJsonNumber(json_line, "take_profit");
  
  Print("[PARSED]");
  Print("  signal_id: ", signal_id);
  Print("  symbol: ", symbol);
  Print("  decision: ", decision);
  Print("  entry: ", entry);
  Print("  stop_loss: ", stop_loss);
  Print("  take_profit: ", take_profit);
  
  if (signal_id == "" || entry == 0) {
    Print("[VALIDATION] ❌ Parseo incompleto");
    return;
  }
  
  if (IsAlreadyProcessed(signal_id)) {
    Print("[VALIDATION] ⚠️ Ya procesada");
    return;
  }
  
  string broker_symbol = (symbol == "XAUUSD") ? "XAUUSD.sml" : symbol;
  
  if (!SymbolSelect(broker_symbol, true)) {
    Print("[MARKET] ❌ No se puede seleccionar ", broker_symbol);
    return;
  }
  
  double ask = SymbolInfoDouble(broker_symbol, SYMBOL_ASK);
  double bid = SymbolInfoDouble(broker_symbol, SYMBOL_BID);
  
  if (ask == 0 || bid == 0) {
    Print("[MARKET] Mercado cerrado");
    return;
  }
  
  Print("[MARKET] ✅ Abierto. Ask: ", ask, " Bid: ", bid);
  
  // Ejecutar
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
  Print("  Type: ", decision);
  Print("  Volume: ", FIXED_LOT);
  Print("  Price: ", request.price);
  Print("  SL: ", sl);
  Print("  TP: ", tp);
  
  if (!OrderSend(request, result)) {
    Print("[BROKER] ❌ OrderSend failed - Retcode: ", result.retcode, " Description: ", GetRetcodeDescription(result.retcode));
    return;
  }
  
  Print("[BROKER RETCODE] ", result.retcode);
  
  if (result.retcode == TRADE_RETCODE_DONE || result.retcode == 10009) {
    Print("[✅ TICKET] ", result.order);
    Print("[✅ PRICE] ", result.price);
    Print("[✅ EXECUTED] Order sent successfully");
    
    g_processed_signals[g_processed_count] = signal_id;
    g_processed_count++;
    if (g_processed_count >= 500) g_processed_count = 0;
  } else {
    Print("[❌ REJECTED] Retcode: ", result.retcode);
  }
}

//+------------------------------------------------------------------+
// HELPERS - JSON PARSING
//+------------------------------------------------------------------+

string GetJsonString(string json, string key)
{
  string search = "\"" + key + "\":\"";
  int pos = StringFind(json, search);
  if (pos < 0) return "";
  
  int start = pos + StringLen(search);
  int end = StringFind(json, "\"", start);
  if (end < 0) return "";
  
  return StringSubstr(json, start, end - start);
}

double GetJsonNumber(string json, string key)
{
  string search = "\"" + key + "\":";
  int pos = StringFind(json, search);
  if (pos < 0) {
    Print("[ERROR] No encontrado: ", key);
    return 0;
  }
  
  int start = pos + StringLen(search);
  int len = StringLen(json);
  
  // Skip whitespace
  while (start < len && (json[start] == ' ' || json[start] == '\t')) start++;
  
  // Find end: look for comma, closing brace, or end
  int end = start;
  while (end < len) {
    char c = json[end];
    if (c == ',' || c == '}' || c == ']' || c == ' ') break;
    end++;
  }
  
  string num_str = StringSubstr(json, start, end - start);
  double result = StringToDouble(num_str);
  
  Print("[PARSE] ", key, "=", num_str, " (", result, ")");
  
  return result;
}

bool IsAlreadyProcessed(string signal_id)
{
  for (int i = 0; i < g_processed_count; i++) {
    if (g_processed_signals[i] == signal_id) return true;
  }
  return false;
}
