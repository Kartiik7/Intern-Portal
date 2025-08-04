@echo off
echo Starting Intern Portal Backend Server...
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Start the server
echo Starting server...
node server.js

pause
