<#
.SYNOPSIS
    Builds AutoHotKeyboard standalone executable (AutoHotKeyboard.exe)
    and professional Windows Setup Installer (AutoHotKeyboard_Setup.exe).
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AutoHotKeyboard - Automated Build Pipeline         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Paths
$ahk2exe = Join-Path $rootDir "tools\compiler\Ahk2Exe.exe"
$baseAhk = "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
$mainScript = Join-Path $rootDir "main.ahk"
$appIcon = Join-Path $rootDir "app-icon.ico"
$outputExe = Join-Path $rootDir "AutoHotKeyboard.exe"
$issScript = Join-Path $rootDir "installer\installer.iss"
$setupExe = Join-Path $rootDir "AutoHotKeyboard_Setup.exe"

$isccPaths = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)
$iscc = $isccPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

# Check compiler tools
if (!(Test-Path $ahk2exe)) {
    throw "Ahk2Exe compiler not found at: $ahk2exe"
}
if (!(Test-Path $baseAhk)) {
    throw "AutoHotkey v2 64-bit base binary not found at: $baseAhk"
}

# 2. Compile Standalone Application Executable
Write-Host "`n[1/2] Compiling AutoHotKeyboard.exe..." -ForegroundColor Yellow
Stop-Process -Name "AutoHotKeyboard" -Force -ErrorAction SilentlyContinue

Push-Location $rootDir
try {
    & $ahk2exe /in "main.ahk" /out "AutoHotKeyboard.exe" /icon "app-icon.ico" /base $baseAhk
} finally {
    Pop-Location
}
if (!(Test-Path $outputExe)) {
    throw "Failed to compile AutoHotKeyboard.exe"
}
$exeItem = Get-Item $outputExe
Write-Host " [SUCCESS] Built: $($exeItem.Name) ($([math]::Round($exeItem.Length / 1MB, 2)) MB)" -ForegroundColor Green

# 3. Compile Windows Setup Installer
if ($iscc) {
    Write-Host "`n[2/2] Compiling Windows Setup Installer with Inno Setup..." -ForegroundColor Yellow
    Start-Sleep -Milliseconds 800
    
    $maxAttempts = 3
    $attempt = 1
    $success = $false
    while ($attempt -le $maxAttempts -and !$success) {
        $isccProc = Start-Process -FilePath $iscc -ArgumentList "`"$issScript`"" -Wait -PassThru -NoNewWindow
        if ($isccProc.ExitCode -eq 0 -and (Test-Path $setupExe)) {
            $success = $true
        } else {
            if ($attempt -lt $maxAttempts) {
                Write-Host " Setup compilation encountered lock, retrying in 1.5s (Attempt $attempt of $maxAttempts)..." -ForegroundColor DarkYellow
                Start-Sleep -Milliseconds 1500
            }
            $attempt++
        }
    }
    if (!$success) {
        throw "Failed to compile AutoHotKeyboard_Setup.exe (ExitCode: $($isccProc.ExitCode))"
    }
    $setupItem = Get-Item $setupExe
    Write-Host " [SUCCESS] Built: $($setupItem.Name) ($([math]::Round($setupItem.Length / 1MB, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "`n[2/2] Inno Setup compiler (ISCC.exe) not found; skipped setup compilation." -ForegroundColor DarkYellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " [ALL DONE] Artifacts available:" -ForegroundColor Green
Write-Host " - Standalone Executable: $outputExe" -ForegroundColor White
Write-Host " - Windows Setup File:   $setupExe" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

