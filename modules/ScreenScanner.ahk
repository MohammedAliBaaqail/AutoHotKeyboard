; ==============================================================================
; Screen Scanner & Pattern Detection Module
; ==============================================================================

ApplyScreenScanner() {
    global g_Config, g_ActiveScanningItems, g_ScreenScannerActive, g_IsEngineActive, g_ActiveHotkeys

    StopScreenScanner()

    if (!g_IsEngineActive)
        return

    if (!g_Config.Has("screenScanner"))
        return

    ss := g_Config["screenScanner"]
    if (ss.Has("enabled") && (!ss["enabled"] || ss["enabled"] = "0"))
        return

    ; 1. Master hotkey removed - only individual script shortcuts are registered below
    if (!ss.Has("items") || !IsObject(ss["items"]) || ss["items"].Length = 0)
        return

    ; 2. Register individual shortcut triggers for each configured visual trigger item
    for item in ss["items"] {
        if (IsObject(item) && item.Has("trigger") && Trim(item["trigger"]) != "") {
            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1)
            if (isEnabled && g_IsEngineActive) {
                try {
                    RegisterSingleScreenScannerTrigger(item)
                } catch as err {
                    LogMessage("Screen scanner hotkey error for " . item["trigger"] . ": " . err.Message)
                }
            }
        }
    }
}

ToggleScreenScannerMaster() {
    global g_IsEngineActive, g_Config, g_ActiveScanningItems, g_ScreenScannerActive, g_ScreenScannerLastTriggerTime,
        g_ScreenScannerLastFoundState, g_Wv

    if (!g_IsEngineActive)
        return

    ; If ALREADY scanning, toggle off and stop all scanning!
    if (g_ScreenScannerActive && g_ActiveScanningItems.Count > 0) {
        StopScreenScanner()
        ShowMouseOSD("SCREEN SCANNER", "Scanning Stopped", false, 1200)
        SoundBeep(450, 80)
        NotifyWebScreenScannerMasterState(false)
        return
    }

    ; Otherwise: Start scanning all enabled visual triggers!
    if (!g_Config.Has("screenScanner"))
        return
    ss := g_Config["screenScanner"]
    if (!ss.Has("items") || !IsObject(ss["items"]) || ss["items"].Length = 0) {
        ShowMouseOSD("SCREEN SCANNER", "No Visual Triggers configured", false, 1500)
        return
    }

    g_ActiveScanningItems.Clear()
    enabledCount := 0
    for item in ss["items"] {
        if (IsObject(item) && (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1)) {
            itemId := item.Has("id") ? item["id"] : ("ss-" . A_Index)
            g_ActiveScanningItems[itemId] := item
            g_ScreenScannerLastTriggerTime[itemId] := 0
            g_ScreenScannerLastFoundState[itemId] := false
            enabledCount++
        }
    }

    if (enabledCount = 0) {
        ShowMouseOSD("SCREEN SCANNER", "All Visual Triggers are disabled", false, 1500)
        return
    }

    rate := ss.Has("scanRate") ? Max(30, Integer(ss["scanRate"])) : 150
    g_ScreenScannerActive := true
    SetTimer(CheckScreenScannerRules, rate)

    ShowMouseOSD("SCREEN SCANNER", "Scanning Started (" . enabledCount . " Triggers)", true, 1400)
    SoundBeep(850, 100)
    NotifyWebScreenScannerMasterState(true)
}

NotifyWebScreenScannerMasterState(isRunning) {
    global g_Wv, g_ActiveScanningItems
    if (!g_Wv)
        return
    activeIds := []
    for k, v in g_ActiveScanningItems {
        activeIds.Push(k)
    }
    try {
        g_Wv.PostWebMessageAsString(JSON.stringify(Map(
            "type", "screenScannerMasterState",
            "running", isRunning,
            "count", g_ActiveScanningItems.Count,
            "activeItemIds", activeIds
        )))
    }
}

