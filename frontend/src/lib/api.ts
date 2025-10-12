import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edvisor_token');
    console.log('=== API REQUEST DEBUG ===');
    console.log('Request URL:', config.url);
    console.log('Request method:', config.method?.toUpperCase());
    console.log('Token present:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 20) + '...');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found - request will be unauthenticated');
    }
    console.log('========================');
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Response URL:', response.config?.url);
    console.log('Response status:', response.status);
    console.log('============================');
    return response;
  },
  (error) => {
    console.log('=== API RESPONSE ERROR ===');
    console.log('Error URL:', error.config?.url);
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Authorization header:', error.config?.headers?.Authorization);
    console.log('==========================');
    
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.log('401 detected - clearing auth data and redirecting');
      localStorage.removeItem('edvisor_token');
      localStorage.removeItem('edvisor_user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
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
  
  webhook: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingId: string;
  }) => api.post('/payments/webhook', data),
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

// Mentor API calls
export const mentorAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getStats: (id: string) => api.get(`/mentor/stats/${id}`),
  
  getBookings: (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/mentor/${id}/bookings`, { params }),
  
  getReviews: (id: string) => api.get(`/mentor/${id}/reviews`),
  
  updateProfile: (id: string, data: {
    bio?: string;
    expertise?: string[];
    hourlyRate?: number;
    tier?: string;
    isAvailable?: boolean;
  }) => api.put(`/mentor/${id}/profile`, data),
  
  completeBooking: (bookingId: string) =>
    api.put(`/mentor/bookings/${bookingId}/complete`),
  
  requestPayout: (data: {
    amount: number;
    method: string;
  }) => api.post('/mentor/payout', data),
};

// Admin API calls
export const adminAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getOverview: () => api.get('/admin/overview'),
  
  getMentors: (params?: {
    status?: string;
    tier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/mentors', { params }),
  
  updateMentorStatus: (mentorId: string, status: string) =>
    api.put(`/admin/mentors/${mentorId}/status`, { status }),
  
  getAllBookings: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/bookings', { params }),
  
  getRanking: (params?: {
    domain?: string;
    tier?: string;
    timeRange?: string;
  }) => api.get('/admin/ranking', { params }),
  
  recomputeRanking: () => api.post('/admin/ranking/compute'),
  
  getRevenue: (params?: {
    timeRange?: string;
  }) => api.get('/admin/revenue', { params }),
};

// Debug function to test authentication (available in browser console as window.testAuth)
if (typeof window !== 'undefined') {
  (window as any).testAuth = async () => {
    try {
      console.log('=== TESTING AUTHENTICATION ===');
      const token = localStorage.getItem('edvisor_token');
      const user = localStorage.getItem('edvisor_user');
      
      console.log('Token present:', !!token);
      console.log('Token length:', token?.length);
      console.log('Token preview:', token?.substring(0, 30) + '...');
      console.log('User data:', user ? JSON.parse(user) : 'No user data');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        return;
      }
      
      // Try to decode JWT payload (without verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        console.log('JWT expires at:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token expired:', Date.now() / 1000 > payload.exp);
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
      
      console.log('Calling /auth/me endpoint...');
      const response = await authAPI.getMe();
      
      console.log('✅ Authentication successful!');
      console.log('User data from API:', response.data);
      
    } catch (error: any) {
      console.error('❌ Authentication failed!');
      console.error('Error:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
    }
    console.log('===============================');
  };
}

export default api;
