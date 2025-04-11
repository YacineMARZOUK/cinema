class App {
    constructor() {
        this.setupEventListeners();
        this.handleRoute();
    }

    setupEventListeners() {
        // Handle navigation
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial page load
        window.addEventListener('load', () => this.handleInitialRoute());
    }

    handleInitialRoute() {
        const hash = window.location.hash;
        if (hash) {
            this.handleRoute();
        } else {
            // Default route - show movies
            window.location.hash = '#movies';
        }
    }

    handleRoute() {
        const hash = window.location.hash || '#movies';
        const mainContent = document.getElementById('main-content');

        // Clear any existing alerts
        const existingAlerts = mainContent.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        switch (hash) {
            case '#movies':
                movies.showMovies();
                break;
            case '#showtimes':
                showtimes.showAllShowtimes();
                break;
            case '#profile':
                if (!auth.isAuthenticated) {
                    window.location.hash = '#login';
                } else {
                    profile.showProfile();
                }
                break;
            default:
                if (hash.startsWith('#movie/')) {
                    const movieId = hash.split('/')[1];
                    movies.showMovieDetails(movieId);
                } else if (hash.startsWith('#showtime/')) {
                    const showtimeId = hash.split('/')[1];
                    showtimes.showShowtimeDetails(showtimeId);
                } else {
                    movies.showMovies();
                }
        }
    }

    async loadUserProfile() {
        if (!auth.isAuthenticated) {
            window.location.hash = '#movies';
            return;
        }

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="spinner"></div>';

        try {
            const [userProfile, reservations] = await Promise.all([
                api.getUserProfile(),
                api.getUserReservations()
            ]);

            this.displayUserProfile(userProfile, reservations);
        } catch (error) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors du chargement du profil. Veuillez réessayer plus tard.
                </div>
            `;
        }
    }

    displayUserProfile(userProfile, reservations) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="profile-section">
                        <h3>Mon Profil</h3>
                        <div class="profile-info">
                            <p><strong>Nom:</strong> ${userProfile.name}</p>
                            <p><strong>Email:</strong> ${userProfile.email}</p>
                        </div>
                        <button class="btn btn-primary" id="edit-profile">
                            Modifier le profil
                        </button>
                    </div>
                </div>

                <div class="col-md-8">
                    <div class="reservations-section">
                        <h3>Mes Réservations</h3>
                        ${this.displayUserReservations(reservations)}
                    </div>
                </div>
            </div>
        `;

        this.setupProfileActions();
    }

    displayUserReservations(reservations) {
        if (reservations.length === 0) {
            return `
                <div class="alert alert-info">
                    Vous n'avez pas encore de réservations.
                </div>
            `;
        }

        return reservations.map(reservation => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${reservation.movie_title}</h5>
                    <p class="card-text">
                        ${new Date(reservation.showtime.start_time).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                        à
                        ${new Date(reservation.showtime.start_time).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p>
                        <span class="badge bg-${reservation.showtime.type === 'VIP' ? 'warning' : 'primary'}">
                            ${reservation.showtime.type}
                        </span>
                        <span class="badge bg-${this.getStatusBadgeColor(reservation.status)}">
                            ${reservation.status}
                        </span>
                    </p>
                    <a href="#reservation/${reservation.id}" class="btn btn-primary">
                        Voir les détails
                    </a>
                </div>
            </div>
        `).join('');
    }

    getStatusBadgeColor(status) {
        const colors = {
            'pending': 'warning',
            'confirmed': 'success',
            'cancelled': 'danger',
            'completed': 'info'
        };
        return colors[status] || 'secondary';
    }

    setupProfileActions() {
        const editProfileBtn = document.getElementById('edit-profile');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                // Implement profile editing functionality
                alert('Fonctionnalité de modification du profil à implémenter');
            });
        }
    }
}

// Create a global instance of the App
const app = new App(); 