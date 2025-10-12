'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MentorSidebar from '@/components/MentorSidebar';
import { mentorAPI } from '@/lib/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  DollarSign,
  Star,
  Video,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

function BookingCard({ booking, onComplete }: { booking: any; onComplete: (id: string) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60)); // minutes
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{booking.student.user.name}</h3>
            <p className="text-sm text-gray-500">{booking.student.user.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDate(booking.startTime)}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">
            ₹{booking.payment ? Math.round(booking.payment.amount / 100) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{getDuration(booking.startTime, booking.endTime)} mins</span>
        </div>
      </div>

      {booking.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Notes:</strong> {booking.notes}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {booking.meetingLink && (
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <Video className="w-4 h-4" />
              <span className="text-sm">Join Meeting</span>
            </button>
          )}
          {booking.review && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{booking.review.rating}/5</span>
            </div>
          )}
        </div>
        
        {booking.status === 'CONFIRMED' && (
          <button
            onClick={() => onComplete(booking.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark Complete</span>
          </button>
        )}
      </div>
    </div>
  );
}

function MentorBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['mentorBookings', statusFilter],
    queryFn: () => mentorAPI.getBookings(user?.id || '', { status: statusFilter }),
    enabled: !!user?.id,
  });

  // Complete booking mutation
  const completeBookingMutation = useMutation({
    mutationFn: (bookingId: string) => mentorAPI.completeBooking(bookingId),
    onSuccess: () => {
      toast.success('Session marked as completed!');
      queryClient.invalidateQueries({ queryKey: ['mentorBookings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to complete session');
    },
  });

  const handleCompleteBooking = (bookingId: string) => {
    completeBookingMutation.mutate(bookingId);
  };

  const bookings = bookingsData?.data.data.bookings || [];

  const statusCounts = {
    all: bookings.length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <MentorSidebar className="w-64 flex-shrink-0" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage your mentoring sessions</p>
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { key: '', label: 'All', count: statusCounts.all },
                { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
                { key: 'CONFIRMED', label: 'Confirmed', count: statusCounts.CONFIRMED },
                { key: 'COMPLETED', label: 'Completed', count: statusCounts.COMPLETED },
                { key: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={handleCompleteBooking}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {statusFilter ? `No ${statusFilter.toLowerCase()} bookings` : 'You haven\'t received any bookings yet'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MentorBookingsPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['MENTOR']} redirectTo="/mentor/login">
      <MentorBookings />
    </ProtectedRoute>
  );
}