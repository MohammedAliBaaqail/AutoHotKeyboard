#Requires AutoHotkey v2
#SingleInstance Off
#UseHook true
InstallKeybdHook(true, true)
SetWorkingDir(A_ScriptDir)
Persistent(true)
try DllCall("shell32\SetCurrentProcessExplicitAppUserModelID", "wstr", "AutoHotKeyboard.Engine.v2")

; ==============================================================================
; Single-Instance Window Reactivation
; If AutoHotKeyboard is already running, restore and foreground the existing window, then exit
; ==============================================================================
DetectHiddenWindows(true)
currentPid := DllCall("kernel32\GetCurrentProcessId", "uint")
existingHwnd := WinExist("AutoHotKeyboard ahk_class AutoHotkeyGUI")
if (existingHwnd) {
    existingPid := WinGetPID("ahk_id " . existingHwnd)
    if (existingPid && existingPid != currentPid) {
        ; Notify existing instance to show its main window and bring to front
        PostMessage(0x0400 + 101, 0, 0, existingHwnd) ; WM_USER + 101
        DllCall("user32\ShowWindow", "ptr", existingHwnd, "int", 9) ; SW_RESTORE
        DllCall("user32\SetForegroundWindow", "ptr", existingHwnd)
        ExitApp(0)
    }
}
DetectHiddenWindows(false)

; Suppress hotkey flood warning dialog (e.g. for key repeat or rapid auto-clicking)
A_MaxHotkeysPerInterval := 50000
A_HotkeyInterval := 2000
A_MenuMaskKey := "vkE8"

; ==============================================================================
; External Support Libraries
; ==============================================================================
#Include lib\ComVar.ahk
#Include lib\Promise.ahk
#Include lib\JSON.ahk
#Include lib\WebView2\WebView2.ahk
#Include lib\AudioSession.ahk
#Include lib\OCR.ahk

; ==============================================================================
; Core Subsystems & Global State
; ==============================================================================
#Include core\Globals.ahk
#Include core\Config.ahk
#Include core\Engine.ahk
#Include core\MainWindow.ahk
#Include core\WebUIBridge.ahk
#Include core\TrayMenu.ahk

; ==============================================================================
; Application Startup (Auto-Execute Section)
; ==============================================================================
try {
    InitConfig()
    CreateMainWindow()
    SetupTrayMenu()
} catch as err {
    LogMessage("Startup Error: " . err.Message . "`n" . err.Stack)
    MsgBox("Startup Error: " . err.Message, "Error", 16)
}
OnExit(OnAppExit)

; ==============================================================================
; Automation Modules
; ==============================================================================
#Include modules\TextExpander.ahk
#Include modules\KeyRemapper.ahk
#Include modules\WindowManager.ahk
#Include modules\Profiles.ahk
#Include modules\AppLauncher.ahk
#Include modules\FolderCreator.ahk
#Include modules\MouseStudio.ahk
#Include modules\ScreenScanner.ahk
#Include modules\MacroRecorder.ahk
#Include modules\MouseGestures.ahk
#Include modules\RadialMenu.ahk
