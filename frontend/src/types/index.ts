// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  student?: Student;
  mentor?: Mentor;
}

export interface Student {
  id: string;
  userId: string;
  bio?: string;
  goals?: string;
  interests?: string;
}

export interface Mentor {
  id: string;
  userId: string;
  bio: string;
  expertise: string;
  experience: number;
  tier: string;
  hourlyRate: number;
  availability: string;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Mentor Types
export interface MentorCard {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  expertise: string;
  experience: number;
  tier: string;
  pricePerHour: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
}

export interface MentorProfile extends MentorCard {
  institution?: {
    name: string;
    logo?: string;
  };
  availability?: {
    timezone: string;
    slots: Array<{
      day: string;
      times: string[];
    }>;
  };
  joinedAt: string;
  reviews: Review[];
}

// Booking Types
export interface Booking {
  id: string;
  studentId: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  status: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    name: string;
    avatar?: string;
  };
  student?: {
    name: string;
    avatar?: string;
  };
  payment?: Payment;
  review?: Review;
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  studentId: string;
  amount: number;
  currency: string;
  status: string;
  razorpayId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student?: {
    name: string;
    avatar?: string;
  };
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  mentorId: string;
  name: string;
  rating: number;
  totalReviews: number;
  tier: string;
  expertise: string;
  score: number;
  lastUpdated: string;
}

export interface LeaderboardStats {
  totalMentors: number;
  averageRating: number;
  topRating: number;
}

export interface Domain {
  domain: string;
  mentorCount: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export interface BookingForm {
  sessionType: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
}

export interface ReviewForm {
  rating: number;
  comment?: string;
}