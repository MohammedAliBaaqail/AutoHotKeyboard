; ==============================================================================
; 4.5. Folder Creator Module
; ==============================================================================

ApplyFolderCreator() {
    global g_Config, g_ActiveHotstrings, g_ActiveHotkeys

    if (!g_Config.Has("folderCreator") || !g_Config["folderCreator"].Has("items")) {
        return
    }

    fcConfig := g_Config["folderCreator"]
    if (fcConfig.Has("enabled") && !fcConfig["enabled"]) {
        return
    }

    for item in fcConfig["items"] {
        if (IsObject(item) && item.Has("trigger") && item.Has("folderPaths")) {
            trig := Trim(item["trigger"])
            paths := Trim(item["folderPaths"])
            type := item.Has("triggerType") ? item["triggerType"] : "string"
            ; Automatically detect shortcuts/hotkeys even if triggerType was mislabeled
            isHk := (type = "hotkey" || type = "shortcut") 
                || InStr(trig, "+") || InStr(trig, "^") || InStr(trig, "!") || InStr(trig, "#") 
                || InStr(trig, "Win") || InStr(trig, "Ctrl") || InStr(trig, "Alt") || InStr(trig, "Shift") || InStr(trig, "CapsLock")

            isEnabled := (!item.Has("enabled") || item["enabled"] = true || item["enabled"] = 1 || item["enabled"] =
            "1")
            if (trig != "" && paths != "" && isEnabled) {
                try {
                    handler := CreateFolderCreatorHandler(item)
                    if (isHk) {
                        RegisterUniversalHotkey(trig, handler)
                    } else {
                        Hotstring(":*:" . trig, handler, "On")
                        g_ActiveHotstrings.Push(trig)
                    }
                } catch as err {
                    LogMessage("FolderCreator error for " . trig . ": " . err.Message)
                }
            } else if (trig != "" && !isHk) {
                try Hotstring(":*:" . trig, , "Off")
            }
        }
    }
}

CreateFolderCreatorHandler(item) {
    return (*) => ExecuteFolderCreation(item)
}

