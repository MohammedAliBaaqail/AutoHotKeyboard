; ==============================================================================
; 6. Macro Recording & Playback Module (Hardware-level capture & sequencer)
; ==============================================================================

ApplyMacroRecorder() {
    global g_Config, g_ActiveHotkeys, g_IsEngineActive

    StopAllMacros()

    if (!g_Config.Has("macroRecorder") || !g_Config["macroRecorder"].Has("items")) {
        return
    }

    modConfig := g_Config["macroRecorder"]
    if (modConfig.Has("enabled") && !modConfig["enabled"]) {
        return
    }

    for item in modConfig["items"] {
        if (IsObject(item) && item.Has("trigger") && item.Has("steps")) {
            trig := Trim(item["trigger"])
            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1)
            if (trig != "" && isEnabled && g_IsEngineActive) {
                try {
                    RegisterSingleMacro(item)
                } catch as err {
                    LogMessage("Macro register error for " . trig . ": " . err.Message)
                }
            }
        }
    }
}

RegisterSingleMacro(item) {
    global g_ActiveHotkeys

    trig := Trim(item["trigger"])
    ahkHk := NormalizeHotkeyToAhk(trig)
    if (ahkHk = "")
        ahkHk := trig

    safeHk := (InStr(ahkHk, "$") || InStr(ahkHk, "*")) ? ahkHk : "$" . ahkHk
    mode := item.Has("playbackMode") ? item["playbackMode"] : "NoRepeat"

    switch mode {
        case "RepeatWhileHolding":
            Hotkey(safeHk, (*) => StartMacroHold(item), "On")
            Hotkey(safeHk . " Up", (*) => StopMacroHold(item), "On")
            g_ActiveHotkeys.Push(safeHk)
            g_ActiveHotkeys.Push(safeHk . " Up")

        case "Toggle":
            Hotkey(safeHk, (*) => ToggleMacroLoop(item), "On")
            g_ActiveHotkeys.Push(safeHk)

        default: ; NoRepeat / Once
            Hotkey(safeHk, (*) => ExecuteMacroAsync(item), "On")
            g_ActiveHotkeys.Push(safeHk)
    }
}

ExecuteMacroAsync(item) {
    global g_IsEngineActive
    if (!g_IsEngineActive)
        return
    if (!item.Has("steps") || !IsObject(item["steps"]))
        return

    SetTimer(() => PlayMacroSteps(item["steps"]), -1)
}

StartMacroHold(item) {
    global g_IsEngineActive, g_MacroActiveTimers
    if (!g_IsEngineActive)
        return
    if (!item.Has("steps") || !IsObject(item["steps"]))
        return

    if (!IsSet(g_MacroActiveTimers) || !IsObject(g_MacroActiveTimers))
        g_MacroActiveTimers := Map()

    mId := item.Has("id") ? item["id"] : "hold_macro"
    if (g_MacroActiveTimers.Has(mId))
        return

    interval := item.Has("repeatInterval") ? Max(10, Integer(item["repeatInterval"])) : 50
    timerFn := () => PlayMacroSteps(item["steps"])
    g_MacroActiveTimers[mId] := timerFn

    SetTimer(timerFn, -1)
    SetTimer(timerFn, interval)
}

StopMacroHold(item) {
    global g_MacroActiveTimers
    if (!IsSet(g_MacroActiveTimers) || !IsObject(g_MacroActiveTimers))
        return

    mId := item.Has("id") ? item["id"] : "hold_macro"
    if (g_MacroActiveTimers.Has(mId)) {
        fn := g_MacroActiveTimers[mId]
        SetTimer(fn, 0)
        g_MacroActiveTimers.Delete(mId)
    }
}

ToggleMacroLoop(item) {
    global g_IsEngineActive, g_MacroActiveTimers, g_Wv
    if (!g_IsEngineActive)
        return
    if (!item.Has("steps") || !IsObject(item["steps"]))
        return

    if (!IsSet(g_MacroActiveTimers) || !IsObject(g_MacroActiveTimers))
        g_MacroActiveTimers := Map()

    mId := item.Has("id") ? item["id"] : "toggle_macro"
    if (g_MacroActiveTimers.Has(mId)) {
        fn := g_MacroActiveTimers[mId]
        SetTimer(fn, 0)
        g_MacroActiveTimers.Delete(mId)
        SoundBeep(600, 60)
        if (g_Wv) {
            try g_Wv.PostWebMessageAsString(JSON.stringify(Map("type", "macroLoopState", "id", mId, "running", false)))
        }
    } else {
        interval := item.Has("repeatInterval") ? Max(10, Integer(item["repeatInterval"])) : 50
        timerFn := () => PlayMacroSteps(item["steps"])
        g_MacroActiveTimers[mId] := timerFn
        SetTimer(timerFn, interval)
        SoundBeep(1100, 60)
        if (g_Wv) {
            try g_Wv.PostWebMessageAsString(JSON.stringify(Map("type", "macroLoopState", "id", mId, "running", true)))
        }
    }
}

