@echo off
title Intern Portal Setup

echo.
echo 🚀 Setting up Intern Portal...
echo ================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js ^(v14 or higher^) and try again.
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected

:: Check if MongoDB is running (basic check for Windows)
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if errorlevel 1 (
    echo ⚠️  MongoDB service might not be running.
    echo    Please start MongoDB service or use Docker:
    echo    docker run -d -p 27017:27017 --name mongodb mongo:latest
    echo.
    set /p "continue=Continue anyway? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
)

:: Navigate to backend directory
cd backend

:: Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed successfully

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env >nul
    
    :: Generate a simple JWT secret (Windows compatible)
    set "JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
    
    :: Update .env file with generated secret
    powershell -Command "(gc .env) -replace 'your-super-secret-jwt-key-here', '%JWT_SECRET%' | Out-File -encoding ASCII .env"
    
    echo ✅ Environment file created with random JWT secret
    echo 📝 Please review and update .env file if needed
) else (
    echo ✅ Environment file already exists
)

:: Return to root directory
cd ..

echo.
echo 🎉 Setup completed successfully!
echo ================================
echo.
echo Next steps:
echo 1. Start MongoDB if not already running
echo 2. Start the backend server:
echo    cd backend ^&^& npm start
echo.
echo 3. In a new command prompt, serve the frontend:
echo    cd frontend
echo    npx http-server -p 8080 -c-1
echo    # OR
echo    python -m http.server 8080
echo.
echo 4. Open your browser and navigate to:
echo    http://localhost:8080
echo.
echo 🔧 Development tips:
echo - Use 'npm run dev' in backend folder for auto-reload
echo - Check backend\.env for configuration
echo - View API documentation in README.md
echo.
echo Happy coding! 🚀
echo.
pause
