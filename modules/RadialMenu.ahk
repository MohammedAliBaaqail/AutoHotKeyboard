; ==============================================================================
; 8. Radial Menu / Command Palette (Pie Wheel) Module
; ==============================================================================

ApplyRadialMenu() {
    global g_Config, g_ActiveHotkeys, g_IsEngineActive

    if (!g_Config.Has("radialMenu")) {
        return
    }

    rm := g_Config["radialMenu"]
    isEnabled := (rm.Has("enabled") && (rm["enabled"] = 1 || rm["enabled"] = true))
    trig := (rm.Has("triggerButton") && Trim(rm["triggerButton"]) != "") ? Trim(rm["triggerButton"]) : "MButton"
    if (!isEnabled || !g_IsEngineActive || StrLower(trig) = "none") {
        return
    }

    try {
        hkStr := "*" . trig
        Hotkey(hkStr, (*) => HandleRadialMenuTrigger(trig), "On")
        g_ActiveHotkeys.Push(hkStr)
    }
}

HandleRadialMenuTrigger(trigBtn) {
    global g_Config
    if (!g_Config.Has("radialMenu")) {
        Click(trigBtn)
        return
    }

    rm := g_Config["radialMenu"]
    slices := rm.Has("slices") ? rm["slices"] : []
    radSize := rm.Has("wheelRadius") ? rm["wheelRadius"] : 180
    sliceCount := (rm.Has("sliceCount") && rm["sliceCount"] = 4) ? 4 : 8
    centerAction := rm.Has("centerAction") ? Trim(rm["centerAction"]) : ""

    CoordMode("Mouse", "Screen")
    MouseGetPos(&originX, &originY)

    RadialMenuHUD.ShowMenu(originX, originY, radSize, slices, trigBtn, sliceCount, centerAction)
}

class RadialMenuHUD {
    static guiObj := 0
    static isShowing := false
    static pressedKey := ""

    static OnHotKey(key) {
        this.pressedKey := StrLower(key)
    }

    static GetActionFriendlyName(actionName) {
        static nameMap := Map(
            "ScreenOcr", "OCR",
            "ColorPicker", "Color Pick",
            "NextDesktop", "Next Desk",
            "PrevDesktop", "Prev Desk",
            "AlwaysOnTop", "Pin Top",
            "MuteVolume", "Mute Audio",
            "CleanText", "Clean Text",
            "TaskView", "Task View",
            "ShowDesktop", "Desktop",
            "LockWorkstation", "Lock PC",
            "Calculator", "Calculator",
            "Screenshot", "Screenshot",
            "MaximizeWindow", "Maximize",
            "MinimizeWindow", "Minimize",
            "CloseWindow", "Close Win",
            "PlayPause", "Play/Pause",
            "NextTrack", "Next Track",
            "PrevTrack", "Prev Track",
            "ActionCenter", "Action Ctr",
            "StartMenu", "Start Menu",
            "NewTab", "New Tab",
            "CloseTab", "Close Tab",
            "ReloadPage", "Reload"
        )
        if (nameMap.Has(actionName))
            return nameMap[actionName]
        return (actionName = "" || actionName = "none") ? "Empty" : actionName
    }

