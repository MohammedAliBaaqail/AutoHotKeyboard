#Requires AutoHotkey v2.0
out := ""

*MButton:: {
    global out
    out .= "*MButton pressed`n"
    while GetKeyState("MButton", "P") {
        Sleep(15)
    }
    out .= "*MButton released`n"
}

MButton & WheelUp:: {
    global out
    out .= "MButton & WheelUp fired!`n"
}

; Write to file on F12
F12:: {
    FileAppend(out, "test_mbutton_wheel.txt")
    ExitApp()
}

