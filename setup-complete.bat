@echo off
echo ================================
echo   INTERN PORTAL SETUP SCRIPT
echo ================================
echo.

cd /d "e:\NewFolder\01TUT\ex\intern-portal"

echo Current directory: %cd%
echo.

echo [STEP 1] Setting up Backend...
cd backend

if not exist .env (
    echo Creating .env configuration file...
    copy .env.example .env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

if not exist node_modules (
    echo Installing backend dependencies...
    npm install
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo [STEP 2] Testing Backend...
echo Testing Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is working

echo.
echo [STEP 3] Setup Complete!
echo.
echo To run the application:
echo.
echo 1. Start Backend Server:
echo    cd backend
echo    npm start
echo.
echo 2. Start Frontend (in a new terminal):
echo    cd frontend
echo    python -m http.server 8080
echo    OR open index.html directly in browser
echo.
echo 3. Open your browser and go to:
echo    http://localhost:8080
echo.
echo ================================
echo   TROUBLESHOOTING TIPS
echo ================================
echo.
echo ❌ If you get MongoDB connection errors:
echo    - The app will use mock data automatically
echo    - To use real database, install MongoDB from:
echo      https://www.mongodb.com/try/download/community
echo.
echo ❌ If you get CORS errors:
echo    - Make sure backend is running on port 5000
echo    - Try serving frontend from http://localhost:8080
echo.
echo ❌ If backend won't start:
echo    - Check if port 5000 is already in use
echo    - Try: netstat -ano | findstr :5000
echo.
echo Press any key to continue...

pause
