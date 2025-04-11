class AuthManager {
    constructor() {
        this.isAuthenticated = !!localStorage.getItem('token');
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                await this.login(email, password);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const phone = document.getElementById('register-phone').value;
                const address = document.getElementById('register-address').value;
                await this.register({ name, email, password, phone, address });
            });
        }

        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
        }

        // Register button
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
                registerModal.show();
            });
        }
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            this.isAuthenticated = true;
            this.updateUI();
            
            // Fermer la modale
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            // Afficher le message de succès
            this.showAlert('Connexion réussie !', 'success');
            
            // Rediriger vers la page des films
            window.location.hash = '#movies';
        } catch (error) {
            this.showAlert('Erreur de connexion. Veuillez vérifier vos identifiants.', 'danger');
        }
    }

    async register(userData) {
        try {
            const response = await api.register(userData);
            this.isAuthenticated = true;
            this.updateUI();
            
            // Fermer la modale
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();
            
            this.showAlert('Inscription réussie !', 'success');
            window.location.hash = '#movies';
        } catch (error) {
            this.showAlert('Erreur lors de l\'inscription. Veuillez réessayer.', 'danger');
        }
    }

    async logout() {
        try {
            await api.logout();
            this.isAuthenticated = false;
            this.updateUI();
            this.showAlert('Déconnexion réussie !', 'success');
            window.location.hash = '#movies';
        } catch (error) {
            this.showAlert('Erreur lors de la déconnexion.', 'danger');
        }
    }

    updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        if (authButtons) {
            if (this.isAuthenticated) {
                authButtons.innerHTML = `
                    <a class="nav-link" href="#" id="profile-btn">Mon Profil</a>
                    <a class="nav-link" href="#" id="logout-btn">Déconnexion</a>
                `;
                
                // Add event listeners for new buttons
                document.getElementById('logout-btn').addEventListener('click', () => this.logout());
                document.getElementById('profile-btn').addEventListener('click', () => {
                    window.location.hash = '#profile';
                });
            } else {
                authButtons.innerHTML = `
                    <a class="nav-link" href="#" id="login-btn">Connexion</a>
                    <a class="nav-link" href="#" id="register-btn">Inscription</a>
                `;
                
                // Re-add event listeners for login/register buttons
                this.setupEventListeners();
            }
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const mainContent = document.getElementById('main-content');
        mainContent.insertBefore(alertDiv, mainContent.firstChild);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Create a global instance of the Auth Manager
const auth = new AuthManager(); 