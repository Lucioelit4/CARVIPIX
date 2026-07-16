//+------------------------------------------------------------------+
//| CARVIPIX_EA_MT5_V2_WITH_RETURNS.mq5
//| Expert Advisor con retornos E2E
//| Version: 2.0.0
//| Build: 20260716
//| Recibe señales → Ejecuta → Retorna ejecución → Retorna cierre
//+------------------------------------------------------------------+

#property copyright "CARVIPIX 2026"
#property link "https://carvipix.com"
#property version "2.00"
#property strict

//+------------------------------------------------------------------+
// INPUTS
//+------------------------------------------------------------------+

input string CARVIPIX_LICENSE_KEY = "";                   // Licencia CARVIPIX
input string BACKEND_URL = "http://localhost:3000";       // URL del backend
input string EA_ENVIRONMENT = "DEVELOPMENT";              // DEVELOPMENT, STAGING, PRODUCTION
input double FIXED_LOT = 0.01;                            // Lote fijo por operación
input int    POLLING_SECONDS = 5;                         // Frecuencia de polling (segundos)
input int    MAGIC_NUMBER = 20260716;                     // Magic number para órdenes

//+------------------------------------------------------------------+
// ESTRUCTURAS
//+------------------------------------------------------------------+

struct TrackingOrder
  {
   ulong    ticket;
   string   event_id;
   string   signal_id;
   string   symbol;
   datetime open_time;
   bool     execution_notified;
   double   entry_price;
   double   stop_loss;
   double   take_profit;
  };

//+------------------------------------------------------------------+
// VARIABLES GLOBALES
//+------------------------------------------------------------------+

TrackingOrder g_tracked[100];
int           g_tracked_count   = 0;
string        g_api_url         = "";
bool          g_connected       = false;
string        g_processed_ids[500];
int           g_processed_count = 0;
int           g_poll_count      = 0;  // Contador de polling

//+------------------------------------------------------------------+
// FORWARD DECLARATIONS
//+------------------------------------------------------------------+

bool   PerformHandshake();
void   FetchAndExecuteSignals();
bool   ExecuteOrder(const string signal_id, const string event_id, const string symbol, const string direction, double entry, double stop_loss, double take_profit);
void   NotifyExecution(const string event_id, const string signal_id, ulong ticket, double entry_price, const string status);
void   MonitorOpenOrders();
void   NotifyClosure(const string event_id, const string signal_id, const string close_type, double close_price, double pips, double profit_loss);
string NormalizeSymbol(const string raw_symbol);
bool   IsMarketOpen(const string symbol);
string JsonExtractString(const string json, const string key);
double JsonExtractDouble(const string json, const string key);
bool   IsAlreadyProcessed(const string signal_id);
void   MarkAsProcessed(const string signal_id);

//+------------------------------------------------------------------+
// INIT
//+------------------------------------------------------------------+

int OnInit()
  {
   Print("[INIT] ============================================");
   Print("[INIT] CARVIPIX EA V2 iniciado — Build 20260716");
   Print("[INIT] Backend URL : ", BACKEND_URL);
   Print("[INIT] Environment : ", EA_ENVIRONMENT);
   Print("[INIT] Fixed Lot   : ", FIXED_LOT);
   Print("[INIT] Magic Number: ", MAGIC_NUMBER);
   Print("[INIT] License     : ", CARVIPIX_LICENSE_KEY == "" ? "vacía (demo)" : "configurada");
   Print("[INIT] ============================================");

   g_api_url = BACKEND_URL;

   Print("[HANDSHAKE] Enviando handshake a ", BACKEND_URL, "/api/bot/mt5/handshake");
   if(PerformHandshake())
     {
      g_connected = true;
      Print("[CONNECTED] ✅ Backend respondió OK — iniciando polling cada ", POLLING_SECONDS, "s");
     }
   else
     {
      Print("[CONNECTED] ⚠️ Backend sin respuesta — reintentando en timer");
      g_connected = false;
     }

   EventSetTimer(POLLING_SECONDS);
   return INIT_SUCCEEDED;
  }

//+------------------------------------------------------------------+
// DEINIT
//+------------------------------------------------------------------+

void OnDeinit(const int reason)
  {
   EventKillTimer();
   Print("[CARVIPIX-V2] EA detenido. Razón: ", reason);
  }

