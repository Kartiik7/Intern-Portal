const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  updateDonations,
  getAchievements,
  getDonationHistory,
  getReferralStats
} = require('../controllers/dashboardController');
const { auth, sensitiveOpAuth } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for authenticated user
// @access  Private
router.get('/stats', auth, getDashboardStats);

// @route   PUT /api/dashboard/update-donations
// @desc    Update user donation amount
// @access  Private
router.put('/update-donations', auth, sensitiveOpAuth, updateDonations);

// @route   GET /api/dashboard/achievements
// @desc    Get user achievements and progress
// @access  Private
router.get('/achievements', auth, getAchievements);

// @route   GET /api/dashboard/donations
// @desc    Get user donation history with pagination
// @access  Private
router.get('/donations', auth, getDonationHistory);

// @route   GET /api/dashboard/referrals
// @desc    Get user referral statistics
// @access  Private
router.get('/referrals', auth, getReferralStats);

module.exports = router;
