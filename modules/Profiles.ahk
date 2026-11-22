; ==============================================================================
; Profile Auto-Switching Engine & Running Apps Scanner
; ==============================================================================

global g_LastActiveSwitchProc := ""
global g_LastActiveSwitchHwnd := 0

class ProfileGdipHelper {
    static pToken := 0
    static Init() {
        if (this.pToken != 0)
            return true
        DllCall("LoadLibrary", "Str", "gdiplus.dll", "Ptr")
        si := Buffer(24, 0)
        NumPut("UInt", 1, si, 0)
        token := 0
        if (DllCall("gdiplus\GdiplusStartup", "Ptr*", &token, "Ptr", si.Ptr, "Ptr", 0) == 0) {
            this.pToken := token
            return true
        }
        return false
    }
}

class ProfileAppScanner {
    static ExtractExeIcon(fullPath, outPng) {
        try {
            if (!ProfileGdipHelper.Init())
                return false
            hIcon := 0
            hIcons := Buffer(A_PtrSize, 0)
            hIconIds := Buffer(4, 0)
            if (DllCall("user32\PrivateExtractIconsW", "Str", fullPath, "Int", 0, "Int", 48, "Int", 48, "Ptr", hIcons.Ptr,
                "Ptr", hIconIds.Ptr, "UInt", 1, "UInt", 0) > 0) {
                hIcon := NumGet(hIcons, 0, "Ptr")
            }
            if (!hIcon) {
                pathBuf := Buffer(520, 0)
                StrPut(fullPath, pathBuf, "UTF-16")
                index := 0
                hIcon := DllCall("shell32\ExtractAssociatedIcon", "Ptr", 0, "Ptr", pathBuf.Ptr, "Short*", &index, "Ptr"
                )
            }
            if (hIcon) {
                pBitmap := 0
                DllCall("gdiplus\GdipCreateBitmapFromHICON", "Ptr", hIcon, "Ptr*", &pBitmap)
                DllCall("user32\DestroyIcon", "Ptr", hIcon)
                if (pBitmap) {
                    this.CleanWhiteCorners(pBitmap)
                    clsidPng := Buffer(16)
                    DllCall("ole32\CLSIDFromString", "Str", "{557CF406-1A04-11D3-9A73-0000F81EF32E}", "Ptr", clsidPng.Ptr
                    )
                    DllCall("gdiplus\GdipSaveImageToFile", "Ptr", pBitmap, "Str", outPng, "Ptr", clsidPng.Ptr, "Ptr", 0
                    )
                    DllCall("gdiplus\GdipDisposeImage", "Ptr", pBitmap)
                }
            }
            return FileExist(outPng) ? true : false
        } catch {
            return false
        }
    }

