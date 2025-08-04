const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000', 
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'file://'
  ],
  credentials: true
}));

app.use(express.json());

// Database connection (optional)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intern-portal';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log('⚠️  MongoDB not connected - using mock data mode');
    console.log('   Error:', error.message);
  }
};

connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Intern Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints for testing
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'user_123',
      name: 'John Doe',
      email: req.body.email || 'john@example.com',
      donationAmount: 1500,
      rank: 5
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration successful',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'user_' + Date.now(),
      name: req.body.name || 'New User',
      email: req.body.email || 'user@example.com',
      donationAmount: 0,
      rank: 25
    }
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalDonations: 1500,
      rank: 5,
      totalInterns: 50,
      achievements: [
        { id: '1', name: 'First Donation', unlocked: true, progress: 100, icon: '🎉' },
        { id: '2', name: 'Rising Star', unlocked: true, progress: 100, icon: '🚀' },
        { id: '3', name: 'Diamond Achiever', unlocked: false, progress: 75, icon: '💎' }
      ],
      referralCode: 'USER2024',
      referralCount: 3,
      weeklyProgress: {
        current: 300,
        target: 500
      }
    }
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: [
      { rank: 1, name: 'Alice Johnson', donationAmount: 5000, achievements: 8 },
      { rank: 2, name: 'Bob Smith', donationAmount: 3500, achievements: 6 },
      { rank: 3, name: 'Carol Brown', donationAmount: 2800, achievements: 5 },
      { rank: 4, name: 'David Wilson', donationAmount: 2200, achievements: 4 },
      { rank: 5, name: 'John Doe', donationAmount: 1500, achievements: 3 }
    ]
  });
});

// Handle donation updates
app.put('/api/dashboard/update-donations', (req, res) => {
  const { amount, source = 'direct', notes } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number'
    });
  }

  res.json({
    success: true,
    message: 'Donation updated successfully',
    data: {
      donation: {
        id: 'donation_' + Date.now(),
        amount: parseFloat(amount),
        formattedAmount: '$' + parseFloat(amount).toLocaleString(),
        source: source,
        notes: notes || '',
        createdAt: new Date().toISOString()
      },
      user: {
        totalDonations: 1500 + parseFloat(amount),
        newRank: Math.max(1, 5 - Math.floor(amount / 500)),
        rankChange: amount > 500 ? -1 : 0
      },
      newAchievements: amount >= 1000 ? [
        { name: 'Big Contributor', icon: '💰', message: 'Donated over $1000 in one go!' }
      ] : []
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