//+------------------------------------------------------------------+
// TIMER
//+------------------------------------------------------------------+

void OnTimer()
  {
   if(!g_connected)
     {
      if(PerformHandshake())
        {
         g_connected = true;
         Print("[CARVIPIX-V2] ✅ Reconectado");
        }
      return;
     }

   FetchAndExecuteSignals();
   MonitorOpenOrders();
  }

//+------------------------------------------------------------------+
// HANDSHAKE
//+------------------------------------------------------------------+

bool PerformHandshake()
  {
   string url = g_api_url + "/api/bot/mt5/handshake";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + CARVIPIX_LICENSE_KEY + "\r\n";
   string result_headers;
   char   post_data[];
   char   response[];

   string json = "{\"ea_version\":\"2.0.0\",\"environment\":\"" + EA_ENVIRONMENT + "\",\"magic_number\":" + IntegerToString(MAGIC_NUMBER) + "}";
   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);

   Print("[HANDSHAKE] POST → ", url);
   int res = WebRequest("POST", url, headers, 5000, post_data, response, result_headers);
   string body = CharArrayToString(response, 0, WHOLE_ARRAY, CP_UTF8);
   Print("[HANDSHAKE] Recibido HTTP ", res, " — ", StringSubstr(body, 0, 80));

   if(res == 200 || res == 201)
      return true;

   return false;
  }

//+------------------------------------------------------------------+
// FETCH AND EXECUTE SIGNALS
//+------------------------------------------------------------------+

