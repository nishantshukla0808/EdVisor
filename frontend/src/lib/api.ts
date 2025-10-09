import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edvisor_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('edvisor_token');
      localStorage.removeItem('edvisor_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  signup: (name: string, email: string, password: string) =>
    api.post('/auth/signup', { name, email, password }),
  
  getMe: () => api.get('/auth/me'),
};

// Mentors API calls
export const mentorsAPI = {
  getMentors: (params?: {
    q?: string;
    domain?: string;
    tier?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get('/mentors', { params }),
  
  getMentor: (id: string) => api.get(`/mentors/${id}`),
};

// Bookings API calls
export const bookingsAPI = {
  createBooking: (data: {
    mentorId: string;
    startTime: string;
    durationMin: number;
    preQuestions?: string[];
    priceTotal: number;
  }) => api.post('/bookings', data),
  
  getBooking: (id: string) => api.get(`/bookings/${id}`),
  
  getMyBookings: () => api.get('/students/me/bookings'),
};

// Reviews API calls
export const reviewsAPI = {
  createReview: (data: {
    bookingId: string;
    rating: number;
    clarity: number;
    relevance: number;
    roadmap: number;
    comment?: string;
  }) => api.post('/reviews', data),
};

// Payments API calls
export const paymentsAPI = {
  initiatePayment: (data: {
    bookingId: string;
  }) => api.post('/payments/initiate', data),
};

// Leaderboard API calls
export const leaderboardAPI = {
  getLeaderboard: (params?: {
    domain?: string;
    tier?: string;
    limit?: number;
  }) => api.get('/leaderboard', { params }),
  
  getDomains: () => api.get('/leaderboard/domains'),
  
  getStats: () => api.get('/leaderboard/stats'),
};

// Students API calls
export const studentsAPI = {
  getDashboard: () => api.get('/students/me/dashboard'),
};

export default api;