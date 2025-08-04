// Dashboard Manager
class DashboardManager {
    constructor() {
        this.stats = {
            totalDonations: 0,
            weeklyDonations: 0,
            currentRank: 999,
            totalInterns: 0,
            nextReward: 100,
            referralCode: 'LOADING...'
        };
        
        this.achievements = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    // Initialize DOM elements
    initializeElements() {
        // Stats elements
        this.internNameEl = document.getElementById('internName');
        this.referralCodeEl = document.getElementById('referralCode');
        this.totalDonationsEl = document.getElementById('totalDonations');
        this.weeklyProgressEl = document.getElementById('weeklyProgress');
        this.currentRankEl = document.getElementById('currentRank');
        this.totalInternsEl = document.getElementById('totalInterns');
        this.nextRewardAmountEl = document.getElementById('nextRewardAmount');
        this.nextRewardTextEl = document.getElementById('nextRewardText');

        // Form elements
        this.donationForm = document.getElementById('donationForm');
        this.donationAmountInput = document.getElementById('donationAmount');
        this.donationSourceSelect = document.getElementById('donationSource');
        this.donationNotesInput = document.getElementById('donationNotes');
        this.updateBtnText = document.getElementById('updateBtnText');
        this.updateBtnLoader = document.getElementById('updateBtnLoader');
        this.donationError = document.getElementById('donationError');

        // Achievements
        this.achievementsGrid = document.getElementById('achievementsGrid');
    }

    // Attach event listeners
    attachEventListeners() {
        this.donationForm.addEventListener('submit', (e) => this.handleDonationSubmit(e));
        
        // Real-time updates
        if (window.realTimeUpdates) {
            realTimeUpdates.subscribe('donation', (data) => this.handleRealtimeUpdate(data));
            realTimeUpdates.subscribe('achievement', (data) => this.handleAchievementUpdate(data));
        }
    }

    // Load dashboard data
    async loadDashboard() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            // Load all dashboard data in parallel
            const [statsData, achievementsData] = await Promise.all([
                this.loadStats(),
                this.loadAchievements()
            ]);

            this.updateUI();
            this.updateUserName();
            
            // Connect real-time updates
            if (window.realTimeUpdates && !realTimeUpdates.isConnected) {
                realTimeUpdates.connect();
            }

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Load statistics
    async loadStats() {
        try {
            const data = await cachedAPI.getStats();
            
            this.stats = {
                totalDonations: data.totalDonations || 0,
                weeklyDonations: data.weeklyDonations || 0,
                currentRank: data.currentRank || 999,
                totalInterns: data.totalInterns || 0,
                nextReward: data.nextReward || 100,
                referralCode: data.referralCode || 'ERROR'
            };

            return data;
        } catch (error) {
            console.error('Failed to load stats:', error);
            throw error;
        }
    }

    // Load achievements
    async loadAchievements() {
        try {
            const data = await dashboardAPI.getAchievements();
            this.achievements = data.achievements || [];
            return data;
        } catch (error) {
            console.error('Failed to load achievements:', error);
            throw error;
        }
    }

    // Update UI with current data
    updateUI() {
        this.updateStatsDisplay();
        this.updateAchievementsDisplay();
    }

    // Update statistics display
    updateStatsDisplay() {
        // Update referral code
        this.referralCodeEl.textContent = this.stats.referralCode;

        // Update total donations
        this.totalDonationsEl.textContent = this.formatCurrency(this.stats.totalDonations);

        // Update weekly progress
        const weeklyChange = this.stats.weeklyDonations;
        this.weeklyProgressEl.textContent = `+${this.formatCurrency(weeklyChange)} this week`;

        // Update rank
        this.currentRankEl.textContent = `#${this.stats.currentRank}`;
        this.totalInternsEl.textContent = `of ${this.stats.totalInterns} interns`;

        // Update next reward
        this.nextRewardAmountEl.textContent = this.formatCurrency(this.stats.nextReward);
        
        const remaining = this.stats.nextReward - this.stats.totalDonations;
        if (remaining > 0) {
            this.nextRewardTextEl.textContent = `${this.formatCurrency(remaining)} to unlock next achievement`;
        } else {
            this.nextRewardTextEl.textContent = 'Achievement unlocked!';
        }
    }

    // Update achievements display
    updateAchievementsDisplay() {
        if (!this.achievementsGrid) return;

        this.achievementsGrid.innerHTML = '';

        if (this.achievements.length === 0) {
            this.achievementsGrid.innerHTML = `
                <div class="achievement-card">
                    <div class="achievement-header">
                        <div class="achievement-icon">🎯</div>
                        <div class="achievement-title">No achievements yet</div>
                    </div>
                    <div class="achievement-description">
                        Start making donations to unlock your first achievement!
                    </div>
                </div>
            `;
            return;
        }

        this.achievements.forEach(achievement => {
            const achievementCard = this.createAchievementCard(achievement);
            this.achievementsGrid.appendChild(achievementCard);
        });
    }

    // Create achievement card element
    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : ''}`;

        const progress = achievement.unlocked ? 100 : (achievement.progress || 0);
        const progressText = achievement.unlocked 
            ? 'Completed!' 
            : `${achievement.currentValue || 0} / ${achievement.targetValue || 0}`;

        card.innerHTML = `
            <div class="achievement-header">
                <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                <div class="achievement-title">${achievement.title}</div>
            </div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progressText}</div>
            </div>
            <div class="achievement-reward">Reward: ${achievement.reward}</div>
        `;

        return card;
    }

    // Handle donation form submission
    async handleDonationSubmit(e) {
        e.preventDefault();

        if (!this.validateDonationForm()) {
            return;
        }

        this.setDonationLoading(true);
        this.clearDonationError();

        try {
            const donationData = {
                amount: parseFloat(this.donationAmountInput.value),
                source: this.donationSourceSelect.value,
                notes: this.donationNotesInput.value.trim() || undefined
            };

            const response = await dashboardAPI.addDonation(donationData);

            // Update local data immediately for better UX
            if (response.data && response.data.user) {
                this.data.totalDonations = response.data.user.totalDonations || (this.data.totalDonations + donationData.amount);
                if (response.data.user.newRank) {
                    this.data.rank = response.data.user.newRank;
                }
            } else {
                // Fallback for mock data
                this.data.totalDonations += donationData.amount;
            }

            // Show success notification
            this.showNotification(
                `Donation of ${this.formatCurrency(donationData.amount)} added successfully!`,
                'success'
            );

            // Show achievement notifications if any
            if (response.data && response.data.newAchievements && response.data.newAchievements.length > 0) {
                response.data.newAchievements.forEach(achievement => {
                    this.showNotification(
                        `🎉 Achievement Unlocked: ${achievement.name} ${achievement.icon}`,
                        'achievement'
                    );
                });
            }

            // Reset form
            this.donationForm.reset();

            // Update UI immediately with new data
            this.updateUI();

            // Refresh dashboard data in background
            setTimeout(() => this.refreshData(), 1000);

        } catch (error) {
            console.error('Donation submission error:', error);
            this.showDonationError(apiUtils.formatError(error));
        } finally {
            this.setDonationLoading(false);
        }
    }

    // Validate donation form
    validateDonationForm() {
        const amount = parseFloat(this.donationAmountInput.value);

        if (!amount || amount <= 0) {
            this.showDonationError('Please enter a valid donation amount');
            return false;
        }

        if (amount > 100000) {
            this.showDonationError('Donation amount cannot exceed $100,000');
            return false;
        }

        return true;
    }

    // Set donation form loading state
    setDonationLoading(loading) {
        const submitBtn = this.donationForm.querySelector('button[type="submit"]');
        submitBtn.disabled = loading;

        if (loading) {
            this.updateBtnText.style.display = 'none';
            this.updateBtnLoader.classList.add('active');
        } else {
            this.updateBtnText.style.display = 'inline';
            this.updateBtnLoader.classList.remove('active');
        }
    }

    // Show donation error
    showDonationError(message) {
        this.donationError.textContent = message;
        this.donationError.classList.add('active');
    }

    // Clear donation error
    clearDonationError() {
        this.donationError.classList.remove('active');
    }

    // Update user name display
    updateUserName() {
        const user = window.authManager?.getCurrentUser();
        if (user && this.internNameEl) {
            this.internNameEl.textContent = user.name || 'Intern';
        }
    }

    // Handle real-time updates
    handleRealtimeUpdate(data) {
        if (data.type === 'new_donation') {
            this.showNotification(data.message, 'info');
            // Refresh stats after a short delay
            setTimeout(() => this.refreshStats(), 2000);
        }
    }

    // Handle achievement updates
    handleAchievementUpdate(data) {
        if (data.type === 'achievement_unlocked') {
            this.showNotification(data.message, 'success');
            // Refresh achievements
            setTimeout(() => this.refreshAchievements(), 1000);
        }
    }

    // Refresh dashboard data
    async refreshData() {
        try {
            // Clear cache to force fresh data
            apiUtils.clearCache();
            
            // Reload data
            await Promise.all([
                this.loadStats(),
                this.loadAchievements()
            ]);

            this.updateUI();
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }

    // Refresh only stats
    async refreshStats() {
        try {
            await this.loadStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    }

    // Refresh only achievements
    async refreshAchievements() {
        try {
            await this.loadAchievements();
            this.updateAchievementsDisplay();
        } catch (error) {
            console.error('Failed to refresh achievements:', error);
        }
    }

    // Show loading state
    showLoadingState() {
        // Show loading in stats
        this.referralCodeEl.textContent = 'Loading...';
        this.totalDonationsEl.textContent = '$0';
        this.currentRankEl.textContent = '#---';
    }

    // Hide loading state
    hideLoadingState() {
        // Loading state will be replaced by actual data
    }

    // Utility: Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        }
    }

    // Show error
    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Leaderboard Manager
class LeaderboardManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentPeriod = 'all';
        this.currentCategory = 'donations';
        this.leaderboardData = [];
        this.userRank = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    // Initialize DOM elements
    initializeElements() {
        this.leaderboardBody = document.getElementById('leaderboardBody');
        this.leaderboardStats = document.getElementById('leaderboardStats');
        this.periodFilter = document.getElementById('periodFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.refreshBtn = document.getElementById('refreshLeaderboard');
        this.leaderboardPagination = document.getElementById('leaderboardPagination');
    }

    // Attach event listeners
    attachEventListeners() {
        this.periodFilter.addEventListener('change', () => this.handleFilterChange());
        this.categoryFilter.addEventListener('change', () => this.handleFilterChange());
        this.refreshBtn.addEventListener('click', () => this.refreshLeaderboard());

        // Real-time updates
        if (window.realTimeUpdates) {
            realTimeUpdates.subscribe('leaderboard', () => this.handleLeaderboardUpdate());
        }
    }

    // Load leaderboard data
    async loadLeaderboard() {
        try {
            this.showLeaderboardLoading();

            const options = {
                period: this.currentPeriod,
                category: this.currentCategory,
                page: this.currentPage,
                limit: this.itemsPerPage
            };

            const [leaderboardResponse, userRankResponse] = await Promise.all([
                cachedAPI.getLeaderboard(options),
                leaderboardAPI.getUserRank(this.currentPeriod, this.currentCategory)
            ]);

            this.leaderboardData = leaderboardResponse.leaderboard || [];
            this.userRank = userRankResponse.rank || null;

            this.updateLeaderboardDisplay();
            this.updateStatsDisplay(leaderboardResponse);

        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showLeaderboardError('Failed to load leaderboard data');
        }
    }

    // Update leaderboard display
    updateLeaderboardDisplay() {
        if (!this.leaderboardBody) return;

        this.leaderboardBody.innerHTML = '';

        if (this.leaderboardData.length === 0) {
            this.leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No data available for the selected filters
                    </td>
                </tr>
            `;
            return;
        }

        const currentUser = window.authManager?.getCurrentUser();
        const currentUserEmail = currentUser?.email;

        this.leaderboardData.forEach((entry, index) => {
            const row = this.createLeaderboardRow(entry, index, currentUserEmail);
            this.leaderboardBody.appendChild(row);
        });
    }

    // Create leaderboard row
    createLeaderboardRow(entry, index, currentUserEmail) {
        const row = document.createElement('tr');
        
        // Highlight current user's row
        if (entry.email === currentUserEmail) {
            row.classList.add('current-user');
        }

        const rank = ((this.currentPage - 1) * this.itemsPerPage) + index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';

        // Get user initials
        const initials = entry.name 
            ? entry.name.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U';

        // Format achievements
        const achievementBadges = (entry.achievements || [])
            .slice(0, 3) // Show only first 3
            .map(achievement => `
                <span class="achievement-badge" title="${achievement.title}">
                    ${achievement.icon || '🏆'}
                </span>
            `).join('');

        const moreAchievements = entry.achievements && entry.achievements.length > 3 
            ? `<span class="achievement-badge">+${entry.achievements.length - 3}</span>`
            : '';

        row.innerHTML = `
            <td class="rank-cell ${rankClass}">${rank}</td>
            <td>
                <div class="intern-info">
                    <div class="intern-avatar">${initials}</div>
                    <div class="intern-details">
                        <div class="intern-name">${entry.name}</div>
                        <div class="intern-email">${entry.email}</div>
                    </div>
                </div>
            </td>
            <td>${this.formatCurrency(entry.totalDonations || 0)}</td>
            <td>
                <div class="achievement-badges">
                    ${achievementBadges}${moreAchievements}
                </div>
            </td>
        `;

        return row;
    }

    // Update stats display
    updateStatsDisplay(data) {
        if (!this.leaderboardStats) return;

        const totalParticipants = data.totalCount || 0;
        const averageDonation = data.averageDonation || 0;

        this.leaderboardStats.innerHTML = `
            ${totalParticipants} participants • 
            Avg: ${this.formatCurrency(averageDonation)}
            ${this.userRank ? ` • You're ranked #${this.userRank}` : ''}
        `;
    }

    // Handle filter changes
    async handleFilterChange() {
        this.currentPeriod = this.periodFilter.value;
        this.currentCategory = this.categoryFilter.value;
        this.currentPage = 1; // Reset to first page

        await this.loadLeaderboard();
    }

    // Refresh leaderboard
    async refreshLeaderboard() {
        // Clear cache for fresh data
        apiUtils.clearCache();
        await this.loadLeaderboard();
        
        this.showNotification('Leaderboard refreshed', 'success');
    }

    // Handle real-time leaderboard updates
    handleLeaderboardUpdate() {
        // Refresh after a short delay
        setTimeout(() => this.refreshLeaderboard(), 2000);
    }

    // Show loading state
    showLeaderboardLoading() {
        if (this.leaderboardBody) {
            this.leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        <div class="spinner"></div>
                        <div style="margin-top: 1rem; color: var(--text-secondary);">Loading leaderboard...</div>
                    </td>
                </tr>
            `;
        }
    }

    // Show error state
    showLeaderboardError(message) {
        if (this.leaderboardBody) {
            this.leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: var(--error-color);">
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    // Utility: Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        }
    }
}

// Utility functions for dashboard
window.copyReferralCode = function() {
    const referralCode = document.getElementById('referralCode').textContent;
    const copyButton = document.querySelector('#referralCard .stat-action');
    
    if (referralCode && referralCode !== 'LOADING...' && referralCode !== 'ERROR') {
        navigator.clipboard.writeText(referralCode).then(() => {
            copyButton.innerHTML = '<span>✓ Copied!</span>';
            setTimeout(() => {
                copyButton.innerHTML = '<span id="copyButtonText">Click to copy</span>';
            }, 2000);
            
            if (window.notificationManager) {
                window.notificationManager.show('Referral code copied to clipboard!', 'success');
            }
        }).catch(() => {
            if (window.notificationManager) {
                window.notificationManager.show('Failed to copy referral code', 'error');
            }
        });
    }
};

// Initialize dashboard and leaderboard managers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    window.leaderboardManager = new LeaderboardManager();
});
