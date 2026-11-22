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

    ; Apply System Key Blocking if enabled in current config or profile
    ApplySystemKeyBlockFromConfig()
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
    global g_ActiveHotstrings, g_ActiveHotkeys, g_CapsDispatch

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
    g_CapsDispatch := Map()
    DisableSystemKeyBlock()
    StopAllMacros()
}

; Universal hotkey registration supporting standard hotkeys and CapsLock modifier combinations
RegisterUniversalHotkey(rawHk, callback) {
    global g_ActiveHotkeys, g_CapsDispatch

    ahkHk := NormalizeHotkeyToAhk(rawHk)
    if (ahkHk = "")
        return false

    ; Check if this is a CapsLock combination: [mods]CapsLock & <key>
    if InStr(ahkHk, "CapsLock &") {
        idx := InStr(ahkHk, "CapsLock &")
        modStr := SubStr(ahkHk, 1, idx - 1)
        targetKey := Trim(SubStr(ahkHk, idx + 10))
        reqCtrl := InStr(modStr, "^") > 0
        reqAlt := InStr(modStr, "!") > 0
        reqShift := InStr(modStr, "+") > 0
        reqWin := InStr(modStr, "#") > 0
        cleanKey := StrLower(targetKey)

        if (!g_CapsDispatch.Has(cleanKey)) {
            g_CapsDispatch[cleanKey] := []
            safeHk := "CapsLock & " . targetKey
            try {
                HotIf()
                Hotkey(safeHk, (*) => DispatchCapsKey(cleanKey), "On")
                g_ActiveHotkeys.Push(safeHk)
            } catch as err {
                LogMessage("Caps hotkey registration error for " . safeHk . ": " . err.Message)
                return false
            }
        }

        g_CapsDispatch[cleanKey].Push({
            reqCtrl: reqCtrl,
            reqAlt: reqAlt,
            reqShift: reqShift,
            reqWin: reqWin,
            fn: callback
        })

        ; Ensure pressing and releasing CapsLock alone toggles CapsLock normally
        static capsToggleRegistered := false
        if (!capsToggleRegistered) {
            try {
                HotIf()
                Hotkey("CapsLock", (*) => SetCapsLockState(!GetKeyState("CapsLock", "T")), "On")
                g_ActiveHotkeys.Push("CapsLock")
                capsToggleRegistered := true
            }
        }
        return true
    }

    ; Standard Hotkey registration
    ; If hotkey uses the Windows key (#), prepend * so it completely consumes and suppresses native Windows shell actions (e.g. *#d overrides Show Desktop)
    if InStr(ahkHk, "#") {
        safeHk := InStr(ahkHk, "*") ? ahkHk : "*" . ahkHk
    } else {
        safeHk := (InStr(ahkHk, "$") || InStr(ahkHk, "*") || InStr(ahkHk, "&")) ? ahkHk : "$" . ahkHk
    }
    try {
        HotIf()
        Hotkey(safeHk, callback, "On")
        g_ActiveHotkeys.Push(safeHk)
        return true
    } catch as err {
        LogMessage("Hotkey error for " . rawHk . " (" . safeHk . "): " . err.Message)
        return false
    }
}

DispatchCapsKey(cleanKey) {
    global g_CapsDispatch
    if (!g_CapsDispatch.Has(cleanKey))
        return
    c := GetKeyState("Ctrl", "P")
    a := GetKeyState("Alt", "P")
    s := GetKeyState("Shift", "P")
    w := (GetKeyState("LWin", "P") || GetKeyState("RWin", "P"))

    for entry in g_CapsDispatch[cleanKey] {
        if (entry.reqCtrl == c && entry.reqAlt == a && entry.reqShift == s && entry.reqWin == w) {
            entry.fn()
            return
        }
    }
}

; ==============================================================================
; System Key Blocking (Prevent Key Presses like Win+D from Activating Actions)
; ==============================================================================

global g_BlockedSysKeys := []
global g_SystemKeysBlocked := false

global g_SysBlockHotkeys := [
    "*#d", "*#e", "*#r", "*#m", "*#s", "*#a", "*#x", "*#Tab",
    "*#g", "*#w", "*#c", "*#q", "*#f", "*#h", "*#k", "*#i", "*#p", "*#t", "*#b",
    "*#1", "*#2", "*#3", "*#4", "*#5", "*#6", "*#7", "*#8", "*#9", "*#0"
]

ApplySystemKeyBlockFromConfig() {
    global g_Config
    isBlock := false
    if (g_Config.Has("blockSystemKeys") && (g_Config["blockSystemKeys"] = true || g_Config["blockSystemKeys"] = 1)) {
        isBlock := true
    }
    curProf := g_Config.Has("activeProfile") ? g_Config["activeProfile"] : "Default"
    if (g_Config.Has("profiles") && g_Config["profiles"].Has(curProf)) {
        p := g_Config["profiles"][curProf]
        if (p.Has("blockSystemKeys") && (p["blockSystemKeys"] = true || p["blockSystemKeys"] = 1)) {
            isBlock := true
        }
    }
    SetBlockSystemKeysState(isBlock)
}

SetBlockSystemKeysState(enabled) {
    global g_SystemKeysBlocked
    if (enabled && !g_SystemKeysBlocked) {
        EnableSystemKeyBlock()
    } else if (!enabled && g_SystemKeysBlocked) {
        DisableSystemKeyBlock()
    }
}

EnableSystemKeyBlock() {
    global g_BlockedSysKeys, g_SystemKeysBlocked, g_SysBlockHotkeys, g_ActiveHotkeys
    if (g_SystemKeysBlocked)
        return
    for k in g_SysBlockHotkeys {
        ; Do not overwrite hotkeys that are already registered by user scripts
        cleanK := StrLower(RegExReplace(k, "^[\*\#\$~]+", ""))
        alreadyInUse := false
        for existing in g_ActiveHotkeys {
            cleanExisting := StrLower(RegExReplace(existing, "^[\*\#\$~]+", ""))
            if (cleanK = cleanExisting && InStr(existing, "#")) {
                alreadyInUse := true
                break
            }
        }
        if (alreadyInUse)
            continue

        try {
            Hotkey(k, HandleBlockedSysKey, "On")
            g_BlockedSysKeys.Push(k)
        }
    }
    try {
        Hotkey("~*LWin", (*) => 0, "On")
        Hotkey("~*RWin", (*) => 0, "On")
        g_BlockedSysKeys.Push("~*LWin")
        g_BlockedSysKeys.Push("~*RWin")
    }
    g_SystemKeysBlocked := true
    LogMessage("System key blocking enabled (Windows shortcuts like Win+D suppressed)")
}

DisableSystemKeyBlock() {
    global g_BlockedSysKeys, g_SystemKeysBlocked
    if (!g_SystemKeysBlocked)
        return
    for k in g_BlockedSysKeys {
        try Hotkey(k, "Off")
    }
    g_BlockedSysKeys := []
    g_SystemKeysBlocked := false
    LogMessage("System key blocking disabled")
}

HandleBlockedSysKey(hk) {
    global g_Wv, g_MainGui
    static lastKey := ""
    static lastTick := 0
    rawKey := RegExReplace(hk, "^[\*\#\$~]+", "")
    now := A_TickCount

    ; Suppress auto-repeat while key is held down
    if (rawKey = lastKey && (now - lastTick < 600)) {
        lastTick := now
        return
    }
    lastKey := rawKey
    lastTick := now

    combo := "Win + " . StrUpper(rawKey)
    try {
        if (g_Wv && g_MainGui && WinActive("ahk_id " . g_MainGui.Hwnd)) {
            msg := JSON.stringify(Map(
                "type", "systemKeyIntercepted",
                "key", StrUpper(rawKey),
                "combo", combo
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
    return
}