    static CleanWhiteCorners(pBitmap) {
        try {
            width := 0, height := 0
            DllCall("gdiplus\GdipGetImageWidth", "Ptr", pBitmap, "UInt*", &width)
            DllCall("gdiplus\GdipGetImageHeight", "Ptr", pBitmap, "UInt*", &height)
            if (width < 4 || height < 4 || width > 128 || height > 128)
                return

            ; Check if top-left corner is solid white or near-white (common GDI+ artifact from masked icons)
            argb0 := 0
            DllCall("gdiplus\GdipBitmapGetPixel", "Ptr", pBitmap, "Int", 0, "Int", 0, "UInt*", &argb0)
            a0 := (argb0 >> 24) & 0xFF
            r0 := (argb0 >> 16) & 0xFF
            g0 := (argb0 >> 8) & 0xFF
            b0 := argb0 & 0xFF
            if (a0 < 250 || r0 < 240 || g0 < 240 || b0 < 240)
                return

            ; Flood-fill from 4 outer corners to convert connected white background to alpha 0
            queue := [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
            visited := Map()
            maxIters := 500
            iter := 0
            while (queue.Length > 0 && ++iter <= maxIters) {
                pt := queue.Pop()
                x := pt[1], y := pt[2]
                if (x < 0 || x >= width || y < 0 || y >= height)
                    continue
                key := x . "," . y
                if (visited.Has(key))
                    continue
                visited[key] := true

                curArgb := 0
                DllCall("gdiplus\GdipBitmapGetPixel", "Ptr", pBitmap, "Int", x, "Int", y, "UInt*", &curArgb)
                a := (curArgb >> 24) & 0xFF
                r := (curArgb >> 16) & 0xFF
                g := (curArgb >> 8) & 0xFF
                b := curArgb & 0xFF
                if (a == 255 && r > 240 && g > 240 && b > 240) {
                    DllCall("gdiplus\GdipBitmapSetPixel", "Ptr", pBitmap, "Int", x, "Int", y, "UInt", 0x00000000)
                    queue.Push([x + 1, y])
                    queue.Push([x - 1, y])
                    queue.Push([x, y + 1])
                    queue.Push([x, y - 1])
                }
            }
        }
    }

    static CleanPngFile(pngPath) {
        if (!FileExist(pngPath))
            return
        if (!ProfileGdipHelper.Init())
            return
        pBitmap := 0
        DllCall("gdiplus\GdipCreateBitmapFromFile", "WStr", pngPath, "Ptr*", &pBitmap)
        if (pBitmap) {
            this.CleanWhiteCorners(pBitmap)
            clsidPng := Buffer(16)
            DllCall("ole32\CLSIDFromString", "Str", "{557CF406-1A04-11D3-9A73-0000F81EF32E}", "Ptr", clsidPng.Ptr)
            tmpPng := pngPath . ".tmp.png"
            DllCall("gdiplus\GdipSaveImageToFile", "Ptr", pBitmap, "Str", tmpPng, "Ptr", clsidPng.Ptr, "Ptr", 0)
            DllCall("gdiplus\GdipDisposeImage", "Ptr", pBitmap)
            if (FileExist(tmpPng)) {
                try FileMove(tmpPng, pngPath, 1)
            }
        }
    }

    static CleanAllCachedIcons() {
        outDir := A_ScriptDir . "\ui\icons"
        if (!DirExist(outDir))
            return
        loop files, outDir . "\*.png" {
            this.CleanPngFile(A_LoopFileFullPath)
        }
    }

    static ExtractWindowIcon(hwnd, outPng) {
        try {
            hIcon := 0
            res := 0
            ; Use SendMessageTimeout with 40ms to prevent hanging on unresponsive or suspended windows
            if (DllCall("user32\SendMessageTimeoutW", "Ptr", hwnd, "UInt", 0x007F, "Ptr", 1, "Ptr", 0, "UInt", 0x0002,
                "UInt", 40, "Ptr*", &res)) {
                hIcon := res
            }
            if (!hIcon && DllCall("user32\SendMessageTimeoutW", "Ptr", hwnd, "UInt", 0x007F, "Ptr", 0, "Ptr", 0, "UInt",
                0x0002, "UInt", 40, "Ptr*", &res)) {
                hIcon := res
            }
            if (!hIcon)
                hIcon := DllCall("GetClassLongPtr", "Ptr", hwnd, "Int", -14, "Ptr") ; GCLP_HICON
            if (!hIcon)
                hIcon := DllCall("GetClassLongPtr", "Ptr", hwnd, "Int", -34, "Ptr") ; GCLP_HICONSM
            if (hIcon) {
                if (ProfileGdipHelper.Init()) {
                    pBitmap := 0
                    DllCall("gdiplus\GdipCreateBitmapFromHICON", "Ptr", hIcon, "Ptr*", &pBitmap)
                    if (pBitmap) {
                        this.CleanWhiteCorners(pBitmap)
                        clsidPng := Buffer(16)
                        DllCall("ole32\CLSIDFromString", "Str", "{557CF406-1A04-11D3-9A73-0000F81EF32E}", "Ptr",
                            clsidPng.Ptr)
                        DllCall("gdiplus\GdipSaveImageToFile", "Ptr", pBitmap, "Str", outPng, "Ptr", clsidPng.Ptr,
                            "Ptr", 0)
                        DllCall("gdiplus\GdipDisposeImage", "Ptr", pBitmap)
                    }
                }
            }
            return FileExist(outPng) ? true : false
        } catch {
            return false
        }
    }

    static ResolveExePath(exePathOrName) {
        exePathOrName := Trim(exePathOrName)
        if (exePathOrName == "")
            return ""

        if (InStr(exePathOrName, ",")) {
            for part in StrSplit(exePathOrName, ",") {
                p := this.ResolveExePath(Trim(part))
                if (p != "")
                    return p
            }
            return ""
        }

        exeClean := Trim(exePathOrName, ' "`t')
        if (FileExist(exeClean))
            return exeClean

        cleanName := RegExReplace(exePathOrName, "i)\.exe$", "") . ".exe"
        cleanBase := RegExReplace(cleanName, "i)\.exe$", "")

        ; 1. Active running process path
        try {
            pid := ProcessExist(cleanName)
            if (pid) {
                p := ProcessGetPath(pid)
                p := Trim(p, ' "`t')
                if (FileExist(p))
                    return p
            }
        }

        ; 2. Windows App Paths registry keys
        regKeys := [
            "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" . cleanName,
            "HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" . cleanName,
            "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\" . cleanName,
            "HKEY_CURRENT_USER\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\" . cleanName
        ]
        for rk in regKeys {
            try {
                p := RegRead(rk, "")
                p := Trim(p, ' "`t')
                if (p != "" && FileExist(p))
                    return p
            }
        }

        ; 3. Common installation paths
        progFilesX86 := EnvGet("ProgramFiles(x86)")
        if (progFilesX86 == "")
            progFilesX86 := "C:\Program Files (x86)"

        candidates := [
            "C:\Program Files\" . cleanBase . "\" . cleanName,
            progFilesX86 . "\" . cleanBase . "\" . cleanName,
            A_AppData . "\..\Local\Programs\" . cleanBase . "\" . cleanName,
            A_AppData . "\..\Local\Programs\" . cleanName,
            A_AppData . "\..\Local\" . cleanBase . "\Application\" . cleanName,
            A_AppData . "\..\Local\" . cleanBase . "\" . cleanName,
            A_WinDir . "\System32\" . cleanName,
            A_WinDir . "\" . cleanName
        ]
        for c in candidates {
            c := Trim(c, ' "`t')
            if (FileExist(c))
                return c
        }
        return ""
    }

    static EnsureProfileIcon(profName, targetExe := "") {
        if (profName = "Default" || profName = "")
            return
        outDir := A_ScriptDir . "\ui\icons"
        if (!DirExist(outDir)) {
            try DirCreate(outDir)
        }
        fullPath := ""
        if (targetExe != "")
            fullPath := this.ResolveExePath(targetExe)
        if (fullPath == "" && profName != "")
            fullPath := this.ResolveExePath(profName)

        if (fullPath != "" && FileExist(fullPath)) {
            outPng := outDir . "\" . profName . ".png"
            if (!FileExist(outPng))
                this.ExtractExeIcon(fullPath, outPng)
            SplitPath(fullPath, &eFile, , , &eNameNoExt)
            cleanPng := outDir . "\" . eNameNoExt . ".png"
            if (!FileExist(cleanPng))
                this.ExtractExeIcon(fullPath, cleanPng)
            lowerPng := outDir . "\" . StrLower(eNameNoExt) . ".png"
            if (!FileExist(lowerPng))
                this.ExtractExeIcon(fullPath, lowerPng)
        }
    }

    static EnsureAllProfileIcons() {
        global g_Config
        if (!g_Config.Has("profiles") || !IsObject(g_Config["profiles"]))
            return
        for pName, pData in g_Config["profiles"] {
            if (pName != "Default" && IsObject(pData)) {
                tExe := pData.Has("targetExe") ? pData["targetExe"] : ""
                this.EnsureProfileIcon(pName, tExe)
            }
        }
    }

    static GetRunningApps() {
        procs := Map()
        outDir := A_ScriptDir . "\ui\icons"
        if (!DirExist(outDir)) {
            try DirCreate(outDir)
        }
        myPid := DllCall("GetCurrentProcessId", "UInt")
        thisExe := StrLower(A_ScriptName)
        cleanThisExe := RegExReplace(thisExe, "i)\.ahk$", ".exe")

        skipProcesses := Map(
            "explorer.exe", 1,
            "autohotkey64.exe", 1,
            "autohotkey32.exe", 1,
            "autohotkeyboard.exe", 1,
            "msedgewebview2.exe", 1,
            "applicationframehost.exe", 1,
            "systemsettings.exe", 1,
            "shellexperiencehost.exe", 1,
            "searchhost.exe", 1,
            "startmenuexperiencehost.exe", 1,
            "lockapp.exe", 1,
            cleanThisExe, 1
        )

        try {
            hwndList := WinGetList()
            for hwnd in hwndList {
                if (!DllCall("IsWindowVisible", "Ptr", hwnd))
                    continue
                title := WinGetTitle(hwnd)
                if (title == "" || title == "Program Manager")
                    continue
                try {
                    winPid := WinGetPID("ahk_id " . hwnd)
                    if (winPid = myPid)
                        continue
                } catch {
                    continue
                }
                try {
                    pname := WinGetProcessName(hwnd)
                    if (pname == "")
                        continue
                    lowPname := StrLower(pname)
                    if (skipProcesses.Has(lowPname) || procs.Has(lowPname))
                        continue

                    cleanProc := RegExReplace(pname, "i)\.exe$", "")
                    iconFile := outDir . "\" . cleanProc . ".png"
                    if (!FileExist(iconFile)) {
                        exePath := ""
                        try exePath := WinGetProcessPath(hwnd)
                        if (exePath != "" && FileExist(exePath)) {
                            this.ExtractExeIcon(exePath, iconFile)
                        }
                        if (!FileExist(iconFile)) {
                            this.ExtractWindowIcon(hwnd, iconFile)
                        }
                    }
                    hasIcon := FileExist(iconFile) ? 1 : 0
                    procs[lowPname] := { title: title, icon: cleanProc, hasIcon: hasIcon, process: pname }
                } catch {
                    continue
                }
            }
        } catch as err {
            LogMessage("GetRunningApps scan error: " . err.Message)
        }
        out := []
        for lowPname, info in procs {
            out.Push(Map("process", info.process, "title", info.title, "icon", info.icon, "hasIcon", info.hasIcon))
        }
        return out
    }
}

class ProfileOsdHUD {
    static guiObj := ""
    static hideFn := () => ProfileOsdHUD.Hide()

