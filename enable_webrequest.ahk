#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%

; Buscar y activar ventana de MT5
IfWinExist ahk_exe terminal64.exe
{
    WinActivate ahk_exe terminal64.exe
    Sleep 500
    
    ; Abrir Tools menu (Alt+T)
    SendInput !t
    Sleep 300
    
    ; Seleccionar Options (O)
    SendInput o
    Sleep 800
    
    ; Buscar tab "Expert Advisors"
    ; En el diálogo Options, hay tabs
    ; Podría estar en Ctrl+Tab o click directo
    
    ; Intentar click en tab Expert Advisors si es visible
    ; Buscar checkbox "Allow WebRequest"
    
    ; Esta es una aproximación - MT5 UI puede variar
    MsgBox, Por favor habilita WebRequest manualmente:
    MsgBox, 1. Tools -> Options
    MsgBox, 2. Tab "Expert Advisors"
    MsgBox, 3. Marca "Allow WebRequest for listed URLs"
    MsgBox, 4. Agrega "localhost:3000" a la lista
    MsgBox, 5. Click OK
}
else
{
    MsgBox MT5 no está abierto
}

ExitApp