GetActiveExplorerPath() {
    activeHwnd := WinActive("A")
    if (!activeHwnd)
        return A_Desktop

    wClass := ""
    try wClass := WinGetClass("ahk_id " . activeHwnd)

    ; Desktop is focused
    if (wClass = "Progman" || wClass = "WorkerW")
        return A_Desktop

    ; If focused control is inside Explorer, get root window
    if (wClass != "CabinetWClass" && wClass != "ExploreWClass") {
        rootHwnd := DllCall("GetAncestor", "ptr", activeHwnd, "uint", 2, "ptr")
        if (rootHwnd) {
            try {
                rootClass := WinGetClass("ahk_id " . rootHwnd)
                if (rootClass = "CabinetWClass" || rootClass = "ExploreWClass") {
                    activeHwnd := rootHwnd
                    wClass := rootClass
                }
            }
        }
    }

    ; If not Explorer at all, fallback to Desktop
    if (wClass != "CabinetWClass" && wClass != "ExploreWClass")
        return A_Desktop

    ; 1. Windows 11 Tabs detection via IShellBrowser
    activeTab := 0
    try {
        activeTab := ControlGetHwnd("ShellTabWindowClass1", activeHwnd)
    } catch {
        try {
            activeTab := ControlGetHwnd("TabWindowClass1", activeHwnd)
        }
    }

    try {
        shell := ComObject("Shell.Application")
        if (activeTab) {
            static IID_IShellBrowser := "{000214E2-0000-0000-C000-000000000046}"
            for w in shell.Windows {
                try {
                    if (!w)
                        continue
                    wHwnd := w.hwnd
                    if (wHwnd != activeHwnd && (wHwnd & 0xFFFFFFFF) != (activeHwnd & 0xFFFFFFFF))
                        continue

                    shellBrowser := ComObjQuery(w, IID_IShellBrowser, IID_IShellBrowser)
                    if (!shellBrowser)
                        continue
                    thisTab := 0
                    ComCall(3, shellBrowser, "uint*", &thisTab := 0)
                    if (thisTab = activeTab) {
                        p := w.Document.Folder.Self.Path
                        if (p != "" && !InStr(p, "::{") && DirExist(p))
                            return p
                    }
                } catch {
                    continue
                }
            }
        }

        ; 2. Match by window HWND directly
        for w in shell.Windows {
            try {
                if (!w)
                    continue
                wHwnd := w.hwnd
                if (wHwnd = activeHwnd || (wHwnd & 0xFFFFFFFF) = (activeHwnd & 0xFFFFFFFF)) {
                    p := w.Document.Folder.Self.Path
                    if (p != "" && !InStr(p, "::{") && DirExist(p))
                        return p
                }
            } catch {
                continue
            }
        }

        ; 3. Title / LocationName match for Windows 11 tabbed Explorer
        activeTitle := WinGetTitle("ahk_id " . activeHwnd)
        if (activeTitle != "") {
            for w in shell.Windows {
                try {
                    locName := w.LocationName
                    if (locName != "" && InStr(activeTitle, locName)) {
                        p := w.Document.Folder.Self.Path
                        if (p != "" && !InStr(p, "::{") && DirExist(p))
                            return p
                    }
                } catch {
                    continue
                }
            }
        }
    } catch {
        ; COM error fallback
    }

    ; 4. Address Bar Toolbar text fallback
    for ctrlName in ["ToolbarWindow322", "ToolbarWindow323", "ToolbarWindow321", "ToolbarWindow324"] {
        try {
            addrText := ControlGetText(ctrlName, "ahk_id " . activeHwnd)
            if (InStr(addrText, "Address: ")) {
                extracted := Trim(SubStr(addrText, 10))
                if (extracted != "" && DirExist(extracted))
                    return extracted
            }
        }
    }

    ; 5. Edit controls fallback
    for ctrlName in ["Edit1", "Edit2", "ComboBox1"] {
        try {
            addrText := ControlGetText(ctrlName, "ahk_id " . activeHwnd)
            if (addrText != "" && DirExist(addrText))
                return addrText
        }
    }

    ; 6. Active Explorer fallback: any valid shell window path
    try {
        shell := ComObject("Shell.Application")
        for w in shell.Windows {
            try {
                p := w.Document.Folder.Self.Path
                if (p != "" && !InStr(p, "::{") && DirExist(p))
                    return p
            } catch {
                continue
            }
        }
    } catch {
    }

    return A_Desktop
}