RegisterSingleScreenScannerTrigger(item) {
    trig := Trim(item["trigger"])
    if (trig = "")
        return

    RegisterUniversalHotkey(trig, (*) => ToggleScreenScannerItem(item))
}

ToggleScreenScannerItem(item) {
    global g_IsEngineActive, g_Config, g_ActiveScanningItems, g_ScreenScannerActive, g_ScreenScannerLastTriggerTime,
        g_ScreenScannerLastFoundState, g_Wv

    if (!g_IsEngineActive)
        return

    itemId := item.Has("id") ? item["id"] : ""
    if (itemId = "")
        return

    ruleName := (item.Has("name") && Trim(item["name"]) != "") ? item["name"] : "Visual Trigger"
    repeatRule := item.Has("repeatRule") ? item["repeatRule"] : "debounce"

    ; If this item is ALREADY scanning, pressing the same shortcut STOPS it immediately!
    if (g_ActiveScanningItems.Has(itemId)) {
        g_ActiveScanningItems.Delete(itemId)
        if (g_ActiveScanningItems.Count = 0) {
            StopScreenScanner()
        }
        ; If playback/macro was triggered by this rule, stop it
        if (item.Has("actionType") && item["actionType"] = "mouseScript") {
            try StopMousePlayback()
        } else if (item.Has("actionType") && item["actionType"] = "macro") {
            try StopAllMacros()
        }
        if (!item.Has("osdAlert") || item["osdAlert"] = true || item["osdAlert"] = 1) {
            ShowMouseOSD("SCREEN SCANNER", ruleName . " (Scanner Stopped)", false, 1200)
        }
        if (item.Has("soundAlert") && (item["soundAlert"] = true || item["soundAlert"] = 1)) {
            SoundBeep(450, 80)
        }
        if (g_Wv) {
            try {
                g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                    "type", "screenScannerScanningStopped",
                    "id", itemId,
                    "name", ruleName,
                    "reason", "userStopped"
                )))
            }
        }
        NotifyWebScreenScannerMasterState(g_ScreenScannerActive && g_ActiveScanningItems.Count > 0)
        return
    }

    ; Otherwise: START scanning for this item!
    g_ActiveScanningItems[itemId] := item
    g_ScreenScannerLastTriggerTime[itemId] := 0
    g_ScreenScannerLastFoundState[itemId] := false

    ; Ensure scanning timer is running
    ss := g_Config.Has("screenScanner") ? g_Config["screenScanner"] : Map()
    rate := ss.Has("scanRate") ? Max(30, Integer(ss["scanRate"])) : 150
    g_ScreenScannerActive := true
    SetTimer(CheckScreenScannerRules, rate)

    repLabel := (repeatRule = "once") ? "Once" : (repeatRule = "continuous" ? "Continuous" : "Cooldown")
    if (!item.Has("osdAlert") || item["osdAlert"] = true || item["osdAlert"] = 1) {
        ShowMouseOSD("SCREEN SCANNER", ruleName . " (Scanning " . repLabel . " started)", true, 1200)
    }
    if (item.Has("soundAlert") && (item["soundAlert"] = true || item["soundAlert"] = 1)) {
        SoundBeep(850, 100)
    }

    if (g_Wv) {
        try {
            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                "type", "screenScannerScanningStarted",
                "id", itemId,
                "name", ruleName,
                "repeatRule", repeatRule
            )))
        }
    }
    NotifyWebScreenScannerMasterState(true)
}

StopScreenScanner() {
    global g_ScreenScannerActive, g_ActiveScanningItems
    wasRunning := (g_ScreenScannerActive || g_ActiveScanningItems.Count > 0)
    g_ScreenScannerActive := false
    g_ActiveScanningItems.Clear()
    try SetTimer(CheckScreenScannerRules, 0)
    if (wasRunning) {
        NotifyWebScreenScannerMasterState(false)
    }
}

