; ==============================================================================
; Configuration Management
; ==============================================================================

InitConfig() {
    global g_Config, g_IsEngineActive, CONFIG_FILE

    if (FileExist(CONFIG_FILE)) {
        try {
            content := FileRead(CONFIG_FILE, "UTF-8")
            if (Trim(content) != "") {
                g_Config := JSON.parse(content, false, true)

                ; Migration check for legacy config formats
                if (!g_Config.Has("textExpander") && g_Config.Has("shortcuts")) {
                    g_Config["textExpander"] := Map(
                        "enabled", true,
                        "items", g_Config["shortcuts"]
                    )
                }

                ; Fill any missing module defaults
                defaults := GetDefaultConfig()
                for modName, modVal in defaults {
                    if (!g_Config.Has(modName)) {
                        g_Config[modName] := modVal
                    }
                }
                ; Always default to Text Expander tab on startup
                g_Config["activeTab"] := "textExpander"

                ; Ensure theme has all Neumorphism parameters
                if (g_Config.Has("theme") && IsObject(g_Config["theme"])) {
                    themeMap := g_Config["theme"]
                    if (!themeMap.Has("radius")) {
                        themeMap["radius"] := 5
                    }
                    if (!themeMap.Has("distance")) {
                        themeMap["distance"] := 3
                    }
                    if (!themeMap.Has("intensity")) {
                        themeMap["intensity"] := 14
                    }
                    if (!themeMap.Has("lightIntensity")) {
                        themeMap["lightIntensity"] := (themeMap.Has("intensity") ? themeMap["intensity"] : 22)
                    }
                    if (!themeMap.Has("darkIntensity")) {
                        themeMap["darkIntensity"] := (themeMap.Has("intensity") ? themeMap["intensity"] : 6)
                    }
                    if (!themeMap.Has("blur")) {
                        themeMap["blur"] := 10
                    }
                    if (!themeMap.Has("customPresets")) {
                        themeMap["customPresets"] := []
                    }
                }

                ; Ensure window custom size is tracked and valid
                if (!g_Config.Has("window") || !IsObject(g_Config["window"])) {
                    GetDefaultWindowSize(&defW, &defH, &defX, &defY)
                    g_Config["window"] := Map("widthPercent", DEFAULT_WINDOW_WIDTH_PCT, "heightPercent",
                        DEFAULT_WINDOW_HEIGHT_PCT, "width", defW, "height", defH)
                }
            } else {
                g_Config := GetDefaultConfig()
                SaveConfigToFile()
            }
        } catch as err {
            LogMessage("Config read error: " . err.Message)
            g_Config := GetDefaultConfig()
            SaveConfigToFile()
        }
    } else {
        g_Config := GetDefaultConfig()
        SaveConfigToFile()
    }

    ; Master engine toggle state
    if g_Config.Has("enabled") {
        g_IsEngineActive := (g_Config["enabled"] = true || g_Config["enabled"] = 1)
    } else {
        g_IsEngineActive := true
        g_Config["enabled"] := true
    }

    SyncForcedItemsAcrossProfilesAhk()
    ApplyAllModules()
    ProfileAppScanner.EnsureAllProfileIcons()
    ProfileAppScanner.CleanAllCachedIcons()
}