StopAllMacros() {
    global g_MacroActiveTimers
    if (!IsSet(g_MacroActiveTimers) || !IsObject(g_MacroActiveTimers)) {
        g_MacroActiveTimers := Map()
        return
    }
    for mId, fn in g_MacroActiveTimers {
        try SetTimer(fn, 0)
    }
    g_MacroActiveTimers.Clear()
}

PlayMacroSteps(steps) {
    global g_MacroIsExecuting
    if (!IsObject(steps) || g_MacroIsExecuting)
        return

    g_MacroIsExecuting := true
    try {
        for s in steps {
            if (!IsObject(s))
                continue

            act := s.Has("action") ? s["action"] : "Down"
            k := s.Has("key") ? s["key"] : ""
            del := s.Has("delay") ? Max(5, Integer(s["delay"])) : 50

            if (act = "Delay") {
                Sleep(del)
                continue
            }
            if (k = "")
                continue

            ; Mouse clicks
            if (k = "LButton" || k = "RButton" || k = "MButton" || k = "Left" || k = "Right" || k = "Middle") {
                btn := (k = "Left") ? "LButton" : ((k = "Right") ? "RButton" : ((k = "Middle") ? "MButton" : k))
                if (act = "Click") {
                    Click(btn)
                } else if (act = "Down") {
                    SendEvent("{" . btn . " Down}")
                } else if (act = "Up") {
                    SendEvent("{" . btn . " Up}")
                }
            } else {
                ; Keyboard key
                if (act = "Down") {
                    SendEvent("{" . k . " Down}")
                } else if (act = "Up") {
                    SendEvent("{" . k . " Up}")
                } else {
                    SendEvent("{" . k . "}")
                }
            }
            Sleep(del)
        }
    } finally {
        g_MacroIsExecuting := false
    }
}

; --- Low-Level Macro Recorder Hook ---

StartMacroRecording(options := "") {
    global g_MacroRecorderHook, g_MacroIsRecording, g_MacroLastTime, g_MacroRealDelays, g_MacroDefDelay,
        g_MacroActiveKeys

    StopMacroRecording()

    g_MacroIsRecording := true
    g_MacroLastTime := 0
    g_MacroDefDelay := 50
    g_MacroRealDelays := false
    g_MacroActiveKeys := Map()

    if (IsObject(options)) {
        if (options.Has("defDelay"))
            g_MacroDefDelay := Max(10, Integer(options["defDelay"]))
        if (options.Has("realDelays"))
            g_MacroRealDelays := (options["realDelays"] = true || options["realDelays"] = 1 || options["realDelays"] =
                "true")
    }

    ih := InputHook("I0")
    ih.KeyOpt("{All}", "+N")
    ih.VisibleNonText := false
    ih.OnKeyDown := (hook, vk, sc) => OnMacroRecordKeyDown(vk, sc)
    ih.OnKeyUp := (hook, vk, sc) => OnMacroRecordKeyUp(vk, sc)

    g_MacroRecorderHook := ih
    ih.Start()
    SoundBeep(1100, 70)
}

StopMacroRecording() {
    global g_MacroRecorderHook, g_MacroIsRecording, g_MacroActiveKeys, g_Wv
    if (g_MacroRecorderHook) {
        try g_MacroRecorderHook.Stop()
        g_MacroRecorderHook := ""
    }
    g_MacroActiveKeys := Map()
    if (g_MacroIsRecording) {
        g_MacroIsRecording := false
        SoundBeep(700, 70)
        if (g_Wv) {
            try g_Wv.PostWebMessageAsString(JSON.stringify(Map("type", "macroRecordingStopped")))
        }
    }
}

