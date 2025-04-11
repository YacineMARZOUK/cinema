class ReservationManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle hash changes for payment and reservation details
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash.startsWith('#payment/')) {
                const reservationId = hash.split('/')[1];
                this.loadPaymentPage(reservationId);
            } else if (hash.startsWith('#reservation/')) {
                const reservationId = hash.split('/')[1];
                this.loadReservationDetails(reservationId);
            }
        });
    }

    async loadPaymentPage(reservationId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="spinner"></div>';

        try {
            const reservation = await api.getReservation(reservationId);
            this.displayPaymentPage(reservation);
        } catch (error) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors du chargement de la page de paiement. Veuillez réessayer plus tard.
                </div>
            `;
        }
    }

    displayPaymentPage(reservation) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h2>Paiement de la réservation</h2>
                    <div class="reservation-details mb-4">
                        <h4>${reservation.movie_title}</h4>
                        <p>
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
                        <p>Places : ${reservation.seats.join(', ')}</p>
                        <h5>Total à payer : ${reservation.total_price.toFixed(2)} €</h5>
                    </div>

                    <div class="payment-form">
                        <h4>Informations de paiement</h4>
                        <form id="payment-form">
                            <div class="mb-3">
                                <label for="card-number" class="form-label">Numéro de carte</label>
                                <input type="text" class="form-control" id="card-number" 
                                       placeholder="1234 5678 9012 3456" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="card-expiry" class="form-label">Date d'expiration</label>
                                    <input type="text" class="form-control" id="card-expiry" 
                                           placeholder="MM/AA" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="card-cvc" class="form-label">CVC</label>
                                    <input type="text" class="form-control" id="card-cvc" 
                                           placeholder="123" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                Payer ${reservation.total_price.toFixed(2)} €
                            </button>
                        </form>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="payment-summary">
                        <h4>Résumé de la commande</h4>
                        <div class="summary-details">
                            <p><strong>Film:</strong> ${reservation.movie_title}</p>
                            <p><strong>Date:</strong> ${new Date(reservation.showtime.start_time).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Heure:</strong> ${new Date(reservation.showtime.start_time).toLocaleTimeString('fr-FR')}</p>
                            <p><strong>Places:</strong> ${reservation.seats.join(', ')}</p>
                            <p><strong>Total:</strong> ${reservation.total_price.toFixed(2)} €</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupPaymentForm(reservation.id);
    }

    setupPaymentForm(reservationId) {
        const form = document.getElementById('payment-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const cardNumber = document.getElementById('card-number').value;
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvc = document.getElementById('card-cvc').value;

            try {
                // Simulate payment processing
                await this.processPayment(reservationId, {
                    cardNumber,
                    cardExpiry,
                    cardCvc
                });

                // Redirect to reservation details
                window.location.hash = `reservation/${reservationId}`;
            } catch (error) {
                this.showAlert('Erreur lors du paiement. Veuillez réessayer.', 'danger');
            }
        });
    }

    async processPayment(reservationId, paymentDetails) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create payment intent
        await api.createPaymentIntent({
            reservation_id: reservationId,
            amount: paymentDetails.amount
        });

        // In a real application, you would integrate with a payment provider like Stripe
        return { success: true };
    }

    async loadReservationDetails(reservationId) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="spinner"></div>';

        try {
            const [reservation, tickets] = await Promise.all([
                api.getReservation(reservationId),
                api.getReservationTickets(reservationId)
            ]);

            this.displayReservationDetails(reservation, tickets);
        } catch (error) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors du chargement des détails de la réservation. Veuillez réessayer plus tard.
                </div>
            `;
        }
    }

    displayReservationDetails(reservation, tickets) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h2>Détails de la réservation</h2>
                    <div class="reservation-info mb-4">
                        <h4>${reservation.movie_title}</h4>
                        <p>
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
                            <span class="badge bg-info">${reservation.showtime.language}</span>
                        </p>
                        <p>Places : ${reservation.seats.join(', ')}</p>
                        <p>Statut : 
                            <span class="badge bg-${this.getStatusBadgeColor(reservation.status)}">
                                ${reservation.status}
                            </span>
                        </p>
                    </div>

                    <div class="tickets-section">
                        <h4>Billets</h4>
                        ${this.displayTickets(tickets)}
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="reservation-actions">
                        <h4>Actions</h4>
                        ${this.getReservationActions(reservation)}
                    </div>
                </div>
            </div>
        `;

        this.setupTicketActions();
    }

    displayTickets(tickets) {
        if (tickets.length === 0) {
            return `
                <div class="alert alert-info">
                    Aucun billet disponible pour cette réservation.
                </div>
            `;
        }

        return tickets.map(ticket => `
            <div class="ticket mb-3">
                <div class="row">
                    <div class="col-md-8">
                        <h5>Billet #${ticket.id}</h5>
                        <p>Place ${ticket.seat_number}</p>
                        <p>
                            <small class="text-muted">
                                Scannez ce QR code à l'entrée de la salle
                            </small>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <img src="${ticket.qr_code}" alt="QR Code" class="img-fluid mb-2">
                        <button class="btn btn-sm btn-outline-primary download-ticket" 
                                data-ticket-id="${ticket.id}">
                            Télécharger
                        </button>
                    </div>
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

    getReservationActions(reservation) {
        if (reservation.status === 'pending') {
            return `
                <button class="btn btn-danger w-100 mb-2" id="cancel-reservation">
                    Annuler la réservation
                </button>
            `;
        }
        return '';
    }

    setupTicketActions() {
        // Download ticket buttons
        document.querySelectorAll('.download-ticket').forEach(button => {
            button.addEventListener('click', async () => {
                const ticketId = button.dataset.ticketId;
                try {
                    await api.downloadTicket(ticketId);
                    this.showAlert('Billet téléchargé avec succès !', 'success');
                } catch (error) {
                    this.showAlert('Erreur lors du téléchargement du billet.', 'danger');
                }
            });
        });

        // Cancel reservation button
        const cancelButton = document.getElementById('cancel-reservation');
        if (cancelButton) {
            cancelButton.addEventListener('click', async () => {
                if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                    try {
                        await api.cancelReservation(reservation.id);
                        this.showAlert('Réservation annulée avec succès.', 'success');
                        window.location.hash = '';
                    } catch (error) {
                        this.showAlert('Erreur lors de l\'annulation de la réservation.', 'danger');
                    }
                }
            });
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

// Create a global instance of the Reservation Manager
const reservationManager = new ReservationManager(); 