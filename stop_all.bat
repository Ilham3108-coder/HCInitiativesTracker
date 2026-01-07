@echo off
cls
echo ========================================================
echo        STOPPING ALL SERVERS & PREVIEWS
echo ========================================================
echo.
echo Killing Python processes...
taskkill /F /IM python.exe /T >nul 2>&1
echo Done.
echo.
echo Killing SSH processes...
taskkill /F /IM ssh.exe /T >nul 2>&1
echo Done.
echo.
echo ========================================================
echo all cleaned up. You can now try to start the server again.
echo ========================================================
pause
