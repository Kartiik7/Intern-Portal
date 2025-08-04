// Authentication module
class AuthManager {
    constructor() {
        this.isLogin = true;
        this.initializeElements();
        this.attachEventListeners();
        this.checkAuthStatus();
    }

    // Initialize DOM elements
    initializeElements() {
        this.authScreen = document.getElementById('authScreen');
        this.mainApp = document.getElementById('mainApp');
        this.authForm = document.getElementById('authForm');
        this.authBtn = document.getElementById('authBtn');
        this.authBtnText = document.getElementById('authBtnText');
        this.authBtnLoader = document.getElementById('authBtnLoader');
        this.toggleAuth = document.getElementById('toggleAuth');
        this.authSubtitle = document.getElementById('authSubtitle');
        this.toggleText = document.getElementById('toggleText');
        this.nameGroup = document.getElementById('nameGroup');
        this.formError = document.getElementById('formError');

        // Input fields
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.nameInput = document.getElementById('name');

        // Error elements
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');
        this.nameError = document.getElementById('nameError');
    }

    // Attach event listeners
    attachEventListeners() {
        this.authForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.toggleAuth.addEventListener('click', () => this.toggleAuthMode());
        
        // Input validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.nameInput.addEventListener('blur', () => this.validateName());
        
        // Clear errors on input
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
        this.nameInput.addEventListener('input', () => this.clearError('name'));
    }

    // Check if user is already authenticated
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token && apiUtils.isAuthenticated()) {
            this.showMainApp();
        } else {
            this.showAuthScreen();
        }
    }

    // Toggle between login and register modes
    toggleAuthMode() {
        this.isLogin = !this.isLogin;
        this.updateAuthUI();
        this.clearAllErrors();
        this.authForm.reset();
    }

    // Update UI based on auth mode
    updateAuthUI() {
        if (this.isLogin) {
            this.authSubtitle.textContent = 'Sign in to your dashboard';
            this.authBtnText.textContent = 'Sign In';
            this.toggleText.textContent = "Don't have an account?";
            this.toggleAuth.textContent = 'Sign up';
            this.nameGroup.style.display = 'none';
            this.nameInput.removeAttribute('required');
        } else {
            this.authSubtitle.textContent = 'Create your intern account';
            this.authBtnText.textContent = 'Sign Up';
            this.toggleText.textContent = 'Already have an account?';
            this.toggleAuth.textContent = 'Sign in';
            this.nameGroup.style.display = 'block';
            this.nameInput.setAttribute('required', '');
        }
    }

    // Handle form submission
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        this.setLoading(true);
        this.clearFormError();

        try {
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value;
            
            let response;
            
            if (this.isLogin) {
                response = await authAPI.login(email, password);
                this.showNotification('Welcome back!', 'success');
            } else {
                const name = this.nameInput.value.trim();
                response = await authAPI.register(name, email, password);
                this.showNotification('Account created successfully!', 'success');
            }

            // Store user data
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            // Show main app
            this.showMainApp();
            
            // Initialize dashboard
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboard();
            }

        } catch (error) {
            console.error('Authentication error:', error);
            this.showFormError(apiUtils.formatError(error));
        } finally {
            this.setLoading(false);
        }
    }

    // Validate entire form
    validateForm() {
        let isValid = true;

        if (!this.validateEmail()) isValid = false;
        if (!this.validatePassword()) isValid = false;
        if (!this.isLogin && !this.validateName()) isValid = false;

        return isValid;
    }

    // Validate email field
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError('email', 'Email is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearError('email');
        return true;
    }

    // Validate password field
    validatePassword() {
        const password = this.passwordInput.value;

        if (!password) {
            this.showError('password', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            return false;
        }

        this.clearError('password');
        return true;
    }

    // Validate name field (for registration)
    validateName() {
        if (this.isLogin) return true;

        const name = this.nameInput.value.trim();

        if (!name) {
            this.showError('name', 'Full name is required');
            return false;
        }

        if (name.length < 2) {
            this.showError('name', 'Name must be at least 2 characters');
            return false;
        }

        this.clearError('name');
        return true;
    }

    // Show field-specific error
    showError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
            inputElement.style.borderColor = 'var(--error-color)';
        }
    }

    // Clear field-specific error
    clearError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement && inputElement) {
            errorElement.classList.remove('active');
            inputElement.style.borderColor = '';
        }
    }

    // Clear all field errors
    clearAllErrors() {
        ['email', 'password', 'name'].forEach(field => this.clearError(field));
    }

    // Show form-level error
    showFormError(message) {
        this.formError.textContent = message;
        this.formError.classList.add('active');
    }

    // Clear form-level error
    clearFormError() {
        this.formError.classList.remove('active');
    }

    // Set loading state
    setLoading(loading) {
        this.authBtn.disabled = loading;
        
        if (loading) {
            this.authBtnText.style.display = 'none';
            this.authBtnLoader.classList.add('active');
        } else {
            this.authBtnText.style.display = 'inline';
            this.authBtnLoader.classList.remove('active');
        }
    }

    // Show auth screen
    showAuthScreen() {
        this.authScreen.classList.add('active');
        this.mainApp.classList.remove('active');
    }

    // Show main application
    showMainApp() {
        this.authScreen.classList.remove('active');
        this.mainApp.classList.add('active');
    }

    // Logout user
    async logout() {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');

        // Clear cache
        apiUtils.clearCache();

        // Show notification
        this.showNotification('Logged out successfully', 'info');

        // Show auth screen
        this.showAuthScreen();

        // Reset form
        this.authForm.reset();
        this.clearAllErrors();
        this.clearFormError();
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        }
    }

    // Get current user data
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Update user data in localStorage
    updateUserData(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    }
}

