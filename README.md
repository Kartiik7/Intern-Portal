# Intern Portal 🚀

A modern, full-stack web application for managing intern donations, achievements, and leaderboards. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing with bcrypt
- Persistent login sessions

### 📊 Dashboard
- Personal donation tracking
- Achievement system with progress tracking
- Referral code generation and management
- Real-time statistics updates
- Weekly progress monitoring

### 🏆 Leaderboard
- Global and filtered rankings
- Multiple time periods (all-time, yearly, monthly, weekly)
- Category-based sorting (donations, referrals)
- Achievement showcase
- User rank tracking

### 🎯 Achievements
- Automated achievement unlocking
- Progress tracking
- Reward system
- Gamification elements

### 🎨 Modern UI/UX
- Responsive design for all devices
- Dark/light theme support
- Real-time notifications
- Smooth animations and transitions
- Accessible interface

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcrypt

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables
- **Architecture**: Modular JavaScript classes
- **API Communication**: Fetch API with error handling
- **State Management**: Custom state manager
- **Real-time Updates**: Simulated WebSocket-like updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd intern-portal
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/intern-portal
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # For local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud connection
   ```

5. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Serve the frontend**
   ```bash
   cd ../frontend
   # Using Python
   python -m http.server 8080
   
   # Or using Node.js live-server
   npx live-server --port=8080
   
   # Or simply open index.html in your browser
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new intern
- `POST /api/auth/login` - Login intern
- `GET /api/auth/profile` - Get user profile (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `PUT /api/dashboard/update-donations` - Update donation amount
- `GET /api/dashboard/achievements` - Get user achievements

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard data
- `GET /api/leaderboard/top/:limit` - Get top N interns

### Referrals
- `POST /api/referrals/generate` - Generate referral code
- `GET /api/referrals/stats` - Get referral statistics

## 📁 Project Structure

```
intern-portal/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   └── leaderboardController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Donation.js
│   │   └── Achievement.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   └── leaderboard.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   └── api.js
│   ├── assets/
│   └── index.html
├── .gitignore
├── README.md
└── package.json
```

## 🎯 Usage

1. **Registration**: Create a new intern account with email and password
2. **Dashboard**: View your donation progress, referral code, and current rank
3. **Achievements**: Track your progress toward unlocking rewards
4. **Leaderboard**: See how you rank against other interns
5. **Theme Toggle**: Switch between light and dark modes

## 🏆 Achievement System

- **🎉 First Donation**: Raise your first $1,000
- **🚀 Rising Star**: Reach $1,000 in donations
- **💎 Diamond Achiever**: Achieve $2,000 in donations
- **👑 Elite Champion**: Hit the $5,000 milestone
- **🏆 Legend Status**: Reach $10,000 in donations

## 🔧 Development

### Running in Development Mode

```bash
# Backend (with auto-reload)
cd backend
npm run dev

# Frontend (with live-server)
cd frontend
npx live-server --port=8080
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intern-portal
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

## 🚀 Deployment

### Backend (Heroku/Railway/DigitalOcean)

1. Set environment variables in your hosting platform
2. Ensure MongoDB connection string is set
3. Deploy the backend folder

### Frontend (Netlify/Vercel/GitHub Pages)

1. Build the frontend if needed
2. Deploy the frontend folder
3. Update API_BASE_URL in frontend/js/api.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Modern CSS techniques and animations
- RESTful API design principles
- JWT authentication best practices
- MongoDB/Mongoose ODM patterns

---

**Happy Coding!** 🎉
