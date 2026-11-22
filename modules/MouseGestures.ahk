; ==============================================================================
; 7. Screen Hot Corners & Mouse Gestures Module
; ==============================================================================

ApplyMouseGestures() {
    global g_Config, g_ActiveHotkeys, g_IsEngineActive, g_WheelGesturesActive, g_RockerGesturesActive,
        g_WheelTriggerBtn

    if (!g_Config.Has("mouseGestures")) {
        return
    }

    mg := g_Config["mouseGestures"]

    ; 1. Screen Hot Corners
    cornersOn := (mg.Has("cornersEnabled") && (mg["cornersEnabled"] = 1 || mg["cornersEnabled"] = true))
    if (cornersOn && g_IsEngineActive) {
        SetTimer(CheckScreenHotCorners, 50)
    } else {
        SetTimer(CheckScreenHotCorners, 0)
    }

    ; 2. Mouse Gestures
    gesturesOn := (mg.Has("gesturesEnabled") && (mg["gesturesEnabled"] = 1 || mg["gesturesEnabled"] = true))
    trigBtn := mg.Has("triggerButton") && Trim(mg["triggerButton"]) != "" ? Trim(mg["triggerButton"]) : "MButton"
    if (gesturesOn && g_IsEngineActive) {
        try {
            hkStr := "*" . trigBtn
            Hotkey(hkStr, (*) => HandleMouseGesture(trigBtn), "On")
            g_ActiveHotkeys.Push(hkStr)
        }
    }

    ; 2b. Gesture Wheel Scrolling (Hold Trigger + Wheel)
    wheelOn := (mg.Has("wheelGestureEnabled") && (mg["wheelGestureEnabled"] = 1 || mg["wheelGestureEnabled"] = true))
    || (mg.Has("wheelGesturesEnabled") && (mg["wheelGesturesEnabled"] = 1 || mg["wheelGesturesEnabled"] = true))
    g_WheelGesturesActive := (wheelOn && g_IsEngineActive)
    g_WheelTriggerBtn := trigBtn

    ; 3. Mouse Rocker Gestures (Hold Left + Click Right, Hold Right + Click Left)
    rockerOn := (mg.Has("rockerEnabled") && (mg["rockerEnabled"] = 1 || mg["rockerEnabled"] = true))
    g_RockerGesturesActive := (rockerOn && g_IsEngineActive)
}

IsRockerLeftActive(*) {
    global g_RockerGesturesActive
    return (IsSet(g_RockerGesturesActive) && g_RockerGesturesActive && GetKeyState("RButton", "P"))
}

IsRockerRightActive(*) {
    global g_RockerGesturesActive
    return (IsSet(g_RockerGesturesActive) && g_RockerGesturesActive && GetKeyState("LButton", "P"))
}

IsWheelGestureActive(*) {
    global g_WheelGesturesActive, g_WheelTriggerBtn, g_GestureTriggerDown
    return (IsSet(g_WheelGesturesActive) && g_WheelGesturesActive && ((IsSet(g_WheelTriggerBtn) && GetKeyState(g_WheelTriggerBtn, "P")) || (IsSet(g_GestureTriggerDown) && g_GestureTriggerDown)))
}

#HotIf IsRockerLeftActive()
*LButton:: HandleRockerLeft()
#HotIf

#HotIf IsRockerRightActive()
*RButton:: HandleRockerRight()
#HotIf

#HotIf IsWheelGestureActive()
*WheelUp:: HandleGestureWheel(1)
*WheelDown:: HandleGestureWheel(-1)
#HotIf

HandleGestureWheel(direction) {
    global g_Config, g_MainGui, g_GestureWheelFired
    g_GestureWheelFired := true
    mg := g_Config.Has("mouseGestures") ? g_Config["mouseGestures"] : Map()
    mode := mg.Has("wheelMode") ? mg["wheelMode"] : (mg.Has("wheelGestureMode") ? mg["wheelGestureMode"] : "volume")
    if (mode = "tabs") {
        ; Activate window under cursor if not active so Ctrl+Tab switches tabs in the target app
        try {
            CoordMode("Mouse", "Screen")
            MouseGetPos(&mx, &my, &hwndUnder)
            rootHwnd := DllCall("GetAncestor", "ptr", hwndUnder, "uint", 2, "ptr")
            targetHwnd := rootHwnd ? rootHwnd : hwndUnder
            if (targetHwnd && (!g_MainGui || targetHwnd != g_MainGui.Hwnd)) {
                if (WinGetID("A") != targetHwnd) {
                    WinActivate("ahk_id " . targetHwnd)
                }
            }
        }
        Send(direction > 0 ? "^{Tab}" : "^+{Tab}")
    } else {
        Send(direction > 0 ? "{Volume_Up 2}" : "{Volume_Down 2}")
    }
}

