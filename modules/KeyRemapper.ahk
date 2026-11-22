; ==============================================================================
; 2. Key Remapper & Custom Shortcuts Module
; ==============================================================================

ApplyKeyRemapper() {
    global g_Config, g_ActiveHotkeys

    if (!g_Config.Has("keyRemapper") || !g_Config["keyRemapper"].Has("items")) {
        return
    }

    modConfig := g_Config["keyRemapper"]
    if (modConfig.Has("enabled") && !modConfig["enabled"]) {
        return
    }

    HotIf(IsNotAppWindowActive)
    for item in modConfig["items"] {
        if (IsObject(item) && item.Has("source") && item.Has("target")) {
            src := Trim(item["source"])
            tgt := Trim(item["target"])
            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1 || item["enabled"] =
            "1")
            if (src != "" && tgt != "" && isEnabled) {
                try {
                    RegisterSingleRemap(src, tgt)
                } catch as err {
                    LogMessage("Remap error for " . src . ": " . err.Message)
                }
            }
        }
    }
    HotIf()
}

FormatSendString(rawKey) {
    ahkKey := NormalizeHotkeyToAhk(rawKey)
    if (ahkKey = "")
        ahkKey := rawKey

    ; Separate leading modifiers (^, !, +, #) from base key
    if RegExMatch(ahkKey, "^([\^!+#]*)(.+)$", &m) {
        mods := m[1]
        base := m[2]
        if (StrLen(base) > 1 && !RegExMatch(base, "^\{.+\}$")) {
            return mods . "{" . base . "}"
        }
        return mods . base
    }
    return ahkKey
}

RegisterSingleRemap(source, target) {
    global g_ActiveHotkeys

    cleanSource := Trim(source)
    cleanTarget := Trim(target)
    if (cleanSource = "" || cleanTarget = "")
        return

    ; Convert human-readable source (e.g. "Ctrl+Shift+A") to AHK format (e.g. "^+A")
    ahkSource := NormalizeHotkeyToAhk(cleanSource)
    if (ahkSource = "")
        ahkSource := cleanSource

    ; Determine hook-safe source hotkey string to prevent self-triggering loops
    safeSource := (InStr(ahkSource, "$") || InStr(ahkSource, "*")) ? ahkSource : "$" . ahkSource

    ; Check for special built-in actions
    if (cleanTarget = "MuteAudio") {
        Hotkey(safeSource, (*) => (SoundSetMute(-1), SoundBeep(650, 40)), "On")
        g_ActiveHotkeys.Push(safeSource)
        return
    }

    ; Modifier key remap (e.g. CapsLock -> Control, or any key to Ctrl/Shift/Alt)
    if (cleanTarget = "Control" || cleanTarget = "Ctrl" || cleanTarget = "Shift" || cleanTarget = "Alt") {
        modKey := (cleanTarget = "Control" || cleanTarget = "Ctrl") ? "Ctrl" : cleanTarget
        static isHeld := false
        Hotkey("*" . ahkSource, (*) => (isHeld ? "" : (isHeld := true, Send("{Blind}{" . modKey . " DownR}"))), "On")
        Hotkey("*" . ahkSource . " up", (*) => (isHeld := false, Send("{Blind}{" . modKey . " Up}")), "On")
        g_ActiveHotkeys.Push("*" . ahkSource)
        g_ActiveHotkeys.Push("*" . ahkSource . " up")
        return
    }

    ; General key / compound shortcut remap with hook ($)
    if (InStr(cleanTarget, "+") || InStr(cleanTarget, " ") || RegExMatch(cleanTarget, "^[\^!+#]")) {
        sendPattern := FormatSendString(cleanTarget)
        Hotkey(safeSource, (*) => Send(sendPattern), "On")
    } else {
        Hotkey(safeSource, (*) => Send("{Blind}{" . cleanTarget . "}"), "On")
    }
    g_ActiveHotkeys.Push(safeSource)
}

