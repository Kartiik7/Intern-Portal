@echo off
cls
echo ========================================
echo    INTERN PORTAL - FRONTEND LAUNCHER
echo ========================================
echo.

cd /d "e:\NewFolder\01TUT\ex\intern-portal\frontend"

echo Choose how to run the frontend:
echo.
echo [1] Quick Demo (Open directly in browser)
echo [2] HTTP Server with Python (port 8080)
echo [3] Live Server with Node.js (port 8080)
echo [4] Open folder to manually start
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo Opening frontend in browser...
    echo Note: Will use demo data only
    start index.html
    echo.
    echo ✅ Frontend opened in browser
    echo Using demo/mock data
) else if "%choice%"=="2" (
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Starting Python HTTP server...
        echo Frontend: http://localhost:8080
        echo Press Ctrl+C to stop
        echo.
        start "Opening Browser" "http://localhost:8080"
        python -m http.server 8080
    ) else (
        echo ❌ Python not found!
        echo Install Python from: https://python.org/
        echo.
        echo Opening frontend directly instead...
        start index.html
    )
) else if "%choice%"=="3" (
    echo Starting Node.js Live Server...
    echo Frontend: http://localhost:8080
    echo Press Ctrl+C to stop
    echo.
    start "Opening Browser" "http://localhost:8080"
    npx live-server --port=8080
) else if "%choice%"=="4" (
    echo Opening frontend folder...
    start .
) else (
    echo Invalid choice. Opening directly...
    start index.html
)

echo.
pause
