// Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'dashboard';
        this.isInitialized = false;
        
        this.initializeApp();
    }

    // Initialize the application
    async initializeApp() {
        this.showLoadingScreen();
        
        try {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components
            this.initializeNavigation();
            this.initializeTheme();
            this.initializeSettings();
            this.initializeNetworkMonitoring();

            // Check authentication and load appropriate view
            await this.initializeAuth();

            this.isInitialized = true;

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        } finally {
            this.hideLoadingScreen();
        }
    }

    // Initialize navigation
    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    // Navigate to a specific page
    navigateToPage(page) {
        if (!this.isInitialized) return;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Show/hide pages
        document.querySelectorAll('.dashboard, .leaderboard').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        const pageElement = document.getElementById(page);
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = page;

            // Load page-specific data
            this.loadPageData(page);
        }
    }

    // Load data for specific page
    async loadPageData(page) {
        try {
            switch (page) {
                case 'dashboard':
                    if (window.dashboardManager) {
                        await window.dashboardManager.loadDashboard();
                    }
                    break;
                    
                case 'leaderboard':
                    if (window.leaderboardManager) {
                        await window.leaderboardManager.loadLeaderboard();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${page} data:`, error);
            this.showNotification(`Failed to load ${page} data`, 'error');
        }
    }

    // Initialize authentication
    async initializeAuth() {
        const token = localStorage.getItem('authToken');
        
        if (token && apiUtils.isAuthenticated()) {
            try {
                // Verify token is still valid
                await authAPI.getProfile();
                
                // Show main app and load dashboard
                this.showMainApp();
                await this.loadPageData('dashboard');
                
            } catch (error) {
                console.error('Token validation failed:', error);
                this.handleAuthFailure();
            }
        } else {
            this.showAuthScreen();
        }
    }

    // Handle authentication failure
    handleAuthFailure() {
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        apiUtils.clearCache();
        
        // Show auth screen
        this.showAuthScreen();
        this.showNotification('Please sign in again', 'warning');
    }

    // Show main application
    showMainApp() {
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
    }

    // Show authentication screen
    showAuthScreen() {
        document.getElementById('authScreen').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
    }

    // Initialize theme system
    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const themeSelect = document.getElementById('themeSelect');
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }

        // Theme toggle button
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.body.className;
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        }

        // Theme select in settings
        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                this.setTheme(themeSelect.value);
            });
        }
    }

    // Set theme
    setTheme(theme) {
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }

        document.body.className = theme;
        localStorage.setItem('theme', theme);

        // Update theme icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Update theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && theme !== 'auto') {
            themeSelect.value = theme;
        }
    }

    // Initialize settings modal
    initializeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const cancelSettings = document.getElementById('cancelSettings');
        const saveSettings = document.getElementById('saveSettings');

        // Close modal handlers
        [closeSettings, cancelSettings].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.closeSettings();
                });
            }
        });

        // Save settings
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Close on backdrop click
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }

        // Load current settings
        this.loadSettings();
    }

    // Load current settings into modal
    loadSettings() {
        // Theme setting
        const themeSelect = document.getElementById('themeSelect');
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }

        // Notification settings
        const emailNotifications = document.getElementById('emailNotifications');
        const achievementNotifications = document.getElementById('achievementNotifications');
        
        if (emailNotifications) {
            emailNotifications.checked = localStorage.getItem('emailNotifications') !== 'false';
        }
        
        if (achievementNotifications) {
            achievementNotifications.checked = localStorage.getItem('achievementNotifications') !== 'false';
        }
    }

    // Save settings
    saveSettings() {
        try {
            // Save theme
            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) {
                this.setTheme(themeSelect.value);
            }

            // Save notification preferences
            const emailNotifications = document.getElementById('emailNotifications');
            const achievementNotifications = document.getElementById('achievementNotifications');
            
            if (emailNotifications) {
                localStorage.setItem('emailNotifications', emailNotifications.checked);
            }
            
            if (achievementNotifications) {
                localStorage.setItem('achievementNotifications', achievementNotifications.checked);
            }

            this.closeSettings();
            this.showNotification('Settings saved successfully', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    // Close settings modal
    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.remove('active');
        }
    }

    // Initialize network monitoring
    initializeNetworkMonitoring() {
        if (window.networkMonitor) {
            networkMonitor.onStatusChange((status) => {
                if (status === 'offline') {
                    this.showNotification('You are offline. Some features may not work.', 'warning', 0);
                } else {
                    this.showNotification('You are back online!', 'success');
                    // Refresh current page data
                    this.refreshCurrentPage();
                }
            });
        }
    }

    // Refresh current page data
    async refreshCurrentPage() {
        if (this.currentPage && this.isInitialized) {
            await this.loadPageData(this.currentPage);
        }
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500); // Small delay for smoother transition
        }
    }

    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
        if (window.notificationManager) {
            window.notificationManager.show(message, type, duration);
        }
    }

    // Show error
    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Error Handler
class GlobalErrorHandler {
    constructor() {
        this.setupErrorHandlers();
    }

    setupErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Check if it's an authentication error
            if (event.reason && event.reason.status === 401) {
                this.handleAuthError();
            } else {
                this.showError('An unexpected error occurred');
            }
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred');
        });
    }

    handleAuthError() {
        if (window.appController) {
            window.appController.handleAuthFailure();
        }
    }

    showError(message) {
        if (window.appController) {
            window.appController.showError(message);
        }
    }
}

// Keyboard shortcuts
class KeyboardShortcuts {
    constructor() {
        this.setupShortcuts();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Alt + D: Dashboard
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                if (window.appController) {
                    window.appController.navigateToPage('dashboard');
                }
            }

            // Alt + L: Leaderboard
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                if (window.appController) {
                    window.appController.navigateToPage('leaderboard');
                }
            }

            // Alt + S: Settings
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal) {
                    settingsModal.classList.add('active');
                }
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
            }
        });
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            apiCalls: 0,
            errors: 0
        };
        
        this.startTime = performance.now();
        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now() - this.startTime;
            console.log(`Page loaded in ${this.metrics.loadTime.toFixed(2)}ms`);
        });

        // Monitor API calls (intercept fetch)
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.metrics.apiCalls++;
            const start = performance.now();
            
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - start;
                console.log(`API call to ${args[0]} took ${duration.toFixed(2)}ms`);
                return response;
            } catch (error) {
                this.metrics.errors++;
                throw error;
            }
        };
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// Application State Manager
class StateManager {
    constructor() {
        this.state = {
            user: null,
            stats: null,
            achievements: null,
            leaderboard: null,
            lastUpdate: null
        };
        
        this.subscribers = [];
    }

    // Update state
    setState(key, value) {
        this.state[key] = value;
        this.state.lastUpdate = new Date().toISOString();
        this.notifySubscribers(key, value);
    }

    // Get state
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    // Notify subscribers
    notifySubscribers(key, value) {
        this.subscribers.forEach(callback => {
            try {
                callback(key, value, this.state);
            } catch (error) {
                console.error('State subscriber error:', error);
            }
        });
    }

    // Clear state
    clearState() {
        this.state = {
            user: null,
            stats: null,
            achievements: null,
            leaderboard: null,
            lastUpdate: null
        };
        this.notifySubscribers('clear', null);
    }
}

// Initialize application when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Create global instances
    window.appController = new AppController();
    window.errorHandler = new GlobalErrorHandler();
    window.keyboardShortcuts = new KeyboardShortcuts();
    window.performanceMonitor = new PerformanceMonitor();
    window.stateManager = new StateManager();

    // Development helpers
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.devTools = {
            getMetrics: () => window.performanceMonitor.getMetrics(),
            getState: () => window.stateManager.getState(),
            clearCache: () => apiUtils.clearCache(),
            simulate: {
                offline: () => window.dispatchEvent(new Event('offline')),
                online: () => window.dispatchEvent(new Event('online')),
                error: (message) => window.appController.showError(message)
            }
        };
        
        console.log('🚀 Intern Portal loaded successfully!');
        console.log('💡 Development tools available in window.devTools');
    }
});