    static ParseHexColor(hexStr, defaultAlpha := 255) {
        clean := StrReplace(StrReplace(hexStr, "#", ""), " ", "")
        if (StrLen(clean) = 6) {
            r := Integer("0x" . SubStr(clean, 1, 2))
            g := Integer("0x" . SubStr(clean, 3, 2))
            b := Integer("0x" . SubStr(clean, 5, 2))
            return ((defaultAlpha & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
        } else if (StrLen(clean) = 8) {
            return Integer("0x" . clean)
        }
        return 0xFF2563EB
    }

    static AdjustBrightness(argb, delta) {
        a := (argb >> 24) & 0xFF
        r := Max(0, Min(255, ((argb >> 16) & 0xFF) + delta))
        g := Max(0, Min(255, ((argb >> 8) & 0xFF) + delta))
        b := Max(0, Min(255, (argb & 0xFF) + delta))
        return (a << 24) | (r << 16) | (g << 8) | b
    }

    static GetLuminance(argb) {
        r := (argb >> 16) & 0xFF
        g := (argb >> 8) & 0xFF
        b := argb & 0xFF
        return 0.299 * r + 0.587 * g + 0.114 * b
    }

    static AddShapeToPath(pPath, x, y, w, h, r) {
        if (r <= 0.5) {
            DllCall("gdiplus\GdipAddPathRectangle", "ptr", pPath, "float", x, "float", y, "float", w, "float", h)
        } else if (r >= (w / 2.0 - 0.5) && r >= (h / 2.0 - 0.5)) {
            DllCall("gdiplus\GdipAddPathEllipse", "ptr", pPath, "float", x, "float", y, "float", w, "float", h)
        } else {
            d := r * 2.0
            DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x, "float", y, "float", d, "float", d, "float",
                180.0, "float", 90.0)
            DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x + w - d, "float", y, "float", d, "float", d,
                "float", 270.0, "float", 90.0)
            DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x + w - d, "float", y + h - d, "float", d, "float",
                d, "float", 0.0, "float", 90.0)
            DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x, "float", y + h - d, "float", d, "float", d,
                "float", 90.0, "float", 90.0)
            DllCall("gdiplus\GdipClosePathFigure", "ptr", pPath)
        }
    }

    static ShowMenu(originX, originY, radSize, slices, trigBtn, sliceCount := 8, centerAction := "") {
        global g_Config
        if (this.isShowing)
            return
        this.isShowing := true
        this.pressedKey := ""

        ; If triggered by a Space combo, wait for Space release so center hub isn't immediately activated
        if (InStr(trigBtn, "SPACE") || InStr(trigBtn, "Space")) {
            while (GetKeyState("Space", "P")) {
                Sleep(10)
            }
        }

        sliceCount := (sliceCount = 4) ? 4 : 8
        is4Slice := (sliceCount = 4)
        ; Ergonomic WASD-cluster key mapping: Up=W, Up-Right=E, Right=D, Down-Right=C, Down=S/X, Down-Left=Z, Left=A, Up-Left=Q
        dirs := is4Slice ? ["W", "D", "S", "A"] : ["W", "E", "D", "C", "S", "Z", "A", "Q"]
        wedgeStep := is4Slice ? 90.0 : 45.0
        halfWedge := wedgeStep / 2.0
        cardinalMap := is4Slice ? [1, 3, 5, 7] : [1, 2, 3, 4, 5, 6, 7, 8]

        ProfileGdipHelper.Init()

        dpiScale := A_ScreenDPI / 96.0
        radSize := Max(140, Min(260, Integer(radSize)))
        guiDiameter := Round((radSize + 70) * 2 * dpiScale)
        guiRadius := guiDiameter // 2
        cx := Float(guiRadius)
        cy := Float(guiRadius)
        R_outer := Float(radSize * dpiScale)
        R_inner := Float(43.0 * dpiScale)
        R_nodes := Float((R_outer + R_inner) * 0.52)
        nodeDiam := 52.0 * dpiScale
        nodeHoverDiam := 58.0 * dpiScale

        ; Read active theme dynamically
        themeBg := (g_Config.Has("theme") && g_Config["theme"].Has("bgColor")) ? g_Config["theme"]["bgColor"] :
            "#f1f5f9"
        themeAccent := (g_Config.Has("theme") && g_Config["theme"].Has("accentColor")) ? g_Config["theme"][
            "accentColor"] : "#2563eb"
        themeRadius := (g_Config.Has("theme") && g_Config["theme"].Has("radius")) ? Integer(g_Config["theme"]["radius"]
        ) : 10

        bgArgb := RadialMenuHUD.ParseHexColor(themeBg, 255)
        accentArgb := RadialMenuHUD.ParseHexColor(themeAccent, 255)
        isLight := RadialMenuHUD.GetLuminance(bgArgb) > 135

        ; Calculate corner radii based on theme.radius (if radius == 0, sharp squares!)
        if (themeRadius <= 0) {
            outerCornerR := 0.0
            hubCornerR := 0.0
            nodeCornerR := 0.0
        } else {
            outerCornerR := Min(R_outer, Float(themeRadius * 7.0 * dpiScale))
            hubCornerR := Min(R_inner, Float(themeRadius * 2.5 * dpiScale))
            nodeCornerR := Min(nodeDiam / 2.0, Float(themeRadius * 2.0 * dpiScale))
        }

        this.guiObj := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +E0x08000000 +E0x00080000")

        hDC := DllCall("GetDC", "ptr", 0, "ptr")
        hMemDC := DllCall("CreateCompatibleDC", "ptr", hDC, "ptr")

        bi := Buffer(40, 0)
        NumPut("uint", 40, bi, 0)
        NumPut("int", guiDiameter, bi, 4)
        NumPut("int", -guiDiameter, bi, 8)
        NumPut("ushort", 1, bi, 12)
        NumPut("ushort", 32, bi, 14)

        pBits := 0
        hBmp := DllCall("CreateDIBSection", "ptr", hMemDC, "ptr", bi, "uint", 0, "ptr*", &pBits, "ptr", 0, "uint", 0,
            "ptr")
        hOldBmp := DllCall("SelectObject", "ptr", hMemDC, "ptr", hBmp, "ptr")

        pGraphics := 0
        DllCall("gdiplus\GdipCreateFromHDC", "ptr", hMemDC, "ptr*", &pGraphics)
        DllCall("gdiplus\GdipSetSmoothingMode", "ptr", pGraphics, "int", 4)
        DllCall("gdiplus\GdipSetTextRenderingHint", "ptr", pGraphics, "int", 4)

        ; GDI+ Fonts matching JetBrains Mono / Segoe UI
        pFamily := 0
        if (DllCall("gdiplus\GdipCreateFontFamilyFromName", "wstr", "JetBrains Mono", "ptr", 0, "ptr*", &pFamily) != 0 ||
        !pFamily) {
            DllCall("gdiplus\GdipCreateFontFamilyFromName", "wstr", "Segoe UI", "ptr", 0, "ptr*", &pFamily)
        }
        scaleRatio := radSize / 180.0
        fontDirSize := 12.5 * dpiScale * scaleRatio
        fontLabelSize := 11.5 * dpiScale * scaleRatio
        fontCenterSize := 8.5 * dpiScale * scaleRatio
        fontCenterActionSize := 10.5 * dpiScale * scaleRatio

        pFontDir := 0
        DllCall("gdiplus\GdipCreateFont", "ptr", pFamily, "float", fontDirSize, "int", 1, "int", 2, "ptr*", &pFontDir)
        pFontLabel := 0
        DllCall("gdiplus\GdipCreateFont", "ptr", pFamily, "float", fontLabelSize, "int", 1, "int", 2, "ptr*", &
            pFontLabel)
        pFontCenter := 0
        DllCall("gdiplus\GdipCreateFont", "ptr", pFamily, "float", fontCenterSize, "int", 1, "int", 2, "ptr*", &
            pFontCenter)
        pFontCenterAction := 0
        DllCall("gdiplus\GdipCreateFont", "ptr", pFamily, "float", fontCenterActionSize, "int", 1, "int", 2, "ptr*", &
            pFontCenterAction)

        ; String formats (centered)
        pFormat := 0
        DllCall("gdiplus\GdipCreateStringFormat", "int", 0, "int", 0, "ptr*", &pFormat)
        DllCall("gdiplus\GdipSetStringFormatAlign", "ptr", pFormat, "int", 1)
        DllCall("gdiplus\GdipSetStringFormatLineAlign", "ptr", pFormat, "int", 1)

        ; Brushes & Pens dynamically mapped to the current theme
        cBackdrop := (0xFC << 24) | (bgArgb & 0x00FFFFFF)
        cBorder := isLight ? ((0x80 << 24) | (RadialMenuHUD.AdjustBrightness(bgArgb, -45) & 0x00FFFFFF)) : ((0x60 << 24
        ) | (RadialMenuHUD.AdjustBrightness(bgArgb, 40) & 0x00FFFFFF))
        cShadow := isLight ? ((0x30 << 24) | (RadialMenuHUD.AdjustBrightness(bgArgb, -60) & 0x00FFFFFF)) : 0x50000000
        cSpoke := isLight ? ((0x35 << 24) | (RadialMenuHUD.AdjustBrightness(bgArgb, -50) & 0x00FFFFFF)) : ((0x30 << 24) |
        (RadialMenuHUD.AdjustBrightness(bgArgb, 50) & 0x00FFFFFF))
        cHoverWedge := (0x35 << 24) | (accentArgb & 0x00FFFFFF)

        cNodeNormalBg := (0xFF << 24) | (RadialMenuHUD.AdjustBrightness(bgArgb, isLight ? 10 : 15) & 0x00FFFFFF)
        cNodeNormalBorder := cBorder
        cNodeHoverBg := (0xFF << 24) | (accentArgb & 0x00FFFFFF)
        cNodeHoverBorder := isLight ? 0xFFFFFFFF : 0xFFFFFFFF

        cCenterHubBg := (0xFF << 24) | (RadialMenuHUD.AdjustBrightness(bgArgb, isLight ? -6 : -10) & 0x00FFFFFF)
        cCenterHubBorder := (0xFF << 24) | (accentArgb & 0x00FFFFFF)
        cTargetIcon := (0xFF << 24) | (accentArgb & 0x00FFFFFF)

        cTextTagNormal := (0xFF << 24) | (accentArgb & 0x00FFFFFF)
        cTextLblNormal := isLight ? 0xFF1E293B : 0xFFF1F5F9
        cTextTagHover := 0xFFFFFFFF
        cTextLblHover := 0xFFFFFFFF
        cTextCenterNormal := isLight ? 0xFF64748B : 0xFF94A3B8
        cTextCenterHover := (0xFF << 24) | (accentArgb & 0x00FFFFFF)

        pWheelBackdropBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cBackdrop, "ptr*", &pWheelBackdropBrush)

        pWheelShadowPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cShadow, "float", 3.0 * dpiScale, "int", 2, "ptr*", &pWheelShadowPen)

        pWheelBorderPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cBorder, "float", 1.8 * dpiScale, "int", 2, "ptr*", &pWheelBorderPen)

        pSpokePen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cSpoke, "float", 1.0 * dpiScale, "int", 2, "ptr*", &pSpokePen)

        pHoverWedgeBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cHoverWedge, "ptr*", &pHoverWedgeBrush)

        ; Slice Nodes
        pNodeNormalBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cNodeNormalBg, "ptr*", &pNodeNormalBrush)

        pNodeNormalPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cNodeNormalBorder, "float", 1.5 * dpiScale, "int", 2, "ptr*", &
            pNodeNormalPen)

        pNodeHoverBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cNodeHoverBg, "ptr*", &pNodeHoverBrush)

        pNodeHoverPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cNodeHoverBorder, "float", 2.2 * dpiScale, "int", 2, "ptr*", &
            pNodeHoverPen)

        ; Center Hub
        pCenterHubBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cCenterHubBg, "ptr*", &pCenterHubBrush)

        pCenterHubPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cCenterHubBorder, "float", 2.0 * dpiScale, "int", 2, "ptr*", &
            pCenterHubPen)

        pTargetIconPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cTargetIcon, "float", 1.6 * dpiScale, "int", 2, "ptr*", &
            pTargetIconPen)

        pTargetIconDotBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTargetIcon, "ptr*", &pTargetIconDotBrush)

        ; Text Brushes
        pTextTagNormalBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextTagNormal, "ptr*", &pTextTagNormalBrush)
        pTextLblNormalBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextLblNormal, "ptr*", &pTextLblNormalBrush)
        pTextTagHoverBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextTagHover, "ptr*", &pTextTagHoverBrush)
        pTextLblHoverBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextLblHover, "ptr*", &pTextLblHoverBrush)
        pTextCenterNormalBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextCenterNormal, "ptr*", &pTextCenterNormalBrush)
        pTextCenterHoverBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cTextCenterHover, "ptr*", &pTextCenterHoverBrush)

        rectBuf := Buffer(16, 0)
        ptDst := Buffer(8, 0)
        sz := Buffer(8, 0)
        NumPut("int", guiDiameter, sz, 0), NumPut("int", guiDiameter, sz, 4)
        ptSrc := Buffer(8, 0)
        blend := Buffer(4, 0)
        NumPut("uchar", 0, blend, 0), NumPut("uchar", 0, blend, 1)
        NumPut("uchar", 255, blend, 2), NumPut("uchar", 1, blend, 3)

        posX := originX - guiRadius
        posY := originY - guiRadius
        NumPut("int", posX, ptDst, 0), NumPut("int", posY, ptDst, 4)

        this.guiObj.Show("x" . posX . " y" . posY . " w" . guiDiameter . " h" . guiDiameter . " NoActivate")

        DrawFrame(selIndex) {
            DllCall("gdiplus\GdipGraphicsClear", "ptr", pGraphics, "uint", 0x00000000)

            ; 1. Outer backdrop path (sharp square if radius 0, squircle, or circle)
            pBackdropPath := 0
            DllCall("gdiplus\GdipCreatePath", "int", 0, "ptr*", &pBackdropPath)
            RadialMenuHUD.AddShapeToPath(pBackdropPath, cx - R_outer, cy - R_outer, R_outer * 2.0, R_outer * 2.0,
                outerCornerR)

            ; Shadow path
            pShadowPath := 0
            DllCall("gdiplus\GdipCreatePath", "int", 0, "ptr*", &pShadowPath)
            shadowOffset := 1.5 * dpiScale
            shadowR := (outerCornerR > 0) ? (outerCornerR + shadowOffset) : 0.0
            RadialMenuHUD.AddShapeToPath(pShadowPath, cx - R_outer - shadowOffset, cy - R_outer - shadowOffset, (
                R_outer + shadowOffset) * 2.0, (R_outer + shadowOffset) * 2.0, shadowR)
            DllCall("gdiplus\GdipDrawPath", "ptr", pGraphics, "ptr", pWheelShadowPen, "ptr", pShadowPath)
            DllCall("gdiplus\GdipDeletePath", "ptr", pShadowPath)

            ; Fill backdrop
            DllCall("gdiplus\GdipFillPath", "ptr", pGraphics, "ptr", pWheelBackdropBrush, "ptr", pBackdropPath)

            ; 2. Hovered slice sector (clipped to backdrop so square corners stay sharp and unclipped)
            if (selIndex >= 0) {
                DllCall("gdiplus\GdipSetClipPath", "ptr", pGraphics, "ptr", pBackdropPath, "int", 0)
                startAngle := (selIndex * wedgeStep) - 90.0 - halfWedge
                DllCall("gdiplus\GdipFillPie", "ptr", pGraphics, "ptr", pHoverWedgeBrush
                    , "float", cx - R_outer * 1.5, "float", cy - R_outer * 1.5, "float", R_outer * 3.0, "float",
                    R_outer * 3.0
                    , "float", startAngle, "float", wedgeStep)
                DllCall("gdiplus\GdipResetClip", "ptr", pGraphics)
            }

            ; 3. Radial Spoke Dividers (clipped to backdrop)
            DllCall("gdiplus\GdipSetClipPath", "ptr", pGraphics, "ptr", pBackdropPath, "int", 0)
            loop (is4Slice ? 4 : 8) {
                spokeAng := ((A_Index - 1) * wedgeStep - 90.0 - halfWedge) * (0.0174532925)
                x1 := cx + R_inner * Cos(spokeAng)
                y1 := cy + R_inner * Sin(spokeAng)
                x2 := cx + R_outer * 1.5 * Cos(spokeAng)
                y2 := cy + R_outer * 1.5 * Sin(spokeAng)
                DllCall("gdiplus\GdipDrawLine", "ptr", pGraphics, "ptr", pSpokePen, "float", x1, "float", y1, "float",
                    x2, "float", y2)
            }
            DllCall("gdiplus\GdipResetClip", "ptr", pGraphics)

            ; 4. Outer Backdrop Border
            DllCall("gdiplus\GdipDrawPath", "ptr", pGraphics, "ptr", pWheelBorderPen, "ptr", pBackdropPath)
            DllCall("gdiplus\GdipDeletePath", "ptr", pBackdropPath)

            ; 5. Slice Option Labels (Floating freely without surrounding boxes, scaling with wheel diameter)
            loop (is4Slice ? 4 : 8) {
                idx := A_Index - 1
                isHov := (idx == selIndex)
                rad := (idx * wedgeStep - 90.0) * (0.0174532925)
                nx := cx + R_nodes * Cos(rad)
                ny := cy + R_nodes * Sin(rad)

                sliceArrIdx := cardinalMap[A_Index]
                actName := (sliceArrIdx <= slices.Length) ? slices[sliceArrIdx] : ""
                friendly := RadialMenuHUD.GetActionFriendlyName(actName)

                tagW := 90.0 * dpiScale * scaleRatio
                tagH := 16.0 * dpiScale * scaleRatio
                lblW := 110.0 * dpiScale * scaleRatio
                lblH := 24.0 * dpiScale * scaleRatio

                ; Direction Tag (N, NE, etc.)
                NumPut("float", nx - (tagW / 2.0), rectBuf, 0)
                NumPut("float", ny - (tagH + 1.0 * dpiScale), rectBuf, 4)
                NumPut("float", tagW, rectBuf, 8)
                NumPut("float", tagH, rectBuf, 12)
                DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", dirs[idx + 1], "int", -1
                    , "ptr", pFontDir, "ptr", rectBuf.Ptr, "ptr", pFormat, "ptr", (isHov ? pTextTagHoverBrush :
                        pTextTagNormalBrush))

                ; Action Label (OCR, Next Desk, etc.)
                NumPut("float", nx - (lblW / 2.0), rectBuf, 0)
                NumPut("float", ny + (1.0 * dpiScale), rectBuf, 4)
                NumPut("float", lblW, rectBuf, 8)
                NumPut("float", lblH, rectBuf, 12)
                DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", friendly, "int", -1
                    , "ptr", pFontLabel, "ptr", rectBuf.Ptr, "ptr", pFormat, "ptr", (isHov ? pTextLblHoverBrush :
                        pTextLblNormalBrush))
            }

            ; 6. Center Hub (Recessed Hub with Target Icon or Action Name)
            pHubPath := 0
            DllCall("gdiplus\GdipCreatePath", "int", 0, "ptr*", &pHubPath)
            RadialMenuHUD.AddShapeToPath(pHubPath, cx - R_inner, cy - R_inner, R_inner * 2.0, R_inner * 2.0, hubCornerR
            )
            DllCall("gdiplus\GdipFillPath", "ptr", pGraphics, "ptr", pCenterHubBrush, "ptr", pHubPath)
            DllCall("gdiplus\GdipDrawPath", "ptr", pGraphics, "ptr", (selIndex == -2 ? pNodeHoverPen : pCenterHubPen),
            "ptr", pHubPath)
            DllCall("gdiplus\GdipDeletePath", "ptr", pHubPath)

            if (selIndex >= 0) {
                curArrIdx := cardinalMap[selIndex + 1]
                centerTxt := RadialMenuHUD.GetActionFriendlyName((curArrIdx <= slices.Length) ? slices[curArrIdx] : "")
                NumPut("float", cx - R_inner, rectBuf, 0)
                NumPut("float", cy - (11.0 * dpiScale), rectBuf, 4)
                NumPut("float", R_inner * 2.0, rectBuf, 8)
                NumPut("float", 22.0 * dpiScale, rectBuf, 12)
                DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", centerTxt, "int", -1
                    , "ptr", pFontCenterAction, "ptr", rectBuf.Ptr, "ptr", pFormat, "ptr", pTextCenterHoverBrush)
            } else if (selIndex == -2) {
                centerTxt := (centerAction != "" && centerAction != "none") ? RadialMenuHUD.GetActionFriendlyName(
                    centerAction) : "DISMISS"
                NumPut("float", cx - R_inner, rectBuf, 0)
                NumPut("float", cy - (11.0 * dpiScale), rectBuf, 4)
                NumPut("float", R_inner * 2.0, rectBuf, 8)
                NumPut("float", 22.0 * dpiScale, rectBuf, 12)
                DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", centerTxt, "int", -1
                    , "ptr", pFontCenterAction, "ptr", rectBuf.Ptr, "ptr", pFormat, "ptr", pTextCenterHoverBrush)
            } else {
                if (hubCornerR <= 0.5) {
                    targetRingR := 8.0 * dpiScale
                    DllCall("gdiplus\GdipDrawRectangle", "ptr", pGraphics, "ptr", pTargetIconPen
                        , "float", cx - targetRingR, "float", cy - (14.0 * dpiScale) - targetRingR, "float",
                        targetRingR * 2.0, "float", targetRingR * 2.0)
                    dotR := 3.0 * dpiScale
                    DllCall("gdiplus\GdipFillRectangle", "ptr", pGraphics, "ptr", pTargetIconDotBrush
                        , "float", cx - dotR, "float", cy - (14.0 * dpiScale) - dotR, "float", dotR * 2.0, "float",
                        dotR * 2.0)
                } else {
                    targetRingR := 9.0 * dpiScale
                    DllCall("gdiplus\GdipDrawEllipse", "ptr", pGraphics, "ptr", pTargetIconPen
                        , "float", cx - targetRingR, "float", cy - (14.0 * dpiScale) - targetRingR, "float",
                        targetRingR * 2.0, "float", targetRingR * 2.0)
                    dotR := 3.2 * dpiScale
                    DllCall("gdiplus\GdipFillEllipse", "ptr", pGraphics, "ptr", pTargetIconDotBrush
                        , "float", cx - dotR, "float", cy - (14.0 * dpiScale) - dotR, "float", dotR * 2.0, "float",
                        dotR * 2.0)
                }

                NumPut("float", cx - R_inner, rectBuf, 0)
                NumPut("float", cy + (4.0 * dpiScale), rectBuf, 4)
                NumPut("float", R_inner * 2.0, rectBuf, 8)
                NumPut("float", 18.0 * dpiScale, rectBuf, 12)
                hubPrompt := (centerAction != "" && centerAction != "none") ? "SPACE" : "WASD / CLICK"
                DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", hubPrompt, "int", -1
                    , "ptr", pFontCenter, "ptr", rectBuf.Ptr, "ptr", pFormat, "ptr", pTextCenterNormalBrush)
            }

            DllCall("UpdateLayeredWindow", "ptr", this.guiObj.Hwnd, "ptr", hDC, "ptr", ptDst, "ptr", sz, "ptr", hMemDC,
                "ptr", ptSrc, "uint", 0, "ptr", blend, "uint", 2)
        }

        DrawFrame(-1)

        isMouseBtn := (trigBtn = "MButton" || trigBtn = "XButton1" || trigBtn = "XButton2" || trigBtn = "RButton")
        startTick := A_TickCount
        selectedSlice := -1
        clickedSlice := -1

        ; Setup InputHook to intercept and suppress WASD-cluster keys, Space, Enter, Escape
        ; This ensures instant response without leaking keystrokes to foreground apps
        ih := InputHook("L0 I1")
        ih.KeyOpt("{All}", "-N -S")
        ih.KeyOpt("{w}{a}{s}{d}{q}{e}{z}{c}{x}{Space}{Escape}{Enter}", "+N +S")
        ih.OnKeyDown := (hook, vk, sc) => (RadialMenuHUD.pressedKey := StrLower(GetKeyName(Format("vk{:x}sc{:x}", vk,
            sc))))
        try ih.Start()

        ; Unified interaction loop: handles mouse hover, hold-and-release, click, and WASD keys
        while (true) {
            Sleep(10)

            ; 1. Cancellation check
            if (RadialMenuHUD.pressedKey = "escape" || GetKeyState("Escape", "P") || GetKeyState("RButton", "P")) {
                clickedSlice := -1
                break
            }

            ; 2. WASD-cluster keyboard activation
            kPress := RadialMenuHUD.pressedKey
            if (kPress = "") {
                if (GetKeyState("w", "P"))
                    kPress := "w"
                else if (GetKeyState("e", "P"))
                    kPress := "e"
                else if (GetKeyState("d", "P"))
                    kPress := "d"
                else if (GetKeyState("c", "P"))
                    kPress := "c"
                else if (GetKeyState("s", "P") || GetKeyState("x", "P"))
                    kPress := "s"
                else if (GetKeyState("z", "P"))
                    kPress := "z"
                else if (GetKeyState("a", "P"))
                    kPress := "a"
                else if (GetKeyState("q", "P"))
                    kPress := "q"
                else if (GetKeyState("Space", "P") || GetKeyState("Enter", "P"))
                    kPress := "space"
            }

            if (kPress != "") {
                if (kPress = "w") {
                    clickedSlice := 0 ; Up / North
                } else if (is4Slice) {
                    if (kPress = "d")
                        clickedSlice := 1 ; Right / East
                    else if (kPress = "s" || kPress = "x")
                        clickedSlice := 2 ; Down / South
                    else if (kPress = "a")
                        clickedSlice := 3 ; Left / West
                    else if (kPress = "space" || kPress = "enter")
                        clickedSlice := -2 ; Center hub
                } else {
                    if (kPress = "e")
                        clickedSlice := 1 ; Up-Right / North-East
                    else if (kPress = "d")
                        clickedSlice := 2 ; Right / East
                    else if (kPress = "c")
                        clickedSlice := 3 ; Down-Right / South-East
                    else if (kPress = "s" || kPress = "x")
                        clickedSlice := 4 ; Down / South
                    else if (kPress = "z")
                        clickedSlice := 5 ; Down-Left / South-West
                    else if (kPress = "a")
                        clickedSlice := 6 ; Left / West
                    else if (kPress = "q")
                        clickedSlice := 7 ; Up-Left / North-West
                    else if (kPress = "space" || kPress = "enter")
                        clickedSlice := -2 ; Center hub
                }

                if (clickedSlice != -1) {
                    DrawFrame(clickedSlice)
                    Sleep(40)
                    break
                }
            }

            ; 3. Mouse pointer tracking and slice highlighting
            MouseGetPos(&curX, &curY)
            dx := curX - originX
            dy := curY - originY
            dist := Sqrt(dx * dx + dy * dy)

            newSel := -1
            if (dist < (26.0 * dpiScale)) {
                newSel := -2 ; Center hub hovered
            } else if (dist <= (radSize + 40.0 * dpiScale)) {
                angle := (ATan2(dx, -dy) * 57.2957795)
                if (angle < 0) angle += 360
                    newSel := Mod(Round(angle / wedgeStep), sliceCount)
            }

            if (newSel != selectedSlice) {
                selectedSlice := newSel
                DrawFrame(selectedSlice)
            }

            ; 4. Hold & Release Trigger Gesture (e.g. MButton hold-drag-release)
            if (isMouseBtn && !GetKeyState(trigBtn, "P") && (A_TickCount - startTick > 150)) {
                if (selectedSlice >= 0 || selectedSlice == -2) {
                    clickedSlice := selectedSlice
                    DrawFrame(clickedSlice)
                    Sleep(30)
                }
                break
            }

            ; 5. Left Click Direct Activation
            if (GetKeyState("LButton", "P")) {
                while (GetKeyState("LButton", "P")) {
                    Sleep(10)
                }
                if (dist < (26.0 * dpiScale)) {
                    clickedSlice := -2
                } else if (dist <= (radSize + 40.0 * dpiScale) && selectedSlice >= 0) {
                    clickedSlice := selectedSlice
                } else {
                    clickedSlice := -1
                }
                break
            }
        }

        try ih.Stop()

        this.guiObj.Destroy()
        this.guiObj := 0
        this.isShowing := false
        RadialMenuHUD.pressedKey := ""

        DllCall("gdiplus\GdipDeleteBrush", "ptr", pWheelBackdropBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pHoverWedgeBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pNodeNormalBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pNodeHoverBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pCenterHubBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTargetIconDotBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextTagNormalBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextLblNormalBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextTagHoverBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextLblHoverBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextCenterNormalBrush)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextCenterHoverBrush)
        DllCall("gdiplus\GdipDeletePen", "ptr", pWheelShadowPen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pWheelBorderPen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pSpokePen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pNodeNormalPen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pNodeHoverPen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pCenterHubPen)
        DllCall("gdiplus\GdipDeletePen", "ptr", pTargetIconPen)
        DllCall("gdiplus\GdipDeleteFont", "ptr", pFontDir)
        DllCall("gdiplus\GdipDeleteFont", "ptr", pFontLabel)
        DllCall("gdiplus\GdipDeleteFont", "ptr", pFontCenter)
        DllCall("gdiplus\GdipDeleteFont", "ptr", pFontCenterAction)
        DllCall("gdiplus\GdipDeleteFontFamily", "ptr", pFamily)
        DllCall("gdiplus\GdipDeleteStringFormat", "ptr", pFormat)
        DllCall("gdiplus\GdipDeleteGraphics", "ptr", pGraphics)
        DllCall("SelectObject", "ptr", hMemDC, "ptr", hOldBmp)
        DllCall("DeleteObject", "ptr", hBmp)
        DllCall("DeleteDC", "ptr", hMemDC)
        DllCall("ReleaseDC", "ptr", 0, "ptr", hDC)

        if (clickedSlice == -2) {
            if (centerAction != "" && centerAction != "none") {
                ExecuteSystemAction(centerAction, "Radial Menu (Center Hub)")
            }
        } else if (clickedSlice >= 0 && clickedSlice < cardinalMap.Length) {
            sourceIdx := cardinalMap[clickedSlice + 1]
            if (sourceIdx <= slices.Length) {
                actionName := slices[sourceIdx]
                if (actionName != "" && actionName != "none") {
                    ExecuteSystemAction(actionName, "Radial Menu (" . dirs[clickedSlice + 1] . ")")
                }
            }
        }
    }

    static AddRoundRectToPath(pPath, x, y, w, h, r) {
        d := r * 2.0
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x, "float", y, "float", d, "float", d, "float", 180.0,
            "float", 90.0)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x + w - d, "float", y, "float", d, "float", d, "float",
            270.0, "float", 90.0)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x + w - d, "float", y + h - d, "float", d, "float", d,
            "float", 0.0, "float", 90.0)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", x, "float", y + h - d, "float", d, "float", d, "float",
            90.0, "float", 90.0)
        DllCall("gdiplus\GdipClosePathFigure", "ptr", pPath)
    }
}

ATan2(x, y) {
    return DllCall("msvcrt\atan2", "Double", x, "Double", y, "Cdecl Double")
}

; ----------------------------------------------------------------------
; Radial Menu (Pie Wheel) WASD Cluster Keyboard Interception Hotkeys
; Active ONLY while the Radial Menu on-screen overlay is showing.
; Intercepts and suppresses keystrokes to prevent pass-through to background apps.
; ----------------------------------------------------------------------
#HotIf RadialMenuHUD.isShowing
*w:: RadialMenuHUD.OnHotKey("w")
*a:: RadialMenuHUD.OnHotKey("a")
*s:: RadialMenuHUD.OnHotKey("s")
*d:: RadialMenuHUD.OnHotKey("d")
*q:: RadialMenuHUD.OnHotKey("q")
*e:: RadialMenuHUD.OnHotKey("e")
*z:: RadialMenuHUD.OnHotKey("z")
*c:: RadialMenuHUD.OnHotKey("c")
*x:: RadialMenuHUD.OnHotKey("x")
*f:: RadialMenuHUD.OnHotKey("f")
*Space:: RadialMenuHUD.OnHotKey("space")
*Escape:: RadialMenuHUD.OnHotKey("escape")
#HotIf