    static Init() {
        if (this.guiObj != "")
            return
        ProfileGdipHelper.Init()
        this.guiObj := Gui("+AlwaysOnTop -Caption +ToolWindow -DPIScale +E0x08000000 +E0x00000020 +E0x00080000")
    }

    static GetProfileIconPath(profileName, triggerExe := "") {
        global g_Config
        iconsDir := A_ScriptDir . "\ui\icons"

        ; 1. Check triggerExe icon
        if (triggerExe != "") {
            cleanExe := RegExReplace(triggerExe, "i)\.exe$", "")
            testPath := iconsDir . "\" . cleanExe . ".png"
            if (FileExist(testPath))
                return testPath
        }

        ; 2. Check profile targetExe in configuration
        if (g_Config.Has("profiles") && g_Config["profiles"].Has(profileName)) {
            prof := g_Config["profiles"][profileName]
            if (IsObject(prof) && prof.Has("targetExe") && prof["targetExe"] != "") {
                cleanExe := RegExReplace(prof["targetExe"], "i)\.exe$", "")
                testPath := iconsDir . "\" . cleanExe . ".png"
                if (FileExist(testPath))
                    return testPath
                try {
                    foundExe := ProfileAppScanner.FindExePath(cleanExe . ".exe")
                    if (foundExe != "") {
                        ProfileAppScanner.ExtractExeIcon(foundExe, testPath)
                        if (FileExist(testPath))
                            return testPath
                    }
                }
            }
        }

        ; 3. Check profile name icon directly
        testNamed := iconsDir . "\" . profileName . ".png"
        if (FileExist(testNamed))
            return testNamed

        ; 4. Default / App Icon fallback
        defaultIcon := A_ScriptDir . "\ui\app-icon.png"
        if (FileExist(defaultIcon))
            return defaultIcon

        return ""
    }