void FetchAndExecuteSignals()
  {
   g_poll_count++;
   string url = g_api_url + "/api/bot/mt5/signal/next?license=" + CARVIPIX_LICENSE_KEY;
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + CARVIPIX_LICENSE_KEY + "\r\n";
   string result_headers;
   char   post_data[];
   char   response[];

   Print("[POLLING] #", g_poll_count, " Consulta de señales → ", url);
   int res = WebRequest("GET", url, headers, 5000, post_data, response, result_headers);

   if(res != 200)
     {
      Print("[POLLING] Respuesta HTTP ", res);
      return;
     }

   string body = CharArrayToString(response, 0, WHOLE_ARRAY, CP_UTF8);
   Print("[POLLING] Respuesta: ", StringSubstr(body, 0, 120));

   if(StringFind(body, "\"has_signal\":true") == -1)
     {
      Print("[POLLING] Sin señales pendientes");
      return;
     }

   Print("[POLLING] ¡SEÑAL ENCONTRADA! Procesando...");

   string signal_id   = JsonExtractString(body, "signal_id");
   string event_id    = JsonExtractString(body, "event_id");
   string symbol      = JsonExtractString(body, "symbol");
   string decision    = JsonExtractString(body, "decision");
   double entry       = JsonExtractDouble(body, "entry");
   double stop_loss   = JsonExtractDouble(body, "stop_loss");
   double take_profit = JsonExtractDouble(body, "take_profit");

   Print("[SIGNAL RECEIVED] ID=", signal_id, " Symbol=", symbol, " Decision=", decision, " Entry=", entry);
   Print("[SIGNAL RECEIVED] SL=", stop_loss, " TP=", take_profit, " EventID=", event_id);

   if(signal_id == "" || symbol == "" || decision == "")
     {
      Print("[SIGNAL VALIDATED] ❌ Campos vacíos — abortando");
      return;
     }

   if(IsAlreadyProcessed(signal_id))
     {
      Print("[SIGNAL VALIDATED] ⚠️ Duplicado — ya procesada: ", signal_id);
      return;
     }

   Print("[SIGNAL VALIDATED] ✅ Señal válida, sin duplicados");

   string trade_symbol = NormalizeSymbol(symbol);
   Print("[SYMBOL RESOLVED] Normalizando: ", symbol, " → ", trade_symbol);

   Print("[VALIDATION] Intentando SymbolSelect(", trade_symbol, ")...");
   if(!SymbolSelect(trade_symbol, true))
     {
      Print("[VALIDATION] ❌ FALLA: SymbolSelect retornó false para: ", trade_symbol);
      return;
     }
   Print("[VALIDATION] ✅ SymbolSelect OK");

   Print("[VALIDATION] Intentando IsMarketOpen(", trade_symbol, ")...");
   if(!IsMarketOpen(trade_symbol))
     {
      Print("[VALIDATION] ⚠️ FALLA: Mercado cerrado para: ", trade_symbol);
      return;
     }
   Print("[VALIDATION] ✅ Mercado abierto");

   Print("[VALIDATION] Calculando margen requerido...");
   double margin_required = 0.0;
   ENUM_ORDER_TYPE order_type = (decision == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   double price_for_margin = (decision == "BUY") ? SymbolInfoDouble(trade_symbol, SYMBOL_ASK) : SymbolInfoDouble(trade_symbol, SYMBOL_BID);

   Print("[VALIDATION] Parámetros: order_type=", order_type, " symbol=", trade_symbol, " volume=", FIXED_LOT, " price=", price_for_margin);

   if(!OrderCalcMargin(order_type, trade_symbol, FIXED_LOT, price_for_margin, margin_required))
     {
      Print("[VALIDATION] ❌ FALLA: OrderCalcMargin retornó false. LastError=", GetLastError());
      return;
     }

   Print("[VALIDATION] Margen calculado: ", margin_required);
   double free_margin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   Print("[VALIDATION] Margen disponible: ", free_margin, " (95% tolerance: ", free_margin * 0.95, ")");

   if(margin_required > free_margin * 0.95)
     {
      Print("[VALIDATION] ❌ FALLA: Margen insuficiente. Requerido=", margin_required, " Disponible=", free_margin);
      return;
     }

   Print("[VALIDATION] ✅ Todas las validaciones pasaron. Ejecutando orden...");
   ExecuteOrder(signal_id, event_id, trade_symbol, decision, entry, stop_loss, take_profit);
  }

//+------------------------------------------------------------------+
// EXECUTE ORDER
//+------------------------------------------------------------------+

bool ExecuteOrder(
   const string signal_id,
   const string event_id,
   const string symbol,
   const string direction,
   double entry,
   double stop_loss,
   double take_profit)
  {
   Print("[ORDER REQUEST] ============================================");
   Print("[ORDER REQUEST] Symbol=", symbol, " Direction=", direction, " Volume=", FIXED_LOT);

   double spread = SymbolInfoInteger(symbol, SYMBOL_SPREAD) * SymbolInfoDouble(symbol, SYMBOL_POINT);
   double ask    = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double bid    = SymbolInfoDouble(symbol, SYMBOL_BID);
   Print("[ORDER REQUEST] Ask=", ask, " Bid=", bid, " Spread=", DoubleToString(spread, 5));
   Print("[ORDER REQUEST] SL=", stop_loss, " TP=", take_profit, " Magic=", MAGIC_NUMBER);

   MqlTradeRequest request;
   MqlTradeResult  result;
   ZeroMemory(request);
   ZeroMemory(result);

   request.action       = TRADE_ACTION_DEAL;
   request.symbol       = symbol;
   request.volume       = FIXED_LOT;
   request.magic        = MAGIC_NUMBER;
   request.comment      = "CARVIPIX_" + signal_id;
   request.type_filling = ORDER_FILLING_IOC;
   request.deviation    = 10;

   if(direction == "BUY")
     {
      request.type  = ORDER_TYPE_BUY;
      request.price = ask;
     }
   else
     {
      request.type  = ORDER_TYPE_SELL;
      request.price = bid;
     }

   request.sl = stop_loss;
   request.tp = take_profit;

   Print("[ORDER REQUEST] Enviando OrderSend... precio=", request.price);
   bool sent = OrderSend(request, result);

   Print("[BROKER RETCODE] ", result.retcode, " | Order=", result.order, " | Deal=", result.deal, " | Comment=", result.comment);

   if(!sent || result.retcode != TRADE_RETCODE_DONE)
     {
      int err = GetLastError();
      Print("[BROKER RETCODE] ❌ FALLÓ. Retcode=", result.retcode, " LastError=", err);
      NotifyExecution(event_id, signal_id, 0, 0.0, "REJECTED");
      return false;
     }

   ulong  ticket     = result.order;
   double exec_price = result.price;

   Print("[TICKET] ✅ Ticket=", ticket, " Precio ejecutado=", exec_price);

   if(g_tracked_count < 99)
     {
      g_tracked[g_tracked_count].ticket             = ticket;
      g_tracked[g_tracked_count].event_id           = event_id;
      g_tracked[g_tracked_count].signal_id          = signal_id;
      g_tracked[g_tracked_count].symbol             = symbol;
      g_tracked[g_tracked_count].open_time          = TimeCurrent();
      g_tracked[g_tracked_count].execution_notified = false;
      g_tracked[g_tracked_count].entry_price        = exec_price;
      g_tracked[g_tracked_count].stop_loss          = stop_loss;
      g_tracked[g_tracked_count].take_profit        = take_profit;
      g_tracked_count++;
     }

   MarkAsProcessed(signal_id);

   Print("[EXECUTION CALLBACK] Enviando → ", g_api_url, "/api/bot/mt5/execution");
   Print("[EXECUTION CALLBACK] Payload: event_id=", event_id, " signal_id=", signal_id, " ticket=", ticket);
   NotifyExecution(event_id, signal_id, ticket, exec_price, "EXECUTED");

   return true;
  }

//+------------------------------------------------------------------+
// NOTIFY EXECUTION
//+------------------------------------------------------------------+

void NotifyExecution(
   const string event_id,
   const string signal_id,
   ulong ticket,
   double entry_price,
   const string status)
  {
   string url = g_api_url + "/api/bot/mt5/execution";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + CARVIPIX_LICENSE_KEY + "\r\n";
   string result_headers;
   char   post_data[];
   char   response[];

   string json = StringFormat(
                    "{\"event_id\":\"%s\",\"signal_id\":\"%s\",\"status\":\"%s\",\"ticket\":%llu,\"entry_price\":%.5f}",
                    event_id, signal_id, status, ticket, entry_price
                 );

   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);

   int res = WebRequest("POST", url, headers, 5000, post_data, response, result_headers);

   string resp_body = CharArrayToString(response, 0, WHOLE_ARRAY, CP_UTF8);
   if(res == 200 || res == 201)
      Print("[EXECUTION CALLBACK] ✅ HTTP ", res, " | Status=", status, " | Ticket=", ticket, " | Resp=", StringSubstr(resp_body, 0, 100));
   else
      Print("[EXECUTION CALLBACK] ⚠️ HTTP ", res, " | Status=", status, " | Resp=", StringSubstr(resp_body, 0, 100));
  }

