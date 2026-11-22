; ==============================================================================
; Master Engine Dispatcher
; ==============================================================================

ApplyAllModules() {
    global g_IsEngineActive

    ; Unregister all existing hooks and stop auto clicker and macros
    StopAutoClicker()
    StopMouseRecording()
    StopMousePlayback()
    StopAllMacros()
    StopScreenScanner()
    UnregisterAllHooks()

    if (!g_IsEngineActive) {
        LogMessage("Master engine suspended (OFF)")
        return
    }

    ApplyTextExpander()
    ApplyKeyRemapper()
    ApplyWindowManager()
    ApplyAppLauncher()
    ApplyFolderCreator()
    ApplyAutoClicker()
    ApplyMacroRecorder()
    ApplyMouseGestures()
    ApplyRadialMenu()
    ApplyScreenScanner()
}

IsNotAppWindowActive(*) {
    global g_MainGui
    try {
        activeHwnd := WinActive("A")
        if (g_MainGui && activeHwnd = g_MainGui.Hwnd)
            return false
        if (WinGetPID("ahk_id " . activeHwnd) = DllCall("GetCurrentProcessId"))
            return false
    }
    return true
}

IsMouseOverTaskbar(*) {
    global g_IsEngineActive
    if (!g_IsEngineActive)
        return false
    try {
        CoordMode("Mouse", "Screen")
        MouseGetPos(, , &mHwnd)
        if (!mHwnd)
            return false
        rootHwnd := DllCall("GetAncestor", "ptr", mHwnd, "uint", 2, "ptr") ; GA_ROOT = 2
        topHwnd := rootHwnd ? rootHwnd : mHwnd
        wClass := WinGetClass("ahk_id " . topHwnd)
        return (wClass = "Shell_TrayWnd" || wClass = "Shell_SecondaryTrayWnd")
    } catch {
        return false
    }
}

UnregisterAllHooks() {
    global g_ActiveHotstrings, g_ActiveHotkeys

    try SetTimer(CheckScreenHotCorners, 0)

    for trig in g_ActiveHotstrings {
        try Hotstring(":?*:" . trig, , "Off")
        try Hotstring(":*:" . trig, , "Off")
    }
    g_ActiveHotstrings := []

    HotIf(IsNotAppWindowActive)
    for hk in g_ActiveHotkeys {
        try Hotkey(hk, "Off")
    }
    HotIf()
    HotIf(IsMouseOverTaskbar)
    for hk in g_ActiveHotkeys {
        try Hotkey(hk, "Off")
    }
    HotIf()
    for hk in g_ActiveHotkeys {
        try Hotkey(hk, "Off")
    }
    g_ActiveHotkeys := []
    StopAllMacros()
}