    static ShowProfileHUD(profileName := "Default", triggerExe := "", durationMs := 1600) {
        global g_Config
        this.Init()

        dpiScale := A_ScreenDPI / 96.0

        ; Theme settings
        bgHex := (g_Config.Has("theme") && g_Config["theme"].Has("bgColor")) ? g_Config["theme"]["bgColor"] : "#E8DFD5"
        accentHex := (g_Config.Has("theme") && g_Config["theme"].Has("accentColor")) ? g_Config["theme"]["accentColor"] :
            "#D97706"
        isIconOnly := (g_Config.Has("theme") && g_Config["theme"].Has("osdIconOnly")) ? (g_Config["theme"][
            "osdIconOnly"] = 1 || g_Config["theme"]["osdIconOnly"] = true) : false

        ; Parse hex colors
        cleanBg := StrReplace(bgHex, "#", "")
        if (StrLen(cleanBg) = 6) {
            bgR := Integer("0x" . SubStr(cleanBg, 1, 2))
            bgG := Integer("0x" . SubStr(cleanBg, 3, 2))
            bgB := Integer("0x" . SubStr(cleanBg, 5, 2))
        } else {
            bgR := 232, bgG := 223, bgB := 213
        }
        cBg := (0xF8 << 24) | (bgR << 16) | (bgG << 8) | bgB

        cleanAcc := StrReplace(accentHex, "#", "")
        if (StrLen(cleanAcc) = 6) {
            accR := Integer("0x" . SubStr(cleanAcc, 1, 2))
            accG := Integer("0x" . SubStr(cleanAcc, 3, 2))
            accB := Integer("0x" . SubStr(cleanAcc, 5, 2))
        } else {
            accR := 217, accG := 119, accB := 6
        }
        cAccent := (0xFF << 24) | (accR << 16) | (accG << 8) | accB

        ; Calculate text color and border based on background luminance
        lum := (bgR * 299 + bgG * 587 + bgB * 114) // 1000
        if (lum > 130) {
            cText := 0xFF18181B       ; Dark slate text
            cBorder := 0x2E000000     ; Soft dark shadow border
        } else {
            cText := 0xFFF8FAFC       ; Light text
            cBorder := 0x35FFFFFF     ; Soft light border
        }

        iconPath := this.GetProfileIconPath(profileName, triggerExe)
        displayText := "Profile: " . profileName

        hDC := DllCall("GetDC", "ptr", 0, "ptr")
        hMemDC := DllCall("CreateCompatibleDC", "ptr", hDC, "ptr")

        ; GDI+ Fonts matching JetBrains Mono / Segoe UI
        pFamily := 0
        if (DllCall("gdiplus\GdipCreateFontFamilyFromName", "wstr", "JetBrains Mono", "ptr", 0, "ptr*", &pFamily) != 0 ||
        !pFamily) {
            DllCall("gdiplus\GdipCreateFontFamilyFromName", "wstr", "Segoe UI", "ptr", 0, "ptr*", &pFamily)
        }
        fontSize := 11.0 * dpiScale
        pFont := 0
        DllCall("gdiplus\GdipCreateFont", "ptr", pFamily, "float", fontSize, "int", 1, "int", 2, "ptr*", &pFont)

        pFormat := 0
        DllCall("gdiplus\GdipCreateStringFormat", "int", 0, "int", 0, "ptr*", &pFormat)
        DllCall("gdiplus\GdipSetStringFormatAlign", "ptr", pFormat, "int", 0)       ; Near (left)
        DllCall("gdiplus\GdipSetStringFormatLineAlign", "ptr", pFormat, "int", 1)   ; Center vertical

        ; Measure text width
        textW := 0.0
        textH := 0.0
        if (!isIconOnly) {
            pTempGraphics := 0
            DllCall("gdiplus\GdipCreateFromHDC", "ptr", hMemDC, "ptr*", &pTempGraphics)
            layoutRect := Buffer(16, 0)
            NumPut("float", 0.0, layoutRect, 0), NumPut("float", 0.0, layoutRect, 4)
            NumPut("float", 2000.0, layoutRect, 8), NumPut("float", 100.0, layoutRect, 12)
            bbox := Buffer(16, 0)
            DllCall("gdiplus\GdipMeasureString", "ptr", pTempGraphics, "wstr", displayText, "int", -1, "ptr", pFont,
                "ptr", layoutRect.Ptr, "ptr", pFormat, "ptr", bbox.Ptr, "int*", 0, "int*", 0)
            textW := NumGet(bbox, 8, "float")
            textH := NumGet(bbox, 12, "float")
            DllCall("gdiplus\GdipDeleteGraphics", "ptr", pTempGraphics)
        }

        ; Layout dimensions matching the pill in the image
        padX := Round(13 * dpiScale)
        iconBoxSize := Round(20 * dpiScale)
        gap := Round(9 * dpiScale)
        cornerRadius := 10.0 * dpiScale

        if (isIconOnly) {
            guiW := Round(44 * dpiScale)
            guiH := Round(44 * dpiScale)
            cornerRadius := 12.0 * dpiScale
            iconBoxSize := Round(24 * dpiScale)
        } else {
            guiH := Round(38 * dpiScale)
            guiW := Round(padX + iconBoxSize + gap + textW + padX + (4 * dpiScale))
        }

        bi := Buffer(40, 0)
        NumPut("uint", 40, bi, 0)
        NumPut("int", guiW, bi, 4)
        NumPut("int", -guiH, bi, 8)
        NumPut("ushort", 1, bi, 12)
        NumPut("ushort", 32, bi, 14)
        NumPut("uint", 0, bi, 16)

        pBits := 0
        hBmp := DllCall("CreateDIBSection", "ptr", hMemDC, "ptr", bi, "uint", 0, "ptr*", &pBits, "ptr", 0, "uint", 0,
            "ptr")
        hOldBmp := DllCall("SelectObject", "ptr", hMemDC, "ptr", hBmp, "ptr")

        pGraphics := 0
        DllCall("gdiplus\GdipCreateFromHDC", "ptr", hMemDC, "ptr*", &pGraphics)
        DllCall("gdiplus\GdipSetSmoothingMode", "ptr", pGraphics, "int", 4)
        DllCall("gdiplus\GdipSetTextRenderingHint", "ptr", pGraphics, "int", 5) ; ClearType

        ; Construct Pill Rounded Path
        inset := 1.0 * dpiScale
        r := cornerRadius
        d := r * 2.0
        rw := Float(guiW) - (inset * 2.0)
        rh := Float(guiH) - (inset * 2.0)

        pPath := 0
        DllCall("gdiplus\GdipCreatePath", "int", 0, "ptr*", &pPath)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", inset, "float", inset, "float", d, "float", d, "float",
            180, "float", 90)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", inset + rw - d, "float", inset, "float", d, "float", d,
            "float", 270, "float", 90)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", inset + rw - d, "float", inset + rh - d, "float", d,
            "float", d, "float", 0, "float", 90)
        DllCall("gdiplus\GdipAddPathArc", "ptr", pPath, "float", inset, "float", inset + rh - d, "float", d, "float", d,
            "float", 90, "float", 90)
        DllCall("gdiplus\GdipClosePathFigure", "ptr", pPath)

        ; Fill Background (Neumorphic Surface)
        pBgBrush := 0
        DllCall("gdiplus\GdipCreateSolidFill", "uint", cBg, "ptr*", &pBgBrush)
        DllCall("gdiplus\GdipFillPath", "ptr", pGraphics, "ptr", pBgBrush, "ptr", pPath)

        ; Draw Subtle Border
        pBorderPen := 0
        DllCall("gdiplus\GdipCreatePen1", "uint", cBorder, "float", 1.2 * dpiScale, "int", 2, "ptr*", &pBorderPen)
        DllCall("gdiplus\GdipDrawPath", "ptr", pGraphics, "ptr", pBorderPen, "ptr", pPath)

        ; Draw Profile Icon
        iconX := isIconOnly ? (Float(guiW) - iconBoxSize) / 2.0 : Float(padX)
        iconY := (Float(guiH) - iconBoxSize) / 2.0

        pBitmap := 0
        if (iconPath != "" && FileExist(iconPath)) {
            DllCall("gdiplus\GdipCreateBitmapFromFile", "wstr", iconPath, "ptr*", &pBitmap)
        }

        if (pBitmap) {
            imgW := 0, imgH := 0
            DllCall("gdiplus\GdipGetImageWidth", "ptr", pBitmap, "uint*", &imgW)
            DllCall("gdiplus\GdipGetImageHeight", "ptr", pBitmap, "uint*", &imgH)
            if (imgW > 0 && imgH > 0) {
                scale := Min(iconBoxSize / imgW, iconBoxSize / imgH)
                drawW := imgW * scale
                drawH := imgH * scale
                dstX := iconX + (iconBoxSize - drawW) / 2.0
                dstY := iconY + (iconBoxSize - drawH) / 2.0
                DllCall("gdiplus\GdipSetInterpolationMode", "ptr", pGraphics, "int", 7)
                DllCall("gdiplus\GdipDrawImageRectRect", "ptr", pGraphics, "ptr", pBitmap
                    , "float", dstX, "float", dstY, "float", drawW, "float", drawH
                    , "float", 0.0, "float", 0.0, "float", Float(imgW), "float", Float(imgH)
                    , "int", 2, "ptr", 0, "ptr", 0, "ptr", 0)
            }
            DllCall("gdiplus\GdipDisposeImage", "ptr", pBitmap)
        } else {
            pEmblemPen := 0
            DllCall("gdiplus\GdipCreatePen1", "uint", cAccent, "float", 1.6 * dpiScale, "int", 2, "ptr*", &pEmblemPen)
            DllCall("gdiplus\GdipDrawEllipse", "ptr", pGraphics, "ptr", pEmblemPen, "float", iconX + 1.0, "float",
                iconY + 1.0, "float", Float(iconBoxSize - 2), "float", Float(iconBoxSize - 2))
            DllCall("gdiplus\GdipDeletePen", "ptr", pEmblemPen)
        }

        ; Draw Text (if not icon only)
        if (!isIconOnly) {
            pTextBrush := 0
            DllCall("gdiplus\GdipCreateSolidFill", "uint", cText, "ptr*", &pTextBrush)
            tX := iconX + iconBoxSize + gap
            tRect := Buffer(16, 0)
            NumPut("float", tX, tRect, 0)
            NumPut("float", 0.0, tRect, 4)
            NumPut("float", textW + 8.0, tRect, 8)
            NumPut("float", Float(guiH), tRect, 12)
            DllCall("gdiplus\GdipDrawString", "ptr", pGraphics, "wstr", displayText, "int", -1, "ptr", pFont, "ptr",
                tRect.Ptr, "ptr", pFormat, "ptr", pTextBrush)
            DllCall("gdiplus\GdipDeleteBrush", "ptr", pTextBrush)
        }

        ; Position above taskbar at bottom-right of current monitor
        CoordMode("Mouse", "Screen")
        MouseGetPos(&mX, &mY)
        monCount := MonitorGetCount()
        monIndex := 1
        loop monCount {
            MonitorGet(A_Index, &mL, &mT, &mR, &mB)
            if (mX >= mL && mX < mR && mY >= mT && mY < mB) {
                monIndex := A_Index
                break
            }
        }
        MonitorGetWorkArea(monIndex, &WL, &WT, &WR, &WB)
        posX := WR - guiW - Round(24 * dpiScale)
        posY := WB - guiH - Round(28 * dpiScale)

        ptDst := Buffer(8, 0)
        NumPut("int", posX, ptDst, 0), NumPut("int", posY, ptDst, 4)
        sz := Buffer(8, 0)
        NumPut("int", guiW, sz, 0), NumPut("int", guiH, sz, 4)
        ptSrc := Buffer(8, 0)
        NumPut("int", 0, ptSrc, 0), NumPut("int", 0, ptSrc, 4)
        blend := Buffer(4, 0)
        NumPut("uchar", 0, blend, 0), NumPut("uchar", 0, blend, 1)
        NumPut("uchar", 255, blend, 2), NumPut("uchar", 1, blend, 3)

        this.guiObj.Show("x" . posX . " y" . posY . " w" . guiW . " h" . guiH . " NoActivate")
        DllCall("UpdateLayeredWindow", "ptr", this.guiObj.Hwnd, "ptr", hDC, "ptr", ptDst, "ptr", sz, "ptr", hMemDC,
            "ptr", ptSrc, "uint", 0, "ptr", blend, "uint", 2)

        ; Cleanup GDI+ resources
        DllCall("gdiplus\GdipDeleteStringFormat", "ptr", pFormat)
        DllCall("gdiplus\GdipDeleteFont", "ptr", pFont)
        DllCall("gdiplus\GdipDeleteFontFamily", "ptr", pFamily)
        DllCall("gdiplus\GdipDeleteBrush", "ptr", pBgBrush)
        DllCall("gdiplus\GdipDeletePen", "ptr", pBorderPen)
        DllCall("gdiplus\GdipDeletePath", "ptr", pPath)
        DllCall("gdiplus\GdipDeleteGraphics", "ptr", pGraphics)
        DllCall("SelectObject", "ptr", hMemDC, "ptr", hOldBmp)
        DllCall("DeleteObject", "ptr", hBmp)
        DllCall("DeleteDC", "ptr", hMemDC)
        DllCall("ReleaseDC", "ptr", 0, "ptr", hDC)

        SetTimer(this.hideFn, 0)
        SetTimer(this.hideFn, -durationMs)
    }

    static ShowIcon(iconPath := "", durationMs := 1200) {
        this.ShowProfileHUD("Default", "", durationMs)
    }

    static Hide() {
        if (this.guiObj != "") {
            this.guiObj.Hide()
        }
    }
}

