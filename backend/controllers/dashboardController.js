const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Achievement = require('../models/Achievement');
const { asyncHandler, validationError, notFoundError } = require('../middleware/errorHandler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  // Get recent donations
  const recentDonations = await Donation.find({ 
    userId: req.user._id,
    status: 'completed'
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('amount source createdAt');

  // Get donation trends for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const donationTrends = await Donation.aggregate([
    {
      $match: {
        userId: user._id,
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Get user's current rank
  const rankInfo = await User.aggregate([
    { $match: { isActive: true } },
    { $sort: { 'donations.total': -1 } },
    {
      $group: {
        _id: null,
        users: { $push: { id: '$_id', total: '$donations.total' } }
      }
    },
    {
      $unwind: { path: '$users', includeArrayIndex: 'rank' }
    },
    {
      $match: { 'users.id': user._id }
    },
    {
      $project: {
        rank: { $add: ['$rank', 1] },
        total: '$users.total'
      }
    }
  ]);

  const currentRank = rankInfo.length > 0 ? rankInfo[0].rank : 999;
  
  // Update user's rank if different
  if (user.rank.current !== currentRank) {
    user.rank.current = currentRank;
    user.rank.lastUpdated = new Date();
    if (currentRank < user.rank.best) {
      user.rank.best = currentRank;
    }
    await user.save();
  }

  // Get total number of active users
  const totalUsers = await User.countDocuments({ isActive: true });

  // Check for new achievements
  const newAchievements = await Achievement.checkUserAchievements(user._id);

  // Get next achievement info
  const nextAchievement = user.nextAchievement;

  res.json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode
      },
      stats: {
        donations: {
          total: user.donations.total,
          weekly: user.donations.weekly,
          lastUpdated: user.donations.lastUpdated
        },
        referrals: user.referrals,
        rank: {
          current: currentRank,
          total: totalUsers,
          best: user.rank.best
        },
        achievements: {
          unlocked: user.achievements.length,
          recent: user.achievements.slice(-3),
          newlyUnlocked: newAchievements
        }
      },
      nextAchievement,
      progress: user.progress,
      recentDonations,
      trends: donationTrends
    }
  });
});

// @desc    Update donation amount
// @route   PUT /api/dashboard/update-donations
// @access  Private
const updateDonations = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw validationError(errorMessages);
  }

  const { amount, source = 'direct', referralCode, notes } = req.body;

  if (!amount || amount <= 0) {
    throw validationError('Amount must be a positive number');
  }

  if (amount > 100000) {
    throw validationError('Amount cannot exceed $100,000');
  }

  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  // Create donation record
  const donation = new Donation({
    userId: user._id,
    amount: parseFloat(amount),
    source,
    referralCode: referralCode || null,
    notes: notes || '',
    metadata: {
      platform: 'web',
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    }
  });

  await donation.save();

  // Update user donations and check achievements
  await user.updateDonations(parseFloat(amount));

  // Update all user rankings
  await User.updateRanks();

  // Get updated user with new rank
  const updatedUser = await User.findById(req.user._id);

  // Check for new achievements
  const newAchievements = await Achievement.checkUserAchievements(user._id);

  res.json({
    success: true,
    message: 'Donation updated successfully',
    data: {
      donation: {
        id: donation._id,
        amount: donation.amount,
        formattedAmount: donation.formattedAmount,
        source: donation.source,
        createdAt: donation.createdAt
      },
      user: {
        donations: updatedUser.donations,
        rank: updatedUser.rank,
        achievements: updatedUser.achievements,
        nextAchievement: updatedUser.nextAchievement,
        progress: updatedUser.progress
      },
      newAchievements
    }
  });
});

// @desc    Get user achievements
// @route   GET /api/dashboard/achievements
// @access  Private
const getAchievements = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  // Get all available achievements with user progress
  const achievementProgress = await Achievement.getUserProgress(user._id);

  // Group achievements by category
  const groupedAchievements = achievementProgress.reduce((groups, achievement) => {
    const category = achievement.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {});

  // Get achievement statistics
  const stats = {
    total: achievementProgress.length,
    unlocked: achievementProgress.filter(a => a.unlocked).length,
    inProgress: achievementProgress.filter(a => !a.unlocked && a.progress > 0).length,
    locked: achievementProgress.filter(a => !a.unlocked && a.progress === 0).length
  };

  res.json({
    success: true,
    message: 'Achievements retrieved successfully',
    data: {
      achievements: achievementProgress,
      groupedAchievements,
      stats,
      userProgress: user.progress,
      nextAchievement: user.nextAchievement
    }
  });
});

// @desc    Get donation history
// @route   GET /api/dashboard/donations
// @access  Private
const getDonationHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, source, startDate, endDate } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = { userId: req.user._id };
  
  if (status) {
    filter.status = status;
  }
  
  if (source) {
    filter.source = source;
  }
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  // Get donations with pagination
  const donations = await Donation.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('referredBy', 'name referralCode');

  // Get total count
  const total = await Donation.countDocuments(filter);

  // Get summary statistics
  const stats = await Donation.getStats(req.user._id);

  res.json({
    success: true,
    message: 'Donation history retrieved successfully',
    data: {
      donations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalDonations: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      stats
    }
  });
});

// @desc    Get referral statistics
// @route   GET /api/dashboard/referrals
// @access  Private
const getReferralStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw notFoundError('User');
  }

  // Get users referred by this user
  const referredUsers = await User.find({
    'referrals.referredBy': user._id,
    isActive: true
  })
    .select('name email donations createdAt')
    .sort({ createdAt: -1 });

  // Get donations made through this user's referral code
  const referralDonations = await Donation.find({
    referralCode: user.referralCode,
    status: 'completed'
  })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  // Calculate referral earnings (if there's a commission system)
  const totalReferralAmount = referralDonations.reduce((sum, donation) => sum + donation.amount, 0);

  res.json({
    success: true,
    message: 'Referral statistics retrieved successfully',
    data: {
      referralCode: user.referralCode,
      stats: {
        totalReferrals: user.referrals.count,
        successfulReferrals: user.referrals.successful,
        totalReferralAmount,
        averageReferralAmount: referralDonations.length > 0 ? totalReferralAmount / referralDonations.length : 0
      },
      referredUsers: referredUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        totalDonations: u.donations.total,
        joinedAt: u.createdAt
      })),
      recentReferralDonations: referralDonations.slice(0, 10)
    }
  });
});

// Validation for update donations
const updateDonationsValidation = [
  body('amount')
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Amount must be between $0.01 and $100,000'),
  
  body('source')
    .optional()
    .isIn(['direct', 'referral', 'campaign', 'event'])
    .withMessage('Invalid donation source'),
  
  body('referralCode')
    .optional()
    .isAlphanumeric()
    .withMessage('Referral code must be alphanumeric'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

module.exports = {
  getDashboardStats,
  updateDonations: [updateDonationsValidation, updateDonations],
  getAchievements,
  getDonationHistory,
  getReferralStats
};
