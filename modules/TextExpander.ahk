; ==============================================================================
; 1. Text Expander Module (with Multiline Support)
; ==============================================================================

ApplyTextExpander() {
    global g_Config, g_ActiveHotstrings

    if (!g_Config.Has("textExpander") || !g_Config["textExpander"].Has("items")) {
        return
    }

    modConfig := g_Config["textExpander"]
    if (modConfig.Has("enabled") && !modConfig["enabled"]) {
        return
    }

    HotIf() ; Clear any contextual HotIf condition so text expander triggers in all windows
    for item in modConfig["items"] {
        if (IsObject(item) && item.Has("input")) {
            trig := Trim(item["input"])
            outText := item.Has("output") ? item["output"] : ""
            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1 || item["enabled"] =
            "1")
            if (trig != "" && outText != "" && isEnabled) {
                try {
                    handler := CreateExpanderHandler(trig, outText)
                    Hotstring(":*:" . trig, handler, "On")
                    Hotstring(":?*:" . trig, handler, "On")
                    g_ActiveHotstrings.Push(trig)
                } catch as err {
                    LogMessage("Expander error for " . trig . ": " . err.Message)
                }
            } else if (trig != "") {
                try Hotstring(":?*:" . trig, , "Off")
                try Hotstring(":*:" . trig, , "Off")
            }
        }
    }
}

CreateExpanderHandler(trigger, replacement) {
    return (*) => OnExpanderTriggered(trigger, replacement)
}

OnExpanderTriggered(trigger, replacement) {
    global g_Wv, g_IsEngineActive
    if (!g_IsEngineActive) {
        return
    }

    ; SendText sends exact unicode characters, including newlines, tabs, and special chars verbatim
    SendText(replacement)

    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "textExpander",
                "message", "Expanded: " . trigger
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

