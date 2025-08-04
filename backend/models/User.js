const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  referralCode: {
    type: String,
    unique: true,
    uppercase: true,
    default: function() {
      return this.name.substring(0, 4).toUpperCase() + '2024';
    }
  },
  donations: {
    total: {
      type: Number,
      default: 0,
      min: [0, 'Donations cannot be negative']
    },
    weekly: {
      type: Number,
      default: 0,
      min: [0, 'Weekly donations cannot be negative']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  referrals: {
    count: {
      type: Number,
      default: 0,
      min: [0, 'Referral count cannot be negative']
    },
    successful: {
      type: Number,
      default: 0,
      min: [0, 'Successful referrals cannot be negative']
    }
  },
  achievements: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    threshold: {
      type: Number,
      required: true
    }
  }],
  rank: {
    current: {
      type: Number,
      default: 999
    },
    best: {
      type: Number,
      default: 999
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: ''
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      },
      leaderboard: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for next achievement
userSchema.virtual('nextAchievement').get(function() {
  const thresholds = [1000, 2000, 3000, 5000, 10000];
  const currentDonations = this.donations.total;
  
  for (let threshold of thresholds) {
    if (currentDonations < threshold) {
      return {
        threshold,
        remaining: threshold - currentDonations,
        percentage: Math.round((currentDonations / threshold) * 100)
      };
    }
  }
  
  return null; // All achievements unlocked
});

// Virtual for progress to next level
userSchema.virtual('progress').get(function() {
  const total = this.donations.total;
  const levels = [
    { min: 0, max: 1000, name: 'Starter' },
    { min: 1000, max: 2000, name: 'Rising Star' },
    { min: 2000, max: 3000, name: 'Diamond' },
    { min: 3000, max: 5000, name: 'Premium' },
    { min: 5000, max: 10000, name: 'Elite' },
    { min: 10000, max: Infinity, name: 'Legend' }
  ];
  
  for (let level of levels) {
    if (total >= level.min && total < level.max) {
      return {
        currentLevel: level.name,
        progress: level.max === Infinity ? 100 : Math.round(((total - level.min) / (level.max - level.min)) * 100),
        nextLevel: level.max === Infinity ? null : levels[levels.indexOf(level) + 1]?.name
      };
    }
  }
  
  return levels[levels.length - 1];
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode && this.name) {
    const namePrefix = this.name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referralCode = `${namePrefix}${randomSuffix}`;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update donations and check for new achievements
userSchema.methods.updateDonations = function(amount) {
  this.donations.total += amount;
  this.donations.weekly += amount;
  this.donations.lastUpdated = new Date();
  
  // Check for new achievements
  const achievementThresholds = [
    { id: 'first_donation', threshold: 1, name: 'First Donation', description: 'Made your first donation', icon: '🎉' },
    { id: 'rising_star', threshold: 1000, name: 'Rising Star', description: 'Raised $1,000', icon: '🚀' },
    { id: 'diamond_achiever', threshold: 2000, name: 'Diamond Achiever', description: 'Raised $2,000', icon: '💎' },
    { id: 'premium_member', threshold: 3000, name: 'Premium Member', description: 'Raised $3,000', icon: '⭐' },
    { id: 'elite_champion', threshold: 5000, name: 'Elite Champion', description: 'Raised $5,000', icon: '👑' },
    { id: 'legend_status', threshold: 10000, name: 'Legend Status', description: 'Raised $10,000', icon: '🏆' }
  ];
  
  achievementThresholds.forEach(achievement => {
    if (this.donations.total >= achievement.threshold && 
        !this.achievements.some(a => a.id === achievement.id)) {
      this.achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        threshold: achievement.threshold,
        unlockedAt: new Date()
      });
    }
  });
  
  return this.save();
};

// Method to get user stats
userSchema.methods.getStats = function() {
  return {
    donations: this.donations,
    referrals: this.referrals,
    rank: this.rank,
    achievements: this.achievements,
    nextAchievement: this.nextAchievement,
    progress: this.progress
  };
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .select('name email referralCode donations.total achievements rank')
    .sort({ 'donations.total': -1 })
    .limit(limit);
};

// Static method to update all user ranks
userSchema.statics.updateRanks = async function() {
  const users = await this.find({ isActive: true })
    .sort({ 'donations.total': -1 })
    .select('_id donations.total rank');
  
  const updates = users.map((user, index) => ({
    updateOne: {
      filter: { _id: user._id },
      update: {
        'rank.current': index + 1,
        'rank.lastUpdated': new Date(),
        $min: { 'rank.best': index + 1 }
      }
    }
  }));
  
  if (updates.length > 0) {
    await this.bulkWrite(updates);
  }
  
  return users.length;
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'donations.total': -1 });
userSchema.index({ 'rank.current': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
