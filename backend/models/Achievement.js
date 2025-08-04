const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Achievement name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  icon: {
    type: String,
    required: [true, 'Achievement icon is required'],
    default: '🏆'
  },
  category: {
    type: String,
    enum: ['donation', 'referral', 'engagement', 'milestone', 'special'],
    default: 'donation'
  },
  type: {
    type: String,
    enum: ['threshold', 'streak', 'count', 'special'],
    default: 'threshold'
  },
  criteria: {
    threshold: {
      type: Number,
      default: 0
    },
    field: {
      type: String,
      enum: ['donations.total', 'donations.count', 'referrals.successful', 'login.streak'],
      default: 'donations.total'
    },
    operator: {
      type: String,
      enum: ['gte', 'gt', 'eq', 'lte', 'lt'],
      default: 'gte'
    }
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badge: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  metadata: {
    color: {
      type: String,
      default: '#6366f1'
    },
    gradient: {
      from: { type: String, default: '#6366f1' },
      to: { type: String, default: '#8b5cf6' }
    },
    animation: {
      type: String,
      enum: ['none', 'pulse', 'glow', 'bounce'],
      default: 'none'
    }
  },
  statistics: {
    totalUnlocked: {
      type: Number,
      default: 0
    },
    lastUnlockedAt: {
      type: Date,
      default: null
    },
    averageTimeToUnlock: {
      type: Number, // in days
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for rarity color
achievementSchema.virtual('rarityColor').get(function() {
  const colors = {
    common: '#9ca3af',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b'
  };
  return colors[this.rarity] || colors.common;
});

// Virtual for achievement progress description
achievementSchema.virtual('progressDescription').get(function() {
  const { threshold, field, operator } = this.criteria;
  const operatorText = {
    gte: 'at least',
    gt: 'more than',
    eq: 'exactly',
    lte: 'at most',
    lt: 'less than'
  };
  
  const fieldText = {
    'donations.total': 'total donations',
    'donations.count': 'donation count',
    'referrals.successful': 'successful referrals',
    'login.streak': 'login streak'
  };
  
  return `Requires ${operatorText[operator]} ${threshold} ${fieldText[field]}`;
});

// Static method to check user achievements
achievementSchema.statics.checkUserAchievements = async function(userId) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const achievements = await this.find({ isActive: true });
    const newAchievements = [];
    
    for (const achievement of achievements) {
      // Check if user already has this achievement
      const hasAchievement = user.achievements.some(a => a.id === achievement.id);
      if (hasAchievement) continue;
      
      // Check if user meets criteria
      const meetsAchievement = this.checkCriteria(user, achievement.criteria);
      
      if (meetsAchievement) {
        // Add achievement to user
        const newAchievement = {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          threshold: achievement.criteria.threshold,
          unlockedAt: new Date()
        };
        
        user.achievements.push(newAchievement);
        newAchievements.push(newAchievement);
        
        // Update achievement statistics
        achievement.statistics.totalUnlocked += 1;
        achievement.statistics.lastUnlockedAt = new Date();
        await achievement.save();
      }
    }
    
    if (newAchievements.length > 0) {
      await user.save();
    }
    
    return newAchievements;
  } catch (error) {
    console.error('Error checking user achievements:', error);
    return [];
  }
};

// Static method to check if user meets achievement criteria
achievementSchema.statics.checkCriteria = function(user, criteria) {
  const { threshold, field, operator } = criteria;
  
  // Get value from user object based on field path
  const getValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };
  
  const userValue = getValue(user, field) || 0;
  
  switch (operator) {
    case 'gte':
      return userValue >= threshold;
    case 'gt':
      return userValue > threshold;
    case 'eq':
      return userValue === threshold;
    case 'lte':
      return userValue <= threshold;
    case 'lt':
      return userValue < threshold;
    default:
      return false;
  }
};

