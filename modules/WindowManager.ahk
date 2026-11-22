; ==============================================================================
; 3. Window Management Module
; ==============================================================================

ApplyWindowManager() {
    global g_Config, g_ActiveHotkeys

    if (!g_Config.Has("windowManager")) {
        return
    }

    wm := g_Config["windowManager"]
    if (wm.Has("enabled") && !wm["enabled"]) {
        return
    }

    ; Always-on-Top Hotkey
    if ((!wm.Has("alwaysOnTopEnabled") || wm["alwaysOnTopEnabled"]) && wm.Has("alwaysOnTopHotkey") && Trim(wm[
        "alwaysOnTopHotkey"]) != "") {
        try {
            rawHk := Trim(wm["alwaysOnTopHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => ToggleAlwaysOnTop(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Center Window Hotkey
    if ((!wm.Has("centerWindowEnabled") || wm["centerWindowEnabled"]) && wm.Has("centerWindowHotkey") && Trim(wm[
        "centerWindowHotkey"]) != "") {
        try {
            rawHk := Trim(wm["centerWindowHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => CenterActiveWindow(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Boss Key / Hide Active Window Hotkey
    if ((!wm.Has("hideWindowEnabled") || wm["hideWindowEnabled"]) && wm.Has("hideWindowHotkey") && Trim(wm[
        "hideWindowHotkey"]) != "") {
        try {
            rawHk := Trim(wm["hideWindowHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => HideActiveWindow(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Mouse Wheel Transparency (#WheelUp / #WheelDown)
    if (wm.Has("transparencyWheel") && wm["transparencyWheel"]) {
        try {
            Hotkey("#WheelUp", (*) => AdjustActiveWindowTransparency(20), "On")
            Hotkey("#WheelDown", (*) => AdjustActiveWindowTransparency(-20), "On")
            g_ActiveHotkeys.Push("#WheelUp")
            g_ActiveHotkeys.Push("#WheelDown")
        }
    }

    ; Focused Application Volume Control (!WheelUp / !WheelDown, ^!PgUp / ^!PgDn)
    if (wm.Has("appVolumeWheel") && wm["appVolumeWheel"]) {
        try {
            Hotkey("!WheelUp", (*) => AdjustActiveAppVolume(0.05), "On")
            Hotkey("!WheelDown", (*) => AdjustActiveAppVolume(-0.05), "On")
            Hotkey("^!PgUp", (*) => AdjustActiveAppVolume(0.05), "On")
            Hotkey("^!PgDn", (*) => AdjustActiveAppVolume(-0.05), "On")
            g_ActiveHotkeys.Push("!WheelUp")
            g_ActiveHotkeys.Push("!WheelDown")
            g_ActiveHotkeys.Push("^!PgUp")
            g_ActiveHotkeys.Push("^!PgDn")
        }
    }

    ; Mute Active Application Hotkey
    if ((!wm.Has("appVolumeMuteEnabled") || wm["appVolumeMuteEnabled"]) && wm.Has("appVolumeMuteHotkey") && Trim(wm[
        "appVolumeMuteHotkey"]) != "") {
        try {
            rawHk := Trim(wm["appVolumeMuteHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => ToggleActiveAppMute(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Mute Master Audio Hotkey
    if ((!wm.Has("masterAudioMuteEnabled") || wm["masterAudioMuteEnabled"]) && wm.Has("masterAudioMuteHotkey") && Trim(
        wm["masterAudioMuteHotkey"]) != "") {
        try {
            rawHk := Trim(wm["masterAudioMuteHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => (SoundSetMute(-1), SoundBeep(650, 40)), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Click-Through Ghost Mode Hotkey
    if (wm.Has("clickThroughGhostHotkey") && Trim(wm["clickThroughGhostHotkey"]) != "") {
        try {
            rawHk := Trim(wm["clickThroughGhostHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => ToggleGhostMode(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Window Shade / Roll Up Hotkey
    if ((!wm.Has("windowShadeEnabled") || wm["windowShadeEnabled"]) && wm.Has("windowShadeHotkey") && Trim(wm[
        "windowShadeHotkey"]) != "") {
        try {
            rawHk := Trim(wm["windowShadeHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => ToggleWindowShade(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Force Borderless Fullscreen Hotkey
    if ((!wm.Has("borderlessEnabled") || wm["borderlessEnabled"]) && wm.Has("borderlessHotkey") && Trim(wm[
        "borderlessHotkey"]) != "") {
        try {
            rawHk := Trim(wm["borderlessHotkey"])
            hk := NormalizeHotkeyToAhk(rawHk)
            if (hk = "")
                hk := rawHk
            Hotkey(hk, (*) => ToggleBorderlessFullscreen(), "On")
            g_ActiveHotkeys.Push(hk)
        }
    }

    ; Text Transformer (Case Converters: UPPER, lower, Title Case)
    if (!wm.Has("textTransformEnabled") || wm["textTransformEnabled"]) {
        rawUpper := (wm.Has("textTransformUpperHotkey") && Trim(wm["textTransformUpperHotkey"]) != "") ? Trim(wm[
            "textTransformUpperHotkey"]) : "^!u"
        rawLower := (wm.Has("textTransformLowerHotkey") && Trim(wm["textTransformLowerHotkey"]) != "") ? Trim(wm[
            "textTransformLowerHotkey"]) : "^!l"
        rawTitle := (wm.Has("textTransformTitleHotkey") && Trim(wm["textTransformTitleHotkey"]) != "") ? Trim(wm[
            "textTransformTitleHotkey"]) : "^!t"
        upperHk := NormalizeHotkeyToAhk(rawUpper)
        if (upperHk = "") {
            upperHk := rawUpper
        }
        lowerHk := NormalizeHotkeyToAhk(rawLower)
        if (lowerHk = "") {
            lowerHk := rawLower
        }
        titleHk := NormalizeHotkeyToAhk(rawTitle)
        if (titleHk = "") {
            titleHk := rawTitle
        }
        try {
            Hotkey(upperHk, (*) => TransformSelectedText("upper"), "On")
            g_ActiveHotkeys.Push(upperHk)
        }
        try {
            Hotkey(lowerHk, (*) => TransformSelectedText("lower"), "On")
            g_ActiveHotkeys.Push(lowerHk)
        }
        try {
            Hotkey(titleHk, (*) => TransformSelectedText("title"), "On")
            g_ActiveHotkeys.Push(titleHk)
        }
    }

    ; Clean Plain Text & Strip Formatting Hotkey
    if (!wm.Has("textTransformCleanEnabled") || wm["textTransformCleanEnabled"]) {
        rawClean := (wm.Has("textTransformCleanHotkey") && Trim(wm["textTransformCleanHotkey"]) != "") ? Trim(wm[
            "textTransformCleanHotkey"]) : "^!k"
        cleanHk := NormalizeHotkeyToAhk(rawClean)
        if (cleanHk = "") {
            cleanHk := rawClean
        }
        try {
            Hotkey(cleanHk, (*) => TransformSelectedText("clean"), "On")
            g_ActiveHotkeys.Push(cleanHk)
        }
    }

    ; Instant Screen OCR (Text Grabber) Hotkey
    if (!wm.Has("screenOcrEnabled") || wm["screenOcrEnabled"]) {
        rawOcr := (wm.Has("screenOcrHotkey") && Trim(wm["screenOcrHotkey"]) != "") ? Trim(wm["screenOcrHotkey"]) :
            "^!o"
        ocrHk := NormalizeHotkeyToAhk(rawOcr)
        if (ocrHk = "") {
            ocrHk := rawOcr
        }
        try {
            Hotkey(ocrHk, (*) => StartScreenOCR(), "On")
            g_ActiveHotkeys.Push(ocrHk)
        }
    }

    ; Precision Screen Color Picker Hotkey
    if (!wm.Has("colorPickerEnabled") || wm["colorPickerEnabled"]) {
        rawCp := (wm.Has("colorPickerHotkey") && Trim(wm["colorPickerHotkey"]) != "") ? Trim(wm["colorPickerHotkey"]) :
            "^!p"
        cpHk := NormalizeHotkeyToAhk(rawCp)
        if (cpHk = "") {
            cpHk := rawCp
        }
        try {
            Hotkey(cpHk, (*) => StartColorPicker(), "On")
            g_ActiveHotkeys.Push(cpHk)
        }
    }

    ; Fast Virtual Desktop Navigation Hotkeys & Taskbar Mouse Wheel Hopping
    if (!wm.Has("virtualDesktopsEnabled") || wm["virtualDesktopsEnabled"] = 1 || wm["virtualDesktopsEnabled"] = true) {
        try {
            Hotkey("^!Left", (*) => SwitchVirtualDesktop(-1), "On")
            Hotkey("^!Right", (*) => SwitchVirtualDesktop(1), "On")
            g_ActiveHotkeys.Push("^!Left")
            g_ActiveHotkeys.Push("^!Right")
        }

        taskbarScrollOn := (!wm.Has("taskbarScrollEnabled") || wm["taskbarScrollEnabled"] = 1 || wm[
            "taskbarScrollEnabled"] = true)
        if (taskbarScrollOn) {
            try {
                HotIf(IsMouseOverTaskbar)
                Hotkey("WheelUp", (*) => SwitchVirtualDesktop(-1), "On")
                Hotkey("WheelDown", (*) => SwitchVirtualDesktop(1), "On")
                HotIf()
                g_ActiveHotkeys.Push("WheelUp")
                g_ActiveHotkeys.Push("WheelDown")
            }
        }
    }

    ; Quick PC Sleep / Hibernate Hotkey (Win+S)
    if (!wm.Has("sleepEnabled") || wm["sleepEnabled"] = 1 || wm["sleepEnabled"] = true) {
        rawSleep := (wm.Has("sleepHotkey") && Trim(wm["sleepHotkey"]) != "") ? Trim(wm["sleepHotkey"]) : "#s"
        sleepHk := NormalizeHotkeyToAhk(rawSleep)
        if (sleepHk = "") {
            sleepHk := rawSleep
        }
        try {
            Hotkey(sleepHk, (*) => TriggerSleepOrHibernate(), "On")
            g_ActiveHotkeys.Push(sleepHk)
        }

        ; Register Esc cancellation hook while countdown is running
        try {
            HotIf(() => g_SleepTimerActive)
            Hotkey("Esc", (*) => CancelSleepTimer("Sleep timer cancelled via Esc."), "On")
            HotIf()
        }
    }
}

TransformSelectedText(transType) {
    global g_Wv, g_MainGui, g_LastExternalHwnd
    activeHwnd := WinExist("A")
    if (g_MainGui && activeHwnd = g_MainGui.Hwnd && g_LastExternalHwnd && WinExist("ahk_id " . g_LastExternalHwnd)) {
        try WinActivate("ahk_id " . g_LastExternalHwnd)
        Sleep(60)
    }
    clipSaved := ClipboardAll()
    A_Clipboard := ""
    Send("^c")
    if (!ClipWait(0.35, 0)) {
        A_Clipboard := clipSaved
        return
    }

    txt := A_Clipboard
    if (txt = "") {
        A_Clipboard := clipSaved
        return
    }

    transformed := ""
    eventMsg := ""
    switch transType {
        case "upper":
            transformed := StrUpper(txt)
            eventMsg := "Text: UPPERCASE"
        case "lower":
            transformed := StrLower(txt)
            eventMsg := "Text: lowercase"
        case "title":
            transformed := StrTitle(txt)
            eventMsg := "Text: Title Case"
        case "clean":
            cleaned := RegExReplace(txt, "\r\n", "`n")
            cleaned := RegExReplace(cleaned, "[ \t]+$", "", , -1)
            transformed := cleaned
            eventMsg := "Text: Clean Plain Text"
    }

    A_Clipboard := transformed
    Sleep(25)
    Send("^v")
    Sleep(120)

    SoundBeep(900, 40)
    if (g_Wv && eventMsg != "") {
        try {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "windowManager",
                "message", eventMsg
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

; Precision Screen Color Picker with Magnifying Zoom Loupe, Reticle, Live Preview & Multi-Format Support
global g_ColorPickerActive := false
global g_ColorPickerLoupeGui := 0
global g_CpHMemDC := 0
global g_CpHMemBmp := 0
global g_CpHOldBmp := 0
global g_ColorPickerFormat := "HEX"
global g_CpLens := 0, g_CpTxtVal := 0, g_CpTxtSub := 0, g_CpSwatch := 0

FormatColorValue(cVal, fmt := "HEX") {
    r := (cVal >> 16) & 0xFF
    g := (cVal >> 8) & 0xFF
    b := cVal & 0xFF

    switch fmt {
        case "HEX_BARE":
            return Format("{:02X}{:02X}{:02X}", r, g, b)
        case "RGB":
            return "rgb(" . r . ", " . g . ", " . b . ")"
        case "RGBA":
            return "rgba(" . r . ", " . g . ", " . b . ", 1.0)"
        case "HSL":
            rf := r / 255.0, gf := g / 255.0, bf := b / 255.0
            cmax := Max(rf, gf, bf), cmin := Min(rf, gf, bf)
            delta := cmax - cmin
            l := (cmax + cmin) / 2.0
            if (delta = 0) {
                h := 0, s := 0
            } else {
                s := (l > 0.5) ? (delta / (2.0 - cmax - cmin)) : (delta / (cmax + cmin))
                if (cmax = rf)
                    h := Mod(((gf - bf) / delta) + 6, 6) * 60
                else if (cmax = gf)
                    h := (((bf - rf) / delta) + 2) * 60
                else
                    h := (((rf - gf) / delta) + 4) * 60
            }
            return Format("hsl({:d}, {:d}%, {:d}%)", Round(h), Round(s * 100), Round(l * 100))
        case "HSV":
            rf := r / 255.0, gf := g / 255.0, bf := b / 255.0
            cmax := Max(rf, gf, bf), cmin := Min(rf, gf, bf)
            delta := cmax - cmin
            v := cmax
            s := (cmax = 0) ? 0 : (delta / cmax)
            if (delta = 0) {
                h := 0
            } else {
                if (cmax = rf)
                    h := Mod(((gf - bf) / delta) + 6, 6) * 60
                else if (cmax = gf)
                    h := (((bf - rf) / delta) + 2) * 60
                else
                    h := (((rf - gf) / delta) + 4) * 60
            }
            return Format("hsv({:d}, {:d}%, {:d}%)", Round(h), Round(s * 100), Round(v * 100))
        case "CMYK":
            rf := r / 255.0, gf := g / 255.0, bf := b / 255.0
            k := 1.0 - Max(rf, gf, bf)
            if (k >= 0.999) {
                c := 0, m := 0, y := 0
            } else {
                c := (1.0 - rf - k) / (1.0 - k)
                m := (1.0 - gf - k) / (1.0 - k)
                y := (1.0 - bf - k) / (1.0 - k)
            }
            return Format("cmyk({:d}%, {:d}%, {:d}%, {:d}%)", Round(c * 100), Round(m * 100), Round(y * 100), Round(k *
                100))
        default: ; HEX
            return Format("#{:02X}{:02X}{:02X}", r, g, b)
    }
}

StartColorPicker() {
    global g_ColorPickerActive, g_ColorPickerLoupeGui, g_CpHMemDC, g_CpHMemBmp, g_CpHOldBmp
    global g_ColorPickerFormat, g_CpLens, g_CpTxtVal, g_CpTxtSub, g_CpSwatch, g_Config

    if (g_ColorPickerActive) {
        CloseColorPickerLoupe()
        return
    }

    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("colorFormat") && g_Config["windowManager"][
        "colorFormat"] != "") {
        g_ColorPickerFormat := g_Config["windowManager"]["colorFormat"]
    } else {
        g_ColorPickerFormat := "HEX"
    }

    CoordMode("Mouse", "Screen")
    CoordMode("Pixel", "Screen")
    MouseGetPos(&mx, &my)

    ; Determine initial monitor work area & cursor-following placement
    loupeW := 190, loupeH := 248, offset := 20
    monCount := MonitorGetCount()
    monLeft := 0, monTop := 0, monRight := A_ScreenWidth, monBottom := A_ScreenHeight
    loop monCount {
        MonitorGetWorkArea(A_Index, &mLeft, &mTop, &mRight, &mBottom)
        if (mx >= mLeft && mx <= mRight && my >= mTop && my <= mBottom) {
            monLeft := mLeft, monTop := mTop, monRight := mRight, monBottom := mBottom
            break
        }
    }
    wx := mx + offset
    wy := my + offset
    if (wx + loupeW > monRight) {
        wx := mx - loupeW - offset
    }
    if (wy + loupeH > monBottom) {
        wy := my - loupeH - offset
    }
    if (wx < monLeft) {
        wx := monLeft
    }
    if (wy < monTop) {
        wy := monTop
    }

    g_ColorPickerActive := true
    g_ColorPickerLoupeGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale")
    g_ColorPickerLoupeGui.BackColor := "181920"

    g_ColorPickerLoupeGui.SetFont("s11 cWhite Bold", "Segoe UI")
    g_CpTxtVal := g_ColorPickerLoupeGui.Add("Text", "x10 y8 w170 h24 Center", "#FFFFFF")

    g_ColorPickerLoupeGui.SetFont("s8 cA0AEC0 Norm", "Segoe UI")
    g_CpTxtSub := g_ColorPickerLoupeGui.Add("Text", "x10 y32 w170 h16 Center", "RGB: 255, 255, 255")

    g_CpSwatch := g_ColorPickerLoupeGui.Add("Progress", "x14 y50 w162 h7 -Smooth Background181920 cFFFFFF", 100)
    g_CpLens := g_ColorPickerLoupeGui.Add("Text", "x15 y61 w160 h150 +0x12")

    g_ColorPickerLoupeGui.SetFont("s8 c718096 Norm", "Segoe UI")
    g_ColorPickerLoupeGui.Add("Text", "x10 y215 w170 h28 Center",
        "[Click] Pick  •  [Space] Format`n[Esc / Right Click] Cancel")

    g_ColorPickerLoupeGui.Show("x" . wx . " y" . wy . " w" . loupeW . " h" . loupeH . " NoActivate")

    try {
        hRgn := DllCall("CreateRoundRectRgn", "int", 0, "int", 0, "int", loupeW, "int", loupeH, "int", 16, "int", 16,
            "ptr")
        DllCall("SetWindowRgn", "ptr", g_ColorPickerLoupeGui.Hwnd, "ptr", hRgn, "int", 1)
    }

    hdcScreen := DllCall("GetDC", "ptr", 0, "ptr")
    g_CpHMemDC := DllCall("CreateCompatibleDC", "ptr", hdcScreen, "ptr")
    g_CpHMemBmp := DllCall("CreateCompatibleBitmap", "ptr", hdcScreen, "int", 160, "int", 150, "ptr")
    g_CpHOldBmp := DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", g_CpHMemBmp, "ptr")
    DllCall("ReleaseDC", "ptr", 0, "ptr", hdcScreen)

    UpdateColorPickerLoupe()
    SetTimer(UpdateColorPickerLoupe, 16)

    Hotkey("*LButton", ColorPickerPickColor, "On")
    Hotkey("*RButton", ColorPickerCancel, "On")
    Hotkey("*Escape", ColorPickerCancel, "On")
    Hotkey("*Space", ColorPickerCycleFormat, "On")
}

UpdateColorPickerLoupe() {
    global g_ColorPickerActive, g_ColorPickerLoupeGui, g_CpHMemDC, g_ColorPickerFormat
    global g_CpLens, g_CpTxtVal, g_CpTxtSub, g_CpSwatch

    if (!g_ColorPickerActive || !g_ColorPickerLoupeGui)
        return

    CoordMode("Mouse", "Screen")
    CoordMode("Pixel", "Screen")
    MouseGetPos(&mx, &my)

    srcX := mx - 7
    srcY := my - 7

    hdcScreen := DllCall("GetDC", "ptr", 0, "ptr")
    DllCall("SetStretchBltMode", "ptr", g_CpHMemDC, "int", 3)
    DllCall("StretchBlt", "ptr", g_CpHMemDC, "int", 5, "int", 0, "int", 150, "int", 150, "ptr", hdcScreen, "int", srcX,
        "int", srcY, "int", 15, "int", 15, "uint", 0x00CC0020)

    ; Grid lines between 15x15 pixels
    gridPen := DllCall("CreatePen", "int", 0, "int", 1, "uint", 0x22222A, "ptr")
    oldPen := DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", gridPen, "ptr")
    loop 14 {
        px := 5 + A_Index * 10
        DllCall("MoveToEx", "ptr", g_CpHMemDC, "int", px, "int", 0, "ptr", 0)
        DllCall("LineTo", "ptr", g_CpHMemDC, "int", px, "int", 150)

        py := A_Index * 10
        DllCall("MoveToEx", "ptr", g_CpHMemDC, "int", 5, "int", py, "ptr", 0)
        DllCall("LineTo", "ptr", g_CpHMemDC, "int", 155, "int", py)
    }

    ; Center Reticle (Dual-layer: outer black, inner white)
    blackPen := DllCall("CreatePen", "int", 0, "int", 1, "uint", 0x000000, "ptr")
    nullBrush := DllCall("GetStockObject", "int", 5, "ptr")
    oldBrush := DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", nullBrush, "ptr")

    DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", blackPen, "ptr")
    DllCall("Rectangle", "ptr", g_CpHMemDC, "int", 74, "int", 69, "int", 86, "int", 81)

    whitePen := DllCall("CreatePen", "int", 0, "int", 1, "uint", 0xFFFFFF, "ptr")
    DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", whitePen, "ptr")
    DllCall("Rectangle", "ptr", g_CpHMemDC, "int", 75, "int", 70, "int", 85, "int", 80)

    ; Outer lens frame border
    lensBorderPen := DllCall("CreatePen", "int", 0, "int", 1, "uint", 0x3E4252, "ptr")
    DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", lensBorderPen, "ptr")
    DllCall("Rectangle", "ptr", g_CpHMemDC, "int", 4, "int", 0, "int", 156, "int", 150)

    ; Cleanup temporary GDI drawing objects
    DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", oldPen)
    DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", oldBrush)
    DllCall("DeleteObject", "ptr", gridPen)
    DllCall("DeleteObject", "ptr", blackPen)
    DllCall("DeleteObject", "ptr", whitePen)
    DllCall("DeleteObject", "ptr", lensBorderPen)

    ; BitBlt composite buffer to static control DC
    hdcLens := DllCall("GetDC", "ptr", g_CpLens.Hwnd, "ptr")
    DllCall("BitBlt", "ptr", hdcLens, "int", 0, "int", 0, "int", 160, "int", 150, "ptr", g_CpHMemDC, "int", 0, "int", 0,
        "uint", 0x00CC0020)
    DllCall("ReleaseDC", "ptr", g_CpLens.Hwnd, "ptr", hdcLens)
    DllCall("ReleaseDC", "ptr", 0, "ptr", hdcScreen)

    ; Live color inspection
    cVal := PixelGetColor(mx, my, "RGB")
    formatted := FormatColorValue(cVal, g_ColorPickerFormat)
    hexClean := Format("{:06X}", cVal)
    g_CpTxtVal.Text := formatted
    g_CpSwatch.Opt("c" . hexClean)
    r := (cVal >> 16) & 0xFF, g := (cVal >> 8) & 0xFF, b := cVal & 0xFF
    g_CpTxtSub.Text := (g_ColorPickerFormat = "HEX") ? ("RGB: " . r . ", " . g . ", " . b) : ("HEX: #" . hexClean)

    ; Loupe window repositioning - follow mouse smoothly & stay fully on-screen
    loupeW := 190, loupeH := 248, offset := 20
    monCount := MonitorGetCount()
    monLeft := 0, monTop := 0, monRight := A_ScreenWidth, monBottom := A_ScreenHeight
    loop monCount {
        MonitorGetWorkArea(A_Index, &mLeft, &mTop, &mRight, &mBottom)
        if (mx >= mLeft && mx <= mRight && my >= mTop && my <= mBottom) {
            monLeft := mLeft, monTop := mTop, monRight := mRight, monBottom := mBottom
            break
        }
    }

    wx := mx + offset
    wy := my + offset
    if (wx + loupeW > monRight) {
        wx := mx - loupeW - offset
    }
    if (wy + loupeH > monBottom) {
        wy := my - loupeH - offset
    }
    if (wx < monLeft) {
        wx := monLeft
    }
    if (wy < monTop) {
        wy := monTop
    }
    if (wx + loupeW > monRight) {
        wx := monRight - loupeW
    }
    if (wy + loupeH > monBottom) {
        wy := monBottom - loupeH
    }

    DllCall("SetWindowPos", "ptr", g_ColorPickerLoupeGui.Hwnd, "ptr", -1, "int", wx, "int", wy, "int", 0, "int", 0,
        "uint", 0x0011)
}

ColorPickerPickColor(*) {
    global g_ColorPickerFormat, g_Wv, g_ColorPickerTarget
    CoordMode("Mouse", "Screen")
    CoordMode("Pixel", "Screen")
    MouseGetPos(&mx, &my)
    cVal := PixelGetColor(mx, my, "RGB")
    formatted := FormatColorValue(cVal, g_ColorPickerFormat)
    A_Clipboard := formatted
    SoundBeep(1200, 50)
    target := g_ColorPickerTarget
    CloseColorPickerLoupe()
    if (g_Wv) {
        msg := JSON.stringify(Map(
            "type", "moduleEvent",
            "module", "systemTools",
            "message", "Color Copied: " . formatted
        ))
        g_Wv.PostWebMessageAsString(msg)

        pickMsg := JSON.stringify(Map(
            "type", "colorPicked",
            "color", formatted,
            "format", g_ColorPickerFormat,
            "hex", Format("#{:06X}", cVal),
            "x", mx,
            "y", my,
            "target", target
        ))
        g_Wv.PostWebMessageAsString(pickMsg)
    }
}

ColorPickerCancel(*) {
    CloseColorPickerLoupe()
}

ColorPickerCycleFormat(*) {
    global g_ColorPickerFormat, g_Config, g_Wv
    static formats := ["HEX", "HEX_BARE", "RGB", "RGBA", "HSL", "HSV", "CMYK"]
    idx := 1
    loop formats.Length {
        if (formats[A_Index] = g_ColorPickerFormat) {
            idx := A_Index
            break
        }
    }
    idx := Mod(idx, formats.Length) + 1
    g_ColorPickerFormat := formats[idx]

    if (!g_Config.Has("windowManager")) {
        g_Config["windowManager"] := Map()
    }
    g_Config["windowManager"]["colorFormat"] := g_ColorPickerFormat
    SaveConfigToFile()

    if (g_Wv) {
        msg := JSON.stringify(Map(
            "type", "colorFormatChanged",
            "format", g_ColorPickerFormat
        ))
        g_Wv.PostWebMessageAsString(msg)
    }

    UpdateColorPickerLoupe()
}

CloseColorPickerLoupe() {
    global g_ColorPickerActive, g_ColorPickerLoupeGui, g_CpHMemDC, g_CpHMemBmp, g_CpHOldBmp, g_ColorPickerTarget

    SetTimer(UpdateColorPickerLoupe, 0)

    try Hotkey("*LButton", "Off")
    try Hotkey("*RButton", "Off")
    try Hotkey("*Escape", "Off")
    try Hotkey("*Space", "Off")

    if (g_CpHMemDC) {
        DllCall("SelectObject", "ptr", g_CpHMemDC, "ptr", g_CpHOldBmp)
        DllCall("DeleteDC", "ptr", g_CpHMemDC)
        DllCall("DeleteObject", "ptr", g_CpHMemBmp)
        g_CpHMemDC := 0
        g_CpHMemBmp := 0
    }

    if (g_ColorPickerLoupeGui) {
        try g_ColorPickerLoupeGui.Destroy()
        g_ColorPickerLoupeGui := 0
    }
    g_ColorPickerActive := false
    g_ColorPickerTarget := ""
}

StartScreenOCR() {
    global g_Wv
    CoordMode("Mouse", "Screen")

    vx := SysGet(76), vy := SysGet(77), vw := SysGet(78), vh := SysGet(79)
    snipGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +LastFound +E0x00080000")
    snipGui.BackColor := "000000"
    WinSetTransparent(40, snipGui)
    snipGui.Show("x" . vx . " y" . vy . " w" . vw . " h" . vh)

    KeyWait("LButton", "D T4")
    if (A_PriorKey = "Escape" || !GetKeyState("LButton", "P")) {
        snipGui.Destroy()
        return
    }

    MouseGetPos(&x1, &y1)
    boxGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale")
    boxGui.BackColor := "d97706"
    WinSetTransparent(80, boxGui)

    while GetKeyState("LButton", "P") {
        Sleep(15)
        MouseGetPos(&cx, &cy)
        bx := Min(x1, cx), by := Min(y1, cy)
        bw := Abs(cx - x1), bh := Abs(cy - y1)
        if (bw > 2 && bh > 2) {
            boxGui.Show("x" . bx . " y" . by . " w" . bw . " h" . bh . " NoActivate")
        }
    }

    MouseGetPos(&x2, &y2)
    snipGui.Destroy()
    boxGui.Destroy()

    snipX := Min(x1, x2), snipY := Min(y1, y2)
    snipW := Abs(x2 - x1), snipH := Abs(y2 - y1)

    if (snipW < 8 || snipH < 8) {
        return
    }

    try {
        result := OCR.FromRect(snipX, snipY, snipW, snipH)
        if (result && Trim(result.Text) != "") {
            txt := Trim(result.Text)
            A_Clipboard := txt
            SoundBeep(1250, 50)
            wordsCount := StrSplit(txt, [" ", "`n", "`r", "`t"]).Length
            if (g_Wv) {
                msg := JSON.stringify(Map(
                    "type", "moduleEvent",
                    "module", "systemTools",
                    "message", "OCR: Copied " . wordsCount . " words to Clipboard"
                ))
                g_Wv.PostWebMessageAsString(msg)
            }
        } else {
            SoundBeep(450, 40)
        }
    } catch as err {
        LogMessage("OCR Error: " . err.Message)
    }
}

StartScreenRegionSelector(mode := "region") {
    global g_Wv
    CoordMode("Mouse", "Screen")

    vx := SysGet(76), vy := SysGet(77), vw := SysGet(78), vh := SysGet(79)
    if (vw <= 0) {
        vx := 0, vy := 0, vw := A_ScreenWidth, vh := A_ScreenHeight
    }
    snipGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +LastFound +E0x00080000")
    snipGui.BackColor := "000000"
    WinSetTransparent(45, snipGui)
    snipGui.Show("x" . vx . " y" . vy . " w" . vw . " h" . vh)

    KeyWait("LButton", "D T10")
    if (A_PriorKey = "Escape" || !GetKeyState("LButton", "P")) {
        try snipGui.Destroy()
        return
    }

    MouseGetPos(&x1, &y1)
    boxGui := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale")
    boxGui.BackColor := "d97706"
    WinSetTransparent(80, boxGui)

    while GetKeyState("LButton", "P") {
        Sleep(15)
        MouseGetPos(&cx, &cy)
        bx := Min(x1, cx), by := Min(y1, cy)
        bw := Abs(cx - x1), bh := Abs(cy - y1)
        if (bw > 2 && bh > 2) {
            boxGui.Show("x" . bx . " y" . by . " w" . bw . " h" . bh . " NoActivate")
        }
    }

    MouseGetPos(&x2, &y2)
    try snipGui.Destroy()
    try boxGui.Destroy()

    rx1 := Min(x1, x2), ry1 := Min(y1, y2)
    rx2 := Max(x1, x2), ry2 := Max(y1, y2)
    rw := rx2 - rx1, rh := ry2 - ry1

    if (rw < 5 || rh < 5)
        return

    SoundBeep(1200, 40)

    if (mode = "snip") {
        snipDir := A_ScriptDir . "\ui\icons\snips"
        if (!DirExist(snipDir)) {
            try DirCreate(snipDir)
        }
        snipName := "snip_" . FormatTime(, "yyyyMMdd_HHmmss") . ".png"
        fullPath := snipDir . "\" . snipName
        success := CaptureScreenAreaToFile(rx1, ry1, rw, rh, fullPath)
        if (success && g_Wv) {
            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                "type", "screenSnipSaved",
                "path", fullPath,
                "x1", rx1, "y1", ry1, "x2", rx2, "y2", ry2,
                "width", rw, "height", rh
            )))
        }
    } else {
        if (g_Wv) {
            g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                "type", "screenRegionSelected",
                "x1", rx1, "y1", ry1, "x2", rx2, "y2", ry2
            )))
        }
    }
}

CaptureScreenAreaToFile(x, y, w, h, outPngPath) {
    if (w <= 0 || h <= 0)
        return false

    SplitPath(outPngPath, , &outDir)
    if (outDir != "" && !DirExist(outDir)) {
        try DirCreate(outDir)
    }

    hdcScreen := DllCall("GetDC", "ptr", 0, "ptr")
    hdcMem := DllCall("CreateCompatibleDC", "ptr", hdcScreen, "ptr")
    hBitmap := DllCall("CreateCompatibleBitmap", "ptr", hdcScreen, "int", w, "int", h, "ptr")
    hOld := DllCall("SelectObject", "ptr", hdcMem, "ptr", hBitmap, "ptr")

    DllCall("BitBlt", "ptr", hdcMem, "int", 0, "int", 0, "int", w, "int", h, "ptr", hdcScreen, "int", x, "int", y,
        "uint", 0x00CC0020)

    DllCall("LoadLibrary", "Str", "gdiplus.dll", "Ptr")
    si := Buffer(A_PtrSize = 8 ? 24 : 16, 0)
    NumPut("UInt", 1, si, 0)
    token := 0
    success := false
    if (DllCall("gdiplus\GdiplusStartup", "Ptr*", &token, "Ptr", si.Ptr, "Ptr", 0) == 0) {
        pBitmap := 0
        if (DllCall("gdiplus\GdipCreateBitmapFromHBITMAP", "Ptr", hBitmap, "Ptr", 0, "Ptr*", &pBitmap) == 0) {
            clsidPng := Buffer(16)
            DllCall("ole32\CLSIDFromString", "Str", "{557CF406-1A04-11D3-9A73-0000F81EF32E}", "Ptr", clsidPng.Ptr)
            if (DllCall("gdiplus\GdipSaveImageToFile", "Ptr", pBitmap, "Str", outPngPath, "Ptr", clsidPng.Ptr, "Ptr", 0
            ) == 0) {
                success := true
            }
            DllCall("gdiplus\GdipDisposeImage", "Ptr", pBitmap)
        }
        DllCall("gdiplus\GdiplusShutdown", "Ptr", token)
    }

    DllCall("SelectObject", "ptr", hdcMem, "ptr", hOld)
    DllCall("DeleteObject", "ptr", hBitmap)
    DllCall("DeleteDC", "ptr", hdcMem)
    DllCall("ReleaseDC", "ptr", 0, "ptr", hdcScreen)

    return success
}

SwitchVirtualDesktop(dir) {
    global g_Wv
    static lastSwitchTick := 0
    if (A_TickCount - lastSwitchTick < 120)
        return
    lastSwitchTick := A_TickCount

    if (dir > 0) {
        Send("^#{Right}")
        msgText := "Virtual Desktop: Next (→)"
    } else {
        Send("^#{Left}")
        msgText := "Virtual Desktop: Previous (←)"
    }
    SoundBeep(750, 35)
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "systemTools",
                "message", msgText
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

global g_SleepTimerActive := false
global g_SleepTimerSecondsLeft := 0
global g_SleepTimerMode := "Sleep"

TriggerSleepOrHibernate() {
    global g_Config, g_Wv, g_SleepTimerActive, g_SleepTimerSecondsLeft, g_SleepTimerMode
    wm := g_Config.Has("windowManager") ? g_Config["windowManager"] : Map()
    if (wm.Has("sleepEnabled") && !wm["sleepEnabled"]) {
        return
    }

    ; If countdown is already ticking, pressing Win+S again cancels it
    if (g_SleepTimerActive) {
        CancelSleepTimer("Sleep timer cancelled by user.")
        return
    }

    isHibernate := (wm.Has("sleepMode") && wm["sleepMode"] = "hibernate")
    || (wm.Has("sleepModeHibernate") && (wm["sleepModeHibernate"] = 1 || wm["sleepModeHibernate"] = true))
    g_SleepTimerMode := isHibernate ? "Hibernate" : "Sleep"

    delaySec := 0
    if (wm.Has("sleepTimer")) {
        try {
            delayMin := Max(0, Integer(wm["sleepTimer"]))
            delaySec := delayMin * 60
        } catch {
            delaySec := 0
        }
    }

    if (delaySec <= 0) {
        ExecuteSleepNow(isHibernate)
    } else {
        StartSleepCountdown(delaySec, isHibernate)
    }
}

FormatDurationSeconds(sec) {
    if (sec <= 0)
        return "0s"
    if (sec < 60)
        return sec . "s"
    mins := sec // 60
    remSec := Mod(sec, 60)
    if (mins < 60) {
        return (remSec = 0) ? (mins . "m") : (mins . "m " . remSec . "s")
    }
    hrs := mins // 60
    remMins := Mod(mins, 60)
    if (remMins = 0 && remSec = 0)
        return hrs . "h"
    if (remSec = 0)
        return hrs . "h " . remMins . "m"
    return hrs . "h " . remMins . "m " . remSec . "s"
}

StartSleepCountdown(seconds, isHibernate) {
    global g_SleepTimerActive, g_SleepTimerSecondsLeft, g_SleepTimerMode, g_Wv
    g_SleepTimerActive := true
    g_SleepTimerSecondsLeft := seconds
    g_SleepTimerMode := isHibernate ? "Hibernate" : "Sleep"

    SoundBeep(850, 80)
    NotifySleepMessage("System: " . g_SleepTimerMode . " in " . FormatDurationSeconds(seconds) .
    " (Press Win+S or Esc to cancel)")
    NotifySleepTimerState(true, seconds, g_SleepTimerMode)

    SetTimer(SleepCountdownTick, 1000)
}

SleepCountdownTick() {
    global g_SleepTimerActive, g_SleepTimerSecondsLeft, g_SleepTimerMode
    if (!g_SleepTimerActive) {
        SetTimer(SleepCountdownTick, 0)
        NotifySleepTimerState(false, 0, "")
        return
    }

    g_SleepTimerSecondsLeft--

    if (g_SleepTimerSecondsLeft <= 0) {
        SetTimer(SleepCountdownTick, 0)
        g_SleepTimerActive := false
        isHib := (g_SleepTimerMode = "Hibernate")
        NotifySleepTimerState(false, 0, "")
        ExecuteSleepNow(isHib)
        return
    }

    NotifySleepTimerState(true, g_SleepTimerSecondsLeft, g_SleepTimerMode)

    ; Audio & message cues for final seconds or interval
    shouldNotify := false
    if (g_SleepTimerSecondsLeft <= 5) {
        shouldNotify := true
    } else if (g_SleepTimerSecondsLeft <= 30 && Mod(g_SleepTimerSecondsLeft, 10) = 0) {
        shouldNotify := true
    } else if (Mod(g_SleepTimerSecondsLeft, 60) = 0) {
        shouldNotify := true
    }

    if (shouldNotify) {
        SoundBeep(950, 40)
        NotifySleepMessage("System: " . g_SleepTimerMode . " in " . FormatDurationSeconds(g_SleepTimerSecondsLeft) .
        "... (Win+S or Esc to cancel)")
    }
}

CancelSleepTimer(reason := "Sleep timer cancelled.") {
    global g_SleepTimerActive, g_SleepTimerSecondsLeft
    if (!g_SleepTimerActive) {
        return
    }
    g_SleepTimerActive := false
    g_SleepTimerSecondsLeft := 0
    SetTimer(SleepCountdownTick, 0)
    NotifySleepTimerState(false, 0, "")
    SoundBeep(450, 70)
    NotifySleepMessage(reason)
}

ExecuteSleepNow(isHibernate) {
    global g_Wv
    NotifySleepTimerState(false, 0, "")
    SoundBeep(isHibernate ? 700 : 900, 60)
    NotifySleepMessage(isHibernate ? "System: Entering Hibernate now..." : "System: Entering Sleep now...")

    Sleep(200)

    if (isHibernate) {
        res := DllCall("PowrProf\SetSuspendState", "int", 1, "int", 0, "int", 0)
        if (!res) {
            Run("shutdown /h", , "Hide")
        }
    } else {
        DllCall("PowrProf\SetSuspendState", "int", 0, "int", 0, "int", 0)
    }
}

NotifySleepTimerState(isActive, secondsLeft, mode) {
    global g_Wv
    if (g_Wv) {
        try {
            msg := JSON.stringify(Map(
                "type", "sleepTimerState",
                "active", isActive ? 1 : 0,
                "secondsLeft", secondsLeft,
                "mode", mode
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

NotifySleepMessage(msgText) {
    global g_Wv
    if (g_Wv && msgText != "") {
        try {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "windowManager",
                "message", msgText
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

ToggleAlwaysOnTop() {
    global g_MainGui, g_Wv, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("alwaysOnTopEnabled") && !g_Config[
        "windowManager"]["alwaysOnTopEnabled"]) {
        return
    }
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd)
            return
        isTop := WinGetExStyle("ahk_id " . hwnd) & 0x8
        WinSetAlwaysOnTop(-1, "ahk_id " . hwnd)
        SoundBeep(isTop ? 600 : 900, 60)

        if (g_Wv) {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "windowManager",
                "message", isTop ? "Always-on-Top: Disabled" : "Always-on-Top: Enabled"
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

CenterActiveWindow() {
    global g_MainGui, g_Wv, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("centerWindowEnabled") && !g_Config[
        "windowManager"]["centerWindowEnabled"]) {
        return
    }
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd)
            return
        MonitorGetWorkArea(, &l, &t, &r, &b)
        WinGetPos(, , &w, &h, "ahk_id " . hwnd)
        newX := l + (r - l - w) // 2
        newY := t + (b - t - h) // 2
        WinMove(newX, newY, , , "ahk_id " . hwnd)
        SoundBeep(850, 50)

        if (g_Wv) {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "windowManager",
                "message", "Active Window Centered"
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

HideActiveWindow() {
    global g_MainGui, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("hideWindowEnabled") && !g_Config[
        "windowManager"]["hideWindowEnabled"]) {
        return
    }
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd)
            return
        WinMinimize("ahk_id " . hwnd)
        SoundBeep(500, 40)
    }
}

AdjustActiveWindowTransparency(delta) {
    global g_MainGui, g_Wv, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("transparencyWheel") && !g_Config[
        "windowManager"]["transparencyWheel"]) {
        return
    }
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd)
            return
        curAlpha := WinGetTransparent("ahk_id " . hwnd)
        if (curAlpha = "") {
            curAlpha := 255
        }
        newAlpha := Min(255, Max(40, curAlpha + delta))
        WinSetTransparent(newAlpha, "ahk_id " . hwnd)

        ; If Click-Through Ghost Mode is active in config
        if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("clickThroughGhost") && g_Config[
            "windowManager"]["clickThroughGhost"]) {
            if (newAlpha < 255) {
                WinSetExStyle("+0x20", "ahk_id " . hwnd)
            } else {
                WinSetExStyle("-0x20", "ahk_id " . hwnd)
            }
        }

        if (g_Wv) {
            pct := Round((newAlpha / 255) * 100)
            ghostNote := (newAlpha < 255 && g_Config["windowManager"].Has("clickThroughGhost") && g_Config[
                "windowManager"]["clickThroughGhost"]) ? " [Ghost Click-Through]" : ""
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "windowManager",
                "message", "Opacity: " . pct . "%" . ghostNote
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    }
}

ToggleGhostMode() {
    global g_MainGui, g_Wv, g_Config
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd || (g_MainGui && hwnd = g_MainGui.Hwnd))
            return
        exStyle := WinGetExStyle("ahk_id " . hwnd)
        isGhost := (exStyle & 0x20)
        if (isGhost) {
            WinSetExStyle("-0x20", "ahk_id " . hwnd)
            WinSetTransparent(255, "ahk_id " . hwnd)
            SoundBeep(600, 50)
            msg := "Ghost Mode: Disabled (Normal)"
        } else {
            curAlpha := WinGetTransparent("ahk_id " . hwnd)
            if (curAlpha = "" || curAlpha = 255) {
                WinSetTransparent(180, "ahk_id " . hwnd)
            }
            WinSetExStyle("+0x20", "ahk_id " . hwnd)
            SoundBeep(950, 50)
            msg := "Ghost Mode: Enabled (Click-Through)"
        }
        if (g_Wv) {
            postMsg := JSON.stringify(Map("type", "moduleEvent", "module", "windowManager", "message", msg))
            g_Wv.PostWebMessageAsString(postMsg)
        }
    }
}

ToggleWindowShade() {
    global g_MainGui, g_ShadedWindows, g_Config, g_Wv
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("windowShadeEnabled") && !g_Config[
        "windowManager"]["windowShadeEnabled"])
        return
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd || (g_MainGui && hwnd = g_MainGui.Hwnd))
            return

        if (g_ShadedWindows.Has(hwnd)) {
            info := g_ShadedWindows[hwnd]
            g_ShadedWindows.Delete(hwnd)
            WinMove(info["x"], info["y"], info["w"], info["h"], "ahk_id " . hwnd)
            SoundBeep(850, 50)
            msg := "Window Shade: Unrolled"
        } else {
            minMax := WinGetMinMax("ahk_id " . hwnd)
            if (minMax = 1) {
                WinRestore("ahk_id " . hwnd)
            }
            WinGetPos(&x, &y, &w, &h, "ahk_id " . hwnd)
            g_ShadedWindows[hwnd] := Map("x", x, "y", y, "w", w, "h", h)

            captionH := DllCall("GetSystemMetrics", "int", 4, "int")
            frameH := DllCall("GetSystemMetrics", "int", 33, "int")
            titleBarHeight := Max(32, captionH + (frameH * 2) + 4)
            WinMove(x, y, w, titleBarHeight, "ahk_id " . hwnd)
            SoundBeep(650, 50)
            msg := "Window Shade: Rolled Up"
        }
        if (g_Wv) {
            postMsg := JSON.stringify(Map("type", "moduleEvent", "module", "windowManager", "message", msg))
            g_Wv.PostWebMessageAsString(postMsg)
        }
    }
}

ToggleBorderlessFullscreen() {
    global g_MainGui, g_BorderlessWindows, g_Config, g_Wv
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("borderlessEnabled") && !g_Config[
        "windowManager"]["borderlessEnabled"])
        return
    try {
        hwnd := WinExist("A")
        if (g_MainGui && hwnd = g_MainGui.Hwnd) {
            extHwnd := GetActiveExternalWindow()
            if (extHwnd)
                hwnd := extHwnd
        }
        if (!hwnd || (g_MainGui && hwnd = g_MainGui.Hwnd))
            return

        if (g_BorderlessWindows.Has(hwnd)) {
            info := g_BorderlessWindows[hwnd]
            g_BorderlessWindows.Delete(hwnd)
            WinSetStyle(info["style"], "ahk_id " . hwnd)
            WinMove(info["x"], info["y"], info["w"], info["h"], "ahk_id " . hwnd)
            DllCall("SetWindowPos", "ptr", hwnd, "ptr", 0, "int", 0, "int", 0, "int", 0, "int", 0, "uint", 0x0027)
            SoundBeep(700, 50)
            msg := "Borderless: Restored Window"
        } else {
            minMax := WinGetMinMax("ahk_id " . hwnd)
            if (minMax = 1) {
                WinRestore("ahk_id " . hwnd)
            }
            WinGetPos(&x, &y, &w, &h, "ahk_id " . hwnd)
            curStyle := WinGetStyle("ahk_id " . hwnd)
            g_BorderlessWindows[hwnd] := Map("x", x, "y", y, "w", w, "h", h, "style", curStyle)

            hMon := DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr")
            monInfo := Buffer(40, 0)
            NumPut("uint", 40, monInfo, 0)
            DllCall("GetMonitorInfo", "ptr", hMon, "ptr", monInfo)
            monLeft := NumGet(monInfo, 4, "int")
            monTop := NumGet(monInfo, 8, "int")
            monRight := NumGet(monInfo, 12, "int")
            monBottom := NumGet(monInfo, 16, "int")
            monW := monRight - monLeft
            monH := monBottom - monTop

            WinSetStyle("-0x00C40000", "ahk_id " . hwnd)
            WinMove(monLeft, monTop, monW, monH, "ahk_id " . hwnd)
            DllCall("SetWindowPos", "ptr", hwnd, "ptr", 0, "int", 0, "int", 0, "int", 0, "int", 0, "uint", 0x0027)
            SoundBeep(950, 50)
            msg := "Force Borderless Fullscreen Enabled"
        }
        if (g_Wv) {
            postMsg := JSON.stringify(Map("type", "moduleEvent", "module", "windowManager", "message", msg))
            g_Wv.PostWebMessageAsString(postMsg)
        }
    }
}

GetActiveExternalWindow() {
    global g_MainGui, g_LastExternalHwnd
    curHwnd := WinExist("A")
    if (curHwnd && curHwnd != g_MainGui.Hwnd) {
        g_LastExternalHwnd := curHwnd
        return curHwnd
    }
    if (g_LastExternalHwnd && WinExist("ahk_id " . g_LastExternalHwnd)) {
        return g_LastExternalHwnd
    }
    return 0
}

AdjustActiveAppVolume(delta) {
    global g_MainGui, g_Wv, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("appVolumeWheel") && !g_Config["windowManager"][
        "appVolumeWheel"]) {
        return
    }
    try {
        hwnd := GetActiveExternalWindow()
        if (!hwnd) {
            return
        }
        pid := WinGetPID("ahk_id " . hwnd)
        if (!pid) {
            return
        }
        procName := ""
        try procName := ProcessGetName(pid)
        if (procName = "") {
            procName := "Application"
        }

        if (AudioSession.SetVolume(pid, delta, true, &newVol, &isMuted)) {
            pct := Round(newVol * 100)
            icon := isMuted ? "🔇" : (pct = 0 ? "🔈" : (pct < 50 ? "🔉" : "🔊"))
            ToolTip(icon . " " . procName . " Volume: " . pct . "%")
            SetTimer(() => ToolTip(), -1400)

            if (g_Wv) {
                msg := JSON.stringify(Map(
                    "type", "activeAppVolumeChanged",
                    "pid", pid,
                    "name", procName,
                    "volume", pct,
                    "muted", isMuted
                ))
                g_Wv.PostWebMessageAsString(msg)
            }
        } else {
            ToolTip("🔈 " . procName . " (No active audio session)")
            SetTimer(() => ToolTip(), -1400)
        }
    }
}

ToggleActiveAppMute() {
    global g_MainGui, g_Wv, g_Config
    if (g_Config.Has("windowManager") && g_Config["windowManager"].Has("appVolumeMuteEnabled") && !g_Config[
        "windowManager"]["appVolumeMuteEnabled"]) {
        return
    }
    try {
        hwnd := GetActiveExternalWindow()
        if (!hwnd) {
            return
        }
        pid := WinGetPID("ahk_id " . hwnd)
        if (!pid) {
            return
        }
        procName := ""
        try procName := ProcessGetName(pid)
        if (procName = "") {
            procName := "Application"
        }

        if (AudioSession.ToggleMute(pid, &isMuted)) {
            curVol := AudioSession.GetVolume(pid)
            pct := curVol >= 0 ? Round(curVol * 100) : 0
            statusText := isMuted ? "MUTED" : "UNMUTED"
            icon := isMuted ? "🔇" : "🔊"
            ToolTip(icon . " " . procName . ": " . statusText . " (" . pct . "%)")
            SetTimer(() => ToolTip(), -1400)

            if (g_Wv) {
                msg := JSON.stringify(Map(
                    "type", "activeAppVolumeChanged",
                    "pid", pid,
                    "name", procName,
                    "volume", pct,
                    "muted", isMuted
                ))
                g_Wv.PostWebMessageAsString(msg)
            }
        }
    }
}

CheckActiveAppFocus() {
    global g_MainGui, g_Wv, g_LastExternalHwnd, g_LastPolledHwnd
    if (!g_Wv) {
        return
    }
    try {
        curHwnd := WinExist("A")
        if (curHwnd && curHwnd != g_MainGui.Hwnd) {
            g_LastExternalHwnd := curHwnd
            if (curHwnd != g_LastPolledHwnd) {
                g_LastPolledHwnd := curHwnd
                pid := WinGetPID("ahk_id " . curHwnd)
                procName := ""
                try procName := ProcessGetName(pid)
                if (procName != "") {
                    vol := AudioSession.GetVolume(pid, &isMuted)
                    pct := vol >= 0 ? Round(vol * 100) : -1
                    g_Wv.PostWebMessageAsString(JSON.stringify(Map(
                        "type", "activeAppVolumeChanged",
                        "pid", pid,
                        "name", procName,
                        "volume", pct,
                        "muted", isMuted
                    )))
                }
            }
        }
    }
}

