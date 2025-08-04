@echo off
cls
echo ========================================
echo    TESTING BACKEND API ENDPOINTS
echo ========================================
echo.

cd /d "e:\NewFolder\01TUT\ex\intern-portal\backend"

echo Starting backend server for testing...
start /b npm run start-simple >nul 2>&1

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Testing API endpoints...
echo.

echo [1] Health Check:
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health'; Write-Host '✅ Status:' $r.status '- Message:' $r.message } catch { Write-Host '❌ Health check failed:' $_.Exception.Message }"

echo.
echo [2] Login Test:
powershell -Command "try { $body = @{email='test@example.com'; password='password123'} | ConvertTo-Json; $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'; Write-Host '✅ Login successful - Token received' } catch { Write-Host '❌ Login failed:' $_.Exception.Message }"

echo.
echo [3] Dashboard Stats Test:
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/dashboard/stats'; Write-Host '✅ Dashboard stats - Donations:' $r.data.totalDonations '- Rank:' $r.data.rank } catch { Write-Host '❌ Dashboard stats failed:' $_.Exception.Message }"

echo.
echo [4] Leaderboard Test:
powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/leaderboard'; Write-Host '✅ Leaderboard loaded -' $r.data.Count 'users found' } catch { Write-Host '❌ Leaderboard failed:' $_.Exception.Message }"

echo.
echo ========================================
echo         API TESTING COMPLETE
echo ========================================

REM Stop the test server
echo.
echo Stopping test server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1

echo.
echo If all tests show ✅, your backend is working perfectly!
echo If you see ❌, check the error messages above.
echo.
pause
