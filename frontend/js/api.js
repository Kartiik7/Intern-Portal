// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Development fallback - use mock data if backend is not available
const USE_MOCK_DATA = false; // Set to true if you want to use mock data only

// Auto-detect if backend is available
let BACKEND_AVAILABLE = false;

// API utility class for handling HTTP requests
class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authorization token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Handle API response
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    }

    // Generic request method with mock data fallback
    async request(endpoint, options = {}) {
        // If explicitly using mock data, return mock responses
        if (USE_MOCK_DATA) {
            return this.getMockData(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            BACKEND_AVAILABLE = true;
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request failed:', error);
            BACKEND_AVAILABLE = false;
            
            // Show user-friendly message for first failed request
            if (!document.querySelector('.backend-offline-notice')) {
                this.showBackendOfflineNotice();
            }
            
            console.log('Falling back to mock data...');
            return this.getMockData(endpoint, options);
        }
    }

    // Show backend offline notice
    showBackendOfflineNotice() {
        const notice = document.createElement('div');
        notice.className = 'backend-offline-notice';
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f59e0b;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 300px;
        `;
        notice.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>⚠️</span>
                <div>
                    <strong>Backend Offline</strong><br>
                    Using demo data. Start backend for full functionality.
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: auto;">×</button>
            </div>
        `;
        document.body.appendChild(notice);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 10000);
    }

    // Mock data for development
    getMockData(endpoint, options) {
        const method = options.method || 'GET';
        
        // Mock responses based on endpoint
        if (endpoint === '/auth/register' && method === 'POST') {
            return Promise.resolve({
                success: true,
                message: 'Registration successful',
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: 'user_' + Date.now(),
                    name: 'Demo User',
                    email: 'demo@example.com',
                    donationAmount: 0,
                    rank: 25
                }
            });
        }
        
        if (endpoint === '/auth/login' && method === 'POST') {
            return Promise.resolve({
                success: true,
                message: 'Login successful',
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: 'user_123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    donationAmount: 1500,
                    rank: 5
                }
            });
        }
        
        if (endpoint === '/auth/profile') {
            return Promise.resolve({
                success: true,
                data: {
                    id: 'user_123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    donationAmount: 1500,
                    rank: 5,
                    joinDate: '2024-01-15',
                    totalAchievements: 3
                }
            });
        }
        
        if (endpoint === '/dashboard/stats') {
            // Get current donation amount from localStorage for persistence
            const currentDonations = localStorage.getItem('mockDonationAmount') || '1500';
            const totalDonations = parseInt(currentDonations);
            
            return Promise.resolve({
                success: true,
                data: {
                    totalDonations: totalDonations,
                    rank: Math.max(1, 6 - Math.floor(totalDonations / 1000)),
                    totalInterns: 50,
                    achievements: [
                        { 
                            id: '1', 
                            name: 'First Donation', 
                            description: 'Made your first donation',
                            unlocked: true, 
                            progress: 100,
                            icon: '🎉',
                            reward: '$50 bonus'
                        },
                        { 
                            id: '2', 
                            name: 'Rising Star', 
                            description: 'Reached $1,000 in donations',
                            unlocked: totalDonations >= 1000, 
                            progress: Math.min(100, (totalDonations / 1000) * 100),
                            icon: '🚀',
                            reward: 'Special badge'
                        },
                        { 
                            id: '3', 
                            name: 'Diamond Achiever', 
                            description: 'Reach $2,000 in donations',
                            unlocked: totalDonations >= 2000, 
                            progress: Math.min(100, (totalDonations / 2000) * 100),
                            icon: '💎',
                            reward: 'Premium features'
                        },
                        { 
                            id: '4', 
                            name: 'Elite Champion', 
                            description: 'Hit the $5,000 milestone',
                            unlocked: totalDonations >= 5000, 
                            progress: Math.min(100, (totalDonations / 5000) * 100),
                            icon: '👑',
                            reward: 'VIP status'
                        }
                    ],
                    referralCode: 'USER2024',
                    referralCount: 3,
                    weeklyProgress: {
                        current: Math.min(500, totalDonations * 0.2),
                        target: 500
                    },
                    monthlyGoal: {
                        current: Math.min(2000, totalDonations * 0.8),
                        target: 2000
                    }
                }
            });
        }
        
        if (endpoint === '/dashboard/achievements') {
            return Promise.resolve({
                success: true,
                data: [
                    { 
                        id: '1', 
                        name: 'First Donation', 
                        description: 'Made your first donation',
                        unlocked: true, 
                        progress: 100,
                        icon: '🎉',
                        unlockedDate: '2024-01-20'
                    },
                    { 
                        id: '2', 
                        name: 'Rising Star', 
                        description: 'Reached $1,000 in donations',
                        unlocked: true, 
                        progress: 100,
                        icon: '🚀',
                        unlockedDate: '2024-02-15'
                    },
                    { 
                        id: '3', 
                        name: 'Diamond Achiever', 
                        description: 'Reach $2,000 in donations',
                        unlocked: false, 
                        progress: 75,
                        icon: '💎'
                    }
                ]
            });
        }
        
        if (endpoint.includes('/dashboard/referral')) {
            return Promise.resolve({
                success: true,
                data: {
                    code: 'JOHN2024',
                    referralCount: 3,
                    totalEarnings: 150,
                    recentReferrals: [
                        { name: 'Alice', date: '2024-08-01', amount: 50 },
                        { name: 'Bob', date: '2024-07-28', amount: 50 },
                        { name: 'Carol', date: '2024-07-25', amount: 50 }
                    ]
                }
            });
        }
        
        if (endpoint === '/leaderboard') {
            return Promise.resolve({
                success: true,
                data: [
                    { rank: 1, name: 'Alice Johnson', donationAmount: 5000, achievements: 8, trend: 'up' },
                    { rank: 2, name: 'Bob Smith', donationAmount: 3500, achievements: 6, trend: 'stable' },
                    { rank: 3, name: 'Carol Brown', donationAmount: 2800, achievements: 5, trend: 'down' },
                    { rank: 4, name: 'David Wilson', donationAmount: 2200, achievements: 4, trend: 'up' },
                    { rank: 5, name: 'John Doe', donationAmount: 1500, achievements: 3, trend: 'up' },
                    { rank: 6, name: 'Emma Davis', donationAmount: 1200, achievements: 3, trend: 'stable' },
                    { rank: 7, name: 'Frank Miller', donationAmount: 1000, achievements: 2, trend: 'down' },
                    { rank: 8, name: 'Grace Lee', donationAmount: 850, achievements: 2, trend: 'up' },
                    { rank: 9, name: 'Henry Chen', donationAmount: 700, achievements: 1, trend: 'stable' },
                    { rank: 10, name: 'Ivy Taylor', donationAmount: 500, achievements: 1, trend: 'up' }
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 3,
                    totalUsers: 50
                }
            });
        }
        
        if (endpoint.includes('/dashboard/update-donations') && method === 'PUT') {
            const amount = JSON.parse(options.body).amount;
            return Promise.resolve({
                success: true,
                message: 'Donation updated successfully',
                data: {
                    donation: {
                        id: 'donation_' + Date.now(),
                        amount: amount,
                        formattedAmount: '$' + amount.toLocaleString(),
                        source: JSON.parse(options.body).source || 'direct',
                        createdAt: new Date().toISOString()
                    },
                    user: {
                        totalDonations: 1500 + amount,
                        newRank: 4,
                        rankChange: -1
                    },
                    newAchievements: amount >= 1000 ? [
                        { name: 'Big Contributor', icon: '💰', message: 'Donated over $1000!' }
                    ] : []
                }
            });
        }
        
        if (endpoint.includes('/dashboard/donations') && method === 'POST') {
            const amount = JSON.parse(options.body).amount;
            return Promise.resolve({
                success: true,
                message: 'Donation added successfully',
                data: {
                    id: 'donation_' + Date.now(),
                    amount: amount,
                    date: new Date().toISOString(),
                    newTotal: 1500 + amount
                }
            });
        }
        
        // Default mock response
        return Promise.resolve({
            success: true,
            message: 'Mock data response',
            data: {}
        });
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create global API instance
const api = new ApiClient();

