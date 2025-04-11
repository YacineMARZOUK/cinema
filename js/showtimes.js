class ShowtimeManager {
    constructor() {
        this.selectedSeats = new Set();
        this.reservationTimer = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle hash changes for showtime details
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash.startsWith('#showtime/')) {
                const showtimeId = hash.split('/')[1];
                this.loadShowtimeDetails(showtimeId);
            }
        });

        const showtimesLink = document.getElementById('showtimes-link');
        if (showtimesLink) {
            showtimesLink.addEventListener('click', () => this.showAllShowtimes());
        }
    }

    async loadShowtimeDetails(showtimeId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="spinner"></div>';

        try {
            const [showtime, availableSeats] = await Promise.all([
                api.getShowtime(showtimeId),
                api.getAvailableSeats(showtimeId)
            ]);

            this.displayShowtimeDetails(showtime, availableSeats);
        } catch (error) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors du chargement des détails de la séance. Veuillez réessayer plus tard.
                </div>
            `;
        }
    }

    displayShowtimeDetails(showtime, availableSeats) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h2>Réserver des places</h2>
                    <div class="showtime-info mb-4">
                        <h4>${showtime.movie_title}</h4>
                        <p>
                            ${new Date(showtime.start_time).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                            à
                            ${new Date(showtime.start_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        <p>
                            <span class="badge bg-${showtime.type === 'VIP' ? 'warning' : 'primary'}">
                                ${showtime.type}
                            </span>
                            <span class="badge bg-info">${showtime.language}</span>
                        </p>
                    </div>

                    <div class="seat-selection">
                        <h4>Sélection des places</h4>
                        <div class="seat-legend mb-3">
                            <span class="seat-legend-item">
                                <div class="seat available"></div>
                                <span>Disponible</span>
                            </span>
                            <span class="seat-legend-item">
                                <div class="seat occupied"></div>
                                <span>Occupé</span>
                            </span>
                            <span class="seat-legend-item">
                                <div class="seat selected"></div>
                                <span>Sélectionné</span>
                            </span>
                            <span class="seat-legend-item">
                                <div class="seat couple"></div>
                                <span>Siège couple</span>
                            </span>
                        </div>
                        <div class="seat-grid">
                            ${this.createSeatGrid(availableSeats)}
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="reservation-summary">
                        <h4>Résumé de la réservation</h4>
                        <div id="selected-seats-summary">
                            <p>Aucune place sélectionnée</p>
                        </div>
                        <div class="price-summary mt-3">
                            <h5>Total: <span id="total-price">0.00</span> €</h5>
                        </div>
                        <button class="btn btn-primary w-100 mt-3" id="proceed-to-payment" disabled>
                            Procéder au paiement
                        </button>
                        <div class="alert alert-warning mt-3" id="reservation-timer" style="display: none;">
                            Votre réservation expire dans <span id="timer">15:00</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupSeatSelection();
        this.startReservationTimer();
    }

    createSeatGrid(availableSeats) {
        const rows = 8;
        const cols = 10;
        let html = '';

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const seatNumber = row * cols + col + 1;
                const isAvailable = availableSeats.includes(seatNumber);
                const isCouple = seatNumber % 2 === 0;
                
                html += `
                    <div class="seat ${isAvailable ? 'available' : 'occupied'} 
                                 ${isCouple ? 'couple' : ''}"
                         data-seat-number="${seatNumber}">
                        ${seatNumber}
                    </div>
                `;
            }
            html += '<br>';
        }

        return html;
    }

    setupSeatSelection() {
        const seats = document.querySelectorAll('.seat.available');
        const proceedButton = document.getElementById('proceed-to-payment');
        const selectedSeatsSummary = document.getElementById('selected-seats-summary');
        const totalPriceElement = document.getElementById('total-price');

        seats.forEach(seat => {
            seat.addEventListener('click', () => {
                const seatNumber = parseInt(seat.dataset.seatNumber);
                const isCouple = seat.classList.contains('couple');

                if (isCouple) {
                    // Handle couple seats
                    const adjacentSeat = document.querySelector(`.seat[data-seat-number="${seatNumber + (seatNumber % 2 === 0 ? -1 : 1)}"]`);
                    if (adjacentSeat && adjacentSeat.classList.contains('available')) {
                        this.toggleSeatSelection(seat);
                        this.toggleSeatSelection(adjacentSeat);
                    }
                } else {
                    this.toggleSeatSelection(seat);
                }

                this.updateReservationSummary();
                proceedButton.disabled = this.selectedSeats.size === 0;
            });
        });

        proceedButton.addEventListener('click', () => {
            this.proceedToPayment();
        });
    }

    toggleSeatSelection(seat) {
        const seatNumber = parseInt(seat.dataset.seatNumber);
        if (this.selectedSeats.has(seatNumber)) {
            this.selectedSeats.delete(seatNumber);
            seat.classList.remove('selected');
        } else {
            this.selectedSeats.add(seatNumber);
            seat.classList.add('selected');
        }
    }

    updateReservationSummary() {
        const selectedSeatsSummary = document.getElementById('selected-seats-summary');
        const totalPriceElement = document.getElementById('total-price');
        
        if (this.selectedSeats.size === 0) {
            selectedSeatsSummary.innerHTML = '<p>Aucune place sélectionnée</p>';
            totalPriceElement.textContent = '0.00';
            return;
        }

        const seatPrice = 10; // Prix de base par siège
        const totalPrice = this.selectedSeats.size * seatPrice;

        selectedSeatsSummary.innerHTML = `
            <p>Places sélectionnées : ${Array.from(this.selectedSeats).join(', ')}</p>
        `;
        totalPriceElement.textContent = totalPrice.toFixed(2);
    }

    startReservationTimer() {
        let timeLeft = 15 * 60; // 15 minutes in seconds
        const timerElement = document.getElementById('timer');
        const timerContainer = document.getElementById('reservation-timer');

        this.reservationTimer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(this.reservationTimer);
                this.selectedSeats.clear();
                this.showAlert('Le temps de réservation a expiré. Veuillez recommencer.', 'warning');
                window.location.hash = '';
            }
        }, 1000);

        timerContainer.style.display = 'block';
    }

    async proceedToPayment() {
        if (!auth.isAuthenticated) {
            this.showAlert('Veuillez vous connecter pour continuer.', 'warning');
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            return;
        }

        try {
            const showtimeId = window.location.hash.split('/')[1];
            const reservation = await api.createReservation({
                showtime_id: showtimeId,
                seats: Array.from(this.selectedSeats)
            });

            window.location.hash = `payment/${reservation.id}`;
        } catch (error) {
            this.showAlert('Erreur lors de la création de la réservation. Veuillez réessayer.', 'danger');
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

    async showAllShowtimes() {
        try {
            const showtimes = await api.getShowtimes();
            this.displayShowtimes(showtimes);
        } catch (error) {
            console.error('Erreur lors de la récupération des séances:', error);
            this.showError('Impossible de charger les séances. Veuillez réessayer plus tard.');
        }
    }

    async showShowtimes(movieId) {
        try {
            const showtimes = await api.getShowtimesByMovie(movieId);
            this.displayShowtimes(showtimes);
        } catch (error) {
            console.error('Erreur lors de la récupération des séances:', error);
            this.showError('Impossible de charger les séances. Veuillez réessayer plus tard.');
        }
    }

    displayShowtimes(showtimes) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        if (!showtimes || showtimes.length === 0) {
            mainContent.innerHTML = '<div class="alert alert-info">Aucune séance disponible pour le moment.</div>';
            return;
        }

        const showtimesHTML = showtimes.map(showtime => {
            const startDate = new Date(showtime.start_time);
            const formattedDate = startDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const formattedTime = startDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${showtime.movie.title}</h5>
                            <div class="mb-3">
                                <p class="card-text">
                                    <strong>Date:</strong> ${formattedDate}<br>
                                    <strong>Heure:</strong> ${formattedTime}<br>
                                    <strong>Salle:</strong> ${showtime.theater.name}<br>
                                    <strong>Capacité:</strong> ${showtime.theater.capacity} places<br>
                                    <strong>Type:</strong> ${showtime.type}<br>
                                    <strong>Langue:</strong> ${showtime.language}
                                </p>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-${this.getTypeBadgeColor(showtime.type)}">${showtime.type}</span>
                                <button class="btn btn-primary" onclick="reservations.createReservation(${showtime.id})">
                                    Réserver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        mainContent.innerHTML = `
            <h2 class="mb-4">Séances disponibles</h2>
            <div class="row">
                ${showtimesHTML}
            </div>
        `;
    }

    getTypeBadgeColor(type) {
        switch (type.toLowerCase()) {
            case 'vip':
                return 'warning';
            case '3d':
                return 'info';
            case 'normal':
            default:
                return 'primary';
        }
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

// Create a global instance of the Showtime Manager
const showtimeManager = new ShowtimeManager(); 