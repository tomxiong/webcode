// Login Mobile JavaScript
class LoginMobile extends MobileBase {
  constructor() {
    super();
    this.isLoading = false;
    this.rememberMe = false;
    
    this.initLogin();
  }

  initLogin() {
    this.setupForm();
    this.setupPasswordToggle();
    this.setupQuickLogin();
    this.setupOfflineDetection();
    this.checkSavedCredentials();
    this.setupKeyboardShortcuts();
  }

  setupForm() {
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (!form) return;

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Remember me checkbox
    if (rememberMeCheckbox) {
      rememberMeCheckbox.addEventListener('change', (e) => {
        this.rememberMe = e.target.checked;
      });
    }

    // Input validation
    [usernameInput, passwordInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          this.clearMessages();
          this.validateInput(input);
        });

        input.addEventListener('blur', () => {
          this.validateInput(input);
        });
      }
    });

    // Forgot password
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }
  }

  setupPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (!passwordInput || !passwordToggle) return;

    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      const eyeIcon = passwordToggle.querySelector('.eye-icon path');
      if (eyeIcon) {
        eyeIcon.setAttribute('d', isPassword ? 
          // Eye slash icon
          'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' :
          // Eye icon
          'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'
        );
      }
    });
  }

  setupQuickLogin() {
    const quickLoginButtons = document.querySelectorAll('.quick-login-btn');
    
    quickLoginButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const role = button.dataset.role;
        await this.handleQuickLogin(role);
      });
    });
  }

  setupOfflineDetection() {
    const offlineIndicator = document.getElementById('offlineIndicator');
    
    const updateOnlineStatus = () => {
      if (offlineIndicator) {
        offlineIndicator.style.display = navigator.onLine ? 'none' : 'flex';
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Enter key on form
      if (e.key === 'Enter' && !this.isLoading) {
        const form = document.getElementById('loginForm');
        if (form && document.activeElement && form.contains(document.activeElement)) {
          e.preventDefault();
          this.handleLogin();
        }
      }
      
      // Escape key to clear messages
      if (e.key === 'Escape') {
        this.clearMessages();
      }
    });
  }

  checkSavedCredentials() {
    try {
      const savedUsername = localStorage.getItem('clsi_saved_username');
      const rememberMe = localStorage.getItem('clsi_remember_me') === 'true';
      
      if (savedUsername && rememberMe) {
        const usernameInput = document.getElementById('username');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        
        if (usernameInput) usernameInput.value = savedUsername;
        if (rememberMeCheckbox) {
          rememberMeCheckbox.checked = true;
          this.rememberMe = true;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved credentials:', error);
    }
  }

  validateInput(input) {
    const inputContainer = input.parentElement;
    const existingError = inputContainer.querySelector('.input-error');
    
    // Remove existing error
    if (existingError) {
      existingError.remove();
    }
    
    // Reset input style
    input.classList.remove('error');
    
    let isValid = true;
    let errorMessage = '';
    
    if (input.id === 'username') {
      if (!input.value.trim()) {
        isValid = false;
        errorMessage = 'Username or email is required';
      } else if (input.value.length < 3) {
        isValid = false;
        errorMessage = 'Username must be at least 3 characters';
      }
    }
    
    if (input.id === 'password') {
      if (!input.value) {
        isValid = false;
        errorMessage = 'Password is required';
      } else if (input.value.length < 6) {
        isValid = false;
        errorMessage = 'Password must be at least 6 characters';
      }
    }
    
    if (!isValid) {
      input.classList.add('error');
      const errorElement = document.createElement('div');
      errorElement.className = 'input-error';
      errorElement.textContent = errorMessage;
      inputContainer.appendChild(errorElement);
    }
    
    return isValid;
  }

  async handleLogin() {
    if (this.isLoading) return;
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) return;
    
    // Validate inputs
    const isUsernameValid = this.validateInput(usernameInput);
    const isPasswordValid = this.validateInput(passwordInput);
    
    if (!isUsernameValid || !isPasswordValid) {
      this.showError('Please fix the errors above');
      return;
    }
    
    const credentials = {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    };
    
    await this.performLogin(credentials);
  }

  async handleQuickLogin(role) {
    if (this.isLoading) return;
    
    const demoCredentials = {
      admin: { username: 'admin', password: 'admin123' },
      microbiologist: { username: 'lab_tech', password: 'lab123' }
    };
    
    const credentials = demoCredentials[role];
    if (!credentials) return;
    
    // Fill form with demo credentials
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) usernameInput.value = credentials.username;
    if (passwordInput) passwordInput.value = credentials.password;
    
    await this.performLogin(credentials);
  }

  async performLogin(credentials) {
    this.isLoading = true;
    this.setLoadingState(true);
    this.clearMessages();
    
    try {
      // Check if offline
      if (!navigator.onLine) {
        throw new Error('You are offline. Please check your internet connection.');
      }
      
      const response = await this.post('/api/auth/login', credentials);
      
      if (response.success) {
        // Save credentials if remember me is checked
        if (this.rememberMe) {
          localStorage.setItem('clsi_saved_username', credentials.username);
          localStorage.setItem('clsi_remember_me', 'true');
        } else {
          localStorage.removeItem('clsi_saved_username');
          localStorage.removeItem('clsi_remember_me');
        }
        
        // Save auth token
        localStorage.setItem('clsi_auth_token', response.data.token);
        localStorage.setItem('clsi_user_data', JSON.stringify(response.data.user));
        
        this.showSuccess('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = '/mobile/dashboard.html';
        }, 1500);
        
      } else {
        throw new Error(response.message || 'Login failed');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('offline') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Invalid username or password.';
      } else if (error.message.includes('account')) {
        errorMessage = 'Account is disabled or suspended.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showError(errorMessage);
      
      // Vibrate on error (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } finally {
      this.isLoading = false;
      this.setLoadingState(false);
    }
  }

  async handleForgotPassword() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput ? usernameInput.value.trim() : '';
    
    if (!username) {
      this.showError('Please enter your username or email first');
      if (usernameInput) usernameInput.focus();
      return;
    }
    
    try {
      const response = await this.post('/api/auth/forgot-password', { username });
      
      if (response.success) {
        this.showSuccess('Password reset instructions sent to your email');
      } else {
        throw new Error(response.message || 'Failed to send reset instructions');
      }
      
    } catch (error) {
      console.error('Forgot password error:', error);
      this.showError(error.message || 'Failed to send reset instructions');
    }
  }

  setLoadingState(loading) {
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton?.querySelector('.button-text');
    const buttonSpinner = loginButton?.querySelector('.button-spinner');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (loginButton) {
      loginButton.disabled = loading;
    }
    
    if (buttonText) {
      buttonText.style.display = loading ? 'none' : 'block';
    }
    
    if (buttonSpinner) {
      buttonSpinner.style.display = loading ? 'flex' : 'none';
    }
    
    if (loadingOverlay) {
      loadingOverlay.style.display = loading ? 'flex' : 'none';
    }
  }

  showError(message) {
    this.clearMessages();
    const errorElement = document.getElementById('errorMessage');
    const errorText = errorElement?.querySelector('.error-text');
    
    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = 'flex';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (errorElement.style.display === 'flex') {
          errorElement.style.display = 'none';
        }
      }, 5000);
    }
  }

  showSuccess(message) {
    this.clearMessages();
    const successElement = document.getElementById('successMessage');
    const successText = successElement?.querySelector('.success-text');
    
    if (successElement && successText) {
      successText.textContent = message;
      successElement.style.display = 'flex';
    }
  }

  clearMessages() {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');
    
    if (errorElement) errorElement.style.display = 'none';
    if (successElement) successElement.style.display = 'none';
    
    // Clear input errors
    const inputErrors = document.querySelectorAll('.input-error');
    inputErrors.forEach(error => error.remove());
    
    const errorInputs = document.querySelectorAll('.form-input.error');
    errorInputs.forEach(input => input.classList.remove('error'));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LoginMobile();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