CheckScreenScannerRules() {
    global g_Config, g_ScreenScannerActive, g_ActiveScanningItems, g_ScreenScannerLastTriggerTime,
        g_ScreenScannerLastFoundState, g_Wv

    if (!g_ScreenScannerActive || g_ActiveScanningItems.Count = 0) {
        StopScreenScanner()
        return
    }

    nowTick := A_TickCount
    itemsToRemove := []

    for itemId, item in g_ActiveScanningItems {
        if (!IsObject(item))
            continue

        foundX := 0, foundY := 0
        isFound := ExecuteScreenScannerDetection(item, &foundX, &foundY)

        wasFound := g_ScreenScannerLastFoundState.Has(itemId) ? g_ScreenScannerLastFoundState[itemId] : false
        g_ScreenScannerLastFoundState[itemId] := isFound

        condition := item.Has("condition") ? item["condition"] : "appear"
        repeatRule := item.Has("repeatRule") ? item["repeatRule"] : "debounce"
        debounceMs := item.Has("debounceMs") ? Integer(item["debounceMs"]) : 2000
        lastTrig := g_ScreenScannerLastTriggerTime.Has(itemId) ? g_ScreenScannerLastTriggerTime[itemId] : 0

        shouldTrigger := false

        if (condition = "appear") {
            if (isFound) {
                if (repeatRule = "continuous") {
                    if (nowTick - lastTrig >= 100)
                        shouldTrigger := true
                } else if (repeatRule = "debounce") {
                    if (!wasFound || (nowTick - lastTrig >= debounceMs))
                        shouldTrigger := true
                } else if (repeatRule = "once") {
                    shouldTrigger := true
                }
            }
        } else if (condition = "disappear") {
            if (wasFound && !isFound) {
                if (repeatRule = "continuous") {
                    if (nowTick - lastTrig >= 100)
                        shouldTrigger := true
                } else if (repeatRule = "debounce") {
                    if (nowTick - lastTrig >= debounceMs)
                        shouldTrigger := true
                } else if (repeatRule = "once") {
                    shouldTrigger := true
                }
            }
        }

        if (shouldTrigger) {
            g_ScreenScannerLastTriggerTime[itemId] := nowTick
            FireScreenScannerAction(item, foundX, foundY)

            ; In "once" mode: automatically stop scanning as soon as the first match triggers!
            if (repeatRule = "once") {
                itemsToRemove.Push(itemId)
            }
        }
    }

    for delId in itemsToRemove {
        if (g_ActiveScanningItems.Has(delId)) {
            itemObj := g_ActiveScanningItems[delId]
            ruleName := itemObj.Has("name") ? itemObj["name"] : "Visual Trigger"
            g_ActiveScanningItems.Delete(delId)

            if (!itemObj.Has("osdAlert") || itemObj["osdAlert"] = true || itemObj["osdAlert"] = 1) {
                ShowMouseOSD("SCREEN SCANNER", ruleName . " (Matched & Finished)", true, 1200)
            }
            if (g_Wv) {
                try {
                    g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                        "type", "screenScannerScanningStopped",
                        "id", delId,
                        "name", ruleName,
                        "reason", "completedOnce"
                    )))
                }
            }
        }
    }

    if (g_ActiveScanningItems.Count = 0) {
        StopScreenScanner()
    } else if (itemsToRemove.Length > 0) {
        NotifyWebScreenScannerMasterState(true)
    }
}