// Static method to get achievement progress for user
achievementSchema.statics.getUserProgress = async function(userId) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const achievements = await this.find({ isActive: true, isVisible: true })
      .sort({ 'criteria.threshold': 1 });
    
    return achievements.map(achievement => {
      const hasUnlocked = user.achievements.some(a => a.id === achievement.id);
      const userValue = this.getUserValue(user, achievement.criteria.field);
      const progress = Math.min(100, Math.round((userValue / achievement.criteria.threshold) * 100));
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rarity: achievement.rarity,
        threshold: achievement.criteria.threshold,
        userValue,
        progress,
        unlocked: hasUnlocked,
        unlockedAt: hasUnlocked ? 
          user.achievements.find(a => a.id === achievement.id)?.unlockedAt : null,
        metadata: achievement.metadata
      };
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    return [];
  }
};

// Helper method to get user value for field
achievementSchema.statics.getUserValue = function(user, field) {
  const getValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };
  
  return getValue(user, field) || 0;
};

// Static method to create default achievements
achievementSchema.statics.createDefaults = async function() {
  const defaultAchievements = [
    {
      id: 'FIRST_DONATION',
      name: 'First Steps',
      description: 'Made your very first donation',
      icon: '🎉',
      category: 'milestone',
      criteria: { threshold: 1, field: 'donations.total' },
      rarity: 'common',
      metadata: { color: '#10b981', animation: 'pulse' }
    },
    {
      id: 'RISING_STAR',
      name: 'Rising Star',
      description: 'Raised $1,000 in total donations',
      icon: '🚀',
      category: 'donation',
      criteria: { threshold: 1000, field: 'donations.total' },
      rarity: 'uncommon',
      metadata: { color: '#3b82f6', animation: 'glow' }
    },
    {
      id: 'DIAMOND_ACHIEVER',
      name: 'Diamond Achiever',
      description: 'Reached $2,000 in total donations',
      icon: '💎',
      category: 'donation',
      criteria: { threshold: 2000, field: 'donations.total' },
      rarity: 'rare',
      metadata: { color: '#8b5cf6', animation: 'glow' }
    },
    {
      id: 'PREMIUM_MEMBER',
      name: 'Premium Member',
      description: 'Achieved $3,000 in total donations',
      icon: '⭐',
      category: 'donation',
      criteria: { threshold: 3000, field: 'donations.total' },
      rarity: 'rare',
      metadata: { color: '#f59e0b', animation: 'pulse' }
    },
    {
      id: 'ELITE_CHAMPION',
      name: 'Elite Champion',
      description: 'Reached the prestigious $5,000 milestone',
      icon: '👑',
      category: 'donation',
      criteria: { threshold: 5000, field: 'donations.total' },
      rarity: 'epic',
      metadata: { color: '#ef4444', animation: 'bounce' }
    },
    {
      id: 'LEGEND_STATUS',
      name: 'Legend Status',
      description: 'Achieved legendary $10,000 in donations',
      icon: '🏆',
      category: 'donation',
      criteria: { threshold: 10000, field: 'donations.total' },
      rarity: 'legendary',
      metadata: { color: '#fbbf24', animation: 'bounce' }
    },
    {
      id: 'REFERRAL_STARTER',
      name: 'Referral Starter',
      description: 'Made your first successful referral',
      icon: '🤝',
      category: 'referral',
      criteria: { threshold: 1, field: 'referrals.successful' },
      rarity: 'common',
      metadata: { color: '#10b981', animation: 'pulse' }
    },
    {
      id: 'REFERRAL_MASTER',
      name: 'Referral Master',
      description: 'Achieved 10 successful referrals',
      icon: '🌟',
      category: 'referral',
      criteria: { threshold: 10, field: 'referrals.successful' },
      rarity: 'epic',
      metadata: { color: '#8b5cf6', animation: 'glow' }
    }
  ];
  
  for (const achv of defaultAchievements) {
    await this.findOneAndUpdate(
      { id: achv.id },
      achv,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Default achievements created/updated');
};

// Indexes for better query performance
achievementSchema.index({ id: 1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ isActive: 1, isVisible: 1 });
achievementSchema.index({ 'criteria.threshold': 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
