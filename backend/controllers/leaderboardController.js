const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { asyncHandler, validationError } = require('../middleware/errorHandler');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public (with optional auth for highlighting current user)
const getLeaderboard = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw validationError(errorMessages);
  }

  const { 
    limit = 50, 
    page = 1, 
    period = 'all',
    category = 'donations'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100); // Max 100 users per page
  const skip = (pageNum - 1) * limitNum;

  let leaderboardData = [];
  let totalUsers = 0;

  if (category === 'donations') {
    // Get donation-based leaderboard
    if (period === 'all') {
      // All-time leaderboard
      leaderboardData = await User.find({ 
        isActive: true,
        'donations.total': { $gt: 0 }
      })
        .select('name email referralCode donations achievements rank profile createdAt')
        .sort({ 'donations.total': -1 })
        .skip(skip)
        .limit(limitNum);

      totalUsers = await User.countDocuments({ 
        isActive: true,
        'donations.total': { $gt: 0 }
      });
    } else {
      // Period-based leaderboard (week, month, year)
      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case 'week':
          dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case 'month':
          dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
          break;
        case 'year':
          dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
          break;
      }

      // Aggregate donations for the period
      const periodDonations = await Donation.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $match: { 'user.isActive': true }
        },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            referralCode: '$user.referralCode',
            achievements: '$user.achievements',
            profile: '$user.profile',
            createdAt: '$user.createdAt',
            periodDonations: '$totalAmount',
            periodDonationCount: '$donationCount',
            totalDonations: '$user.donations.total'
          }
        }
      ]);

      leaderboardData = periodDonations;
      
      // Get total count for pagination
      const totalCount = await Donation.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $match: { 'user.isActive': true }
        },
        { $count: 'total' }
      ]);

      totalUsers = totalCount.length > 0 ? totalCount[0].total : 0;
    }
  } else if (category === 'referrals') {
    // Referral-based leaderboard
    leaderboardData = await User.find({ 
      isActive: true,
      'referrals.successful': { $gt: 0 }
    })
      .select('name email referralCode referrals achievements profile createdAt')
      .sort({ 'referrals.successful': -1 })
      .skip(skip)
      .limit(limitNum);

    totalUsers = await User.countDocuments({ 
      isActive: true,
      'referrals.successful': { $gt: 0 }
    });
  }

  // Format leaderboard data
  const formattedLeaderboard = leaderboardData.map((user, index) => {
    const rank = skip + index + 1;
    const isCurrentUser = req.user && req.user._id.toString() === (user._id || user.userId).toString();

    let mainStat, secondaryStat;
    
    if (category === 'donations') {
      if (period === 'all') {
        mainStat = user.donations?.total || 0;
        secondaryStat = user.achievements?.length || 0;
      } else {
        mainStat = user.periodDonations || 0;
        secondaryStat = user.totalDonations || 0;
      }
    } else if (category === 'referrals') {
      mainStat = user.referrals?.successful || 0;
      secondaryStat = user.referrals?.count || 0;
    }

    return {
      rank,
      user: {
        id: user._id || user.userId,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        avatar: user.profile?.avatar || '',
        joinedAt: user.createdAt
      },
      stats: {
        main: mainStat,
        secondary: secondaryStat,
        achievements: user.achievements?.length || 0
      },
      isCurrentUser,
      badges: getRankBadges(rank, mainStat)
    };
  });

  // Get current user's position if authenticated
  let currentUserRank = null;
  if (req.user) {
    if (category === 'donations' && period === 'all') {
      const userRankQuery = await User.aggregate([
        { $match: { isActive: true, 'donations.total': { $gt: 0 } } },
        { $sort: { 'donations.total': -1 } },
        {
          $group: {
            _id: null,
            users: { $push: { id: '$_id', total: '$donations.total' } }
          }
        },
        { $unwind: { path: '$users', includeArrayIndex: 'rank' } },
        { $match: { 'users.id': req.user._id } },
        { $project: { rank: { $add: ['$rank', 1] }, total: '$users.total' } }
      ]);

      if (userRankQuery.length > 0) {
        currentUserRank = {
          rank: userRankQuery[0].rank,
          total: userRankQuery[0].total
        };
      }
    }
  }

  // Get leaderboard statistics
  const stats = await getLeaderboardStats(category, period);

  res.json({
    success: true,
    message: 'Leaderboard retrieved successfully',
    data: {
      leaderboard: formattedLeaderboard,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        hasNext: pageNum < Math.ceil(totalUsers / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        category,
        period,
        limit: limitNum
      },
      currentUserRank,
      stats
    }
  });
});