HandleRockerLeft() {
    global g_Config, g_MainGui, g_RockerFired
    g_RockerFired := true
    try {
        if (g_MainGui && WinActive("A") = g_MainGui.Hwnd) {
            return
        }
    }
    ; Send harmless virtual key to prevent Windows from showing context menu on RMB release
    Send("{vkFF}")
    mg := g_Config.Has("mouseGestures") ? g_Config["mouseGestures"] : Map()
    actionName := mg.Has("actionRockerLeft") ? mg["actionRockerLeft"] : "Back"
    ExecuteSystemAction(actionName, "Rocker Left")
}

HandleRockerRight() {
    global g_Config, g_MainGui, g_RockerFired
    g_RockerFired := true
    try {
        if (g_MainGui && WinActive("A") = g_MainGui.Hwnd) {
            return
        }
    }
    mg := g_Config.Has("mouseGestures") ? g_Config["mouseGestures"] : Map()
    actionName := mg.Has("actionRockerRight") ? mg["actionRockerRight"] : "Forward"
    ExecuteSystemAction(actionName, "Rocker Right")
}

CheckScreenHotCorners() {
    global g_Config, g_CornerActive, g_CornerTick, g_CornerTriggered, g_IsEngineActive

    if (!g_IsEngineActive || !g_Config.Has("mouseGestures")) {
        return
    }

    mg := g_Config["mouseGestures"]
    if (!mg.Has("cornersEnabled") || (!mg["cornersEnabled"])) {
        return
    }

    dwellMs := mg.Has("dwellDuration") ? Integer(mg["dwellDuration"]) : 250
    if (dwellMs < 20) {
        dwellMs := 20
    }

    baseTol := mg.Has("cornerSize") ? Max(5, Min(40, Integer(mg["cornerSize"]))) : 14
    baseTol := mg.Has("cornerSize") ? Max(1, Min(40, Integer(mg["cornerSize"]))) : 14

    ; Switch thread to Per-Monitor v2 DPI context to guarantee true 1:1 physical pixel coordinates across mixed 4K/2K displays
    oldCtx := DllCall("user32\SetThreadDpiAwarenessContext", "ptr", -4, "ptr")

    pt := Buffer(8, 0)
    DllCall("user32\GetCursorPos", "ptr", pt.Ptr)
    mx := NumGet(pt, 0, "int")
    my := NumGet(pt, 4, "int")

    ; Identify the exact monitor directly containing the cursor
    hMon := DllCall("user32\MonitorFromPoint", "int64", ((my & 0xFFFFFFFF) << 32) | (mx & 0xFFFFFFFF), "uint", 2, "ptr"
    )
    if (!hMon) {
        if (oldCtx) DllCall("user32\SetThreadDpiAwarenessContext", "ptr", oldCtx, "ptr")
            g_CornerActive := ""
        g_CornerTriggered := false
        return
    }

    mi := Buffer(40, 0)
    NumPut("uint", 40, mi, 0)
    DllCall("user32\GetMonitorInfoW", "ptr", hMon, "ptr", mi.Ptr)
    mL := NumGet(mi, 4, "int")
    mT := NumGet(mi, 8, "int")
    mR := NumGet(mi, 12, "int")
    mB := NumGet(mi, 16, "int")

    ; Respect monitorMode if configured ("primary" only vs all monitors)
    if (mg.Has("monitorMode") && mg["monitorMode"] = "primary") {
        isPrimary := (NumGet(mi, 36, "uint") & 1)
        if (!isPrimary) {
            if (oldCtx) DllCall("user32\SetThreadDpiAwarenessContext", "ptr", oldCtx, "ptr")
                g_CornerActive := ""
            g_CornerTriggered := false
            return
        }
    }

    ; Calculate DPI scale for the specific active monitor so 4K hit zones scale properly
    dpiX := 96, dpiY := 96
    try DllCall("shcore\GetDpiForMonitor", "ptr", hMon, "int", 0, "uint*", &dpiX, "uint*", &dpiY)
    dpiScale := Max(1.0, dpiX / 96.0)
    effectiveTol := Round(baseTol * dpiScale)

    if (oldCtx)
        DllCall("user32\SetThreadDpiAwarenessContext", "ptr", oldCtx, "ptr")

    ; Check corner bounds (in Windows RECT, Right & Bottom coordinates are exclusive bounds, so mR - 1 and mB - 1)
    isLeft := (mx <= mL + effectiveTol)
    isRight := (mx >= mR - 1 - effectiveTol)
    isTop := (my <= mT + effectiveTol)
    isBottom := (my >= mB - 1 - effectiveTol)

    cornerName := ""
    if (isLeft && isTop) {
        cornerName := "cornerTopLeft"
    } else if (isRight && isTop) {
        cornerName := "cornerTopRight"
    } else if (isLeft && isBottom) {
        cornerName := "cornerBottomLeft"
    } else if (isRight && isBottom) {
        cornerName := "cornerBottomRight"
    }

    if (cornerName != "") {
        if (g_CornerActive != cornerName) {
            g_CornerActive := cornerName
            g_CornerTick := A_TickCount
            g_CornerTriggered := false
        } else if (!g_CornerTriggered && (A_TickCount - g_CornerTick >= dwellMs)) {
            g_CornerTriggered := true
            actionName := mg.Has(cornerName) ? mg[cornerName] : ""
            if (actionName != "" && actionName != "None" && actionName != "none") {
                ExecuteSystemAction(actionName, "Hot Corner: " . cornerName)
            }
        }
    } else {
        g_CornerActive := ""
        g_CornerTriggered := false
    }
}

