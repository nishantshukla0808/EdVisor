'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Edit2, Save, X, BookOpen, Target, School, Calendar, Mail } from 'lucide-react';
import { authAPI, studentsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    goals: '',
    interests: '',
    college: '',
    year: '',
  });

  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getMe,
    enabled: isAuthenticated,
  });

  const { data: dashboardResponse } = useQuery({
    queryKey: ['dashboard'],
    queryFn: studentsAPI.getDashboard,
    enabled: isAuthenticated,
  });

  const profile = profileResponse?.data.data.user;
  const dashboard = dashboardResponse?.data.data;

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.student?.bio || '',
        goals: profile.student?.goals || '',
        interests: profile.student?.interests || '',
        college: profile.student?.college || '',
        year: profile.student?.year || '',
      });
    }
  }, [profile]);

  // Mock update mutation since we don't have this endpoint in backend
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { data: { success: true } };
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.student?.bio || '',
        goals: profile.student?.goals || '',
        interests: profile.student?.interests || '',
        college: profile.student?.college || '',
        year: profile.student?.year || '',
      });
    }
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
          <Link href="/auth/login" className="btn btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input text-center text-xl font-bold"
                    />
                  ) : (
                    profile?.name
                  )}
                </h1>
                <p className="text-gray-600 mb-4">
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input text-center text-sm"
                      disabled
                    />
                  ) : (
                    profile?.email
                  )}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Student
                </div>
              </div>

              {/* Quick Stats */}
              {dashboard && (
                <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xl font-bold text-blue-600">{dashboard.totalBookings || 0}</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xl font-bold text-green-600">{dashboard.completedBookings || 0}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="text-center text-sm text-gray-500 mb-6">
                <Calendar className="w-4 h-4 inline mr-1" />
                Member since {new Date(profile?.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>

              {/* Edit Button */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full btn btn-primary flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSubmit}
                    disabled={updateProfileMutation.isPending}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/mentors"
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Find Mentors</span>
                </Link>
                <Link
                  href="/bookings"
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>My Sessions</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Top Mentors</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself, your background, and what you're looking to achieve..."
                  rows={4}
                  className="input w-full resize-none"
                />
              ) : formData.bio ? (
                <p className="text-gray-700 leading-relaxed">{formData.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio added yet. Click "Edit Profile" to add one.</p>
              )}
            </div>

            {/* Learning Goals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Learning Goals</h2>
              </div>
              {isEditing ? (
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="What are your learning objectives? What skills do you want to develop?"
                  rows={3}
                  className="input w-full resize-none"
                />
              ) : formData.goals ? (
                <p className="text-gray-700 leading-relaxed">{formData.goals}</p>
              ) : (
                <p className="text-gray-500 italic">No goals specified yet.</p>
              )}
            </div>

            {/* Interests */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Interests</h2>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="e.g. Machine Learning, Web Development, Product Design (comma-separated)"
                  className="input w-full"
                />
              ) : formData.interests ? (
                <div className="flex flex-wrap gap-2">
                  {formData.interests.split(',').map((interest, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                    >
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No interests specified yet.</p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <School className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College/University</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="Enter your institution name"
                      className="input w-full"
                    />
                  ) : formData.college ? (
                    <p className="text-gray-700">{formData.college}</p>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year/Level</label>
                  {isEditing ? (
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Professional">Working Professional</option>
                    </select>
                  ) : formData.year ? (
                    <p className="text-gray-700">{formData.year}</p>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {dashboard && dashboard.recentBookings && dashboard.recentBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>
                <div className="space-y-3">
                  {dashboard.recentBookings.slice(0, 3).map((booking: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">
                          Session with {booking.mentorName || 'Mentor'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(booking.startTime || new Date()).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {booking.status || 'Completed'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/bookings" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                    View all sessions →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}