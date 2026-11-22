; ==============================================================================
; GUI & WebView2 Window
; ==============================================================================

CreateMainWindow() {
    global g_MainGui, g_Wvc, g_Wv, APP_WIDTH, APP_HEIGHT, APP_NAME, g_Config

    g_MainGui := Gui("+Resize +MaximizeBox +MinimizeBox", APP_NAME)
    g_MainGui.Opt("+MinSize720x520")

    initBg := "e8dfd5"
    if (g_Config.Has("theme") && g_Config["theme"].Has("bgColor")) {
        cleanHex := StrReplace(g_Config["theme"]["bgColor"], "#", "")
        if (StrLen(cleanHex) = 6) {
            initBg := cleanHex
        }
    }
    g_MainGui.BackColor := initBg

    targetMon := 0
    try {
        targetMon := MonitorGetPrimary()
    } catch {
        targetMon := 1
    }
    if (g_Config.Has("window") && IsObject(g_Config["window"])) {
        winCfg := g_Config["window"]
        if (winCfg.Has("monitor") && Integer(winCfg["monitor"]) > 0) {
            targetMon := Integer(winCfg["monitor"])
        } else if (winCfg.Has("x") && winCfg.Has("y") && winCfg.Has("width") && winCfg.Has("height")) {
            targetMon := GetMonitorFromRect(Integer(winCfg["x"]), Integer(winCfg["y"]), Integer(winCfg["width"]),
            Integer(winCfg["height"]))
        }
    }

    try {
        monCount := MonitorGetCount()
        if (targetMon > monCount || targetMon < 1) {
            try targetMon := MonitorGetPrimary()
            catch
                targetMon := 1
        }
    } catch {
        targetMon := 1
    }

    GetDefaultWindowSize(&defW, &defH, &defX, &defY, targetMon)

    winW := defW
    winH := defH
    posX := defX
    posY := defY
    isStartMax := 0

    if (g_Config.Has("window") && IsObject(g_Config["window"])) {
        winCfg := g_Config["window"]
        try {
            MonitorGetWorkArea(targetMon, &wL, &wT, &wR, &wB)
            monW := wR - wL
            monH := wB - wT
        } catch {
            wL := 0, wT := 0
            monW := A_ScreenWidth
            monH := A_ScreenHeight
        }

        ; Width (exact saved pixel width takes priority, fallback to widthPercent)
        if (winCfg.Has("width") && Integer(winCfg["width"]) >= 720) {
            winW := Min(Integer(winCfg["width"]), monW - 20)
        } else if (winCfg.Has("widthPercent") && Float(winCfg["widthPercent"]) > 0) {
            valPct := Float(winCfg["widthPercent"])
            winW := Max(720, Min(monW - 40, Round(monW * (valPct / 100.0))))
        } else {
            winW := defW
        }

        ; Height (exact saved pixel height takes priority, fallback to heightPercent)
        if (winCfg.Has("height") && Integer(winCfg["height"]) >= 520) {
            winH := Min(Integer(winCfg["height"]), monH - 20)
        } else if (winCfg.Has("heightPercent") && Float(winCfg["heightPercent"]) > 0) {
            valHPct := Float(winCfg["heightPercent"])
            winH := Max(520, Min(monH - 60, Round(monH * (valHPct / 100.0))))
        } else {
            winH := defH
        }

        ; Position
        if (winCfg.Has("x") && winCfg.Has("y")) {
            savedX := Integer(winCfg["x"])
            savedY := Integer(winCfg["y"])
            ; Validate that saved coordinates are visible on target monitor
            if (savedX >= (wL - winW + 100) && savedX <= (wR - 100) && savedY >= (wT - 20) && savedY <= (wB - 100)) {
                posX := Max(wL, Min(wR - winW, savedX))
                posY := Max(wT, Min(wB - winH, savedY))
            } else {
                posX := wL + Max(0, (monW - winW) // 2)
                posY := wT + Max(0, (monH - winH) // 2)
            }
        } else {
            posX := wL + Max(0, (monW - winW) // 2)
            posY := wT + Max(0, (monH - winH) // 2)
        }

        if (winCfg.Has("isMaximized") && winCfg["isMaximized"]) {
            isStartMax := 1
        }
    }

    g_MainGui.OnEvent("Close", (*) => ExitApp())
    g_MainGui.OnEvent("Size", OnGuiSize)

    ; Windows 11 hardware-accelerated rounded corners
    DllCall("dwmapi\DwmSetWindowAttribute", "ptr", g_MainGui.Hwnd, "uint", 33, "uint*", 2, "uint", 4)
    ; Disable DWM default border to remove top border line artifact (DWMWA_COLOR_NONE = 0xFFFFFFFE)
    DllCall("dwmapi\DwmSetWindowAttribute", "ptr", g_MainGui.Hwnd, "uint", 34, "uint*", 0xFFFFFFFE, "uint", 4)

    ; Suppress Windows default top non-client frame calculation to eliminate the top white line artifact
    OnMessage(0x0083, OnNcCalcSize)
    OnMessage(0x0024, OnGetMinMaxInfo)
    OnMessage(0x0232, OnExitSizeMove)

    ; Set App Icon for Windows Taskbar & System Tray
    iconPath := A_ScriptDir . "\app-icon.ico"
    if FileExist(iconPath) {
        try {
            TraySetIcon(iconPath)
            cxBig := DllCall("GetSystemMetrics", "int", 11, "int")   ; SM_CXICON
            cyBig := DllCall("GetSystemMetrics", "int", 12, "int")   ; SM_CYICON
            cxSm := DllCall("GetSystemMetrics", "int", 49, "int")   ; SM_CXSMICON
            cySm := DllCall("GetSystemMetrics", "int", 50, "int")   ; SM_CYSMICON
            cxBig := Max(cxBig, 32)
            cyBig := Max(cyBig, 32)
            cxSm := Max(cxSm, 16)
            cySm := Max(cySm, 16)

            hIconBig := DllCall("LoadImage", "ptr", 0, "str", iconPath, "uint", 1, "int", cxBig, "int", cyBig, "uint",
                0x00000010, "ptr")
            hIconSmall := DllCall("LoadImage", "ptr", 0, "str", iconPath, "uint", 1, "int", cxSm, "int", cySm, "uint",
                0x00000010, "ptr")
            if (hIconBig)
                SendMessage(0x0080, 1, hIconBig, g_MainGui.Hwnd)
            if (hIconSmall)
                SendMessage(0x0080, 0, hIconSmall, g_MainGui.Hwnd)
        }
    }

    g_MainGui.Show(Format("x{} y{} w{} h{}", posX, posY, winW, winH))
    if (isStartMax) {
        g_MainGui.Maximize()
    }

    InitWebView2()
}

OnNcCalcSize(wParam, lParam, msg, hwnd) {
    global g_MainGui
    if (!g_MainGui || hwnd != g_MainGui.Hwnd)
        return

    ; If wParam is TRUE (1), lParam points to NCCALCSIZE_PARAMS
    if (wParam) {
        try {
            isMax := (WinGetMinMax("ahk_id " . hwnd) = 1)
            if (isMax) {
                hMon := DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr")
                if (hMon) {
                    mi := Buffer(40, 0)
                    NumPut("uint", 40, mi, 0)
                    if (DllCall("GetMonitorInfoW", "ptr", hMon, "ptr", mi)) {
                        workLeft := NumGet(mi, 20, "int")
                        workTop := NumGet(mi, 24, "int")
                        workRight := NumGet(mi, 28, "int")
                        workBottom := NumGet(mi, 32, "int")

                        NumPut("int", workLeft, lParam, 0)
                        NumPut("int", workTop, lParam, 4)
                        NumPut("int", workRight, lParam, 8)
                        NumPut("int", workBottom, lParam, 12)
                        return 0
                    }
                }
            }
        }
        return 0
    }
    return 0
}

OnGetMinMaxInfo(wParam, lParam, msg, hwnd) {
    global g_MainGui
    if (!g_MainGui || hwnd != g_MainGui.Hwnd)
        return

    hMon := DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr") ; MONITOR_DEFAULTTONEAREST = 2
    if (!hMon)
        return

    mi := Buffer(40, 0)
    NumPut("uint", 40, mi, 0)
    if (!DllCall("GetMonitorInfoW", "ptr", hMon, "ptr", mi))
        return

    monLeft := NumGet(mi, 4, "int")
    monTop := NumGet(mi, 8, "int")
    workLeft := NumGet(mi, 20, "int")
    workTop := NumGet(mi, 24, "int")
    workRight := NumGet(mi, 28, "int")
    workBottom := NumGet(mi, 32, "int")

    workW := workRight - workLeft
    workH := workBottom - workTop

    ; ptMaxSize (offset 8) -> maximum window size when maximized to exact monitor work area (taskbar preserved)
    NumPut("int", workW, lParam, 8)
    NumPut("int", workH, lParam, 12)
    ; ptMaxPosition (offset 16) -> top-left position when maximized relative to monitor
    NumPut("int", workLeft - monLeft, lParam, 16)
    NumPut("int", workTop - monTop, lParam, 20)
    ; ptMaxTrackSize (offset 32) -> allow sizing up to work area
    NumPut("int", workW, lParam, 32)
    NumPut("int", workH, lParam, 36)
    return 0
}

InitWebView2() {
    global g_MainGui, g_Wvc, g_Wv

    ; Dedicated WebView2 user data folder in AppData to prevent conflict with running Edge browser (0x800700AA)
    userDataDir := A_AppData . "\AutoHotKeyboard\WebView2"
    if !DirExist(userDataDir) {
        try DirCreate(userDataDir)
    }

    ; Resolve architecture-specific WebView2Loader.dll path
    loaderDll := A_ScriptDir . "\lib\WebView2\" . (A_PtrSize = 8 ? "64bit" : "32bit") . "\WebView2Loader.dll"
    if (!FileExist(loaderDll)) {
        loaderDll := A_ScriptDir . "\WebView2Loader.dll"
    }

    ; Attempt initialization with primary data directory, fallback to process-specific temp directory if locked
    envOpts := { AdditionalBrowserArguments: "--disable-features=FluentScrollbar,OverlayScrollbar" }
    try {
        g_Wvc := WebView2.CreateControllerAsync(g_MainGui.Hwnd, envOpts, userDataDir, "", loaderDll).await2(8000)
    } catch as err {
        LogMessage("Primary WebView2 data folder busy or failed (" . err.Message . "), trying isolated session...")
        tempDataDir := A_Temp . "\AutoHotKeyboard_WV_" . ProcessExist()
        try {
            if !DirExist(tempDataDir)
                DirCreate(tempDataDir)
            g_Wvc := WebView2.CreateControllerAsync(g_MainGui.Hwnd, envOpts, tempDataDir, "", loaderDll).await2(8000)
        } catch as err2 {
            LogMessage("FATAL: Failed to initialize WebView2 component: " . err2.Message)
            userChoice := MsgBox(
                "Microsoft Edge WebView2 Runtime is missing or could not be loaded.`n`n" .
                "AutoHotKeyboard requires the WebView2 Runtime to display its user interface.`n`n" .
                "Would you like to open the official Microsoft download page to install it now?",
                "AutoHotKeyboard - Missing Runtime",
                52
            )
            if (userChoice = "Yes") {
                try Run("https://go.microsoft.com/fwlink/p/?LinkId=2124703")
            }
            ExitApp()
        }
    }

    try {
        g_Wv := g_Wvc.CoreWebView2
        try g_Wvc.DefaultBackgroundColor := 0
        try g_Wvc.Fill()

        settings := g_Wv.Settings
        settings.AreDefaultContextMenusEnabled := false
        settings.IsStatusBarEnabled := false
        settings.AreDevToolsEnabled := true
        try settings.AreBrowserAcceleratorKeysEnabled := false

        g_Wv.add_WebMessageReceived(WebView2.Handler(OnWebMessageReceived, 3))
        g_Wv.add_NavigationCompleted(WebView2.Handler((*) => SendInitialStateToWeb(), 3))

        ; Inject initial config & theme before page DOM is created to prevent any reset or flash
        try {
            initJson := JSON.stringify(g_Config)
            g_Wv.AddScriptToExecuteOnDocumentCreatedAsync("window.__INITIAL_CONFIG__ = " . initJson . ";")
        }

        htmlUri := "file:///" . StrReplace(A_ScriptDir . "\ui\index.html", "\", "/")
        g_Wv.Navigate(htmlUri)
        LogMessage("WebView2 successfully initialized and navigated to: " . htmlUri)

        ; Start polling for active window changes to update Window Manager volume live
        SetTimer(CheckActiveAppFocus, 400)
        ; Start polling for real-time application profile auto-switching
        SetTimer(CheckAutoProfileSwitch, 350)

        ; Enable window resizing/moving tracking only after window has fully initialized
        SetTimer(() => (g_IsWindowReady := true), -500)

    } catch as err {
        LogMessage("FATAL: Failed to configure WebView2: " . err.Message)
        MsgBox("Failed to configure WebView2: " . err.Message, "AutoHotKeyboard Error", 16)
        ExitApp()
    }
}

OnGuiSize(guiObj, minMax, width, height) {
    global g_Wvc, g_Wv, g_Config, g_MainGui, g_IsWindowReady
    if (g_Wvc && minMax != -1) {
        try g_Wvc.Fill()
    }
    if (g_Wv && minMax != -1) {
        try {
            stateMsg := Map("type", "windowStateChanged", "isMaximized", (minMax = 1))
            g_Wv.PostWebMessageAsString(JSON.stringify(stateMsg))
        }
    }
    if (!g_IsWindowReady) {
        return
    }
    if (minMax = 0 && width >= 720 && height >= 520) {
        if (!g_Config.Has("window") || !IsObject(g_Config["window"])) {
            g_Config["window"] := Map()
        }
        g_Config["window"]["width"] := width
        g_Config["window"]["height"] := height
        try {
            g_MainGui.GetPos(&curX, &curY)
            targetMon := GetMonitorFromRect(curX, curY, width, height)
            MonitorGetWorkArea(targetMon, &wL, &wT, &wR, &wB)
            monW := wR - wL
            monH := wB - wT
            if (monW > 0 && monH > 0) {
                g_Config["window"]["widthPercent"] := Round((width / Float(monW)) * 100, 1)
                g_Config["window"]["heightPercent"] := Round((height / Float(monH)) * 100, 1)
                g_Config["window"]["userCustomized"] := 1
                g_Config["window"]["monitor"] := targetMon
                g_Config["window"]["x"] := curX
                g_Config["window"]["y"] := curY
            }
        }
        g_Config["window"]["isMaximized"] := 0
        SetTimer(SaveWindowSizeDebounced, -600)
    } else if (minMax = 1) {
        if (!g_Config.Has("window") || !IsObject(g_Config["window"])) {
            g_Config["window"] := Map()
        }
        try {
            g_MainGui.GetPos(&curX, &curY)
            g_MainGui.GetClientPos(&dummyX, &dummyY, &curW, &curH)
            targetMon := GetMonitorFromRect(curX, curY, curW, curH)
            g_Config["window"]["monitor"] := targetMon
        }
        g_Config["window"]["isMaximized"] := 1
        SetTimer(SaveWindowSizeDebounced, -600)
    }
}

OnExitSizeMove(wParam, lParam, msg, hwnd) {
    global g_MainGui, g_IsWindowReady
    if (g_MainGui && hwnd = g_MainGui.Hwnd && g_IsWindowReady) {
        SaveWindowState()
        SaveConfigToFile()
    }
}

SaveWindowSizeDebounced() {
    SaveConfigToFile()
}