// Notification Manager
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = [];
        this.maxNotifications = 5;
    }

    // Show notification
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.addNotification(notification, duration);
    }

    // Create notification element
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        return notification;
    }

    // Add notification to container
    addNotification(notification, duration) {
        // Remove oldest notification if at max capacity
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            if (oldest && oldest.parentNode) {
                oldest.remove();
            }
        }

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }

    // Remove notification
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                    const index = this.notifications.indexOf(notification);
                    if (index > -1) {
                        this.notifications.splice(index, 1);
                    }
                }
            }, 300);
        }
    }

    // Clear all notifications
    clearAll() {
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.remove();
            }
        });
        this.notifications = [];
    }
}

// User Menu Handler
class UserMenuHandler {
    constructor() {
        this.userMenuBtn = document.getElementById('userMenuBtn');
        this.userDropdown = document.getElementById('userDropdown');
        this.userInitials = document.getElementById('userInitials');
        this.headerUserName = document.getElementById('headerUserName');
        this.headerUserEmail = document.getElementById('headerUserEmail');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.settingsBtn = document.getElementById('settingsBtn');

        this.attachEventListeners();
        this.updateUserInfo();
    }

    // Attach event listeners
    attachEventListeners() {
        this.userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        this.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.authManager) {
                window.authManager.logout();
            }
        });

        this.settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettings();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeDropdown();
        });
    }

    // Toggle dropdown visibility
    toggleDropdown() {
        this.userDropdown.classList.toggle('active');
    }

    // Close dropdown
    closeDropdown() {
        this.userDropdown.classList.remove('active');
    }

    // Update user info in header
    updateUserInfo() {
        const user = window.authManager?.getCurrentUser();
        if (user) {
            this.headerUserName.textContent = user.name || 'User';
            this.headerUserEmail.textContent = user.email || '';
            
            // Set initials
            const initials = user.name 
                ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                : 'U';
            this.userInitials.textContent = initials;
        }
    }

    // Show settings modal
    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.add('active');
        }
        this.closeDropdown();
    }
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    window.notificationManager = new NotificationManager();
    window.userMenuHandler = new UserMenuHandler();
});
