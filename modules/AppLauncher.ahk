; ==============================================================================
; 4. Quick App Launcher & Runner Module
; ==============================================================================

ApplyAppLauncher() {
    global g_Config, g_ActiveHotstrings, g_ActiveHotkeys

    if (!g_Config.Has("appLauncher") || !g_Config["appLauncher"].Has("items")) {
        return
    }

    launcherConfig := g_Config["appLauncher"]
    if (launcherConfig.Has("enabled") && !launcherConfig["enabled"]) {
        return
    }

    for item in launcherConfig["items"] {
        if (IsObject(item) && item.Has("trigger") && item.Has("target")) {
            trig := Trim(item["trigger"])
            target := Trim(item["target"])
            type := item.Has("triggerType") ? item["triggerType"] : "string"
            ; Automatically detect shortcuts/hotkeys (e.g. Win + D, Ctrl + Shift + ...) even if triggerType was mislabeled
            isHk := (type = "hotkey" || type = "shortcut") 
                || InStr(trig, "+") || InStr(trig, "^") || InStr(trig, "!") || InStr(trig, "#") 
                || InStr(trig, "Win") || InStr(trig, "Ctrl") || InStr(trig, "Alt") || InStr(trig, "Shift") || InStr(trig, "CapsLock")
            if (isHk) {
                item["triggerType"] := "hotkey"
            }

            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1 || item["enabled"] =
            "1")
            if (trig != "" && target != "" && isEnabled) {
                try {
                    handler := CreateLauncherHandler(trig, target)
                    if (isHk) {
                        RegisterUniversalHotkey(trig, handler)
                    } else {
                        Hotstring(":*:" . trig, handler, "On")
                        g_ActiveHotstrings.Push(trig)
                    }
                } catch as err {
                    LogMessage("Launcher error for " . trig . ": " . err.Message)
                }
            } else if (trig != "" && !isHk) {
                try Hotstring(":*:" . trig, , "Off")
            }
        }
    }
}

NormalizeHotkeyToAhk(rawHk) {
    clean := Trim(rawHk)
    if (clean = "")
        return ""

    ; If it already looks like pure AHK notation (e.g. ^!c, +F12, #Space, $^c, +3, CapsLock)
    if RegExMatch(clean, "^[\$*~<>\^!+#]+[A-Za-z0-9_]+$") || RegExMatch(clean,
        "^(?i)(F\d{1,2}|Space|Tab|Enter|Esc|Escape|BS|Backspace|Delete|Del|Insert|Ins|Home|End|PgUp|PgDn|CapsLock)$") {
        return clean
    }

    ; Handle CapsLock custom combinations like "CapsLock & 3" or "^+CapsLock & 3"
    if InStr(clean, "CapsLock &") {
        return clean
    }

    ; Replace human-readable compound formats like "Ctrl + Alt + C", "Shift + 3", or "CapsLock + 3"
    mods := ""
    key := ""
    hasCaps := false
    parts := StrSplit(clean, "+")

    for part in parts {
        p := StrLower(Trim(part))
        if (p = "ctrl" || p = "control") {
            mods .= "^"
        } else if (p = "alt") {
            mods .= "!"
        } else if (p = "shift") {
            mods .= "+"
        } else if (p = "win" || p = "windows" || p = "meta" || p = "cmd") {
            mods .= "#"
        } else if (p = "capslock" || p = "caps") {
            hasCaps := true
        } else {
            actual := Trim(part)
            if (p = "space")
                actual := "Space"
            else if (p = "esc" || p = "escape")
                actual := "Esc"
            else if (p = "enter" || p = "return")
                actual := "Enter"
            else if (p = "tab")
                actual := "Tab"
            else if (p = "backspace" || p = "bs")
                actual := "Backspace"
            else if (p = "delete" || p = "del")
                actual := "Del"
            else if (p = "capslock")
                actual := "CapsLock"
            else if RegExMatch(actual, "^(?i)f(\d{1,2})$", &fm)
                actual := "F" . fm[1]
            key := actual
        }
    }

    if (hasCaps) {
        if (key = "")
            return "CapsLock"
        return mods . "CapsLock & " . key
    }

    if (key = "")
        return clean

    if (StrLen(key) = 1)
        key := StrLower(key)

    return mods . key
}

CreateLauncherHandler(trigger, target) {
    return (*) => RunLauncherTarget(trigger, target)
}

RunLauncherTarget(trigger, target) {
    global g_Wv, g_IsEngineActive
    if (!g_IsEngineActive) {
        return
    }

    ; If Win key was part of trigger, send mask key to neutralize Windows shell hotkeys (e.g. Win+D)
    if InStr(trigger, "Win") || InStr(trigger, "#") {
        try SendEvent("{vkE8}")
    }

    try {
        Run(target)
        SoundBeep(950, 50)
        if (g_Wv) {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "appLauncher",
                "message", "Launched: " . target
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    } catch as err {
        SoundBeep(400, 100)
        LogMessage("Run target failed: " . err.Message)
    }
}

