@echo off
:: Check for permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Requesting Administrator privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
cls
echo ========================================================
echo        STARTING TRACKER PREVIEW SERVER (V2)
echo ========================================================
echo.
echo Server is starting using PowerShell...
echo.
echo.
echo The server will display the correct link to share (LAN Access).
echo Please check the output below for the address starting with http://...
echo.
echo Press Ctrl+C to stop the server when done.
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0simple_server.ps1'"
pause