// Auth API methods
const authAPI = {
    // Login user
    async login(email, password) {
        const data = await api.post('/auth/login', { email, password });
        if (data.token) {
            api.setToken(data.token);
        }
        return data;
    },

    // Register user
    async register(name, email, password) {
        const data = await api.post('/auth/register', { name, email, password });
        if (data.token) {
            api.setToken(data.token);
        }
        return data;
    },

    // Logout user
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            api.setToken(null);
        }
    },

    // Get current user profile
    async getProfile() {
        return api.get('/auth/profile');
    },

    // Update user profile
    async updateProfile(userData) {
        return api.put('/auth/profile', userData);
    }
};

// Dashboard API methods
const dashboardAPI = {
    // Get dashboard stats
    async getStats() {
        return api.get('/dashboard/stats');
    },

    // Add new donation
    async addDonation(donationData) {
        return api.put('/dashboard/update-donations', donationData);
    },

    // Get donations history
    async getDonations(page = 1, limit = 10) {
        return api.get(`/dashboard/donations?page=${page}&limit=${limit}`);
    },

    // Get achievements
    async getAchievements() {
        return api.get('/dashboard/achievements');
    },

    // Get referral code
    async getReferralCode() {
        return api.get('/dashboard/referral-code');
    },

    // Generate new referral code
    async generateReferralCode() {
        return api.post('/dashboard/referral-code');
    },

    // Get referral stats
    async getReferralStats() {
        return api.get('/dashboard/referral-stats');
    }
};

