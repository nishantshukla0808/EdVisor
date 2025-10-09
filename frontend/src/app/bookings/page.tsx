'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Video, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ReviewModal from '@/components/ReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function BookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: bookingsAPI.getMyBookings,
    enabled: isAuthenticated,
  });

  const bookings = bookingsResponse?.data.data.bookings || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your bookings.</p>
          <Link href="/auth/login" className="btn btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const isSessionLive = (booking: any) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    return now >= startTime && now <= endTime && booking.status === 'CONFIRMED';
  };

  const canJoinSession = (booking: any) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    return minutesDiff <= 15 && minutesDiff >= -15 && booking.status === 'CONFIRMED';
  };

  const canLeaveReview = (booking: any) => {
    return booking.status === 'COMPLETED' && booking.payment?.status === 'COMPLETED' && !booking.review;
  };

  const filteredBookings = bookings.filter((booking: any) => {
    if (filter === 'upcoming') {
      return new Date(booking.startTime) > new Date() && booking.status === 'CONFIRMED';
    }
    if (filter === 'completed') {
      return booking.status === 'COMPLETED';
    }
    if (filter === 'cancelled') {
      return booking.status === 'CANCELLED';
    }
    return true;
  });

  const handleLeaveReview = (booking: any) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-lg text-gray-600">
            Manage your mentorship sessions and track your progress
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Sessions' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't booked any sessions yet." 
                : `No ${filter} sessions found.`}
            </p>
            <Link href="/mentors" className="btn btn-primary">
              Find Mentors
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {/* Mentor Avatar */}
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {booking.mentor?.avatar ? (
                          <img 
                            src={booking.mentor.avatar} 
                            alt={booking.mentor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      
                      {/* Session Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Session with {booking.mentor?.name || 'Mentor'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(booking.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {' - '}
                            {new Date(booking.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-900">Duration:</span>
                      <br />
                      <span className="text-gray-600">
                        {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60))} minutes
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-900">Amount:</span>
                      <br />
                      <span className="text-gray-600">
                        ₹{booking.payment?.amount || 0}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium text-gray-900">Payment:</span>
                      <br />
                      <span className={`${
                        booking.payment?.status === 'COMPLETED' 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {booking.payment?.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Session Notes:</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    {isSessionLive(booking) && (
                      <button className="btn bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <Video className="w-4 h-4" />
                        <span>Join Live Session</span>
                      </button>
                    )}
                    
                    {canJoinSession(booking) && !isSessionLive(booking) && (
                      <button className="btn btn-primary flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span>Join Session</span>
                      </button>
                    )}

                    {booking.meetingLink && booking.status === 'CONFIRMED' && (
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Meeting Link</span>
                      </a>
                    )}

                    {canLeaveReview(booking) && (
                      <button
                        onClick={() => handleLeaveReview(booking)}
                        className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center space-x-2"
                      >
                        <Star className="w-4 h-4" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {booking.review && (
                      <div className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 text-sm rounded">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span>Review submitted</span>
                      </div>
                    )}

                    <button className="btn btn-outline flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}