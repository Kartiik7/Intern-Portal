@echo off
cls
echo ========================================
echo    INTERN PORTAL - FULL STACK LAUNCHER
echo ========================================
echo.

cd /d "e:\NewFolder\01TUT\ex\intern-portal"

echo [1/4] Setting up environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

echo.
echo [2/4] Setting up Backend...
cd backend

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env configuration...
    copy .env.example .env >nul
    echo ✅ Environment configuration created
) else (
    echo ✅ Environment configuration exists
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing backend dependencies...
    echo This may take a few minutes...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo [3/4] Starting Backend Server...
echo Backend will run on: http://localhost:5000
echo.

REM Start backend in a new window
start "Intern Portal Backend" cmd /k "echo Backend Server Starting... && echo. && npm run start-simple"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo ✅ Backend server started in new window
echo.

echo [4/4] Starting Frontend...
cd ..\frontend

REM Check if Python is available for HTTP server
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python found, starting HTTP server on port 8080...
    echo Frontend will be available at: http://localhost:8080
    echo.
    echo ========================================
    echo    APPLICATION IS NOW RUNNING!
    echo ========================================
    echo.
    echo Frontend: http://localhost:8080
    echo Backend:  http://localhost:5000
    echo.
    echo Press Ctrl+C to stop the frontend server
    echo Close the backend window to stop backend
    echo.
    start "Opening Browser" "http://localhost:8080"
    python -m http.server 8080
) else (
    echo Python not found, opening frontend directly...
    echo.
    echo ========================================
    echo    APPLICATION STARTED!
    echo ========================================
    echo.
    echo Frontend: Opening in browser...
    echo Backend:  http://localhost:5000
    echo.
    echo Note: Frontend is using file:// protocol
    echo For full functionality, install Python and restart
    echo.
    start "Intern Portal Frontend" index.html
)

echo.
echo Application stopped.
pause