// Leaderboard API methods
const leaderboardAPI = {
    // Get leaderboard data
    async getLeaderboard(options = {}) {
        const params = new URLSearchParams();
        
        if (options.period) params.append('period', options.period);
        if (options.category) params.append('category', options.category);
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);
        
        const queryString = params.toString();
        return api.get(`/leaderboard${queryString ? `?${queryString}` : ''}`);
    },

    // Get user's rank
    async getUserRank(period = 'all', category = 'donations') {
        return api.get(`/leaderboard/rank?period=${period}&category=${category}`);
    },

    // Get top achievers
    async getTopAchievers(limit = 5) {
        return api.get(`/leaderboard/top-achievers?limit=${limit}`);
    }
};

// Error handling utility
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Retry utility for failed requests
async function withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Don't retry on authentication errors
            if (error.status === 401 || error.status === 403) {
                throw error;
            }
            
            // Wait before retrying
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
    
    throw lastError;
}

// Network status monitoring
class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.callbacks = [];
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyCallbacks('online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyCallbacks('offline');
        });
    }
    
    onStatusChange(callback) {
        this.callbacks.push(callback);
    }
    
    notifyCallbacks(status) {
        this.callbacks.forEach(callback => callback(status));
    }
}

// Create global network monitor
const networkMonitor = new NetworkMonitor();

// Cache utility for API responses
class APICache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }
    
    set(key, data, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }
    
    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    clear() {
        this.cache.clear();
    }
    
    delete(key) {
        this.cache.delete(key);
    }
}

// Create global cache instance
const apiCache = new APICache();

// Enhanced API methods with caching
const cachedAPI = {
    async getStats(useCache = true) {
        const cacheKey = 'dashboard-stats';
        
        if (useCache) {
            const cached = apiCache.get(cacheKey);
            if (cached) return cached;
        }
        
        const data = await dashboardAPI.getStats();
        apiCache.set(cacheKey, data, 2 * 60 * 1000); // Cache for 2 minutes
        return data;
    },
    
    async getLeaderboard(options = {}, useCache = true) {
        const cacheKey = `leaderboard-${JSON.stringify(options)}`;
        
        if (useCache) {
            const cached = apiCache.get(cacheKey);
            if (cached) return cached;
        }
        
        const data = await leaderboardAPI.getLeaderboard(options);
        apiCache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
        return data;
    }
};

// Real-time updates simulation
class RealTimeUpdates {
    constructor() {
        this.listeners = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    // Simulate WebSocket connection
    connect() {
        if (this.isConnected) return;
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Simulate periodic updates
        this.interval = setInterval(() => {
            this.simulateUpdates();
        }, 30000); // Every 30 seconds
        
        console.log('Real-time updates connected');
    }
    
    disconnect() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.isConnected = false;
        console.log('Real-time updates disconnected');
    }
    
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    unsubscribe(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
    
    async simulateUpdates() {
        try {
            // Randomly simulate different types of updates
            const updateTypes = ['donation', 'achievement', 'leaderboard'];
            const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
            
            switch (randomType) {
                case 'donation':
                    // Simulate a new donation
                    if (Math.random() < 0.3) { // 30% chance
                        this.emit('donation', {
                            type: 'new_donation',
                            message: 'A new donation was recorded!',
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;
                    
                case 'achievement':
                    // Simulate achievement unlock
                    if (Math.random() < 0.1) { // 10% chance
                        this.emit('achievement', {
                            type: 'achievement_unlocked',
                            message: 'New achievement unlocked!',
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;
                    
                case 'leaderboard':
                    // Simulate leaderboard change
                    if (Math.random() < 0.2) { // 20% chance
                        this.emit('leaderboard', {
                            type: 'rank_change',
                            message: 'Leaderboard positions updated!',
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error in real-time updates:', error);
        }
    }
}

// Create global real-time updates instance
const realTimeUpdates = new RealTimeUpdates();

// Utility functions for API handling
const apiUtils = {
    // Format error messages for display
    formatError(error) {
        if (error.message) {
            return error.message;
        }
        
        if (typeof error === 'string') {
            return error;
        }
        
        return 'An unexpected error occurred. Please try again.';
    },
    
    // Check if error is due to network issues
    isNetworkError(error) {
        return error.name === 'TypeError' && error.message.includes('fetch');
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!api.token;
    },
    
    // Clear all cached data (useful on logout)
    clearCache() {
        apiCache.clear();
    },
    
    // Refresh authentication token
    async refreshToken() {
        try {
            const response = await api.post('/auth/refresh');
            if (response.token) {
                api.setToken(response.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
        return false;
    }
};

// Export API modules for use in other files
window.api = api;
window.authAPI = authAPI;
window.dashboardAPI = dashboardAPI;
window.leaderboardAPI = leaderboardAPI;
window.cachedAPI = cachedAPI;
window.apiUtils = apiUtils;
window.realTimeUpdates = realTimeUpdates;
window.networkMonitor = networkMonitor;
