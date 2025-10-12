'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar,
  Users,
  Badge,
  User,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { mentorsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import BookingModal from '@/components/BookingModal';
import { useAuth } from '@/contexts/AuthContext';

export default function MentorProfilePage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: mentorResponse, isLoading } = useQuery({
    queryKey: ['mentor', id],
    queryFn: () => mentorsAPI.getMentor(id as string),
    enabled: !!id,
  });

  const mentor = mentorResponse?.data.data.mentor;

  // Debug logging to understand data structure
  console.log('Mentor data:', mentor);
  console.log('Mentor user:', mentor?.user);

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

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mentor Not Found</h1>
          <Link href="/mentors" className="btn btn-primary">
            Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  const expertiseList = mentor.expertise.split(',').map((skill: string) => skill.trim());
  const availability = mentor.availability || null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TIER1':
        return 'bg-green-100 text-green-800';
      case 'TIER2':
        return 'bg-blue-100 text-blue-800';
      case 'TIER3':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookSession = () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/mentors"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Mentors
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Mentor Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(mentor.user?.avatar || mentor.avatar) ? (
                    <img 
                      src={mentor.user?.avatar || mentor.avatar} 
                      alt={mentor.user?.name || mentor.name || 'Mentor'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{mentor.user?.name || mentor.name || 'Unknown Mentor'}</h1>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getTierColor(mentor.tier)}`}>
                  <Award className="w-4 h-4 mr-1" />
                  {mentor.tier}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(mentor.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">{mentor.rating}</span>
                <span className="ml-1 text-gray-500">({mentor.totalReviews} reviews)</span>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{mentor.experience}</div>
                  <div className="text-sm text-gray-500">Years Experience</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">₹{mentor.hourlyRate}</div>
                  <div className="text-sm text-gray-500">Per Hour</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    {mentor.institution?.name || 'Global'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    {availability?.timezone || 'IST (UTC+5:30)'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${mentor.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-gray-600">
                    {mentor.isAvailable ? 'Available for sessions' : 'Currently unavailable'}
                  </span>
                </div>
              </div>

              {/* Book Session Button */}
              <button
                onClick={handleBookSession}
                disabled={!mentor.isAvailable}
                className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mentor.isAvailable ? 'Book Session' : 'Currently Unavailable'}
              </button>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { key: 'about', label: 'About', icon: User },
                    { key: 'reviews', label: 'Reviews', icon: Star },
                    { key: 'availability', label: 'Availability', icon: Calendar }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                      <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {expertiseList.map((skill: string, index: number) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {mentor.institution && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution</h3>
                        <div className="flex items-center space-x-3">
                          {mentor.institution.logo && (
                            <img 
                              src={mentor.institution.logo} 
                              alt={mentor.institution.name}
                              className="w-10 h-10 rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{mentor.institution.name}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Learn</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          Industry-specific knowledge and best practices
                        </li>
                        <li className="flex items-start">
                          <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          Career guidance and roadmap planning
                        </li>
                        <li className="flex items-start">
                          <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          Hands-on project feedback and improvement
                        </li>
                        <li className="flex items-start">
                          <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          Interview preparation and skill assessment
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Reviews ({mentor.totalReviews})
                      </h3>
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">{mentor.rating}</span>
                        <span className="text-gray-500 ml-1">average</span>
                      </div>
                    </div>

                    {/* Mock Reviews */}
                    {mentor.totalReviews > 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: Math.min(5, mentor.totalReviews) }, (_, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-gray-900">Student {i + 1}</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, star) => (
                                      <Star 
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star < 4 + (i % 2) 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {Math.floor(Math.random() * 30) + 1} days ago
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm">
                                  Great session! {mentor.user?.name || mentor.name || 'The mentor'} provided excellent guidance and practical insights. 
                                  The session was well-structured and very helpful for my career growth.
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No reviews yet. Be the first to book a session!
                      </div>
                    )}
                  </div>
                )}

                {/* Availability Tab */}
                {activeTab === 'availability' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
                    
                    {availability ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Timezone</h4>
                          <p className="text-blue-700">{availability.timezone}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Weekly Schedule</h4>
                          <div className="space-y-3">
                            {availability.slots?.map((slot: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-900 capitalize">{slot.day}</span>
                                <div className="flex flex-wrap gap-2">
                                  {slot.times.map((time: string, timeIndex: number) => (
                                    <span key={timeIndex} className="px-2 py-1 bg-white text-gray-700 text-sm rounded border">
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                          Flexible scheduling available. Discuss timing during booking.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          mentor={mentor}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}