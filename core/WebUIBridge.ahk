; ==============================================================================
; WebUI Message Dispatcher
; ==============================================================================

OnWebMessageReceived(thisPtr, senderPtr, argsPtr) {
    global g_MainGui, g_Wv, g_Config, g_IsEngineActive, CONFIG_FILE

    args := WebView2.WebMessageReceivedEventArgs(argsPtr)
    rawJson := args.TryGetWebMessageAsString()

    if (rawJson = "") {
        return
    }

    try {
        msg := JSON.parse(rawJson, false, true)
        action := msg.Has("action") ? msg["action"] : ""

        switch action {
            case "getInitialState":
                SendInitialStateToWeb()

            case "launchColorPicker":
                StartColorPicker()

            case "showProfileOsd":
                profName := msg.Has("profile") ? msg["profile"] : (g_Config.Has("activeProfile") ? g_Config[
                    "activeProfile"] : "Default")
                ProfileOsdHUD.ShowProfileHUD(profName)

            case "previewCornerZones":
                size := msg.Has("size") ? Integer(msg["size"]) : 14
                show := msg.Has("show") ? (msg["show"] = true || msg["show"] = 1) : true
                HotCornerPreviewHUD.ShowPreview(size, show)

            case "setColorFormat":
                if (msg.Has("format") && msg["format"] != "") {
                    global g_ColorPickerFormat
                    g_ColorPickerFormat := msg["format"]
                    if (!g_Config.Has("windowManager")) {
                        g_Config["windowManager"] := Map()
                    }
                    g_Config["windowManager"]["colorFormat"] := msg["format"]
                    SaveConfigToFile()
                }

            case "saveState":
                if (msg.Has("config") && IsObject(msg["config"])) {
                    newConfig := msg["config"]
                    if (g_Config.Has("window")) {
                        newConfig["window"] := g_Config["window"]
                    }
                    g_Config := newConfig
                    if (g_Config.Has("enabled")) {
                        g_IsEngineActive := (g_Config["enabled"] = true || g_Config["enabled"] = 1)
                    }
                    if (g_Config.Has("theme") && g_Config["theme"].Has("bgColor")) {
                        cleanHex := StrReplace(g_Config["theme"]["bgColor"], "#", "")
                        if (StrLen(cleanHex) = 6) {
                            try g_MainGui.BackColor := cleanHex
                        }
                    }
                    SaveConfigToFile()
                    ApplyAllModules()
                    ProfileAppScanner.EnsureAllProfileIcons()
                }

            case "startDrag":
                if (g_MainGui) {
                    DllCall("ReleaseCapture")
                    try {
                        isMax := (WinGetMinMax("ahk_id " . g_MainGui.Hwnd) = 1)
                        if (isMax) {
                            CoordMode("Mouse", "Screen")
                            MouseGetPos(&mX, &mY)
                            g_MainGui.Restore()
                            g_MainGui.GetPos(, , &wW, &wH)
                            newX := mX - (wW // 2)
                            newY := Max(0, mY - 20)
                            g_MainGui.Move(newX, newY)
                        }
                    }
                    PostMessage(0x0112, 0xF012, 0, g_MainGui.Hwnd) ; WM_SYSCOMMAND, SC_MOVE | HTCAPTION
                }

            case "startResize":
                dir := msg.Has("dir") ? msg["dir"] : "se"
                dirCode := 8
                switch dir {
                    case "w": dirCode := 1  ; Left
                    case "e": dirCode := 2  ; Right
                    case "n": dirCode := 3  ; Top
                    case "nw": dirCode := 4  ; Top-left
                    case "ne": dirCode := 5  ; Top-right
                    case "s": dirCode := 6  ; Bottom
                    case "sw": dirCode := 7  ; Bottom-left
                    case "se": dirCode := 8  ; Bottom-right
                }
                DllCall("ReleaseCapture")
                PostMessage(0x0112, 0xF000 + dirCode, 0, g_MainGui.Hwnd)

            case "runLauncher":
                if (msg.Has("target")) {
                    RunLauncherTarget("", msg["target"])
                }

            case "toggleAutoClicker":
                ToggleAutoClicker()

            case "startMouseRecording":
                opts := msg.Has("options") ? msg["options"] : msg
                cd := opts.Has("countdown") ? Integer(opts["countdown"]) : 0
                tech := opts.Has("technique") ? opts["technique"] : "polling"
                rate := opts.Has("rate") ? Integer(opts["rate"]) : 20
                recKeys := (!opts.Has("recordKeys") || opts["recordKeys"] = true || opts["recordKeys"] = 1)
                StartMouseRecordingWithCountdown(cd, tech, rate, recKeys)

            case "stopMouseRecording":
                StopMouseRecording()

            case "playRecordedMouse":
                events := msg.Has("events") ? msg["events"] : []
                spd := msg.Has("speed") ? Float(msg["speed"]) : 1.0
                loopCnt := msg.Has("loop") ? Integer(msg["loop"]) : 1
                origin := msg.Has("origin") ? msg["origin"] : "absolute"
                clicksOnly := (msg.Has("clicksOnly") && (msg["clicksOnly"] = 1 || msg["clicksOnly"] = true))
                humanize := (msg.Has("humanize") && (msg["humanize"] = 1 || msg["humanize"] = true))
                emergencyStop := (msg.Has("emergencyStop") && (msg["emergencyStop"] = 1 || msg["emergencyStop"] = true))
                countdown := msg.Has("countdown") ? Integer(msg["countdown"]) : 0
                sId := msg.Has("scriptId") ? msg["scriptId"] : (msg.Has("id") ? msg["id"] : "")
                SetTimer(() => PlayRecordedMousePath(events, spd, loopCnt, origin, clicksOnly, humanize, emergencyStop,
                    countdown, sId), -1)

            case "stopMousePlayback":
                StopMousePlayback()

            case "triggerSleep":
                TriggerSleepOrHibernate()

            case "cancelSleepTimer":
                CancelSleepTimer("Sleep timer cancelled.")

            case "startMacroRecording":
                opts := msg.Has("options") ? msg["options"] : msg
                StartMacroRecording(opts)

            case "setMacroRecordingOptions":
                global g_MacroRealDelays, g_MacroDefDelay
                if (msg.Has("realDelays"))
                    g_MacroRealDelays := (msg["realDelays"] = true || msg["realDelays"] = 1 || msg["realDelays"] =
                        "true")
                if (msg.Has("defDelay"))
                    g_MacroDefDelay := Max(10, Integer(msg["defDelay"]))

            case "stopMacroRecording":
                StopMacroRecording()

            case "testMacro":
                if (msg.Has("macro") && IsObject(msg["macro"])) {
                    mObj := msg["macro"]
                    st := mObj.Has("steps") ? mObj["steps"] : []
                    SetTimer(() => PlayMacroSteps(st), -1)
                }

            case "stopAllMacros":
                StopAllMacros()

            case "minimize":
                g_MainGui.Minimize()

            case "maximize":
                if (g_MainGui) {
                    try {
                        isMax := WinGetMinMax("ahk_id " . g_MainGui.Hwnd)
                        if (isMax = 1) {
                            g_MainGui.Restore()
                        } else {
                            g_MainGui.Maximize()
                        }
                    }
                }

            case "close":
                SetTimer(() => ExitApp(), -1)

            case "openLog":
                OpenDebugLog()

            case "reload":
                InitConfig()
                SendInitialStateToWeb()

            case "openConfig":
                try Run('explorer.exe /select,"' . CONFIG_FILE . '"')

            case "getStartupStatus":
                if (g_Wv) {
                    g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                        "type", "startupStatus",
                        "enabled", IsStartupEnabled(),
                        "isAdmin", !!A_IsAdmin
                    )))
                }

            case "toggleStartup":
                ToggleStartupFromTray()
                if (g_Wv) {
                    g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                        "type", "startupStatus",
                        "enabled", IsStartupEnabled(),
                        "isAdmin", !!A_IsAdmin
                    )))
                }

            case "restartAsAdmin":
                RestartAsAdmin()

            case "browseApp":
                try {
                    selectedFile := FileSelect(1, , "Select Application or Executable",
                        "Programs (*.exe; *.lnk; *.bat; *.cmd; *.com; *.ps1; *.vbs)|All Files (*.*)")
                    if (selectedFile != "") {
                        SplitPath(selectedFile, &outFileName, &outDir, &outExt, &outNameNoExt)
                        if (g_Wv) {
                            resMsg := JSON.stringify(Map(
                                "type", "appSelected",
                                "path", selectedFile,
                                "name", outNameNoExt
                            ))
                            g_Wv.PostWebMessageAsString(resMsg)
                        }
                    }
                } catch as err {
                    LogMessage("browseApp error: " . err.Message)
                }

            case "browseFolder":
                try {
                    selectedFolder := DirSelect(, 1, "Select Target Folder")
                    if (selectedFolder != "") {
                        if (g_Wv) {
                            resMsg := JSON.stringify(Map(
                                "type", "folderSelected",
                                "path", selectedFolder
                            ))
                            g_Wv.PostWebMessageAsString(resMsg)
                        }
                    }
                } catch as err {
                    LogMessage("browseFolder error: " . err.Message)
                }

            case "getActiveAppVolume":
                hwnd := GetActiveExternalWindow()
                if (hwnd) {
                    pid := WinGetPID("ahk_id " . hwnd)
                    procName := ""
                    try procName := ProcessGetName(pid)
                    vol := AudioSession.GetVolume(pid, &isMuted)
                    pct := vol >= 0 ? Round(vol * 100) : -1
                    if (g_Wv) {
                        g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                            "type", "activeAppVolumeChanged",
                            "pid", pid,
                            "name", procName,
                            "volume", pct,
                            "muted", isMuted
                        )))
                    }
                }

            case "setActiveAppVolume":
                hwnd := GetActiveExternalWindow()
                if (hwnd && msg.Has("volume")) {
                    pid := msg.Has("pid") && msg["pid"] > 0 ? msg["pid"] : WinGetPID("ahk_id " . hwnd)
                    volNorm := msg["volume"] / 100.0
                    AudioSession.SetVolume(pid, volNorm, false, &newVol, &isMuted)
                }

            case "toggleMuteActiveApp":
                ToggleActiveAppMute()

            case "getRunningApps":
                try {
                    apps := ProfileAppScanner.GetRunningApps()
                    if (g_Wv) {
                        g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                            "type", "runningAppsList",
                            "apps", apps
                        )))
                    }
                } catch as err {
                    LogMessage("getRunningApps error: " . err.Message)
                    if (g_Wv) {
                        try g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                            "type", "runningAppsList",
                            "apps", []
                        )))
                    }
                }

            case "browseProfileApp":
                try {
                    selectedFile := FileSelect(1, , "Select Target Application",
                        "Programs (*.exe; *.lnk; *.bat; *.cmd; *.com)|All Files (*.*)")
                    if (selectedFile != "") {
                        SplitPath(selectedFile, &outFileName, &outDir, &outExt, &outNameNoExt)
                        iconName := outNameNoExt
                        outDirPng := A_ScriptDir . "\ui\icons"
                        if (!DirExist(outDirPng)) {
                            try DirCreate(outDirPng)
                        }
                        iconPng := outDirPng . "\" . outNameNoExt . ".png"
                        if (!FileExist(iconPng)) {
                            ProfileAppScanner.ExtractExeIcon(selectedFile, iconPng)
                        }
                        if (g_Wv) {
                            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                                "type", "profileAppSelected",
                                "path", selectedFile,
                                "exe", outFileName,
                                "name", outNameNoExt,
                                "hasIcon", FileExist(iconPng) ? 1 : 0
                            )))
                        }
                    }
                } catch as err {
                    LogMessage("browseProfileApp error: " . err.Message)
                }

            case "toggleScreenScannerMaster":
                ToggleScreenScannerMaster()

            case "toggleScreenScannerItem":
                if (msg.Has("id") && g_Config.Has("screenScanner") && g_Config["screenScanner"].Has("items")) {
                    for item in g_Config["screenScanner"]["items"] {
                        if (IsObject(item) && item.Has("id") && item["id"] = msg["id"]) {
                            ToggleScreenScannerItem(item)
                            break
                        }
                    }
                }

            case "testScreenScan":
                if (msg.Has("item") && IsObject(msg["item"])) {
                    itemObj := msg["item"]
                    fX := 0, fY := 0
                    t0 := A_TickCount
                    found := ExecuteScreenScannerDetection(itemObj, &fX, &fY)
                    tElapsed := A_TickCount - t0
                    if (g_Wv) {
                        try {
                            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                                "type", "screenScanTestResult",
                                "id", itemObj.Has("id") ? itemObj["id"] : "",
                                "found", found ? 1 : 0,
                                "x", fX,
                                "y", fY,
                                "elapsedMs", tElapsed,
                                "mode", itemObj.Has("mode") ? itemObj["mode"] : "image"
                            )))
                        }
                    }
                }

            case "browseImageForScanner":
                try {
                    selectedFile := FileSelect(1, , "Select Target Template Image",
                        "Images (*.png; *.bmp; *.jpg; *.jpeg; *.gif)|All Files (*.*)")
                    if (selectedFile != "" && g_Wv) {
                        try {
                            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                                "type", "screenScannerImageSelected",
                                "path", selectedFile
                            )))
                        }
                    }
                } catch as err {
                    LogMessage("browseImageForScanner error: " . err.Message)
                }

            case "pickScreenColorForScanner":
                global g_ColorPickerTarget
                g_ColorPickerTarget := msg.Has("target") ? msg["target"] : "screenScannerPixel"
                StartColorPicker()

            case "startScreenSnip":
                SetTimer(() => StartScreenRegionSelector("snip"), -1)

            case "startScreenRegionSelect":
                SetTimer(() => StartScreenRegionSelector("region"), -1)
        }
    } catch as err {
        LogMessage("WebMessage dispatch error: " . err.Message)
    }
}

SendInitialStateToWeb() {
    global g_Wv, g_Config, g_IsEngineActive, g_AutoClickerRunning, g_SleepTimerActive, g_SleepTimerSecondsLeft,
        g_SleepTimerMode
    if (!g_Wv) {
        return
    }

    try {
        isMax := false
        if (g_MainGui) {
            try isMax := (WinGetMinMax("ahk_id " . g_MainGui.Hwnd) = 1)
        }
        response := Map(
            "type", "init",
            "enabled", g_IsEngineActive,
            "autoClickerRunning", g_AutoClickerRunning,
            "isMaximized", isMax,
            "config", g_Config
        )
        jsonStr := JSON.stringify(response)
        g_Wv.PostWebMessageAsString(jsonStr)
        if (g_SleepTimerActive) {
            NotifySleepTimerState(true, g_SleepTimerSecondsLeft, g_SleepTimerMode)
        }
    } catch as err {
        LogMessage("Failed to send initial state: " . err.Message)
    }
}

