const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, validationError, authError, conflictError } = require('../middleware/errorHandler');

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw validationError(errorMessages);
  }

  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflictError('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password
  });

  // Generate JWT token
  const token = generateToken(user._id);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        donations: user.donations,
        achievements: user.achievements,
        rank: user.rank,
        settings: user.settings,
        profile: user.profile
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw validationError(errorMessages);
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw authError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw authError('Account is deactivated. Please contact support.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw authError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        donations: user.donations,
        achievements: user.achievements,
        rank: user.rank,
        settings: user.settings,
        profile: user.profile,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        donations: user.donations,
        referrals: user.referrals,
        achievements: user.achievements,
        rank: user.rank,
        settings: user.settings,
        profile: user.profile,
        nextAchievement: user.nextAchievement,
        progress: user.progress,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, settings } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  // Update allowed fields
  if (name) {
    if (name.trim().length < 2 || name.trim().length > 50) {
      throw validationError('Name must be between 2 and 50 characters');
    }
    user.name = name.trim();
  }

  if (bio !== undefined) {
    if (bio.length > 200) {
      throw validationError('Bio cannot exceed 200 characters');
    }
    user.profile.bio = bio;
  }

  if (settings) {
    if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
      user.settings.theme = settings.theme;
    }
    
    if (settings.notifications) {
      user.settings.notifications = {
        ...user.settings.notifications,
        ...settings.notifications
      };
    }
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        donations: user.donations,
        referrals: user.referrals,
        achievements: user.achievements,
        rank: user.rank,
        settings: user.settings,
        profile: user.profile
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw validationError('Current password and new password are required');
  }

  if (newPassword.length < 6) {
    throw validationError('New password must be at least 6 characters long');
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    throw validationError('New password must contain at least one lowercase letter, one uppercase letter, and one number');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw notFoundError('User');
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw authError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmation } = req.body;

  if (!password || confirmation !== 'DELETE') {
    throw validationError('Password and confirmation ("DELETE") are required');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    throw notFoundError('User');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw authError('Password is incorrect');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user || !user.isActive) {
    throw authError('User not found or account deactivated');
  }

  // Generate new token
  const token = generateToken(user._id);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token
    }
  });
});

module.exports = {
  register: [registerValidation, register],
  login: [loginValidation, login],
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  refreshToken
};
