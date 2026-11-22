; ==============================================================================
; 5. Auto-Clicker & Key Repeater Module
; ==============================================================================

ApplyAutoClicker() {
    global g_Config, g_ActiveHotkeys, g_AutoClickerRunning, g_IsEngineActive

    if (!g_Config.Has("autoClicker")) {
        return
    }

    ac := g_Config["autoClicker"]
    if (ac.Has("enabled") && (!ac["enabled"] || ac["enabled"] = "0")) {
        if (g_AutoClickerRunning) {
            StopAutoClicker()
        }
        return
    }

    HotIf()

    ; 1. Master AutoClicker Hotkey (default F8)
    if (ac.Has("hotkey") && Trim(ac["hotkey"]) != "") {
        try {
            hk := Trim(ac["hotkey"])
            normHk := NormalizeHotkeyToAhk(hk)
            if (normHk = "")
                normHk := hk
            safeHk := (InStr(normHk, "$") || InStr(normHk, "*")) ? normHk : "$" . normHk
            Hotkey(safeHk, (*) => ToggleAutoClicker(), "On")
            g_ActiveHotkeys.Push(safeHk)
        } catch as err {
            LogMessage("AutoClicker hotkey error: " . err.Message)
        }
    }

    ; 2. Register Hotkeys for Each Saved Mouse Recording Script
    if (ac.Has("items") && IsObject(ac["items"])) {
        for item in ac["items"] {
            if (IsObject(item) && item.Has("trigger") && Trim(item["trigger"]) != "") {
                isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1)
                if (isEnabled && g_IsEngineActive) {
                    try {
                        RegisterSingleMouseScript(item)
                    } catch as err {
                        LogMessage("Mouse script hotkey error for " . item["trigger"] . ": " . err.Message)
                    }
                }
            }
        }
    }
}

RegisterSingleMouseScript(item) {
    trig := Trim(item["trigger"])
    if (trig = "")
        return

    RegisterUniversalHotkey(trig, (*) => ExecuteMouseScript(item))
}

ExecuteMouseScript(item) {
    global g_IsEngineActive, g_MousePlaybackActive

    if (!g_IsEngineActive)
        return

    ; If playback is already active, pressing any mouse script hotkey acts as an immediate stop
    if (g_MousePlaybackActive) {
        StopMousePlayback()
        return
    }

    if (!item.Has("events") || !IsObject(item["events"]) || item["events"].Length = 0)
        return

    events := item["events"]
    spd := item.Has("speed") ? Float(item["speed"]) : 1.0
    isInf := (item.Has("playbackInfinite") && (item["playbackInfinite"] = 1 || item["playbackInfinite"] = true))
    loopCnt := isInf ? 0 : (item.Has("loop") ? Integer(item["loop"]) : 1)
    origin := item.Has("origin") ? item["origin"] : "absolute"
    clicksOnly := (item.Has("clicksOnly") && (item["clicksOnly"] = 1 || item["clicksOnly"] = true))
    humanize := (item.Has("humanize") && (item["humanize"] = 1 || item["humanize"] = true))
    emergencyStop := (item.Has("emergencyStop") && (item["emergencyStop"] = 1 || item["emergencyStop"] = true))
    countdown := item.Has("countdown") ? Integer(item["countdown"]) : 0
    sId := item.Has("id") ? item["id"] : ""

    SetTimer(() => PlayRecordedMousePath(events, spd, loopCnt, origin, clicksOnly, humanize, emergencyStop, countdown,
        sId), -1)
}

