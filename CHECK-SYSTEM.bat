@echo off
cls
echo ========================================
echo    INTERN PORTAL - SYSTEM CHECK
echo ========================================
echo.

cd /d "e:\NewFolder\01TUT\ex\intern-portal"

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js found: 
    node --version
) else (
    echo ❌ Node.js not found!
    echo Please install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Checking backend dependencies...
cd backend
if exist node_modules (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Installing backend dependencies...
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully
    ) else (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo [3/5] Testing backend server...
echo Starting simple server test...
timeout /t 1 /nobreak >nul

REM Start server in background and test
start /b node server-simple.js >nul 2>&1
timeout /t 3 /nobreak >nul

REM Test health endpoint
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; if ($response.status -eq 'OK') { Write-Host '✅ Backend server responding correctly' } else { Write-Host '⚠️  Backend server responding but status unclear' } } catch { Write-Host '❌ Backend server not responding' }"

REM Kill the test server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1

echo.
echo [4/5] Checking frontend files...
cd ..\frontend
if exist index.html (
    echo ✅ Frontend index.html found
) else (
    echo ❌ Frontend index.html missing!
    pause
    exit /b 1
)

if exist js\api.js (
    echo ✅ Frontend JavaScript files found
) else (
    echo ❌ Frontend JavaScript files missing!
    pause
    exit /b 1
)

if exist css\styles.css (
    echo ✅ Frontend CSS files found
) else (
    echo ❌ Frontend CSS files missing!
    pause
    exit /b 1
)

echo.
echo [5/5] Checking Python (for frontend server)...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python found: 
    python --version
    echo   Can use: python -m http.server 8080
) else (
    echo ⚠️  Python not found
    echo   You can still open index.html directly
)

echo.
echo ========================================
echo         SYSTEM CHECK COMPLETE
echo ========================================
echo.
echo ✅ Your system is ready to run the Intern Portal!
echo.
echo 🚀 Quick Start Options:
echo.
echo [1] Auto Start Everything:
echo     Double-click: START-APP.bat
echo.
echo [2] Manual Backend:
echo     cd backend
echo     npm run start-simple
echo.
echo [3] Manual Frontend:
echo     cd frontend
echo     python -m http.server 8080
echo     OR double-click index.html
echo.
echo [4] Demo Mode Only:
echo     Double-click: frontend\index.html
echo.
echo ========================================

pause