ExecuteScreenScannerDetection(item, &foundX, &foundY) {
    foundX := 0
    foundY := 0

    mode := item.Has("mode") ? item["mode"] : "image"
    region := item.Has("region") ? item["region"] : "fullscreen"

    x1 := 0, y1 := 0, x2 := A_ScreenWidth, y2 := A_ScreenHeight
    coordModeType := "Screen"

    if (region = "activeWindow") {
        try {
            activeHwnd := WinActive("A")
            if (activeHwnd) {
                WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " . activeHwnd)
                x1 := wx, y1 := wy, x2 := wx + ww, y2 := wy + wh
            }
        }
    } else if (region = "custom") {
        if (item.Has("regionBox") && IsObject(item["regionBox"])) {
            box := item["regionBox"]
            x1 := box.Has("x1") ? Integer(box["x1"]) : 0
            y1 := box.Has("y1") ? Integer(box["y1"]) : 0
            x2 := box.Has("x2") ? Integer(box["x2"]) : A_ScreenWidth
            y2 := box.Has("y2") ? Integer(box["y2"]) : A_ScreenHeight
        }
    }

    if (x2 <= x1)
        x2 := x1 + 1
    if (y2 <= y1)
        y2 := y1 + 1

    CoordMode("Pixel", coordModeType)
    CoordMode("Mouse", coordModeType)

    if (mode = "image") {
        imgPath := item.Has("imagePath") ? Trim(item["imagePath"]) : ""
        if (imgPath = "" || !FileExist(imgPath))
            return false

        variation := item.Has("imageVariation") ? Integer(item["imageVariation"]) : 30
        trans := item.Has("imageTrans") ? Trim(item["imageTrans"]) : ""

        optStr := "*" . variation
        if (trans != "")
            optStr .= " *Trans" . trans

        try {
            outX := "", outY := ""
            if (ImageSearch(&outX, &outY, x1, y1, x2, y2, optStr . " " . imgPath)) {
                foundX := outX
                foundY := outY
                return true
            }
        }
        return false

    } else if (mode = "pixel") {
        colorStr := item.Has("pixelColor") ? Trim(item["pixelColor"]) : "#FF0000"
        colorHex := ParseColorToHex(colorStr)
        variation := item.Has("pixelVariation") ? Integer(item["pixelVariation"]) : 15

        try {
            outX := "", outY := ""
            if (PixelSearch(&outX, &outY, x1, y1, x2, y2, colorHex, variation)) {
                foundX := outX
                foundY := outY
                return true
            }
        }
        return false

    } else if (mode = "point") {
        ptX := item.Has("pointX") ? Integer(item["pointX"]) : 0
        ptY := item.Has("pointY") ? Integer(item["pointY"]) : 0
        expectedColor := item.Has("pointColor") ? Trim(item["pointColor"]) : "#00FF00"
        variation := item.Has("pixelVariation") ? Integer(item["pixelVariation"]) : 15

        try {
            currentColor := PixelGetColor(ptX, ptY, "RGB")
            if (CompareHexColorsWithTolerance(currentColor, expectedColor, variation)) {
                foundX := ptX
                foundY := ptY
                return true
            }
        }
        return false
    }

    return false
}

ParseColorToHex(colorStr) {
    clean := StrReplace(colorStr, "#", "")
    clean := StrReplace(clean, "0x", "")
    clean := StrReplace(clean, "0X", "")
    try {
        return Integer("0x" . clean)
    }
    return 0
}

CompareHexColorsWithTolerance(actualColorIntOrHex, targetColorStr, tolerance) {
    actInt := IsInteger(actualColorIntOrHex) ? actualColorIntOrHex : ParseColorToHex(actualColorIntOrHex)
    tgtInt := ParseColorToHex(targetColorStr)

    r1 := (actInt >> 16) & 0xFF, g1 := (actInt >> 8) & 0xFF, b1 := actInt & 0xFF
    r2 := (tgtInt >> 16) & 0xFF, g2 := (tgtInt >> 8) & 0xFF, b2 := tgtInt & 0xFF

    return (Abs(r1 - r2) <= tolerance && Abs(g1 - g2) <= tolerance && Abs(b1 - b2) <= tolerance)
}