class HotCornerPreviewHUD {
    static guiList := []
    static hideTimer := 0

    static ShowPreview(cornerSizePx, show := true) {
        global g_Config

        if (this.hideTimer) {
            SetTimer(this.hideTimer, 0)
            this.hideTimer := 0
        }

        if (!show) {
            this.DestroyHUD()
            return
        }

        themeAccent := (g_Config.Has("theme") && g_Config["theme"].Has("accentColor")) ? g_Config["theme"][
            "accentColor"] : "#d97706"
        accentArgb := RadialMenuHUD.ParseHexColor(themeAccent, 255)

        cFill := (0x45 << 24) | (accentArgb & 0x00FFFFFF)
        cBorder := (0xFF << 24) | (accentArgb & 0x00FFFFFF)

        ProfileGdipHelper.Init()

        targetMode := "all"
        if (g_Config.Has("mouseGestures")) {
            if (g_Config["mouseGestures"].Has("monitorMode"))
                targetMode := g_Config["mouseGestures"]["monitorMode"]
            else if (g_Config["mouseGestures"].Has("targetDisplays"))
                targetMode := g_Config["mouseGestures"]["targetDisplays"]
        }

        oldCtx := DllCall("user32\SetThreadDpiAwarenessContext", "ptr", -4, "ptr")

        monCount := MonitorGetCount()
        primaryMon := MonitorGetPrimary()

        monIndices := []
        if (targetMode = "primary") {
            monIndices.Push(primaryMon)
        } else {
            loop monCount {
                monIndices.Push(A_Index)
            }
        }

        cornerRects := []
        loop monIndices.Length {
            mIdx := monIndices[A_Index]
            MonitorGet(mIdx, &mL, &mT, &mR, &mB)

            midX := mL + Round((mR - mL) / 2)
            midY := mT + Round((mB - mT) / 2)
            pt64 := ((midY & 0xFFFFFFFF) << 32) | (midX & 0xFFFFFFFF)
            hMon := DllCall("user32\MonitorFromPoint", "int64", pt64, "uint", 2, "ptr")

            dpiX := 96, dpiY := 96
            if (hMon) {
                try DllCall("Shcore\GetDpiForMonitor", "ptr", hMon, "int", 0, "uint*", &dpiX, "uint*", &dpiY)
            }
            dpiScale := Max(1.0, dpiX / 96.0)

            baseTol := Max(5, Min(40, Integer(cornerSizePx)))
            baseTol := Max(1, Min(40, Integer(cornerSizePx)))
            effectiveTol := Round(baseTol * dpiScale)
            boxPx := effectiveTol + 1

            cornerRects.Push({ x: mL, y: mT, w: boxPx, h: boxPx, dpiScale: dpiScale })
            cornerRects.Push({ x: mR - boxPx, y: mT, w: boxPx, h: boxPx, dpiScale: dpiScale })
            cornerRects.Push({ x: mL, y: mB - boxPx, w: boxPx, h: boxPx, dpiScale: dpiScale })
            cornerRects.Push({ x: mR - boxPx, y: mB - boxPx, w: boxPx, h: boxPx, dpiScale: dpiScale })
        }

        if (oldCtx)
            DllCall("user32\SetThreadDpiAwarenessContext", "ptr", oldCtx, "ptr")

        if (this.guiList.Length != cornerRects.Length) {
            this.DestroyHUD()
            loop cornerRects.Length {
                gObj := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +E0x20 +E0x08000000 +E0x00080000")
                this.guiList.Push(gObj)
            }
        }

        hDC := DllCall("GetDC", "ptr", 0, "ptr")

        for idx, c in cornerRects {
            gObj := this.guiList[idx]

            hMemDC := DllCall("CreateCompatibleDC", "ptr", hDC, "ptr")

            bi := Buffer(40, 0)
            NumPut("uint", 40, bi, 0)
            NumPut("int", c.w, bi, 4)
            NumPut("int", -c.h, bi, 8)
            NumPut("ushort", 1, bi, 12)
            NumPut("ushort", 32, bi, 14)

            pBits := 0
            hBmp := DllCall("CreateDIBSection", "ptr", hMemDC, "ptr", bi, "uint", 0, "ptr*", &pBits, "ptr", 0, "uint",
                0, "ptr")
            hOldBmp := DllCall("SelectObject", "ptr", hMemDC, "ptr", hBmp, "ptr")

            pGraphics := 0
            DllCall("gdiplus\GdipCreateFromHDC", "ptr", hMemDC, "ptr*", &pGraphics)
            DllCall("gdiplus\GdipSetSmoothingMode", "ptr", pGraphics, "int", 4)

            pFillBrush := 0
            DllCall("gdiplus\GdipCreateSolidFill", "uint", cFill, "ptr*", &pFillBrush)

            penWidth := Max(1.5, 2.0 * c.dpiScale)
            pBorderPen := 0
            DllCall("gdiplus\GdipCreatePen1", "uint", cBorder, "float", penWidth, "int", 2, "ptr*", &pBorderPen)

            ; Draw filled corner rectangle with theme border matching physical hit zone
            DllCall("gdiplus\GdipFillRectangle", "ptr", pGraphics, "ptr", pFillBrush, "float", 0.0, "float", 0.0,
                "float", Float(c.w), "float", Float(c.h))
            DllCall("gdiplus\GdipDrawRectangle", "ptr", pGraphics, "ptr", pBorderPen, "float", 0.5, "float", 0.5,
                "float", Float(c.w - 1), "float", Float(c.h - 1))

            DllCall("gdiplus\GdipDeleteBrush", "ptr", pFillBrush)
            DllCall("gdiplus\GdipDeletePen", "ptr", pBorderPen)
            DllCall("gdiplus\GdipDeleteGraphics", "ptr", pGraphics)

            ptDst := Buffer(8, 0)
            NumPut("int", c.x, ptDst, 0), NumPut("int", c.y, ptDst, 4)
            sz := Buffer(8, 0)
            NumPut("int", c.w, sz, 0), NumPut("int", c.h, sz, 4)
            ptSrc := Buffer(8, 0)
            blend := Buffer(4, 0)
            NumPut("uchar", 0, blend, 0), NumPut("uchar", 0, blend, 1)
            NumPut("uchar", 255, blend, 2), NumPut("uchar", 1, blend, 3)

            gObj.Show("x" . c.x . " y" . c.y . " w" . c.w . " h" . c.h . " NoActivate")
            DllCall("UpdateLayeredWindow", "ptr", gObj.Hwnd, "ptr", hDC, "ptr", ptDst, "ptr", sz, "ptr", hMemDC, "ptr",
                ptSrc, "uint", 0, "ptr", blend, "uint", 2)

            DllCall("SelectObject", "ptr", hMemDC, "ptr", hOldBmp)
            DllCall("DeleteObject", "ptr", hBmp)
            DllCall("DeleteDC", "ptr", hMemDC)
        }

        DllCall("ReleaseDC", "ptr", 0, "ptr", hDC)

        this.hideTimer := () => HotCornerPreviewHUD.DestroyHUD()
        SetTimer(this.hideTimer, -1800)
    }