GetDefaultConfig() {
    return Map(
        "enabled", true,
        "activeTab", "textExpander",
        "textExpander", Map(
            "enabled", true,
            "items", [
                Map("id", "te-1", "input", "@@email", "output", "user@example.com", "multiline", false, "enabled", 1)
            ]
        ),
        "keyRemapper", Map(
            "enabled", true,
            "items", [
                Map("id", "kr-1", "source", "CapsLock", "target", "Control", "name", "CapsLock to Control")
            ]
        ),
        "windowManager", Map(
            "enabled", true,
            "alwaysOnTopEnabled", true,
            "alwaysOnTopHotkey", "^SPACE",
            "centerWindowEnabled", true,
            "centerWindowHotkey", "^!c",
            "hideWindowEnabled", true,
            "hideWindowHotkey", "^!h",
            "transparencyWheel", true,
            "opacity", 210,
            "appVolumeWheel", true,
            "appVolumeMuteEnabled", true,
            "appVolumeMuteHotkey", "!m",
            "masterAudioMuteEnabled", true,
            "masterAudioMuteHotkey", "^!m",
            "borderlessEnabled", true,
            "borderlessHotkey", "^!Enter",
            "textTransformEnabled", true,
            "textTransformUpperHotkey", "^!u",
            "textTransformLowerHotkey", "^!l",
            "textTransformTitleHotkey", "^!t",
            "textTransformCleanEnabled", true,
            "textTransformCleanHotkey", "^!k",
            "screenOcrEnabled", true,
            "screenOcrHotkey", "^!o",
            "colorPickerEnabled", true,
            "colorPickerHotkey", "^!p",
            "colorFormat", "RGB",
            "virtualDesktopsEnabled", true,
            "taskbarScrollEnabled", true,
            "sleepEnabled", true,
            "sleepHotkey", "#s",
            "sleepModeHibernate", true,
            "sleepTimer", 30
        ),
        "appLauncher", Map(
            "enabled", true,
            "items", [
                Map("id", "al-1", "trigger", "@calc", "triggerType", "string", "target", "calc.exe", "name",
                    "Calculator"),
                Map("id", "al-2", "trigger", "@yt", "triggerType", "string", "target", "https://www.youtube.com",
                    "name", "YouTube"),
                Map("id", "al-3", "trigger", "@gh", "triggerType", "string", "target", "https://github.com", "name",
                    "GitHub")
            ]
        ),
        "folderCreator", Map(
            "enabled", true,
            "items", [
                Map(
                    "id", "fc-1",
                    "name", "Project Scaffolding",
                    "trigger", "@mkproj",
                    "triggerType", "string",
                    "targetLocation", "activeExplorer",
                    "customPath", "",
                    "folderPaths", "{Name}`n{Name}\src`n{Name}\docs`n{Name}\assets\images",
                    "seedFiles", "README.md, notes.txt",
                    "autoOpen", true,
                    "enabled", true
                ),
                Map(
                    "id", "fc-2",
                    "name", "Dated Archive Batch",
                    "trigger", "Ctrl+Alt+Shift+F",
                    "triggerType", "hotkey",
                    "targetLocation", "activeExplorer",
                    "customPath", "",
                    "folderPaths", "Backup-{Date}`nBackup-{Date}\Part [01-05]",
                    "seedFiles", "manifest.txt",
                    "autoOpen", true,
                    "enabled", true
                )
            ]
        ),
        "autoClicker", Map(
            "enabled", true,
            "hotkey", "F8",
            "button", "Left",
            "clickType", "Single",
            "cps", 20,
            "limit", 0
        ),
        "macroRecorder", Map(
            "enabled", true,
            "items", [
                Map(
                    "id", "macro-1",
                    "name", "Fast Reload Combo",
                    "trigger", "F9",
                    "playbackMode", "NoRepeat",
                    "repeatInterval", 50,
                    "enabled", true,
                    "steps", [
                        Map("action", "Down", "key", "r", "delay", 40),
                        Map("action", "Up", "key", "r", "delay", 100),
                        Map("action", "Down", "key", "1", "delay", 40),
                        Map("action", "Up", "key", "1", "delay", 50)
                    ]
                )
            ]
        ),
        "screenScanner", Map(
            "enabled", true,
            "scanRate", 150,
            "items", []
        ),
        "theme", Map(
            "bgColor", "#e8dfd5",
            "accentColor", "#d97706",
            "radius", 5,
            "distance", 4,
            "lightIntensity", 39,
            "darkIntensity", 5,
            "intensity", 22,
            "blur", 9,
            "customPresets", []
        ),
        "window", Map(
            "widthPercent", DEFAULT_WINDOW_WIDTH_PCT,
            "heightPercent", DEFAULT_WINDOW_HEIGHT_PCT
        )
    )
}

SaveConfigToFile() {
    global g_Config, CONFIG_FILE
    try {
        jsonStr := JSON.stringify(g_Config, 2)
        f := FileOpen(CONFIG_FILE, "w", "UTF-8-RAW")
        if (f) {
            f.Write(jsonStr)
            f.Close()
        }
    } catch as err {
        LogMessage("Failed to save config: " . err.Message)
    }
}