FireScreenScannerAction(item, foundX, foundY) {
    global g_Wv

    actionType := item.Has("actionType") ? item["actionType"] : "click"
    ruleName := item.Has("name") ? item["name"] : "Screen Trigger"

    if (!item.Has("soundAlert") || item["soundAlert"] = true || item["soundAlert"] = 1) {
        SoundBeep(1200, 80)
    }

    if (!item.Has("osdAlert") || item["osdAlert"] = true || item["osdAlert"] = 1) {
        ShowMouseOSD("SCREEN SCANNER", ruleName . " (Matched)", true, 1200)
    }

    if (actionType = "click") {
        clickBtn := item.Has("clickButton") ? item["clickButton"] : "Left"
        offX := item.Has("clickOffsetX") ? Integer(item["clickOffsetX"]) : 0
        offY := item.Has("clickOffsetY") ? Integer(item["clickOffsetY"]) : 0

        targetX := foundX + offX
        targetY := foundY + offY

        CoordMode("Mouse", "Screen")
        MouseMove(targetX, targetY, 2)

        if (clickBtn = "Left") {
            Click("Left")
        } else if (clickBtn = "Right") {
            Click("Right")
        } else if (clickBtn = "Double") {
            Click("Left 2")
        } else if (clickBtn = "Middle") {
            Click("Middle")
        }

    } else if (actionType = "appLauncher") {
        appId := item.Has("appLauncherId") ? item["appLauncherId"] : ""
        if (appId != "") {
            cleanId := SubStr(appId, 1, 3) = "al-" ? appId : ("al-" . appId)
            ExecuteSystemAction(cleanId, "Screen Scanner: " . ruleName)
        }

    } else if (actionType = "mouseScript") {
        mScriptId := item.Has("mouseScriptId") ? item["mouseScriptId"] : ""
        if (mScriptId != "") {
            cleanId := SubStr(mScriptId, 1, 3) = "ms-" ? SubStr(mScriptId, 4) : mScriptId
            ExecuteSavedMouseScriptById(cleanId)
        }

    } else if (actionType = "macro") {
        macroId := item.Has("macroId") ? item["macroId"] : ""
        if (macroId != "") {
            cleanId := SubStr(macroId, 1, 6) = "macro-" ? SubStr(macroId, 7) : macroId
            ExecuteMacroById(cleanId)
        }

    } else if (actionType = "key") {
        keyStr := item.Has("keyToSend") ? Trim(item["keyToSend"]) : ""
        if (keyStr != "") {
            SendInput(keyStr)
        }

    } else if (actionType = "system") {
        sysAct := item.Has("systemAction") ? item["systemAction"] : "beep"
        if (sysAct = "sleep") {
            TriggerSleepOrHibernate()
        } else if (sysAct = "mute") {
            SoundSetMute(-1)
        } else if (sysAct = "beep") {
            SoundBeep(1500, 200)
        } else if (sysAct = "osd") {
            ; On-screen alert handled by notification
        } else {
            ExecuteSystemAction(sysAct, "Screen Scanner: " . ruleName)
        }
    }

    if (g_Wv) {
        try {
            mScriptId := item.Has("mouseScriptId") ? item["mouseScriptId"] : ""
            macroId := item.Has("macroId") ? item["macroId"] : ""
            dMs := (actionType = "mouseScript") ? 0 : (item.Has("debounceMs") ? Integer(item["debounceMs"]) : 2000)
            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                "type", "screenScannerTriggered",
                "id", item.Has("id") ? item["id"] : "",
                "name", ruleName,
                "x", foundX,
                "y", foundY,
                "action", actionType,
                "mouseScriptId", mScriptId,
                "macroId", macroId,
                "durationMs", dMs
            )))
        }
    }
}

ExecuteSavedMouseScriptById(sId) {
    global g_Config
    if (!g_Config.Has("autoClicker") || !g_Config["autoClicker"].Has("items"))
        return
    for item in g_Config["autoClicker"]["items"] {
        if (IsObject(item) && item.Has("id") && item["id"] = sId) {
            ExecuteMouseScript(item)
            return
        }
    }
}

ExecuteMacroById(macroId) {
    global g_Config
    if (!g_Config.Has("macroRecorder") || !g_Config["macroRecorder"].Has("items"))
        return
    for item in g_Config["macroRecorder"]["items"] {
        if (IsObject(item) && item.Has("id") && item["id"] = macroId) {
            if (item.Has("steps") && IsObject(item["steps"])) {
                SetTimer(() => PlayMacroSteps(item["steps"]), -1)
            }
            return
        }
    }
}

