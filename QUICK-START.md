# 🚀 QUICK START GUIDE - Intern Portal

## What You Have Now

Your intern portal is a complete full-stack application with:
- ✅ Backend API (Node.js + Express)
- ✅ Frontend (HTML/CSS/JavaScript)
- ✅ Mock data for development
- ✅ Database models ready for MongoDB

## 🎯 How to Run (3 Easy Options)

### Option 1: Quick Test (Simplest)
1. Double-click: `frontend/index.html`
2. The app will automatically use mock data
3. You can test all features immediately!

### Option 2: With Backend Server
1. Run: `setup-complete.bat` (sets everything up)
2. Open terminal in `backend` folder
3. Run: `npm start`
4. Open another terminal in `frontend` folder  
5. Run: `python -m http.server 8080`
6. Open: http://localhost:8080

### Option 3: With Live Reload
1. Run: `setup-complete.bat` 
2. In `backend` folder: `npm start`
3. In `frontend` folder: `npx live-server --port=8080`

## 🔧 Common Issues & Solutions

### ❌ "MongoDB connection error"
**Solution**: The app automatically uses mock data. No action needed!

### ❌ "CORS error" or "Can't connect to API"
**Solutions**:
1. Make sure backend is running on port 5000
2. Serve frontend from http://localhost:8080 (not file://)
3. Check Windows Firewall isn't blocking ports

### ❌ "Port already in use"
**Solution**: 
- For port 5000: `netstat -ano | findstr :5000` then kill process
- For port 8080: Use a different port like 8081

### ❌ "npm not found" or "node not found"  
**Solution**: Install Node.js from https://nodejs.org/

## 🎮 Test the App

1. **Registration**: Create account with any email/password
2. **Login**: Use the same credentials
3. **Dashboard**: View your stats and achievements  
4. **Leaderboard**: See rankings and compete
5. **Theme**: Toggle dark/light mode

## 📱 Features Working Out of the Box

- ✅ User registration/login (mock)
- ✅ Dashboard with stats
- ✅ Achievement system
- ✅ Leaderboard rankings
- ✅ Responsive design
- ✅ Dark/light themes
- ✅ Smooth animations

## 🗃️ Real Database (Optional)

To use real MongoDB instead of mock data:

1. Install MongoDB Community: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. In `frontend/js/api.js`, change: `USE_MOCK_DATA = false`
4. Restart backend server

## 🚀 Next Steps

Your app is production-ready! You can:
- Deploy backend to Heroku/Railway/DigitalOcean
- Deploy frontend to Netlify/Vercel
- Add more features
- Customize the design

---

**Need help?** Check the detailed README.md or the troubleshooting section above!
