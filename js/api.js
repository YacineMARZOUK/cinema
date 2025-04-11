const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Erreur de connexion');
        }

        const data = await response.json();
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData) {
        const response = await fetch(`${this.baseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'inscription');
        }

        const data = await response.json();
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async logout() {
        try {
            await this.request('/logout', { method: 'POST' });
        } finally {
            this.clearToken();
        }
    }

    // Profile endpoints
    async getProfile() {
        return this.request('/me');
    }

    async updateProfile(data) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Movies endpoints
    async getMovies() {
        return this.request('/movies');
    }

    async getMovie(id) {
        return this.request(`/movies/${id}`);
    }

    // Showtimes endpoints
    async getShowtimes() {
        return this.request('/showtimes');
    }

    async getShowtimesByMovie(movieId) {
        return this.request(`/showtimes/movie/${movieId}`);
    }

    async getShowtime(id) {
        return this.request(`/showtimes/${id}`);
    }

    async getShowtimesByType(type) {
        return this.request(`/showtimes/type/${type}`);
    }

    // Seats endpoints
    async getTheaterSeats(theaterId) {
        return this.request(`/seats/theater/${theaterId}`);
    }

    async getAvailableSeats(showtimeId) {
        return this.request(`/seats/available/${showtimeId}`);
    }

    // Reservations endpoints
    async createReservation(data) {
        return this.request('/reservations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getUserReservations() {
        return this.request('/reservations');
    }

    async getReservation(id) {
        return this.request(`/reservations/${id}`);
    }

    async cancelReservation(id) {
        return this.request(`/reservations/${id}`, {
            method: 'DELETE'
        });
    }

    async updateReservation(id, data) {
        return this.request(`/reservations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Payment endpoints
    async createPaymentIntent(data) {
        return this.request('/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Tickets endpoints
    async getTicket(id) {
        return this.request(`/tickets/${id}`);
    }

    async getReservationTickets(reservationId) {
        return this.request(`/tickets/reservation/${reservationId}`);
    }

    async downloadTicket(id) {
        return this.request(`/tickets/${id}/download`);
    }
}

// Create a global instance of the API service
const api = new ApiService(); 