CheckAutoProfileSwitch() {
    global g_Config, g_MainGui, g_Wv, g_LastActiveSwitchProc, g_LastActiveSwitchHwnd
    if (!g_Config.Has("profiles") || !IsObject(g_Config["profiles"]))
        return

    ; When profile is locked, freeze on current profile and disallow auto-switching
    if (g_Config.Has("profileLocked") && (g_Config["profileLocked"] = 1 || g_Config["profileLocked"] = true))
        return

    ; Check if any profile has switchOnHover enabled (including Default)
    hasHoverProfiles := false
    for pName, pData in g_Config["profiles"] {
        if (IsObject(pData)) {
            triggerEnabled := !pData.Has("switchTriggerEnabled") || pData["switchTriggerEnabled"] = 1 || pData[
                "switchTriggerEnabled"] = true
            isHover := triggerEnabled && pData.Has("switchOnHover") && (pData["switchOnHover"] = 1 || pData[
                "switchOnHover"] = true)
            if (isHover) {
                hasHoverProfiles := true
                break
            }
        }
    }

    matchedProfile := ""
    triggerProc := ""

    ; 1. If any hover profile exists, check window under cursor
    if (hasHoverProfiles) {
        try {
            CoordMode("Mouse", "Screen")
            MouseGetPos(&mX, &mY, &hoverHwnd)
            if (hoverHwnd && (!g_MainGui || hoverHwnd != g_MainGui.Hwnd)) {
                hoverProc := WinGetProcessName("ahk_id " . hoverHwnd)
                if (hoverProc != "" && hoverProc != "AutoHotkey64.exe" && hoverProc != "msedgewebview2.exe") {
                    matchedProfile := FindProfileForProcess(hoverProc, "hover")
                    if (matchedProfile != "") {
                        triggerProc := hoverProc
                    } else {
                        ; Hovered window did not match any custom hover profile.
                        ; If it also doesn't match ANY custom profile (e.g. desktop, explorer, unassigned app),
                        ; check if Default profile has hover enabled so it can switch back to Default on hover away!
                        anyCustom := FindProfileForProcess(hoverProc, "any")
                        if (anyCustom == "") {
                            defaultProf := g_Config["profiles"].Has("Default") ? g_Config["profiles"]["Default"] : ""
                            defaultTriggerEnabled := IsObject(defaultProf) ? (!defaultProf.Has("switchTriggerEnabled") ||
                            defaultProf["switchTriggerEnabled"] = 1 || defaultProf["switchTriggerEnabled"] = true) :
                                true
                            defaultHover := defaultTriggerEnabled && IsObject(defaultProf) && defaultProf.Has(
                                "switchOnHover") && (defaultProf["switchOnHover"] = 1 || defaultProf["switchOnHover"] =
                                    true)
                            if (defaultHover) {
                                matchedProfile := "Default"
                                triggerProc := hoverProc
                            }
                        }
                    }
                }
            }
        }
    }

    ; 2. If not matched via hover, check focused window
    if (matchedProfile == "") {
        activeHwnd := WinExist("A")
        if (!activeHwnd || (g_MainGui && activeHwnd == g_MainGui.Hwnd))
            return

        activeProc := ""
        try activeProc := WinGetProcessName(activeHwnd)
        if (activeProc == "" || activeProc = "AutoHotkey64.exe" || activeProc = "msedgewebview2.exe")
            return

        g_LastActiveSwitchHwnd := activeHwnd
        matchedProfile := FindProfileForProcess(activeProc, "focus")
        if (matchedProfile != "") {
            triggerProc := activeProc
        } else {
            ; Focused window does NOT match any custom focus profile.
            ; Check if Default profile has focus switch enabled so it can switch back on focus away!
            defaultProf := g_Config["profiles"].Has("Default") ? g_Config["profiles"]["Default"] : ""
            defaultTriggerEnabled := IsObject(defaultProf) ? (!defaultProf.Has("switchTriggerEnabled") || defaultProf[
                "switchTriggerEnabled"] = 1 || defaultProf["switchTriggerEnabled"] = true) : true
            defaultFocus := defaultTriggerEnabled && (IsObject(defaultProf) && defaultProf.Has("switchOnFocus") ? (
                defaultProf["switchOnFocus"] = 1 || defaultProf["switchOnFocus"] = true) : true)
            if (defaultFocus) {
                matchedProfile := "Default"
                triggerProc := activeProc
            }
        }
    }

    curProfile := g_Config.Has("activeProfile") ? g_Config["activeProfile"] : "Default"
    if (matchedProfile != "" && matchedProfile != curProfile && g_Config["profiles"].Has(matchedProfile)) {
        g_LastActiveSwitchProc := triggerProc
        SwitchToProfileInternal(matchedProfile, triggerProc)
    }
}

