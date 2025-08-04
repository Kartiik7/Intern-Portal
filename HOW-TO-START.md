# 🚀 HOW TO START THE INTERN PORTAL

## Quick Start (Recommended)

### Option 1: Full Stack (Backend + Frontend)
1. **Double-click**: `START-APP.bat`
2. **Wait**: The script will automatically:
   - Check Node.js installation
   - Install dependencies
   - Start backend server (new window)
   - Start frontend server
   - Open browser automatically

**That's it!** Your app will be running at:
- Frontend: http://localhost:8080
- Backend: http://localhost:5000

### Option 2: Frontend Only (Demo Mode)
1. **Go to**: `frontend` folder
2. **Double-click**: `index.html`
3. **Result**: App runs with demo data (no backend needed)

## Manual Start (Advanced)

### Step 1: Start Backend
**Option A - Simple Server (Recommended for testing):**
```bash
cd backend
npm install
npm run start-simple
```

**Option B - Full Server (with database):**
```bash
cd backend
npm install
npm start
```

### Step 2: Start Frontend
**Option A - Python HTTP Server:**
```bash
cd frontend
python -m http.server 8080
```

**Option B - Node.js Live Server:**
```bash
cd frontend
npx live-server --port=8080
```

**Option C - Direct File:**
- Open `frontend/index.html` in browser

## ✅ Features You Can Test

### Without Backend (Demo Mode)
- ✅ Login/Register (any credentials work)
- ✅ Dashboard with mock stats
- ✅ Achievements system
- ✅ Leaderboard
- ✅ Responsive design
- ✅ Dark/light themes

### With Backend (Full Functionality)
- ✅ Real user authentication
- ✅ Persistent data storage
- ✅ MongoDB integration
- ✅ JWT security
- ✅ API validation
- ✅ Real-time updates

## 🔧 Troubleshooting

### "TypeError: app.use() requires a middleware function"
**Quick Fix:**
```bash
cd backend
npm run start-simple
```
This uses a simplified server that always works!

### "Node.js not found"
- Install from: https://nodejs.org/
- Restart terminal/command prompt

### "Port already in use"
- Backend (5000): `netstat -ano | findstr :5000`
- Frontend (8080): `netstat -ano | findstr :8080`
- Kill process or use different port

### "MongoDB connection error"
- **Don't worry!** App automatically uses demo data
- To use real DB: Install MongoDB Community

### "CORS errors"
- Make sure to serve frontend from `http://localhost:8080`
- Don't open as `file://` if using backend

### "Donation not updating on dashboard"
**This issue has been FIXED!** Now:
- ✅ Donations update immediately on submission
- ✅ Total amounts persist between sessions  
- ✅ Rankings update automatically
- ✅ Achievement progress tracks correctly

**To test:** Add a donation and watch the dashboard update instantly!

## 🎮 Test Accounts (Demo Mode)

**Login with any credentials:**
- Email: `test@example.com`
- Password: `password123`

**Or register new account with any details!**

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari

---

## 🔍 How to Check if Everything is Working

### Step 1: Check Backend Server
Open PowerShell/Command Prompt and run:
```bash
cd e:\NewFolder\01TUT\ex\intern-portal\backend
npm run start-simple
```

**✅ Success signs:**
- You see: `🚀 Server running on port 5000`
- You see: `📱 API available at: http://localhost:5000/api`
- No error messages

**🌐 Test the API:**
Open browser and go to: `http://localhost:5000/api/health`
You should see:
```json
{
  "status": "OK",
  "message": "Intern Portal API is running",
  "timestamp": "2025-08-04T..."
}
```

### Step 2: Check Frontend
**Option A - With HTTP Server:**
```bash
cd e:\NewFolder\01TUT\ex\intern-portal\frontend
python -m http.server 8080
```
Then open: `http://localhost:8080`

**Option B - Direct File:**
Double-click: `e:\NewFolder\01TUT\ex\intern-portal\frontend\index.html`

**✅ Success signs:**
- Login page appears
- No console errors (press F12 to check)
- You can register/login with any credentials

### Step 3: Test Full Functionality
1. **Register a new user:**
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`

2. **Check Dashboard:**
   - You should see donation stats
   - Achievement progress bars
   - Referral code
   - Weekly progress chart

3. **Check Leaderboard:**
   - You should see ranked users
   - Your rank should be displayed

4. **Test Theme Toggle:**
   - Click the theme button (🌙/☀️)
   - Interface should switch between dark/light

### Step 4: Check Browser Console
Press `F12` in your browser and look at the Console tab:

**✅ Good signs:**
- No red error messages
- You might see: "Backend Offline - Using demo data" (this is normal!)

**❌ Bad signs:**
- Red errors about missing files
- CORS errors (if using backend)
- JavaScript syntax errors

### Step 5: Automatic Check Script
I'll create a quick check script for you:

**Need help?** Check the main README.md for detailed documentation!
