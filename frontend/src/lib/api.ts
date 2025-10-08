import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error responses
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    register: (data: { email: string; password: string; name: string; role: string }) =>
      apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
  },

  // Mentors endpoints
  mentors: {
    getAll: (params?: any) => apiClient.get('/mentors', { params }),
    getById: (id: string) => apiClient.get(`/mentors/${id}`),
    getLeaderboard: (params?: any) => apiClient.get('/mentors/leaderboard/top', { params }),
    updateProfile: (data: any) => apiClient.put('/mentors/profile', data),
  },

  // Bookings endpoints
  bookings: {
    create: (data: any) => apiClient.post('/bookings', data),
    getAll: (params?: any) => apiClient.get('/bookings', { params }),
    updateStatus: (id: string, status: string) =>
      apiClient.patch(`/bookings/${id}/status`, { status }),
  },

  // Payments endpoints
  payments: {
    createOrder: (data: { bookingId: string }) =>
      apiClient.post('/payments/create-order', data),
    verify: (data: any) => apiClient.post('/payments/verify', data),
    getHistory: (params?: any) => apiClient.get('/payments', { params }),
    getStatus: (paymentId: string) =>
      apiClient.get(`/payments/${paymentId}/status`),
  },

  // Reviews endpoints
  reviews: {
    create: (data: any) => apiClient.post('/reviews', data),
    getByMentor: (mentorId: string, params?: any) =>
      apiClient.get(`/reviews/mentor/${mentorId}`, { params }),
    getMy: () => apiClient.get('/reviews/my-reviews'),
  },
};