@echo off
REM Script para ejecutar primera operación real en MT5

echo.
echo ======================================
echo CARVIPIX - PRIMERA OPERACION REAL
echo ======================================
echo.

REM 1. Matar MT5
echo [1] Cerrando MT5...
taskkill /IM terminal64.exe /F >nul 2>&1
timeout /t 3 /nobreak

REM 2. Compilar
echo [2] Compilando EA...
set METAEDITOR="C:\Program Files\OANDA MetaTrader 5 Terminal\metaeditor64.exe"
set MQ5_FILE="C:\Users\user1\AppData\Roaming\MetaQuotes\Terminal\EC6CB01DD6EC087A123DA4B636574C06\MQL5\Experts\CARVIPIX_EA_MT5_V2_WITH_RETURNS.mq5"
set SRC_FILE="c:\Users\user1\carvipix\scripts\CARVIPIX_EA_MT5_V2_WITH_RETURNS.mq5"

copy %SRC_FILE% %MQ5_FILE% >nul
%METAEDITOR% "/compile:%MQ5_FILE%" >nul 2>&1
timeout /t 6 /nobreak

echo [3] EA compilado
echo.
echo [4] Abriendo MT5...
start "" "C:\Program Files\OANDA MetaTrader 5 Terminal\terminal64.exe"
timeout /t 20 /nobreak

echo.
echo [5] Esperando ejecución...
timeout /t 30 /nobreak

echo.
echo ======================================
echo COMPLETADO - Revisa MT5
echo Pestaña EXPERTS debe mostrar [TICKET]
echo ======================================
echo.

pause