FindProfileForProcess(procName, triggerMode := "any") {
    global g_Config
    procLower := StrLower(Trim(procName))
    if (!g_Config.Has("profiles") || !IsObject(g_Config["profiles"]))
        return ""

    for pName, pData in g_Config["profiles"] {
        if (!IsObject(pData) || pName = "Default")
            continue

        triggerEnabled := !pData.Has("switchTriggerEnabled") || pData["switchTriggerEnabled"] = 1 || pData[
            "switchTriggerEnabled"] = true
        if (!triggerEnabled)
            continue

        if (triggerMode = "hover") {
            isHover := pData.Has("switchOnHover") && (pData["switchOnHover"] = 1 || pData["switchOnHover"] = true)
            if (!isHover)
                continue
        } else if (triggerMode = "focus") {
            isFocus := !pData.Has("switchOnFocus") || pData["switchOnFocus"] = 1 || pData["switchOnFocus"] = true
            if (!isFocus)
                continue
        }

        targetExe := pData.Has("targetExe") ? pData["targetExe"] : ""
        if (targetExe != "") {
            for part in StrSplit(targetExe, ",") {
                clean := StrLower(Trim(part))
                if (clean == "")
                    continue
                SplitPath(clean, &cleanFile)
                if (cleanFile != "")
                    clean := cleanFile
                if (!InStr(clean, ".exe"))
                    clean .= ".exe"
                if (clean == procLower)
                    return pName
            }
        } else {
            ; Fallback: if targetExe is not set, match against profile name if it matches the process name
            pClean := StrLower(Trim(pName))
            if (!InStr(pClean, ".exe"))
                pClean .= ".exe"
            if (pClean == procLower)
                return pName
        }
    }
    return ""
}