ToggleAutoClicker() {
    global g_AutoClickerRunning, g_AutoClickerCount, g_Config, g_IsEngineActive
    global g_MouseRecordActive, g_MousePlaybackActive, g_MouseRecordCountdownActive

    if (!g_IsEngineActive) {
        return
    }

    if (g_Config.Has("autoClicker")) {
        ac := g_Config["autoClicker"]
        if (ac.Has("enabled") && (!ac["enabled"] || ac["enabled"] = "0")) {
            if (g_AutoClickerRunning)
                StopAutoClicker()
            if (g_MouseRecordActive)
                StopMouseRecording()
            if (g_MousePlaybackActive)
                StopMousePlayback()
            return
        }

        ; Check mode: Recorder vs Clicker (Default to recorder)
        mode := (ac.Has("mode") && ac["mode"] != "") ? ac["mode"] : "recorder"
        if (mode = "recorder") {
            if (g_MouseRecordCountdownActive) {
                g_MouseRecordCountdownActive := false
                HideMouseOSD()
                SoundBeep(450, 90)
                NotifyWebMouseCountdown(false, 0)
            } else if (g_MouseRecordActive) {
                StopMouseRecording()
            } else if (g_MousePlaybackActive) {
                StopMousePlayback()
            } else {
                cd := ac.Has("recordCountdown") ? Integer(ac["recordCountdown"]) : 0
                tech := ac.Has("recordTechnique") ? ac["recordTechnique"] : "polling"
                rate := ac.Has("pollingRate") ? Integer(ac["pollingRate"]) : 20
                recKeys := (!ac.Has("recordKeys") || ac["recordKeys"] = 1 || ac["recordKeys"] = true)
                StartMouseRecordingWithCountdown(cd, tech, rate, recKeys)
            }
            return
        }
    }

    g_AutoClickerRunning := !g_AutoClickerRunning
    g_AutoClickerCount := 0

    if (g_AutoClickerRunning) {
        EnableEmergencyEscHotkey()
        cps := 20
        if (g_Config.Has("autoClicker") && g_Config["autoClicker"].Has("cps")) {
            cps := Max(1, Min(100, g_Config["autoClicker"]["cps"]))
        }
        interval := Max(10, 1000 // cps)
        SetTimer(DoAutoClick, interval)
        SoundBeep(1100, 60)
    } else {
        SetTimer(DoAutoClick, 0)
        DisableEmergencyEscHotkey()
        SoundBeep(550, 60)
    }

    NotifyWebAutoClicker()
}

StopAutoClicker() {
    global g_AutoClickerRunning
    g_AutoClickerRunning := false
    SetTimer(DoAutoClick, 0)
    DisableEmergencyEscHotkey()
    NotifyWebAutoClicker()
}

DoAutoClick() {
    global g_AutoClickerRunning, g_AutoClickerCount, g_Config

    if (!g_AutoClickerRunning) {
        SetTimer(DoAutoClick, 0)
        return
    }

    btn := "Left"
    clickType := "Single"
    limit := 0

    if (g_Config.Has("autoClicker")) {
        ac := g_Config["autoClicker"]
        if (ac.Has("button")) {
            btn := ac["button"]
        }
        if (ac.Has("clickType")) {
            clickType := ac["clickType"]
        }
        if (ac.Has("limit")) {
            limit := ac["limit"]
        }
    }

    if (clickType = "Double") {
        Click(btn . " 2")
    } else {
        Click(btn)
    }

    g_AutoClickerCount++
    if (limit > 0 && g_AutoClickerCount >= limit) {
        StopAutoClicker()
        SoundBeep(800, 80)
    }
}

NotifyWebAutoClicker() {
    global g_Wv, g_AutoClickerRunning
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "autoClickerState",
                "running", g_AutoClickerRunning
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

; ------------------------------------------------------------------------------
; Mouse Movement Recording & Playback Engine (Dual Technique: Polling & Hook)
; ------------------------------------------------------------------------------

ShowMouseOSD(titleText, mainText := "", isSuccess := false, autoHideMs := 0) {
    global g_MouseCountdownGui
    try {
        if (!g_MouseCountdownGui) {
            g_MouseCountdownGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +E0x20")
            g_MouseCountdownGui.BackColor := "101216"
            g_MouseCountdownGui.MarginX := 24
            g_MouseCountdownGui.MarginY := 14
            g_MouseCountdownGui.SetFont("s10 c8E95A5 Bold", "Segoe UI")
            g_MouseCountdownGui.Add("Text", "vTitle Center w260", titleText)
            g_MouseCountdownGui.SetFont("s22 c00F5FF Bold", "Segoe UI")
            g_MouseCountdownGui.Add("Text", "vMain Center w260 y+4", mainText)
        } else {
            g_MouseCountdownGui["Title"].Text := titleText
            g_MouseCountdownGui["Main"].Text := mainText
            if (isSuccess) {
                g_MouseCountdownGui["Main"].Opt("c10B981")
            } else {
                g_MouseCountdownGui["Main"].Opt("c00F5FF")
            }
        }

        CoordMode("Mouse", "Screen")
        MouseGetPos(&mX, &mY)
        monCount := MonitorGetCount()
        monIdx := 1
        loop monCount {
            MonitorGet(A_Index, &mL, &mT, &mR, &mB)
            if (mX >= mL && mX < mR && mY >= mT && mY < mB) {
                monIdx := A_Index
                break
            }
        }
        MonitorGetWorkArea(monIdx, &WL, &WT, &WR, &WB)
        guiW := 300
        guiH := 84
        posX := WL + ((WR - WL - guiW) // 2)
        posY := WT + 40

        g_MouseCountdownGui.Show("x" . posX . " y" . posY . " w" . guiW . " h" . guiH . " NoActivate")

        if (autoHideMs > 0) {
            SetTimer(HideMouseOSD, -autoHideMs)
        } else {
            SetTimer(HideMouseOSD, 0)
        }
    }
}

HideMouseOSD() {
    global g_MouseCountdownGui
    try {
        if (g_MouseCountdownGui) {
            g_MouseCountdownGui.Hide()
        }
    }
}

NotifyWebMouseCountdown(isActive, remainingSeconds := 0) {
    global g_Wv
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "mouseCountdownState",
                "active", isActive,
                "seconds", remainingSeconds
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

StartMouseRecordingWithCountdown(countdown := 0, tech := "polling", rate := 20, recKeys := true) {
    global g_MouseRecordCountdownActive, g_MouseRecordActive, g_MousePlaybackActive

    if (g_MouseRecordActive) {
        StopMouseRecording()
        return
    }
    if (g_MousePlaybackActive) {
        StopMousePlayback()
        return
    }
    if (g_MouseRecordCountdownActive) {
        g_MouseRecordCountdownActive := false
        HideMouseOSD()
        SoundBeep(450, 90)
        NotifyWebMouseCountdown(false, 0)
        return
    }

    c := Integer(countdown)
    if (c <= 0) {
        StartMouseRecording(Map("technique", tech, "rate", rate, "recordKeys", recKeys))
        return
    }

    g_MouseRecordCountdownActive := true
    NotifyWebMouseCountdown(true, c)
    EnableEmergencyEscHotkey()

    while (c > 0 && g_MouseRecordCountdownActive) {
        ShowMouseOSD("MOUSE RECORDING IN", c . "s")
        SoundBeep(850, 90)
        NotifyWebMouseCountdown(true, c)
        loop 10 {
            Sleep(100)
            if (!g_MouseRecordCountdownActive) {
                HideMouseOSD()
                NotifyWebMouseCountdown(false, 0)
                return
            }
        }
        c--
    }

    if (!g_MouseRecordCountdownActive) {
        HideMouseOSD()
        NotifyWebMouseCountdown(false, 0)
        return
    }

    g_MouseRecordCountdownActive := false
    NotifyWebMouseCountdown(false, 0)
    ShowMouseOSD("MOUSE RECORDER", "RECORDING STARTED!", true, 900)
    SoundBeep(1300, 150)

    StartMouseRecording(Map("technique", tech, "rate", rate, "recordKeys", recKeys))
}

StartMouseRecording(options := "") {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime, g_MouseRecordLastX, g_MouseRecordLastY
    global g_MouseRecordTechnique, g_MouseRecordPollingRate, g_Wv, g_IsEngineActive
    global g_MouseRecordKeys, g_MouseKeyHook, g_MouseRecordWinHwnd, g_MouseRecordWinX, g_MouseRecordWinY

    if (!g_IsEngineActive)
        return

    StopMouseRecording()
    StopMousePlayback()

    tech := "polling"
    rate := 20
    recKeys := true

    if (IsObject(options)) {
        if (options.Has("technique"))
            tech := options["technique"]
        if (options.Has("rate"))
            rate := Max(5, Integer(options["rate"]))
        if (options.Has("recordKeys"))
            recKeys := (options["recordKeys"] = 1 || options["recordKeys"] = true)
    } else {
        global g_Config
        if (g_Config.Has("autoClicker")) {
            ac := g_Config["autoClicker"]
            if (ac.Has("recordTechnique"))
                tech := ac["recordTechnique"]
            if (ac.Has("pollingRate"))
                rate := Max(5, Integer(ac["pollingRate"]))
            if (ac.Has("recordKeys"))
                recKeys := (ac["recordKeys"] = 1 || ac["recordKeys"] = true)
        }
    }

    g_MouseRecordTechnique := (tech = "hook") ? "hook" : "polling"
    g_MouseRecordPollingRate := rate
    g_MouseRecordKeys := recKeys
    g_MouseRecordedEvents := []
    g_MouseRecordActive := true
    g_MouseRecordLastTime := A_TickCount
    g_MouseRecordLastX := -1
    g_MouseRecordLastY := -1

    global g_MouseRecordBtnStates, g_MousePollLastL, g_MousePollLastR, g_MousePollLastM
    g_MouseRecordBtnStates := Map()
    g_MousePollLastL := GetKeyState("LButton", "P")
    g_MousePollLastR := GetKeyState("RButton", "P")
    g_MousePollLastM := GetKeyState("MButton", "P")

    ; Capture active window for window-relative playback
    try {
        g_MouseRecordWinHwnd := WinActive("A")
        if (g_MouseRecordWinHwnd)
            WinGetPos(&g_MouseRecordWinX, &g_MouseRecordWinY, , , g_MouseRecordWinHwnd)
    } catch {
        g_MouseRecordWinHwnd := 0
        g_MouseRecordWinX := 0
        g_MouseRecordWinY := 0
    }

    CoordMode("Mouse", "Screen")
    MouseGetPos(&initX, &initY)
    g_MouseRecordLastX := initX
    g_MouseRecordLastY := initY
    g_MouseRecordedEvents.Push(Map("type", "move", "x", initX, "y", initY, "delay", 0))

    ; Install mouse click capture across all techniques
    InstallMouseClickCapture()

    if (g_MouseRecordTechnique = "hook") {
        StartMouseHookRecord()
    } else {
        StartMousePollingRecord(g_MouseRecordPollingRate)
    }

    if (g_MouseRecordKeys) {
        try {
            g_MouseKeyHook := InputHook("V I1")
            g_MouseKeyHook.KeyOpt("{All}", "N")
            g_MouseKeyHook.OnKeyDown := OnRecordedKeyDown
            g_MouseKeyHook.OnKeyUp := OnRecordedKeyUp
            g_MouseKeyHook.Start()
        } catch {
            g_MouseKeyHook := ""
        }
    }

    EnableEmergencyEscHotkey()
    SoundBeep(1200, 70)
    NotifyWebMouseRecordState(true)
}

StopMouseRecording() {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordTechnique, g_Wv, g_MouseKeyHook, g_MainGui,
        g_MouseRecordCountdownActive

    if (g_MouseRecordCountdownActive) {
        g_MouseRecordCountdownActive := false
        HideMouseOSD()
        NotifyWebMouseCountdown(false, 0)
        SoundBeep(450, 90)
    }

    if (!g_MouseRecordActive)
        return

    g_MouseRecordActive := false
    HideMouseOSD()
    DisableEmergencyEscHotkey()
    RemoveMouseClickCapture()

    if (g_MouseKeyHook) {
        try g_MouseKeyHook.Stop()
        g_MouseKeyHook := ""
    }

    if (g_MouseRecordTechnique = "hook") {
        StopMouseHookRecord()
    } else {
        StopMousePollingRecord()
    }

    ; Clean up stray stop clicks if the user clicked the stop button in the UI
    if (g_MainGui) {
        try {
            WinGetPos(&gx, &gy, &gw, &gh, g_MainGui.Hwnd)
            while (g_MouseRecordedEvents.Length > 0) {
                lastEv := g_MouseRecordedEvents[g_MouseRecordedEvents.Length]
                if (IsObject(lastEv) && lastEv.Has("type") && lastEv["type"] = "click") {
                    cx := lastEv.Has("x") ? lastEv["x"] : -1
                    cy := lastEv.Has("y") ? lastEv["y"] : -1
                    if (cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh) {
                        g_MouseRecordedEvents.Pop()
                        continue
                    }
                }
                break
            }
        }
    }

    ; If any button was left in "Down" state at the end of recording, synthesize the "Up" release
    global g_MouseRecordBtnStates
    if (IsSet(g_MouseRecordBtnStates) && IsObject(g_MouseRecordBtnStates)) {
        for btn, st in g_MouseRecordBtnStates {
            if (st = "Down") {
                CoordMode("Mouse", "Screen")
                MouseGetPos(&upX, &upY)
                g_MouseRecordedEvents.Push(Map("type", "click", "btn", btn, "action", "Up", "x", upX, "y", upY, "delay",
                    10))
            }
        }
        g_MouseRecordBtnStates := Map()
    }

    SoundBeep(700, 70)
    NotifyWebMouseRecordState(false)

    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "mouseRecordedPath",
                "events", g_MouseRecordedEvents
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

OnRecordedKeyDown(ih, vk, sc) {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime
    if (!g_MouseRecordActive)
        return
    kName := GetKeyName(Format("vk{:x}sc{:x}", vk, sc))
    if (kName = "" || kName = "Escape" || kName = "Esc")
        return
    tNow := A_TickCount
    delta := Max(1, tNow - g_MouseRecordLastTime)
    g_MouseRecordedEvents.Push(Map("type", "key", "key", kName, "action", "Down", "delay", delta))
    g_MouseRecordLastTime := tNow
}

OnRecordedKeyUp(ih, vk, sc) {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime
    if (!g_MouseRecordActive)
        return
    kName := GetKeyName(Format("vk{:x}sc{:x}", vk, sc))
    if (kName = "" || kName = "Escape" || kName = "Esc")
        return
    tNow := A_TickCount
    delta := Max(1, tNow - g_MouseRecordLastTime)
    g_MouseRecordedEvents.Push(Map("type", "key", "key", kName, "action", "Up", "delay", delta))
    g_MouseRecordLastTime := tNow
}

; --- Technique 1: High-Frequency Polling ---
StartMousePollingRecord(rate := 20) {
    SetTimer(OnMousePollTick, rate)
}

StopMousePollingRecord() {
    SetTimer(OnMousePollTick, 0)
}

OnMousePollTick() {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime, g_MouseRecordLastX, g_MouseRecordLastY
    global g_MousePollLastL, g_MousePollLastR, g_MousePollLastM
    if (!g_MouseRecordActive) {
        SetTimer(OnMousePollTick, 0)
        return
    }

    ; 1. Poll physical button states to reliably capture click-and-hold across all windows
    curL := GetKeyState("LButton", "P")
    if (curL != g_MousePollLastL) {
        g_MousePollLastL := curL
        RecordMouseClickAction("Left", curL ? "Down" : "Up")
    }
    curR := GetKeyState("RButton", "P")
    if (curR != g_MousePollLastR) {
        g_MousePollLastR := curR
        RecordMouseClickAction("Right", curR ? "Down" : "Up")
    }
    curM := GetKeyState("MButton", "P")
    if (curM != g_MousePollLastM) {
        g_MousePollLastM := curM
        RecordMouseClickAction("Middle", curM ? "Down" : "Up")
    }

    ; 2. Poll cursor position
    CoordMode("Mouse", "Screen")
    MouseGetPos(&x, &y)
    if (x != g_MouseRecordLastX || y != g_MouseRecordLastY) {
        tNow := A_TickCount
        delta := Max(1, tNow - g_MouseRecordLastTime)
        g_MouseRecordedEvents.Push(Map("type", "move", "x", x, "y", y, "delay", delta))
        g_MouseRecordLastX := x
        g_MouseRecordLastY := y
        g_MouseRecordLastTime := tNow
    }
}

InstallMouseClickCapture() {
    global g_ClickHotkeysActive
    if (g_ClickHotkeysActive)
        return
    try {
        HotIf() ; Clear any active #HotIf criteria so hotkeys are 100% global!
        Hotkey("~*LButton", OnRecordedLButtonDown, "On")
        Hotkey("~*LButton Up", OnRecordedLButtonUp, "On")
        Hotkey("~*RButton", OnRecordedRButtonDown, "On")
        Hotkey("~*RButton Up", OnRecordedRButtonUp, "On")
        Hotkey("~*MButton", OnRecordedMButtonDown, "On")
        Hotkey("~*MButton Up", OnRecordedMButtonUp, "On")
        Hotkey("~*XButton1", OnRecordedXButton1Down, "On")
        Hotkey("~*XButton1 Up", OnRecordedXButton1Up, "On")
        Hotkey("~*XButton2", OnRecordedXButton2Down, "On")
        Hotkey("~*XButton2 Up", OnRecordedXButton2Up, "On")
        Hotkey("~*WheelUp", OnRecordedWheelUp, "On")
        Hotkey("~*WheelDown", OnRecordedWheelDown, "On")
        g_ClickHotkeysActive := true
    }
}

RemoveMouseClickCapture() {
    global g_ClickHotkeysActive
    if (g_ClickHotkeysActive) {
        try {
            HotIf()
            Hotkey("~*LButton", "Off")
            Hotkey("~*LButton Up", "Off")
            Hotkey("~*RButton", "Off")
            Hotkey("~*RButton Up", "Off")
            Hotkey("~*MButton", "Off")
            Hotkey("~*MButton Up", "Off")
            Hotkey("~*XButton1", "Off")
            Hotkey("~*XButton1 Up", "Off")
            Hotkey("~*XButton2", "Off")
            Hotkey("~*XButton2 Up", "Off")
            Hotkey("~*WheelUp", "Off")
            Hotkey("~*WheelDown", "Off")
        }
        g_ClickHotkeysActive := false
    }
}

OnRecordedLButtonDown(*) => RecordMouseClickAction("Left", "Down")
OnRecordedLButtonUp(*) => RecordMouseClickAction("Left", "Up")
OnRecordedRButtonDown(*) => RecordMouseClickAction("Right", "Down")
OnRecordedRButtonUp(*) => RecordMouseClickAction("Right", "Up")
OnRecordedMButtonDown(*) => RecordMouseClickAction("Middle", "Down")
OnRecordedMButtonUp(*) => RecordMouseClickAction("Middle", "Up")
OnRecordedXButton1Down(*) => RecordMouseClickAction("XButton1", "Down")
OnRecordedXButton1Up(*) => RecordMouseClickAction("XButton1", "Up")
OnRecordedXButton2Down(*) => RecordMouseClickAction("XButton2", "Down")
OnRecordedXButton2Up(*) => RecordMouseClickAction("XButton2", "Up")
OnRecordedWheelUp(*) => RecordMouseClickAction("WheelUp", "Click")
OnRecordedWheelDown(*) => RecordMouseClickAction("WheelDown", "Click")

RecordMouseClickAction(btn, act) {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime, g_MouseRecordLastX, g_MouseRecordLastY
    global g_MouseRecordBtnStates
    if (!g_MouseRecordActive)
        return

    if (!IsSet(g_MouseRecordBtnStates) || !IsObject(g_MouseRecordBtnStates))
        g_MouseRecordBtnStates := Map()

    ; Avoid recording redundant duplicate Down or Up for the same button
    if (act = "Down" || act = "Up") {
        if (g_MouseRecordBtnStates.Has(btn) && g_MouseRecordBtnStates[btn] = act)
            return
        g_MouseRecordBtnStates[btn] := act
    }

    CoordMode("Mouse", "Screen")
    MouseGetPos(&x, &y)
    tNow := A_TickCount
    delta := Max(1, tNow - g_MouseRecordLastTime)
    g_MouseRecordedEvents.Push(Map("type", "click", "btn", btn, "action", act, "x", x, "y", y, "delay", delta))
    g_MouseRecordLastX := x
    g_MouseRecordLastY := y
    g_MouseRecordLastTime := tNow
}

; --- Technique 2: Low-Level Windows Hook (WH_MOUSE_LL) ---
StartMouseHookRecord() {
    global g_MouseHookHandle, g_MouseHookCallback
    if (g_MouseHookHandle)
        StopMouseHookRecord()
    g_MouseHookCallback := CallbackCreate(LowLevelMouseProc, "Fast", 3)
    hMod := DllCall("GetModuleHandle", "Ptr", 0, "Ptr")
    g_MouseHookHandle := DllCall("SetWindowsHookEx", "Int", 14, "Ptr", g_MouseHookCallback, "Ptr", hMod, "UInt", 0,
        "Ptr")
}

StopMouseHookRecord() {
    global g_MouseHookHandle, g_MouseHookCallback
    if (g_MouseHookHandle) {
        DllCall("UnhookWindowsHookEx", "Ptr", g_MouseHookHandle)
        g_MouseHookHandle := 0
    }
    if (g_MouseHookCallback) {
        CallbackFree(g_MouseHookCallback)
        g_MouseHookCallback := 0
    }
}

LowLevelMouseProc(nCode, wParam, lParam) {
    global g_MouseRecordActive, g_MouseRecordedEvents, g_MouseRecordLastTime, g_MouseRecordLastX, g_MouseRecordLastY
    if (nCode >= 0 && g_MouseRecordActive) {
        ; 0x0200 = WM_MOUSEMOVE
        if (wParam = 0x0200) {
            x := NumGet(lParam, 0, "Int")
            y := NumGet(lParam, 4, "Int")
            if (x != g_MouseRecordLastX || y != g_MouseRecordLastY) {
                tNow := A_TickCount
                delta := Max(1, tNow - g_MouseRecordLastTime)
                g_MouseRecordedEvents.Push(Map("type", "move", "x", x, "y", y, "delay", delta))
                g_MouseRecordLastX := x
                g_MouseRecordLastY := y
                g_MouseRecordLastTime := tNow
            }
        } else if (wParam = 0x0201) { ; WM_LBUTTONDOWN
            RecordMouseClickAction("Left", "Down")
        } else if (wParam = 0x0202) { ; WM_LBUTTONUP
            RecordMouseClickAction("Left", "Up")
        } else if (wParam = 0x0204) { ; WM_RBUTTONDOWN
            RecordMouseClickAction("Right", "Down")
        } else if (wParam = 0x0205) { ; WM_RBUTTONUP
            RecordMouseClickAction("Right", "Up")
        } else if (wParam = 0x0207) { ; WM_MBUTTONDOWN
            RecordMouseClickAction("Middle", "Down")
        } else if (wParam = 0x0208) { ; WM_MBUTTONUP
            RecordMouseClickAction("Middle", "Up")
        } else if (wParam = 0x020A) { ; WM_MOUSEWHEEL
            mouseData := NumGet(lParam, 8, "UInt")
            wheelDelta := (mouseData >> 16) & 0xFFFF
            if (wheelDelta > 0x7FFF)
                RecordMouseClickAction("WheelDown", "Click")
            else
                RecordMouseClickAction("WheelUp", "Click")
        } else if (wParam = 0x020B) { ; WM_XBUTTONDOWN
            mouseData := NumGet(lParam, 8, "UInt")
            xBtn := (((mouseData >> 16) = 1) ? "XButton1" : "XButton2")
            RecordMouseClickAction(xBtn, "Down")
        } else if (wParam = 0x020C) { ; WM_XBUTTONUP
            mouseData := NumGet(lParam, 8, "UInt")
            xBtn := (((mouseData >> 16) = 1) ? "XButton1" : "XButton2")
            RecordMouseClickAction(xBtn, "Up")
        }
    }
    return DllCall("CallNextHookEx", "Ptr", 0, "Int", nCode, "Ptr", wParam, "Ptr", lParam, "Ptr")
}

; --- Playback Engine & Emergency Stop ---
ResponsivePlaybackSleep(ms) {
    global g_MousePlaybackStopReq
    if (ms <= 0 || g_MousePlaybackStopReq)
        return
    if (ms <= 15) {
        Sleep(ms)
        return
    }
    endTick := A_TickCount + ms
    while (A_TickCount < endTick && !g_MousePlaybackStopReq) {
        remain := endTick - A_TickCount
        Sleep(Min(15, remain))
    }
}

EnableEmergencyEscHotkey() {
    global g_EmergencyEscActive
    if (!g_EmergencyEscActive) {
        try {
            Hotkey("*Esc", OnMouseEmergencyStopHotkeyPressed, "On")
            g_EmergencyEscActive := true
        }
    }
}

DisableEmergencyEscHotkey() {
    global g_EmergencyEscActive, g_MousePlaybackActive, g_MouseRecordActive, g_AutoClickerRunning,
        g_MouseRecordCountdownActive
    if (!g_MousePlaybackActive && !g_MouseRecordActive && !g_AutoClickerRunning && !g_MouseRecordCountdownActive) {
        if (g_EmergencyEscActive) {
            try {
                Hotkey("*Esc", "Off")
                g_EmergencyEscActive := false
            }
        }
    }
}

OnMouseEmergencyStopHotkeyPressed(*) {
    global g_MousePlaybackActive, g_MouseRecordActive, g_AutoClickerRunning, g_MouseRecordCountdownActive
    stopped := false
    if (g_MouseRecordCountdownActive) {
        g_MouseRecordCountdownActive := false
        HideMouseOSD()
        NotifyWebMouseCountdown(false, 0)
        stopped := true
    }
    if (g_MousePlaybackActive) {
        StopMousePlayback()
        stopped := true
    }
    if (g_MouseRecordActive) {
        StopMouseRecording()
        stopped := true
    }
    if (g_AutoClickerRunning) {
        StopAutoClicker()
        stopped := true
    }
    if (stopped)
        SoundBeep(650, 90)
}

PlayRecordedMousePath(events, speed := 1.0, loopCount := 1, originMode := "absolute", clicksOnly := false, humanize :=
    false, emergencyStop := false, countdown := 0, scriptId := "") {
    global g_MousePlaybackActive, g_MousePlaybackStopReq, g_MouseRecordWinX, g_MouseRecordWinY, g_MousePlaybackScriptId
    if (!IsObject(events) || events.Length = 0 || g_MousePlaybackActive)
        return

    g_MousePlaybackActive := true
    g_MousePlaybackScriptId := scriptId
    g_MousePlaybackStopReq := false
    EnableEmergencyEscHotkey()
    NotifyWebMousePlayback(true, scriptId)

    ; Playback countdown with On-Screen Display if configured
    if (countdown > 0) {
        c := countdown
        while (c > 0 && !g_MousePlaybackStopReq) {
            ShowMouseOSD("MOUSE PLAYBACK IN", c . "s")
            SoundBeep(850, 90)
            loop 10 {
                Sleep(100)
                if (g_MousePlaybackStopReq) {
                    HideMouseOSD()
                    SoundBeep(450, 90)
                    return
                }
            }
            c--
        }
        if (g_MousePlaybackStopReq) {
            HideMouseOSD()
            return
        }
        ShowMouseOSD("MOUSE PLAYBACK", "PLAYBACK STARTED!", true, 800)
        SoundBeep(1300, 120)
    }

    ; Elevate Windows multimedia timer resolution to 1ms for sub-millisecond precision playback
    DllCall("winmm\timeBeginPeriod", "UInt", 1)

    ; CRITICAL: Disable AutoHotkey's internal 10ms post-move/post-click sleep.
    ; Without this, AutoHotkey's hook architecture forces a 10-15ms sleep after EVERY MouseMove/Click,
    ; completely destroying high-speed playback (e.g. 50x taking 16s instead of 0.2s)!
    prevMouseDelay := A_MouseDelay
    prevDefaultMouseSpeed := A_DefaultMouseSpeed
    prevKeyDelay := A_KeyDelay
    SetMouseDelay(-1)
    SetDefaultMouseSpeed(0)
    SetKeyDelay(-1, -1)

    speedMultiplier := (speed > 0) ? Float(speed) : 1.0
    CoordMode("Mouse", "Screen")

    isRelative := (originMode = "relative")
    isWindow := (originMode = "window")
    originBaseX := 0
    originBaseY := 0
    firstRecX := 0
    firstRecY := 0

    if (isRelative || isWindow) {
        MouseGetPos(&originBaseX, &originBaseY)
        for ev in events {
            if (IsObject(ev) && ev.Has("x") && ev.Has("y")) {
                firstRecX := Integer(ev["x"])
                firstRecY := Integer(ev["y"])
                break
            }
        }
    }

    lastSetX := -1
    lastSetY := -1
    heldButtons := Map("Left", false, "Right", false, "Middle", false, "XButton1", false, "XButton2", false)

    try {
        ; Countdown with audible beeps if configured
        if (countdown > 0) {
            c := countdown
            while (c > 0 && !g_MousePlaybackStopReq) {
                SoundBeep(800, 100)
                ResponsivePlaybackSleep(900)
                c--
            }
            if (g_MousePlaybackStopReq)
                return
            SoundBeep(1200, 150)
        }

        currentLoop := 0
        delayAccum := 0.0

        while ((currentLoop < loopCount || loopCount = 0) && !g_MousePlaybackStopReq) {
            ; In relative mode on subsequent loops, refresh base position
            if (isRelative && currentLoop > 0) {
                MouseGetPos(&originBaseX, &originBaseY)
            }

            ; In window mode, refresh active window position
            curWinX := 0
            curWinY := 0
            if (isWindow) {
                try {
                    WinGetPos(&curWinX, &curWinY, , , "A")
                } catch {
                    curWinX := 0
                    curWinY := 0
                }
            }

            delayAccum := 0.0
            for ev in events {
                if (g_MousePlaybackStopReq)
                    break 2
                if (!IsObject(ev))
                    continue

                t := ev.Has("type") ? ev["type"] : "move"

                ; Emergency Hand-Move Stop detection: check periodically to avoid Win32 syscall flood on ultra-high speed (50x)
                if (emergencyStop && lastSetX >= 0 && lastSetY >= 0 && (delayAccum >= 1.0 || (A_Index & 7) = 0)) {
                    MouseGetPos(&physX, &physY)
                    distSq := (physX - lastSetX) ** 2 + (physY - lastSetY) ** 2
                    if (distSq > 400) { ; > 20 pixels physical move
                        SoundBeep(600, 120)
                        break 2
                    }
                }

                ; Skip movement travel events if Clicks-Only Instant Warp mode is active, UNLESS a button is currently held down (drag)
                isAnyHeld := (heldButtons["Left"] || heldButtons["Right"] || heldButtons["Middle"] || heldButtons[
                    "XButton1"] || heldButtons["XButton2"])
                if (clicksOnly && t = "move" && !isAnyHeld)
                    continue

                if (t = "move") {
                    x := ev.Has("x") ? Integer(ev["x"]) : 0
                    y := ev.Has("y") ? Integer(ev["y"]) : 0

                    if (humanize) {
                        x += Random(-1, 1)
                        y += Random(-1, 1)
                    }

                    if (isRelative) {
                        targetX := originBaseX + (x - firstRecX)
                        targetY := originBaseY + (y - firstRecY)
                    } else if (isWindow) {
                        targetX := curWinX + (x - g_MouseRecordWinX)
                        targetY := curWinY + (y - g_MouseRecordWinY)
                    } else {
                        targetX := x
                        targetY := y
                    }

                    ; MouseMove generates the native Windows input events (WM_MOUSEMOVE with MK_LBUTTON / MK_RBUTTON) so drags and holds work in all windows, drawing programs, and games!
                    MouseMove(targetX, targetY, 0)
                    DllCall("SetCursorPos", "Int", targetX, "Int", targetY)
                    lastSetX := targetX
                    lastSetY := targetY

                } else if (t = "click") {
                    ; Move cursor to click position first
                    if (ev.Has("x") && ev.Has("y")) {
                        cx := Integer(ev["x"])
                        cy := Integer(ev["y"])
                        if (isRelative) {
                            cx := originBaseX + (cx - firstRecX)
                            cy := originBaseY + (cy - firstRecY)
                        } else if (isWindow) {
                            cx := curWinX + (cx - g_MouseRecordWinX)
                            cy := curWinY + (cy - g_MouseRecordWinY)
                        }
                        MouseMove(cx, cy, 0)
                        DllCall("SetCursorPos", "Int", cx, "Int", cy)
                        lastSetX := cx
                        lastSetY := cy
                    }

                    btn := ev.Has("btn") ? ev["btn"] : "Left"
                    act := ev.Has("action") ? ev["action"] : "Click"
                    if (btn = "WheelUp") {
                        Click("WheelUp")
                    } else if (btn = "WheelDown") {
                        Click("WheelDown")
                    } else {
                        clickBtn := (btn = "Right") ? "Right" : ((btn = "Middle") ? "Middle" : ((btn = "XButton1") ?
                            "X1" : ((btn = "XButton2") ? "X2" : "Left")))
                        if (act = "Down") {
                            Click("Down " . clickBtn)
                            heldButtons[btn] := true
                        } else if (act = "Up") {
                            Click("Up " . clickBtn)
                            heldButtons[btn] := false
                        } else {
                            Click(clickBtn)
                        }
                    }
                } else if (t = "key") {
                    k := ev.Has("key") ? ev["key"] : ""
                    act := ev.Has("action") ? ev["action"] : "Down"
                    if (k != "") {
                        SendEvent("{" . k . " " . act . "}")
                    }
                }

                ; Calculate precise speed-scaled delay using fractional accumulator
                del := ev.Has("delay") ? Float(ev["delay"]) : 10.0
                scaledDelay := del / speedMultiplier
                if (humanize && scaledDelay > 4.0) {
                    scaledDelay *= (1.0 + Random(-15, 15) / 100.0)
                }

                delayAccum += scaledDelay
                if (delayAccum >= 1.0) {
                    msToSleep := Integer(delayAccum)
                    delayAccum -= msToSleep
                    ResponsivePlaybackSleep(msToSleep)
                    if (g_MousePlaybackStopReq)
                        break 2
                }
            }
            currentLoop++
        }
    } finally {
        ; Restore Windows multimedia timer resolution and AHK delays
        DllCall("winmm\timeEndPeriod", "UInt", 1)
        try SetMouseDelay(prevMouseDelay)
        try SetDefaultMouseSpeed(prevDefaultMouseSpeed)
        try SetKeyDelay(prevKeyDelay)

        ; Safety release any buttons that were held down during playback
        try {
            if (heldButtons["Left"] && GetKeyState("LButton"))
                Click("Up Left")
            if (heldButtons["Right"] && GetKeyState("RButton"))
                Click("Up Right")
            if (heldButtons["Middle"] && GetKeyState("MButton"))
                Click("Up Middle")
            if (heldButtons["XButton1"] && GetKeyState("XButton1"))
                Click("Up X1")
            if (heldButtons["XButton2"] && GetKeyState("XButton2"))
                Click("Up X2")
        }
        g_MousePlaybackActive := false
        g_MousePlaybackScriptId := ""
        g_MousePlaybackStopReq := false
        DisableEmergencyEscHotkey()
        NotifyWebMousePlayback(false, "")
    }
}

StopMousePlayback() {
    global g_MousePlaybackActive, g_MousePlaybackStopReq, g_MousePlaybackScriptId
    if (!g_MousePlaybackActive)
        return

    g_MousePlaybackStopReq := true
    g_MousePlaybackActive := false
    g_MousePlaybackScriptId := ""
    HideMouseOSD()
    NotifyWebMousePlayback(false, "")
    SoundBeep(650, 80)
    DisableEmergencyEscHotkey()
}

NotifyWebMouseRecordState(isRecording) {
    global g_Wv
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "mouseRecordingState",
                "recording", isRecording
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

NotifyWebMousePlayback(isPlaying, scriptId := "") {
    global g_Wv
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "mousePlaybackState",
                "playing", isPlaying,
                "scriptId", scriptId
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