// @desc    Get user's rank and nearby users
// @route   GET /api/leaderboard/nearby
// @access  Private
const getNearbyUsers = asyncHandler(async (req, res) => {
  const { range = 5, category = 'donations' } = req.query;
  const rangeNum = Math.min(parseInt(range), 10); // Max 10 users on each side

  const user = await User.findById(req.user._id);
  if (!user) {
    throw notFoundError('User');
  }

  let leaderboard = [];
  let currentUserRank = 1;

  if (category === 'donations') {
    // Get all users sorted by donations
    const allUsers = await User.find({ 
      isActive: true,
      'donations.total': { $gt: 0 }
    })
      .select('name email referralCode donations achievements profile')
      .sort({ 'donations.total': -1 });

    // Find current user's position
    currentUserRank = allUsers.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    // Get nearby users
    const startIndex = Math.max(0, currentUserRank - rangeNum - 1);
    const endIndex = Math.min(allUsers.length, currentUserRank + rangeNum);
    
    leaderboard = allUsers.slice(startIndex, endIndex);
  } else if (category === 'referrals') {
    // Similar logic for referrals
    const allUsers = await User.find({ 
      isActive: true,
      'referrals.successful': { $gt: 0 }
    })
      .select('name email referralCode referrals achievements profile')
      .sort({ 'referrals.successful': -1 });

    currentUserRank = allUsers.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    const startIndex = Math.max(0, currentUserRank - rangeNum - 1);
    const endIndex = Math.min(allUsers.length, currentUserRank + rangeNum);
    
    leaderboard = allUsers.slice(startIndex, endIndex);
  }

  // Format nearby users
  const formattedUsers = leaderboard.map((user, index) => {
    const rank = Math.max(1, currentUserRank - rangeNum) + index;
    const isCurrentUser = user._id.toString() === req.user._id.toString();

    return {
      rank,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        avatar: user.profile?.avatar || ''
      },
      stats: {
        donations: user.donations?.total || 0,
        referrals: user.referrals?.successful || 0,
        achievements: user.achievements?.length || 0
      },
      isCurrentUser
    };
  });

  res.json({
    success: true,
    message: 'Nearby users retrieved successfully',
    data: {
      currentUserRank,
      nearbyUsers: formattedUsers,
      category,
      range: rangeNum
    }
  });
});

// @desc    Update user rank (admin only or automated)
// @route   POST /api/leaderboard/update-ranks
// @access  Private (Admin or system)
const updateRanks = asyncHandler(async (req, res) => {
  const updatedCount = await User.updateRanks();

  res.json({
    success: true,
    message: 'User ranks updated successfully',
    data: {
      updatedUsers: updatedCount,
      timestamp: new Date().toISOString()
    }
  });
});

// Helper function to get rank badges
const getRankBadges = (rank, amount) => {
  const badges = [];
  
  // Rank badges
  if (rank === 1) badges.push({ type: 'rank', value: 'gold', label: '🥇 1st Place' });
  else if (rank === 2) badges.push({ type: 'rank', value: 'silver', label: '🥈 2nd Place' });
  else if (rank === 3) badges.push({ type: 'rank', value: 'bronze', label: '🥉 3rd Place' });
  else if (rank <= 10) badges.push({ type: 'rank', value: 'top10', label: '🔟 Top 10' });
  
  // Amount badges
  if (amount >= 10000) badges.push({ type: 'amount', value: 'legend', label: '🏆 Legend' });
  else if (amount >= 5000) badges.push({ type: 'amount', value: 'elite', label: '👑 Elite' });
  else if (amount >= 3000) badges.push({ type: 'amount', value: 'premium', label: '⭐ Premium' });
  else if (amount >= 2000) badges.push({ type: 'amount', value: 'diamond', label: '💎 Diamond' });
  else if (amount >= 1000) badges.push({ type: 'amount', value: 'rising', label: '🚀 Rising Star' });
  
  return badges;
};

// Helper function to get leaderboard statistics
const getLeaderboardStats = async (category, period) => {
  const stats = {};
  
  if (category === 'donations') {
    if (period === 'all') {
      const donationStats = await User.aggregate([
        { $match: { isActive: true, 'donations.total': { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: '$donations.total' },
            averageDonations: { $avg: '$donations.total' },
            maxDonations: { $max: '$donations.total' },
            activeUsers: { $sum: 1 }
          }
        }
      ]);
      
      stats.donations = donationStats[0] || {
        totalDonations: 0,
        averageDonations: 0,
        maxDonations: 0,
        activeUsers: 0
      };
    }
  }
  
  return stats;
};

// Validation rules
const leaderboardValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('period')
    .optional()
    .isIn(['all', 'week', 'month', 'year'])
    .withMessage('Period must be one of: all, week, month, year'),
  
  query('category')
    .optional()
    .isIn(['donations', 'referrals'])
    .withMessage('Category must be either donations or referrals')
];

module.exports = {
  getLeaderboard: [leaderboardValidation, getLeaderboard],
  getNearbyUsers,
  updateRanks
};