SwitchToProfileInternal(targetProfile, triggerExe := "") {
    global g_Config, g_Wv
    if (!g_Config["profiles"].Has(targetProfile))
        return

    g_Config["activeProfile"] := targetProfile
    prof := g_Config["profiles"][targetProfile]
    if (IsObject(prof)) {
        if (prof.Has("textExpander"))
            g_Config["textExpander"] := prof["textExpander"]
        if (prof.Has("keyRemapper"))
            g_Config["keyRemapper"] := prof["keyRemapper"]
        if (prof.Has("appLauncher"))
            g_Config["appLauncher"] := prof["appLauncher"]
        if (prof.Has("folderCreator"))
            g_Config["folderCreator"] := prof["folderCreator"]
        if (prof.Has("macroRecorder"))
            g_Config["macroRecorder"] := prof["macroRecorder"]
        if (prof.Has("windowManager"))
            g_Config["windowManager"] := prof["windowManager"]
        if (prof.Has("autoClicker"))
            g_Config["autoClicker"] := prof["autoClicker"]
        if (prof.Has("mouseGestures")) {
            if (!g_Config.Has("mouseGestures") || !IsObject(g_Config["mouseGestures"]))
                g_Config["mouseGestures"] := Map()
            for k, v in prof["mouseGestures"] {
                g_Config["mouseGestures"][k] := v
            }
        }
        if (prof.Has("radialMenu"))
            g_Config["radialMenu"] := prof["radialMenu"]
        if (prof.Has("screenScanner"))
            g_Config["screenScanner"] := prof["screenScanner"]
    }

    ; Enforce any globally forced feature toggles across profiles
    if (g_Config.Has("forcedFeatures") && IsObject(g_Config["forcedFeatures"])) {
        for fId, isForced in g_Config["forcedFeatures"] {
            if (isForced) {
                parts := StrSplit(fId, ".")
                if (parts.Length = 2) {
                    modName := parts[1]
                    fKey := parts[2]
                    if (!g_Config.Has(modName) || !IsObject(g_Config[modName]))
                        g_Config[modName] := Map()
                    val := (fKey = "enabled" || fKey = "cornersEnabled" || fKey = "gesturesEnabled") ? true : 1
                    g_Config[modName][fKey] := val
                }
            }
        }
    }

    SyncForcedItemsAcrossProfilesAhk()
    SaveConfigToFile()
    ApplyAllModules()

    ; Notify WebUI of profile change
    if (g_Wv) {
        g_Wv.PostWebMessageAsString(JSON.stringify(Map(
            "type", "profileAutoSwitched",
            "activeProfile", targetProfile,
            "triggerExe", triggerExe
        )))
    }

    ; Trigger Profile OSD HUD notification on user's screen
    showOsd := true
    if (IsObject(prof) && prof.Has("showOsdIcon")) {
        showOsd := (prof["showOsdIcon"] = 1 || prof["showOsdIcon"] = true)
    }
    if (showOsd) {
        ProfileOsdHUD.ShowProfileHUD(targetProfile, triggerExe, 1600)
    }
}

