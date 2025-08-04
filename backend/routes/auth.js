const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  refreshToken
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', ...register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', ...login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, changePassword);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, refreshToken);

// @route   DELETE /api/auth/account
// @desc    Delete user account (soft delete)
// @access  Private
router.delete('/account', auth, deleteAccount);

module.exports = router;