ExecuteFolderCreation(item) {
    global g_Wv, g_IsEngineActive
    if (!g_IsEngineActive)
        return

    try {
        ; Determine base target directory
        locType := item.Has("targetLocation") ? item["targetLocation"] : "activeExplorer"
        baseDir := ""
        if (locType = "custom" && item.Has("customPath") && Trim(item["customPath"]) != "") {
            baseDir := Trim(item["customPath"])
        } else {
            baseDir := GetActiveExplorerPath()
        }

        if (baseDir = "")
            baseDir := A_Desktop

        if (!DirExist(baseDir)) {
            try DirCreate(baseDir)
        }

        rawPaths := item.Has("folderPaths") ? item["folderPaths"] : ""
        if (rawPaths = "")
            return

        ; Check if interactive {Name} prompt is needed
        projectName := ""
        if (InStr(rawPaths, "{Name}") || InStr(rawPaths, "{name}")) {
            presetLabel := item.Has("name") && item["name"] != "" ? item["name"] : "Folder Creator"
            ib := InputBox("Enter Project / Folder Name:", presetLabel, "w340 h130")
            if (ib.Result != "OK" || Trim(ib.Value) = "")
                return
            projectName := Trim(ib.Value)
        }

        ; Replace date/time tokens
        vYear := FormatTime(, "yyyy")
        vMonth := FormatTime(, "MM")
        vDay := FormatTime(, "dd")
        vDate := FormatTime(, "yyyy-MM-dd")
        vTime := FormatTime(, "HH-mm-ss")

        expandedPaths := rawPaths
        if (projectName != "") {
            expandedPaths := StrReplace(expandedPaths, "{Name}", projectName)
            expandedPaths := StrReplace(expandedPaths, "{name}", projectName)
        }
        expandedPaths := StrReplace(expandedPaths, "{YYYY}", vYear)
        expandedPaths := StrReplace(expandedPaths, "{MM}", vMonth)
        expandedPaths := StrReplace(expandedPaths, "{DD}", vDay)
        expandedPaths := StrReplace(expandedPaths, "{Date}", vDate)
        expandedPaths := StrReplace(expandedPaths, "{Time}", vTime)

        ; Split by newline to process each line
        lines := StrSplit(expandedPaths, ["`r`n", "`n", "`r"])
        createdFolders := []

        for rawLine in lines {
            line := Trim(rawLine)
            if (line = "")
                continue

            ; Check for numbered range sequence e.g. [1-10] or [01-12]
            if RegExMatch(line, "\[(\d+)-(\d+)\]", &mSeq) {
                numStart := Integer(mSeq[1])
                numEnd := Integer(mSeq[2])
                padLen := StrLen(mSeq[1])
                step := numStart <= numEnd ? 1 : -1

                curr := numStart
                loop {
                    currStr := Format("{:0" . padLen . "}", curr)
                    seqLine := RegExReplace(line, "\[\d+-\d+\]", currStr, , 1)
                    createdFolders.Push(seqLine)
                    if (curr = numEnd)
                        break
                    curr += step
                }
            } else {
                createdFolders.Push(line)
            }
        }

        ; Create directories on disk
        firstCreatedPath := ""
        for relPath in createdFolders {
            cleanRel := StrReplace(relPath, "/", "\")
            ; Determine if path is absolute or relative to baseDir
            fullPath := ""
            if (SubStr(cleanRel, 2, 1) = ":" || SubStr(cleanRel, 1, 2) = "\\") {
                fullPath := cleanRel
            } else {
                fullPath := RTrim(baseDir, "\") . "\" . cleanRel
            }

            if (!DirExist(fullPath)) {
                try DirCreate(fullPath)
            }
            if (firstCreatedPath = "") {
                firstCreatedPath := fullPath
            }
        }

        ; Create Seed Files if specified
        if (item.Has("seedFiles") && Trim(item["seedFiles"]) != "") {
            seedStr := item["seedFiles"]
            seedList := StrSplit(RegExReplace(seedStr, "[\r\n,]+", "|"), "|")

            seedTargetDir := baseDir
            if (projectName != "" && DirExist(baseDir . "\" . projectName)) {
                seedTargetDir := baseDir . "\" . projectName
            } else if (firstCreatedPath != "" && DirExist(firstCreatedPath)) {
                seedTargetDir := firstCreatedPath
            }

            for rawSeed in seedList {
                seedName := Trim(rawSeed)
                if (seedName = "")
                    continue
                seedFullPath := RTrim(seedTargetDir, "\") . "\" . seedName
                if (!FileExist(seedFullPath)) {
                    try FileAppend("", seedFullPath, "UTF-8")
                }
            }
        }

        ; Sound confirmation
        SoundBeep(1200, 70)

        ; Auto-Open in Explorer if enabled (only when user picked fixed folder option)
        isAutoOpen := (item.Has("autoOpen") && (item["autoOpen"] = true || item["autoOpen"] = 1 || item["autoOpen"] =
            "1"))
        if (isAutoOpen && locType = "custom") {
            openTarget := baseDir
            if (projectName != "" && DirExist(baseDir . "\" . projectName)) {
                openTarget := baseDir . "\" . projectName
            } else if (firstCreatedPath != "" && DirExist(firstCreatedPath)) {
                openTarget := firstCreatedPath
            }
            try Run('explorer.exe "' . openTarget . '"')
        }

        if (g_Wv) {
            msg := JSON.stringify(Map(
                "type", "moduleEvent",
                "module", "folderCreator",
                "message", "Folders created: " . createdFolders.Length . " items"
            ))
            g_Wv.PostWebMessageAsString(msg)
        }
    } catch as err {
        SoundBeep(400, 100)
        LogMessage("ExecuteFolderCreation failed: " . err.Message)
    }
}