SyncForcedItemsAcrossProfilesAhk() {
    global g_Config
    if (!g_Config.Has("profiles") || !IsObject(g_Config["profiles"]))
        return

    listMods := ["textExpander", "keyRemapper", "appLauncher", "folderCreator", "macroRecorder"]

    ; 1. If canonical forcedItemStates map exists, enforce it strictly across root and all profiles
    if (g_Config.Has("forcedItemStates") && IsObject(g_Config["forcedItemStates"])) {
        for modName in listMods {
            for itemId, stateVal in g_Config["forcedItemStates"] {
                numVal := (stateVal = 1 || stateVal = true || stateVal = "1") ? 1 : 0
                if (g_Config.Has(modName) && g_Config[modName].Has("items") && IsObject(g_Config[modName]["items"])) {
                    for item in g_Config[modName]["items"] {
                        if (IsObject(item) && item.Has("id") && item["id"] = itemId)
                            item["enabled"] := numVal
                    }
                }
                for pName, pObj in g_Config["profiles"] {
                    if (pObj.Has(modName) && pObj[modName].Has("items") && IsObject(pObj[modName]["items"])) {
                        for item in pObj[modName]["items"] {
                            if (IsObject(item) && item.Has("id") && item["id"] = itemId)
                                item["enabled"] := numVal
                        }
                    }
                }
            }
        }
        return
    }

    ; 2. Fallback heuristic: If any profile or root has a forced item disabled, it stays disabled everywhere
    for modName in listMods {
        forcedDisabledMap := Map()

        ; Check root config items
        if (g_Config.Has(modName) && g_Config[modName].Has("items") && IsObject(g_Config[modName]["items"])) {
            for item in g_Config[modName]["items"] {
                if (IsObject(item) && item.Has("id")) {
                    isForced := (item.Has("forcedAllProfiles") && (item["forcedAllProfiles"] = true || item[
                        "forcedAllProfiles"] = 1 || item["forcedAllProfiles"] = "1"))
                    || (item.Has("allProfiles") && (item["allProfiles"] = true || item["allProfiles"] = 1 || item[
                        "allProfiles"] = "1"))
                    if (isForced) {
                        isDisabled := (item.Has("enabled") && (item["enabled"] = 0 || item["enabled"] = false || item[
                            "enabled"] = "0"))
                        if (isDisabled)
                            forcedDisabledMap[item["id"]] := true
                    }
                }
            }
        }

        ; Check profiles
        for pName, pObj in g_Config["profiles"] {
            if (pObj.Has(modName) && pObj[modName].Has("items") && IsObject(pObj[modName]["items"])) {
                for item in pObj[modName]["items"] {
                    if (IsObject(item) && item.Has("id")) {
                        isForced := (item.Has("forcedAllProfiles") && (item["forcedAllProfiles"] = true || item[
                            "forcedAllProfiles"] = 1 || item["forcedAllProfiles"] = "1"))
                        || (item.Has("allProfiles") && (item["allProfiles"] = true || item["allProfiles"] = 1 || item[
                            "allProfiles"] = "1"))
                        if (isForced) {
                            isDisabled := (item.Has("enabled") && (item["enabled"] = 0 || item["enabled"] = false ||
                                item["enabled"] = "0"))
                            if (isDisabled)
                                forcedDisabledMap[item["id"]] := true
                        }
                    }
                }
            }
        }

        ; Enforce disabled state across root and every profile
        for itemId, _ in forcedDisabledMap {
            if (g_Config.Has(modName) && g_Config[modName].Has("items") && IsObject(g_Config[modName]["items"])) {
                for item in g_Config[modName]["items"] {
                    if (IsObject(item) && item.Has("id") && item["id"] = itemId)
                        item["enabled"] := 0
                }
            }
            for pName, pObj in g_Config["profiles"] {
                if (pObj.Has(modName) && pObj[modName].Has("items") && IsObject(pObj[modName]["items"])) {
                    for item in pObj[modName]["items"] {
                        if (IsObject(item) && item.Has("id") && item["id"] = itemId)
                            item["enabled"] := 0
                    }
                }
            }
        }
    }
}

