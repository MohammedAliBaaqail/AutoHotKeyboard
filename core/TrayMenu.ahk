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
    tray.Add("Show AutoHotKeyboard", (*) => (g_MainGui.Restore(), g_MainGui.Show()))
    tray.Add("Toggle Active/Suspended", (*) => ToggleEngineFromTray())
    tray.Add("View Debug Log", (*) => OpenDebugLog())
    tray.Add()
    tray.Add("Exit", (*) => ExitApp())
    tray.Default := "Show AutoHotKeyboard"
}

OpenDebugLog() {
    logPath := A_ScriptDir . "\debug.log"
    if (!FileExist(logPath)) {
        try FileAppend(FormatTime(, "yyyy-MM-dd HH:mm:ss") . " [AutoHotKeyboard] Log file initialized.`n", logPath,
        "UTF-8")
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