//+------------------------------------------------------------------+
// MONITOR OPEN ORDERS
//+------------------------------------------------------------------+

void MonitorOpenOrders()
  {
   for(int i = 0; i < g_tracked_count; i++)
     {
      if(g_tracked[i].ticket == 0)
         continue;

      if(!PositionSelectByTicket(g_tracked[i].ticket))
        {
         double close_price = 0.0;
         double pnl         = 0.0;
         string close_type  = "MANUAL";
         double pips        = 0.0;

         HistorySelect(g_tracked[i].open_time - 60, TimeCurrent() + 60);
         int total_deals = HistoryDealsTotal();

         for(int d = total_deals - 1; d >= 0; d--)
           {
            ulong deal_ticket = HistoryDealGetTicket(d);
            if(deal_ticket <= 0)
               continue;

            long deal_entry = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
            if(deal_entry != DEAL_ENTRY_OUT)
               continue;

            long deal_order = HistoryDealGetInteger(deal_ticket, DEAL_ORDER);
            if(deal_order != (long)g_tracked[i].ticket)
               continue;

            close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
            pnl         = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);

            string deal_comment = HistoryDealGetString(deal_ticket, DEAL_COMMENT);
            if(StringFind(deal_comment, "sl") >= 0 || StringFind(deal_comment, "stop") >= 0)
               close_type = "STOP_LOSS";
            else if(StringFind(deal_comment, "tp") >= 0 || StringFind(deal_comment, "take") >= 0)
               close_type = "TAKE_PROFIT";

            double point = SymbolInfoDouble(g_tracked[i].symbol, SYMBOL_POINT);
            if(point > 0.0)
              {
               int digits = (int)SymbolInfoInteger(g_tracked[i].symbol, SYMBOL_DIGITS);
               double pip_factor = (digits == 3 || digits == 5) ? 10.0 : 1.0;
               pips = MathAbs(close_price - g_tracked[i].entry_price) / (point * pip_factor);
              }

            break;
           }

         Print("[CLOSURE] Ticket ", g_tracked[i].ticket, " cerrado. Type=", close_type, " Price=", close_price, " PnL=", pnl, " Pips=", pips);

         NotifyClosure(
            g_tracked[i].event_id,
            g_tracked[i].signal_id,
            close_type,
            close_price,
            pips,
            pnl);

         g_tracked[i].ticket = 0;
        }
     }
  }