OnMacroRecordKeyDown(vk, sc) {
    global g_MacroIsRecording, g_MacroLastTime, g_MacroRealDelays, g_MacroDefDelay, g_MacroActiveKeys, g_Wv
    if (!g_MacroIsRecording || !g_Wv)
        return

    kName := NormalizeRecordedKey(vk, sc)
    if (kName = "")
        return

    ; Ignore auto-repeat keydown
    if (g_MacroActiveKeys.Has(kName))
        return

    tNow := A_TickCount
    del := (g_MacroRealDelays && g_MacroLastTime > 0) ? Max(10, tNow - g_MacroLastTime) : g_MacroDefDelay
    g_MacroLastTime := tNow
    g_MacroActiveKeys[kName] := tNow

    ahkKey := (StrLen(kName) = 1) ? StrLower(kName) : ((kName = "Win") ? "LWin" : kName)

    try {
        msg := JSON.stringify(Map(
            "type", "macroStepRecorded",
            "action", "Down",
            "key", ahkKey,
            "delay", del
        ))
        g_Wv.PostWebMessageAsString(msg)
    }
}

OnMacroRecordKeyUp(vk, sc) {
    global g_MacroIsRecording, g_MacroLastTime, g_MacroRealDelays, g_MacroDefDelay, g_MacroActiveKeys, g_Wv
    if (!g_MacroIsRecording || !g_Wv)
        return

    kName := NormalizeRecordedKey(vk, sc)
    if (kName = "")
        return

    tNow := A_TickCount
    del := g_MacroDefDelay
    if (g_MacroActiveKeys.Has(kName)) {
        tDown := g_MacroActiveKeys[kName]
        del := g_MacroRealDelays ? Max(10, tNow - tDown) : g_MacroDefDelay
        g_MacroActiveKeys.Delete(kName)
    } else if (g_MacroRealDelays && g_MacroLastTime > 0) {
        del := Max(10, tNow - g_MacroLastTime)
    }
    g_MacroLastTime := tNow

    ahkKey := (StrLen(kName) = 1) ? StrLower(kName) : ((kName = "Win") ? "LWin" : kName)

    try {
        msg := JSON.stringify(Map(
            "type", "macroStepRecorded",
            "action", "Up",
            "key", ahkKey,
            "delay", del
        ))
        g_Wv.PostWebMessageAsString(msg)
    }
}

NormalizeRecordedKey(vk, sc) {
    if (vk >= 0x41 && vk <= 0x5A)
        return Chr(vk)
    if (vk >= 0x30 && vk <= 0x39)
        return Chr(vk)
    if (vk >= 0x60 && vk <= 0x69)
        return "Numpad" . (vk - 0x60)
    if (vk >= 0x70 && vk <= 0x87)
        return "F" . (vk - 0x6F)

    switch vk {
        case 0x11, 0xA2, 0xA3: return "Ctrl"
        case 0x10, 0xA0, 0xA1: return "Shift"
        case 0x12, 0xA4, 0xA5: return "Alt"
        case 0x5B, 0x5C: return "Win"
        case 0x1B: return "Escape"
        case 0x20: return "Space"
        case 0x09: return "Tab"
        case 0x0D: return "Enter"
        case 0x08: return "Backspace"
        case 0x2E: return "Delete"
        case 0x2D: return "Insert"
        case 0x24: return "Home"
        case 0x23: return "End"
        case 0x21: return "PgUp"
        case 0x22: return "PgDn"
        case 0x26: return "Up"
        case 0x28: return "Down"
        case 0x25: return "Left"
        case 0x27: return "Right"
        case 0x14: return "CapsLock"
        case 0x90: return "NumLock"
        case 0x91: return "ScrollLock"
        case 0x2C: return "PrintScreen"
        case 0x13: return "Pause"
        case 0x6A: return "NumpadMult"
        case 0x6B: return "NumpadAdd"
        case 0x6D: return "NumpadSub"
        case 0x6E: return "NumpadDot"
        case 0x6F: return "NumpadDiv"
        case 0xBA: return ";"
        case 0xBB: return "="
        case 0xBC: return ","
        case 0xBD: return "-"
        case 0xBE: return "."
        case 0xBF: return "/"
        case 0xC0: return "``"
        case 0xDB: return "["
        case 0xDC: return "\"
        case 0xDD: return "]"
        case 0xDE: return "'"
    }

    kName := GetKeyName(Format("vk{:02x}sc{:03x}", vk, sc))
    if (kName = "")
        return ""
    switch kName {
        case "Control", "Ctrl", "LControl", "RControl", "LCtrl", "RCtrl": return "Ctrl"
        case "Shift", "LShift", "RShift": return "Shift"
        case "Alt", "LAlt", "RAlt": return "Alt"
        case "Win", "LWin", "RWin": return "Win"
    }
    return kName
}