    static DestroyHUD() {
        if (this.hideTimer) {
            SetTimer(this.hideTimer, 0)
            this.hideTimer := 0
        }
        for _, g in this.guiList {
            try g.Destroy()
        }
        this.guiList := []
    }
}

HandleMouseGesture(triggerBtn) {
    global g_Config, g_MainGui, g_GestureWheelFired, g_RockerFired, g_GestureTriggerDown
    g_GestureWheelFired := false
    g_RockerFired := false
    g_GestureTriggerDown := true

    if (!g_Config.Has("mouseGestures")) {
        g_GestureTriggerDown := false
        Click(triggerBtn)
        return
    }

    mg := g_Config["mouseGestures"]
    timeoutMs := mg.Has("gestureTimeout") ? mg["gestureTimeout"] : 1200
    threshPx := mg.Has("strokeThreshold") ? mg["strokeThreshold"] : 35
    isRockerOn := (mg.Has("rockerEnabled") && (mg["rockerEnabled"] = 1 || mg["rockerEnabled"] = true))

    CoordMode("Mouse", "Screen")
    MouseGetPos(&startX, &startY)
    startTick := A_TickCount
    rockerTriggered := false

    ; Wait while trigger button is physically held down
    while GetKeyState(triggerBtn, "P") {
        Sleep(15)
        ; Check for Rocker Left (Hold RMB + Click LMB)
        if (isRockerOn && triggerBtn = "RButton" && GetKeyState("LButton", "P")) {
            rockerTriggered := true
            g_RockerFired := true
            while GetKeyState("LButton", "P")
                Sleep(10)
            act := mg.Has("actionRockerLeft") ? mg["actionRockerLeft"] : "Back"
            ExecuteSystemAction(act, "Rocker Left")
            while GetKeyState("RButton", "P")
                Sleep(10)
            g_GestureTriggerDown := false
            return
        }
        if (A_TickCount - startTick > 3500) {
            break
        }
    }

    g_GestureTriggerDown := false

    if (g_GestureWheelFired || rockerTriggered || g_RockerFired) {
        g_GestureWheelFired := false
        g_RockerFired := false
        return
    }

    elapsed := A_TickCount - startTick
    MouseGetPos(&endX, &endY)

    dx := endX - startX
    dy := endY - startY
    dist := Sqrt((dx * dx) + (dy * dy))

    ; If the movement did not exceed threshold, perform standard click (e.g. right-click menu)
    if (dist < threshPx) {
        if (triggerBtn = "RButton") {
            Click("Right")
        } else if (triggerBtn = "MButton") {
            Click("Middle")
        } else if (triggerBtn = "XButton1") {
            Click("X1")
        } else if (triggerBtn = "XButton2") {
            Click("X2")
        }
        return
    }

    ; If held longer than 3.5s without completing, abort to prevent accidental stroke execution
    if (elapsed > 3500) {
        return
    }

    ; 8-octant angle detection: (0=Up, 1=UpRight, 2=Right, 3=DownRight, 4=Down, 5=DownLeft, 6=Left, 7=UpLeft)
    angle := (ATan2(dx, -dy) * 57.2957795)
    if (angle < 0) angle += 360
        octant := Mod(Round(angle / 45.0), 8)

    gesture := ""
    switch octant {
        case 0: gesture := "actionUp"
        case 1: gesture := "actionUpRight"
        case 2: gesture := "actionRight"
        case 3: gesture := "actionDownRight"
        case 4: gesture := "actionDown"
        case 5: gesture := "actionDownLeft"
        case 6: gesture := "actionLeft"
        case 7: gesture := "actionUpLeft"
    }

    actionName := mg.Has(gesture) ? mg[gesture] : ""
    if (actionName != "" && StrLower(actionName) != "none") {
        ; Activate the window under the starting point so actions apply to it
        try {
            hwndUnder := DllCall("WindowFromPoint", "int64", (startY << 32) | (startX & 0xFFFFFFFF), "ptr")
            rootHwnd := DllCall("GetAncestor", "ptr", hwndUnder, "uint", 2, "ptr")
            if (rootHwnd && (!g_MainGui || rootHwnd != g_MainGui.Hwnd)) {
                WinActivate("ahk_id " . rootHwnd)
            }
        }
        ExecuteSystemAction(actionName, "Gesture: " . gesture)
    }
}

