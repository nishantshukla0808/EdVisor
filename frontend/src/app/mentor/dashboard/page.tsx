'use client';

import { useQuery } from '@tanstack/react-query';
import { mentorAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MentorSidebar from '@/components/MentorSidebar';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  loading = false 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function MentorDashboard() {
  const { user } = useAuth();
  
  // Mock data for now - replace with actual API calls
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['mentorStats', user?.id],
    queryFn: () => {
      // Mock stats - replace with actual API call
      return Promise.resolve({
        totalEarnings: 15420,
        sessionsCount: 45,
        totalHours: 67,
        avgRating: 4.8,
        upcomingSessions: 8,
        completionRate: 94,
      });
    },
    enabled: !!user?.id,
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['mentorRecentBookings', user?.id],
    queryFn: () => {
      // Mock bookings - replace with actual API call
      return Promise.resolve([
        {
          id: '1',
          studentName: 'Alice Johnson',
          date: '2024-01-15',
          time: '2:00 PM - 3:00 PM',
          status: 'CONFIRMED',
          topic: 'Career Guidance'
        },
        {
          id: '2', 
          studentName: 'Bob Smith',
          date: '2024-01-16',
          time: '10:00 AM - 11:00 AM',
          status: 'PENDING',
          topic: 'Resume Review'
        },
      ]);
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <MentorSidebar className="w-64 flex-shrink-0" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Here's your mentoring overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Earnings"
              value={`₹${stats?.totalEarnings?.toLocaleString()}`}
              change="+12% from last month"
              icon={DollarSign}
              color="green"
              loading={statsLoading}
            />
            <StatCard
              title="Sessions Completed"
              value={stats?.sessionsCount || 0}
              change="+8 this month"
              icon={Calendar}
              color="blue"
              loading={statsLoading}
            />
            <StatCard
              title="Hours Taught"
              value={`${stats?.totalHours || 0}h`}
              change="+15h this month"
              icon={Clock}
              color="purple"
              loading={statsLoading}
            />
            <StatCard
              title="Average Rating"
              value={stats?.avgRating || 0}
              change="From 234 reviews"
              icon={Star}
              color="orange"
              loading={statsLoading}
            />
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatCard
              title="Upcoming Sessions"
              value={stats?.upcomingSessions || 0}
              icon={Users}
              color="blue"
              loading={statsLoading}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats?.completionRate || 0}%`}
              icon={TrendingUp}
              color="green"
              loading={statsLoading}
            />
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
              <p className="text-gray-600 mt-1">Your latest scheduled sessions</p>
            </div>
            
            <div className="p-6">
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : recentBookings?.length ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{booking.studentName}</h3>
                        <p className="text-sm text-gray-600">{booking.topic}</p>
                        <p className="text-xs text-gray-500">{booking.date} • {booking.time}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent bookings</h3>
                  <p className="text-gray-600">Your upcoming sessions will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
              <Calendar className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Manage Bookings</h3>
              <p className="text-blue-100 text-sm">View and manage your scheduled sessions</p>
            </button>
            
            <button className="p-6 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors">
              <DollarSign className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Withdraw Earnings</h3>
              <p className="text-emerald-100 text-sm">Request payout of your earnings</p>
            </button>
            
            <button className="p-6 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors">
              <Star className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">View Reviews</h3>
              <p className="text-purple-100 text-sm">Check feedback from your students</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MentorDashboardPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['MENTOR']} redirectTo="/mentor/login">
      <MentorDashboard />
    </ProtectedRoute>
  );
}