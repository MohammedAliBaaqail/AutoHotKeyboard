; Global constants and variables
global APP_NAME := "AutoHotKeyboard"
global DEFAULT_WINDOW_WIDTH_PCT := 70   ; Default 70% of screen work area
global DEFAULT_WINDOW_HEIGHT_PCT := 75  ; Default 75% of screen work area
global CONFIG_FILE := A_ScriptDir . "\config.json"

GetDefaultWindowSize(&defW, &defH, &defX, &defY, monIndex := 0) {
    global DEFAULT_WINDOW_WIDTH_PCT, DEFAULT_WINDOW_HEIGHT_PCT
    try {
        monCount := MonitorGetCount()
        if (monIndex < 1 || monIndex > monCount) {
            try monIndex := MonitorGetPrimary()
            catch
                monIndex := 1
        }
        MonitorGetWorkArea(monIndex, &wL, &wT, &wR, &wB)
        monW := wR - wL
        monH := wB - wT
    } catch {
        wL := 0, wT := 0
        monW := A_ScreenWidth
        monH := A_ScreenHeight
    }
    pctW := (DEFAULT_WINDOW_WIDTH_PCT > 0) ? (DEFAULT_WINDOW_WIDTH_PCT / 100.0) : 0.70
    pctH := (DEFAULT_WINDOW_HEIGHT_PCT > 0) ? (DEFAULT_WINDOW_HEIGHT_PCT / 100.0) : 0.75

    defW := Max(720, Min(monW - 40, Round(monW * pctW)))
    defH := Max(520, Min(monH - 60, Round(monH * pctH)))
    defX := wL + Max(0, (monW - defW) // 2)
    defY := wT + Max(0, (monH - defH) // 2)
}

GetMonitorFromRect(x, y, w, h) {
    cx := x + (w // 2)
    cy := y + (h // 2)
    try {
        monCount := MonitorGetCount()
        loop monCount {
            MonitorGet(A_Index, &mL, &mT, &mR, &mB)
            if (cx >= mL && cx < mR && cy >= mT && cy < mB)
                return A_Index
        }
        loop monCount {
            MonitorGet(A_Index, &mL, &mT, &mR, &mB)
            if (x < mR && (x + w) > mL && y < mB && (y + h) > mT)
                return A_Index
        }
    }
    try {
        return MonitorGetPrimary()
    }
    return 1
}

global g_MainGui := 0
global g_Wvc := 0
global g_Wv := 0
global g_Config := Map()
global g_IsEngineActive := true
global g_IsWindowReady := false

; Module active hook tracking
global g_ActiveHotstrings := []
global g_ActiveHotkeys := []
global g_AutoClickerRunning := false
global g_AutoClickerCount := 0
global g_MouseRecordActive := false
global g_MousePlaybackActive := false
global g_MouseRecordTechnique := "polling"
global g_MouseRecordPollingRate := 20
global g_MouseRecordedEvents := []
global g_MouseRecordLastTime := 0
global g_MouseRecordLastX := -1
global g_MouseRecordLastY := -1
global g_MouseHookHandle := 0
global g_MouseHookCallback := 0
global g_MousePlaybackStopReq := false
global g_ClickHotkeysActive := false
global g_MouseRecordKeys := true
global g_MouseKeyHook := ""
global g_MouseRecordWinHwnd := 0
global g_MouseRecordWinX := 0
global g_MouseRecordWinY := 0
global g_EmergencyEscActive := false
global g_MouseCountdownGui := ""
global g_MouseRecordCountdownActive := false
global g_LastExternalHwnd := 0
global g_LastPolledHwnd := 0
global g_ShadedWindows := Map()
global g_BorderlessWindows := Map()

; Macro Recorder tracking (initialized in auto-execute section)
global g_MacroRecorderHook := ""
global g_MacroIsRecording := false
global g_MacroLastTime := 0
global g_MacroRealDelays := false
global g_MacroDefDelay := 50
global g_MacroActiveTimers := Map()
global g_MacroActiveKeys := Map()
global g_MacroIsExecuting := false
global g_IsExiting := false

; Screen Scanner tracking
global g_ScreenScannerActive := false
global g_ScreenScannerLastTriggerTime := Map()
global g_ScreenScannerLastFoundState := Map()
global g_ActiveScanningItems := Map()
global g_ColorPickerTarget := ""

; Hot Corner & Gesture Global State Variables
global g_CornerActive := ""
global g_CornerTick := 0
global g_CornerTriggered := false
global g_WheelGesturesActive := false
global g_RockerGesturesActive := false
global g_WheelTriggerBtn := "MButton"
global g_GestureTriggerDown := false
global g_GestureWheelFired := false
global g_RockerFired := false

; Color Picker Globals
global g_ColorPickerActive := false
global g_ColorPickerLoupeGui := 0
global g_CpHMemDC := 0
global g_CpHMemBmp := 0
global g_CpHOldBmp := 0
global g_ColorPickerFormat := "HEX"
global g_CpLens := 0, g_CpTxtVal := 0, g_CpTxtSub := 0, g_CpSwatch := 0

; Sleep Timer Globals
global g_SleepTimerActive := false
global g_SleepTimerSecondsLeft := 0
global g_SleepTimerMode := "Sleep"

LogMessage(msg) {
    OutputDebug("[AutoHotKeyboard] " . msg)
    try FileAppend(FormatTime(, "yyyy-MM-dd HH:mm:ss") . " [AutoHotKeyboard] " . msg . "`n", A_ScriptDir . "\debug.log",
    "UTF-8")
}

GlobalErrorHandler(thrown, mode) {
    global g_IsExiting
    errDetail := FormatTime(, "yyyy-MM-dd HH:mm:ss") . " [ERROR] " . thrown.Message
    if (thrown.HasProp("Extra") && thrown.Extra != "")
        errDetail .= " (Specifically: " . thrown.Extra . ")"
    if (thrown.HasProp("File") && thrown.File != "")
        errDetail .= "`n  File: " . thrown.File
    if (thrown.HasProp("Line") && thrown.Line != "")
        errDetail .= " (Line: " . thrown.Line . ")"
    if (thrown.HasProp("What") && thrown.What != "")
        errDetail .= "`n  In: " . thrown.What
    if (thrown.HasProp("Stack") && thrown.Stack != "")
        errDetail .= "`n  Stack:`n" . thrown.Stack
    LogMessage(errDetail)
    if (mode = "Exit" || g_IsExiting)
        return 1
}
OnError(GlobalErrorHandler)


SaveWindowState() {
    global g_MainGui, g_Config
    if (!g_MainGui || !g_MainGui.Hwnd)
        return
    try {
        minMax := WinGetMinMax("ahk_id " . g_MainGui.Hwnd)
        isMax := (minMax = 1)
        isMin := (minMax = -1)

        if (!g_Config.Has("window") || !IsObject(g_Config["window"])) {
            g_Config["window"] := Map()
        }
        g_Config["window"]["isMaximized"] := isMax ? 1 : 0

        g_MainGui.GetPos(&curX, &curY)
        g_MainGui.GetClientPos(&dummyX, &dummyY, &curW, &curH)
        targetMon := GetMonitorFromRect(curX, curY, curW, curH)
        g_Config["window"]["monitor"] := targetMon

        ; Only save restored dimensions when the window is neither maximized nor minimized
        if (!isMax && !isMin) {
            if (curW >= 720 && curH >= 520) {
                g_Config["window"]["width"] := curW
                g_Config["window"]["height"] := curH
                g_Config["window"]["x"] := curX
                g_Config["window"]["y"] := curY
                try {
                    MonitorGetWorkArea(targetMon, &wL, &wT, &wR, &wB)
                    monW := wR - wL
                    monH := wB - wT
                    if (monW > 0 && monH > 0) {
                        g_Config["window"]["widthPercent"] := Round((curW / Float(monW)) * 100, 1)
                        g_Config["window"]["heightPercent"] := Round((curH / Float(monH)) * 100, 1)
                    }
                }
                g_Config["window"]["userCustomized"] := 1
            }
        }
    }
}

OnAppExit(exitReason, exitCode) {
    global g_Wvc, g_MainGui, g_Config, g_IsExiting
    g_IsExiting := true
    try SetTimer(CheckActiveAppFocus, 0)
    try SetTimer(CheckAutoProfileSwitch, 0)
    try SetTimer(SaveWindowSizeDebounced, 0)
    try ProfileOsdHUD.Hide()
    try HideMouseOSD()
    try SaveWindowState()
    try SaveConfigToFile()
    try StopAutoClicker()
    try StopMouseRecording()
    try StopMousePlayback()
    try StopScreenScanner()
    try UnregisterAllHooks()
    try CloseColorPickerLoupe()
    if (g_Wvc) {
        try g_Wvc.Close()
        g_Wvc := 0
    }
}