//+------------------------------------------------------------------+
// NOTIFY CLOSURE
//+------------------------------------------------------------------+

void NotifyClosure(
   const string event_id,
   const string signal_id,
   const string close_type,
   double close_price,
   double pips,
   double profit_loss)
  {
   string url = g_api_url + "/api/bot/mt5/closure";
   string headers = "Content-Type: application/json\r\nAuthorization: Bearer " + CARVIPIX_LICENSE_KEY + "\r\n";
   string result_headers;
   char   post_data[];
   char   response[];

   string json = StringFormat(
                    "{\"event_id\":\"%s\",\"signal_id\":\"%s\",\"status\":\"CLOSED\",\"close_type\":\"%s\",\"close_price\":%.5f,\"pips\":%.2f,\"profit_loss\":%.2f}",
                    event_id, signal_id, close_type, close_price, pips, profit_loss
                 );

   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);

   int res = WebRequest("POST", url, headers, 5000, post_data, response, result_headers);

   if(res == 200 || res == 201)
      Print("[CLOSURE CALLBACK] ✅ Notificado. PnL=", profit_loss);
   else
      Print("[CLOSURE CALLBACK] ⚠️ Código: ", res);
  }

//+------------------------------------------------------------------+
// NORMALIZE SYMBOL
//+------------------------------------------------------------------+

string NormalizeSymbol(const string raw_symbol)
  {
   if(SymbolSelect(raw_symbol, false))
      return raw_symbol;

   string with_sml = raw_symbol + ".sml";
   if(SymbolSelect(with_sml, false))
      return with_sml;

   return raw_symbol;
  }

//+------------------------------------------------------------------+
// IS MARKET OPEN
//+------------------------------------------------------------------+

bool IsMarketOpen(const string symbol)
  {
   // Simplificado: si puede obtener Ask/Bid, el mercado está disponible
   double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   
   if(ask > 0 && bid > 0)
     {
      Print("[DEBUG] Precios disponibles: Ask=", ask, " Bid=", bid);
      return true;
     }

   Print("[DEBUG] No hay precios disponibles para ", symbol);
   return false;
  }

//+------------------------------------------------------------------+
// JSON EXTRACT STRING
//+------------------------------------------------------------------+

string JsonExtractString(const string json, const string key)
  {
   string search = "\"" + key + "\":\"";
   int pos = StringFind(json, search);
   if(pos == -1)
      return "";

   int start = pos + StringLen(search);
   int end   = StringFind(json, "\"", start);
   if(end == -1)
      return "";

   return StringSubstr(json, start, end - start);
  }

//+------------------------------------------------------------------+
// JSON EXTRACT DOUBLE
//+------------------------------------------------------------------+

double JsonExtractDouble(const string json, const string key)
  {
   string search = "\"" + key + "\":";
   int pos = StringFind(json, search);
   if(pos == -1)
      return 0.0;

   int start = pos + StringLen(search);

   while(start < StringLen(json) && StringSubstr(json, start, 1) == " ")
      start++;

   int    end = start;
   string ch;
   while(end < StringLen(json))
     {
      ch = StringSubstr(json, end, 1);
      if(ch == "," || ch == "}" || ch == "]" || ch == " " || ch == "\n" || ch == "\r")
         break;
      end++;
     }

   return StringToDouble(StringSubstr(json, start, end - start));
  }

//+------------------------------------------------------------------+
// DEDUPLICATION
//+------------------------------------------------------------------+

bool IsAlreadyProcessed(const string signal_id)
  {
   for(int i = 0; i < g_processed_count; i++)
     {
      if(g_processed_ids[i] == signal_id)
         return true;
     }
   return false;
  }

void MarkAsProcessed(const string signal_id)
  {
   if(g_processed_count < 499)
     {
      g_processed_ids[g_processed_count] = signal_id;
      g_processed_count++;
     }
  }

//+------------------------------------------------------------------+
