export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  student?: Student;
  mentor?: Mentor;
}

export interface Student {
  id: string;
  userId: string;
  bio?: string;
  goals: string[];
  interests: string[];
}

export interface Mentor {
  id: string;
  userId: string;
  bio: string;
  expertise: string[];
  experience: number;
  tier: 'TIER1' | 'TIER2' | 'TIER3';
  hourlyRate: number;
  availability: any;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
  user?: {
    name: string;
    avatar?: string;
    email: string;
  };
  reviews?: Review[];
}

export interface Booking {
  id: string;
  studentId: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
  };
  mentor?: {
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
  };
  payment?: Payment;
  review?: Review;
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student?: {
    user: {
      name: string;
      avatar?: string;
    };
  };
  mentor?: {
    user: {
      name: string;
      avatar?: string;
    };
  };
  booking?: {
    startTime: string;
    endTime: string;
  };
}

export interface Payment {
  id: string;
  bookingId: string;
  studentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  razorpayId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    mentor: {
      user: {
        name: string;
        avatar?: string;
      };
    };
  };
}

export interface LeaderboardEntry {
  id: string;
  mentorId: string;
  mentorName: string;
  rating: number;
  totalReviews: number;
  tier: 'TIER1' | 'TIER2' | 'TIER3';
  expertise: string[];
  rank: number;
  updatedAt: string;
}