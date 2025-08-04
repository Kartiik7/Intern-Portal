const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Access denied.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Optional auth middleware (doesn't fail if no token provided)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without user
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await auth(req, res, () => {});
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authentication.'
    });
  }
};

// Rate limiting middleware for sensitive operations
const sensitiveOpAuth = (req, res, next) => {
  // Add additional checks for sensitive operations
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for this operation.'
    });
  }
  
  // Check if account is recently created (prevent abuse)
  const accountAge = Date.now() - new Date(req.user.createdAt).getTime();
  const minAgeMs = 24 * 60 * 60 * 1000; // 24 hours
  
  if (accountAge < minAgeMs) {
    return res.status(429).json({
      success: false,
      message: 'Account too new. Please wait 24 hours before performing this action.'
    });
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'intern-portal-api',
      audience: 'intern-portal-app'
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  sensitiveOpAuth,
  generateToken,
  verifyToken
};
