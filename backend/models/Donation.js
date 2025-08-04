const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [0.01, 'Donation amount must be positive']
  },
  source: {
    type: String,
    enum: ['direct', 'referral', 'campaign', 'event'],
    default: 'direct'
  },
  referralCode: {
    type: String,
    uppercase: true,
    default: null
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  campaign: {
    id: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    }
  },
  metadata: {
    platform: {
      type: String,
      default: 'web'
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
});

// Virtual for donation age
donationSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInMs = now - created;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
});

// Pre-save middleware to handle referral tracking
donationSchema.pre('save', async function(next) {
  if (this.isNew && this.referralCode) {
    try {
      const User = mongoose.model('User');
      const referrer = await User.findOne({ referralCode: this.referralCode });
      
      if (referrer && referrer._id.toString() !== this.userId.toString()) {
        this.referredBy = referrer._id;
        
        // Update referrer's stats
        referrer.referrals.count += 1;
        referrer.referrals.successful += 1;
        await referrer.save();
      }
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }
  next();
});

// Static method to get donation statistics
donationSchema.statics.getStats = async function(userId = null, period = 'all') {
  const matchStage = { status: 'completed' };
  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);
  
  // Add date filter based on period
  if (period !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalDonations: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalAmount: 0,
    totalDonations: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0
  };
};

// Static method to get top donors
donationSchema.statics.getTopDonors = function(limit = 10, period = 'all') {
  const matchStage = { status: 'completed' };
  
  // Add date filter based on period
  if (period !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalAmount: { $sum: '$amount' },
        donationCount: { $sum: 1 },
        lastDonation: { $max: '$createdAt' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
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
      $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        referralCode: '$user.referralCode',
        totalAmount: 1,
        donationCount: 1,
        lastDonation: 1
      }
    }
  ]);
};

// Static method to get donation trends
donationSchema.statics.getTrends = function(period = 'month', userId = null) {
  const matchStage = { status: 'completed' };
  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);
  
  let groupBy;
  switch (period) {
    case 'day':
      groupBy = { 
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      break;
    case 'week':
      groupBy = { 
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      break;
    case 'month':
      groupBy = { 
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      break;
    case 'year':
      groupBy = { year: { $year: '$createdAt' } };
      break;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy,
        totalAmount: { $sum: '$amount' },
        donationCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

// Indexes for better query performance
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ referralCode: 1 });
donationSchema.index({ referredBy: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ amount: -1 });

module.exports = mongoose.model('Donation', donationSchema);
