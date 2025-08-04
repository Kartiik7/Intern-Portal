const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getNearbyUsers,
  updateRanks
} = require('../controllers/leaderboardController');
const { auth, optionalAuth, adminAuth } = require('../middleware/auth');

// @route   GET /api/leaderboard
// @desc    Get leaderboard with optional user highlighting
// @access  Public (with optional auth)
router.get('/', optionalAuth, getLeaderboard);

// @route   GET /api/leaderboard/nearby
// @desc    Get users near current user's rank
// @access  Private
router.get('/nearby', auth, getNearbyUsers);

// @route   POST /api/leaderboard/update-ranks
// @desc    Update all user rankings (admin or system)
// @access  Private (Admin)
router.post('/update-ranks', auth, updateRanks);

module.exports = router;
