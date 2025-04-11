class MovieManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const moviesLink = document.getElementById('movies-link');
        if (moviesLink) {
            moviesLink.addEventListener('click', () => this.showMovies());
        }
    }

    async showMovies() {
        try {
            const movies = await api.getMovies();
            this.displayMovies(movies);
        } catch (error) {
            console.error('Erreur lors de la récupération des films:', error);
            this.showError('Impossible de charger les films. Veuillez réessayer plus tard.');
        }
    }

    displayMovies(movies) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        if (!movies || movies.length === 0) {
            mainContent.innerHTML = '<div class="alert alert-info">Aucun film disponible pour le moment.</div>';
            return;
        }

        const moviesHTML = movies.map(movie => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${movie.title}</h5>
                        <p class="card-text">${movie.description || 'Aucune description disponible'}</p>
                        <ul class="list-unstyled">
                            <li><strong>Durée:</strong> ${movie.duration} minutes</li>
                            <li><strong>Âge minimum:</strong> ${movie.min_age} ans</li>
                            ${movie.genre ? `<li><strong>Genre:</strong> ${movie.genre}</li>` : ''}
                        </ul>
                        ${movie.trailer_url ? `
                            <a href="${movie.trailer_url}" class="btn btn-outline-primary mb-2" target="_blank">
                                <i class="fas fa-play-circle"></i> Voir la bande annonce
                            </a>
                        ` : ''}
                        <button class="btn btn-primary" onclick="showtimes.showShowtimes(${movie.id})">
                            Voir les séances
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <h2 class="mb-4">Films à l'affiche</h2>
            <div class="row">
                ${moviesHTML}
            </div>
        `;
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

// Créer une instance globale du gestionnaire de films
const movies = new MovieManager(); 