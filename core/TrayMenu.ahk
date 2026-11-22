; ==============================================================================
; Tray Menu
; ==============================================================================

SetupTrayMenu() {
    global g_MainGui, APP_NAME

    iconPath := A_ScriptDir . "\app-icon.ico"
    if FileExist(iconPath) {
        try TraySetIcon(iconPath)
    }

    tray := A_TrayMenu
    tray.Delete()
    tray.Add("Show AutoHotKeyboard", (*) => ShowMainWindow())
    tray.Add("Toggle Active/Suspended", (*) => ToggleEngineFromTray())
    tray.Add()
    tray.Add("Start with Windows", (*) => ToggleStartupFromTray())
    if (IsStartupEnabled()) {
        try tray.Check("Start with Windows")
    }
    if (!A_IsAdmin) {
        tray.Add("Restart as Administrator", (*) => RestartAsAdmin())
    }
    tray.Add()
    tray.Add("View Debug Log", (*) => OpenDebugLog())
    tray.Add("Exit", (*) => ExitApp())
    tray.Default := "Show AutoHotKeyboard"
    tray.ClickCount := 1
}

GetStartupShortcutPath() {
    return A_Startup . "\AutoHotKeyboard.lnk"
}

IsStartupEnabled() {
    return FileExist(GetStartupShortcutPath()) != ""
}

ToggleStartupFromTray() {
    lnk := GetStartupShortcutPath()
    tray := A_TrayMenu
    if (IsStartupEnabled()) {
        try FileDelete(lnk)
        try tray.Uncheck("Start with Windows")
    } else {
        targetExe := A_IsCompiled ? A_ScriptFullPath : A_AhkPath
        args := A_IsCompiled ? "" : ('"' . A_ScriptFullPath . '"')
        try FileCreateShortcut(targetExe, lnk, A_ScriptDir, args, "AutoHotKeyboard", A_ScriptDir . "\app-icon.ico")
        try tray.Check("Start with Windows")
    }
}

RestartAsAdmin() {
    try {
        if (A_IsCompiled) {
            Run('*RunAs "' . A_ScriptFullPath . '"')
        } else {
            Run('*RunAs "' . A_AhkPath . '" "' . A_ScriptFullPath . '"')
        }
        ExitApp()
    } catch as err {
        MsgBox("Failed to elevate to Administrator: " . err.Message, APP_NAME, 48)
    }
}

OpenDebugLog() {
    global LOG_FILE
    logPath := (LOG_FILE != "") ? LOG_FILE : (A_ScriptDir . "\debug.log")
    if (!FileExist(logPath)) {
        try FileAppend(FormatTime(, "yyyy-MM-dd HH:mm:ss") . " [AutoHotKeyboard] Log file initialized.`n", logPath, "UTF-8")
    }
    try Run('notepad.exe "' . logPath . '"')
}

ToggleEngineFromTray() {
    global g_IsEngineActive, g_Config, g_Wv
    g_IsEngineActive := !g_IsEngineActive
    g_Config["enabled"] := g_IsEngineActive
    SyncForcedItemsAcrossProfilesAhk()
    SaveConfigToFile()
    ApplyAllModules()

    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "updateState",
                "enabled", g_IsEngineActive,
                "config", g_Config
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

