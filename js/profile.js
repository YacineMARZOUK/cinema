class ProfileManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Gérer le changement de hash pour la page profil
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#profile') {
                this.showProfile();
            }
        });

        // Gérer le clic sur le bouton profil
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                window.location.hash = '#profile';
            });
        }
    }

    async showProfile() {
        if (!auth.isAuthenticated) {
            window.location.hash = '#login';
            return;
        }

        try {
            const profile = await api.getProfile();
            this.displayProfile(profile);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            this.showError('Impossible de charger votre profil. Veuillez réessayer plus tard.');
        }
    }

    displayProfile(profile) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-md-8 mx-auto">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">Mon Profil</h4>
                            </div>
                            <div class="card-body">
                                <form id="profile-form">
                                    <div class="mb-3">
                                        <label for="profile-name" class="form-label">Nom complet</label>
                                        <input type="text" class="form-control" id="profile-name" 
                                               value="${profile.name}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="profile-email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="profile-email" 
                                               value="${profile.email}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="profile-phone" class="form-label">Téléphone</label>
                                        <input type="tel" class="form-control" id="profile-phone" 
                                               value="${profile.phone}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="profile-address" class="form-label">Adresse</label>
                                        <input type="text" class="form-control" id="profile-address" 
                                               value="${profile.address}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Rôle</label>
                                        <input type="text" class="form-control" value="${profile.role}" disabled>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save"></i> Enregistrer les modifications
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" id="change-password-btn">
                                            <i class="fas fa-key"></i> Changer le mot de passe
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div class="card mt-4">
                            <div class="card-header bg-info text-white">
                                <h4 class="mb-0">Mes Réservations</h4>
                            </div>
                            <div class="card-body">
                                <div id="reservations-list">
                                    <div class="text-center">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Chargement...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupProfileForm();
        this.loadReservations();
    }

    setupProfileForm() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateProfile();
            });
        }

        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                // TODO: Implémenter le changement de mot de passe
                this.showAlert('Fonctionnalité à venir', 'info');
            });
        }
    }

    async updateProfile() {
        try {
            const updatedData = {
                name: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value,
                address: document.getElementById('profile-address').value
            };

            await api.updateProfile(updatedData);
            this.showAlert('Profil mis à jour avec succès !', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            this.showAlert('Erreur lors de la mise à jour du profil. Veuillez réessayer.', 'danger');
        }
    }

    async loadReservations() {
        try {
            const reservations = await api.getUserReservations();
            this.displayReservations(reservations);
        } catch (error) {
            console.error('Erreur lors du chargement des réservations:', error);
            this.showError('Impossible de charger vos réservations. Veuillez réessayer plus tard.');
        }
    }

    displayReservations(reservations) {
        const reservationsList = document.getElementById('reservations-list');
        if (!reservationsList) return;

        if (!reservations || reservations.length === 0) {
            reservationsList.innerHTML = `
                <div class="alert alert-info">
                    Vous n'avez pas encore de réservations.
                </div>
            `;
            return;
        }

        const reservationsHTML = reservations.map(reservation => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${reservation.movie.title}</h5>
                    <p class="card-text">
                        <strong>Date:</strong> ${new Date(reservation.showtime.start_time).toLocaleDateString('fr-FR')}<br>
                        <strong>Heure:</strong> ${new Date(reservation.showtime.start_time).toLocaleTimeString('fr-FR')}<br>
                        <strong>Salle:</strong> ${reservation.showtime.theater.name}<br>
                        <strong>Places:</strong> ${reservation.seats.join(', ')}<br>
                        <strong>Statut:</strong> 
                        <span class="badge bg-${this.getStatusBadgeColor(reservation.status)}">
                            ${reservation.status}
                        </span>
                    </p>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-primary btn-sm" 
                                onclick="reservations.viewReservation(${reservation.id})">
                            Voir les détails
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        reservationsList.innerHTML = reservationsHTML;
    }

    getStatusBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'confirmé':
                return 'success';
            case 'en attente':
                return 'warning';
            case 'annulé':
                return 'danger';
            default:
                return 'secondary';
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

    showError(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    ${message}
                </div>
            `;
        }
    }
}

// Créer une instance globale du gestionnaire de profil
const profile = new ProfileManager(); 