ExecuteSystemAction(actionName, triggerSource := "") {
    global g_Wv

    switch actionName {
        case "TaskView":
            Send("#{Tab}")
        case "ActionCenter":
            Send("#a")
        case "StartMenu":
            Send("^{Esc}")
        case "ShowDesktop":
            Send("#d")
        case "LockWorkstation":
            DllCall("LockWorkStation")
        case "Sleep", "Suspend":
            TriggerSleepOrHibernate()
        case "Hibernate":
            res := DllCall("PowrProf\SetSuspendState", "int", 1, "int", 0, "int", 0)
            if (!res) {
                Run("shutdown /h", , "Hide")
            }
        case "MuteVolume":
            Send("{Volume_Mute}")
        case "VolumeUp":
            Send("{Volume_Up 2}")
        case "VolumeDown":
            Send("{Volume_Down 2}")
        case "PrevTrack":
            Send("{Media_Prev}")
        case "NextTrack":
            Send("{Media_Next}")
        case "PlayPause":
            Send("{Media_Play_Pause}")
        case "Back":
            Send("!{Left}")
        case "Forward":
            Send("!{Right}")
        case "ScrollTop":
            Send("^{Home}")
        case "ScrollBottom":
            Send("^{End}")
        case "CloseWindow":
            Send("!{F4}")
        case "MinimizeWindow":
            try WinMinimize("A")
        case "MaximizeWindow":
            try {
                hwnd := WinGetID("A")
                isMax := WinGetMinMax("ahk_id " . hwnd)
                if (isMax = 1) {
                    WinRestore("ahk_id " . hwnd)
                } else {
                    WinMaximize("ahk_id " . hwnd)
                }
            }
        case "SnapLeft":
            Send("#{Left}")
        case "SnapRight":
            Send("#{Right}")
        case "MinimizeAll":
            Send("#m")
        case "NewTab":
            Send("^t")
        case "CloseTab":
            Send("^w")
        case "ReopenTab":
            Send("^+t")
        case "NextTab":
            Send("^{Tab}")
        case "PrevTab":
            Send("^+{Tab}")
        case "DuplicateTab":
            Send("!d"), Sleep(35), Send("!{Enter}")
        case "ReloadPage":
            Send("^{F5}")
        case "ClipboardHistory":
            Send("#v")
        case "EmojiPicker":
            Send("#.")
        case "PastePlainText":
            try {
                clipBak := A_Clipboard
                A_Clipboard := RegExReplace(RegExReplace(clipBak, "\r\n|\r|\n", "`r`n"), "^\s+|\s+$", "")
                Send("^v")
            }
        case "FileExplorer":
            Send("#e")
        case "WindowsSettings":
            Send("#i")
        case "GameBar":
            Send("#g")
        case "Screenshot":
            Send("#+s")
        case "ScreenOcr":
            StartScreenOCR()
        case "ColorPicker":
            StartColorPicker()
        case "NextDesktop":
            SwitchVirtualDesktop(1)
        case "PrevDesktop":
            SwitchVirtualDesktop(-1)
        case "AlwaysOnTop":
            ToggleAlwaysOnTop()
        case "GhostMode":
            ToggleGhostMode()
        case "CleanText":
            TransformSelectedText("clean")
        case "Calculator":
            try Run("calc.exe")
        default:
            ; Check custom App Launcher item or Macro Recorder item by id prefix
            displayActionName := actionName
            if (SubStr(actionName, 1, 3) = "al-") {
                actionCoreId := RegExReplace(actionName, "^(al-)+", "")
                targetToRun := ""
                targetName := ""

                ; 1. Search in active profile's appLauncher
                if (g_Config.Has("appLauncher") && g_Config["appLauncher"].Has("items")) {
                    for item in g_Config["appLauncher"]["items"] {
                        if (IsObject(item) && item.Has("id") && item.Has("target")) {
                            itemCoreId := RegExReplace(String(item["id"]), "^(al-)+", "")
                            if (actionCoreId = itemCoreId || item["id"] = actionName) {
                                targetToRun := item["target"]
                                targetName := item.Has("name") ? item["name"] : item["target"]
                                break
                            }
                        }
                    }
                }

                ; 2. Fallback: Search across all profiles
                if (targetToRun == "" && g_Config.Has("profiles")) {
                    for pName, pData in g_Config["profiles"] {
                        if (IsObject(pData) && pData.Has("appLauncher") && pData["appLauncher"].Has("items")) {
                            for item in pData["appLauncher"]["items"] {
                                if (IsObject(item) && item.Has("id") && item.Has("target")) {
                                    itemCoreId := RegExReplace(String(item["id"]), "^(al-)+", "")
                                    if (actionCoreId = itemCoreId || item["id"] = actionName) {
                                        targetToRun := item["target"]
                                        targetName := item.Has("name") ? item["name"] : item["target"]
                                        break 2
                                    }
                                }
                            }
                        }
                    }
                }

                if (targetName != "") {
                    displayActionName := targetName
                }

                if (targetToRun != "") {
                    try {
                        Run(targetToRun)
                    } catch as err1 {
                        try {
                            Run("shell:" . targetToRun)
                        } catch as err2 {
                            LogMessage("Run target failed: " . targetToRun . " (" . err1.Message . ")")
                        }
                    }
                }
            } else if (SubStr(actionName, 1, 6) = "macro-") {
                actionCoreId := RegExReplace(actionName, "^(macro-)+", "")
                macroToRun := ""
                macroName := ""

                ; 1. Search in active profile's macroRecorder
                if (g_Config.Has("macroRecorder") && g_Config["macroRecorder"].Has("items")) {
                    for item in g_Config["macroRecorder"]["items"] {
                        if (IsObject(item) && item.Has("id")) {
                            itemCoreId := RegExReplace(String(item["id"]), "^(macro-)+", "")
                            if (actionCoreId = itemCoreId || item["id"] = actionName) {
                                macroToRun := item
                                macroName := item.Has("name") ? item["name"] : "Macro #" . itemCoreId
                                break
                            }
                        }
                    }
                }

                ; 2. Fallback: Search across all profiles
                if (!IsObject(macroToRun) && g_Config.Has("profiles")) {
                    for pName, pData in g_Config["profiles"] {
                        if (IsObject(pData) && pData.Has("macroRecorder") && pData["macroRecorder"].Has("items")) {
                            for item in pData["macroRecorder"]["items"] {
                                if (IsObject(item) && item.Has("id")) {
                                    itemCoreId := RegExReplace(String(item["id"]), "^(macro-)+", "")
                                    if (actionCoreId = itemCoreId || item["id"] = actionName) {
                                        macroToRun := item
                                        macroName := item.Has("name") ? item["name"] : "Macro #" . itemCoreId
                                        break 2
                                    }
                                }
                            }
                        }
                    }
                }

                if (macroName != "") {
                    displayActionName := macroName
                }

                if (IsObject(macroToRun)) {
                    try ExecuteMacroAsync(macroToRun)
                }
            }
    }

    SoundBeep(1100, 45)

    if (g_Wv) {
        try {
            ; Friendly source mapping
            friendlySource := triggerSource
            friendlySource := StrReplace(friendlySource, "cornerTopLeft", "Top-Left Corner")
            friendlySource := StrReplace(friendlySource, "cornerTopRight", "Top-Right Corner")
            friendlySource := StrReplace(friendlySource, "cornerBottomLeft", "Bottom-Left Corner")
            friendlySource := StrReplace(friendlySource, "cornerBottomRight", "Bottom-Right Corner")

            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "systemTools",
                "message", friendlySource . " -> " . (displayActionName != "" ? displayActionName : actionName)
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

