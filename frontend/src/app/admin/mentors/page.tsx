'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';
import { adminAPI } from '@/lib/api';
import { 
  Users, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Star,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

function MentorCard({ mentor, onStatusUpdate }: { mentor: any; onStatusUpdate: (id: string, status: string) => void }) {
  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TIER1':
        return 'bg-purple-100 text-purple-800';
      case 'TIER2':
        return 'bg-blue-100 text-blue-800';
      case 'TIER3':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{mentor.user.name}</h3>
            <p className="text-sm text-gray-500 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {mentor.user.email}
            </p>
            <p className="text-xs text-gray-400">
              Joined {formatDate(mentor.joinedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(mentor.tier)}`}>
            {mentor.tier}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mentor.isAvailable)}`}>
            {mentor.isAvailable ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {mentor.bio || 'No bio provided'}
        </p>
        <p className="text-sm text-blue-600 mt-1">
          <strong>Expertise:</strong> {mentor.expertise || 'Not specified'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Star className="w-4 h-4" />
          <span>{mentor.rating || 0}/5 ({mentor.totalReviews} reviews)</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>₹{mentor.hourlyRate}/hour</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{mentor.completedSessions} sessions</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Shield className="w-4 h-4" />
          <span>{mentor.experience} years exp.</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {mentor.user.emailVerified ? (
            <span className="text-green-600">✓ Email verified</span>
          ) : (
            <span className="text-red-600">✗ Email not verified</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {mentor.isAvailable ? (
            <button
              onClick={() => onStatusUpdate(mentor.id, 'inactive')}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-3 h-3" />
              <span>Deactivate</span>
            </button>
          ) : (
            <button
              onClick={() => onStatusUpdate(mentor.id, 'active')}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Activate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminMentors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  // Fetch mentors
  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ['adminMentors', searchTerm, statusFilter, tierFilter],
    queryFn: () => adminAPI.getMentors({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      tier: tierFilter || undefined,
    }),
  });

  // Update mentor status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ mentorId, status }: { mentorId: string; status: string }) =>
      adminAPI.updateMentorStatus(mentorId, status),
    onSuccess: (_, variables) => {
      toast.success(`Mentor ${variables.status === 'active' ? 'activated' : 'deactivated'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['adminMentors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update mentor status');
    },
  });

  const handleStatusUpdate = (mentorId: string, status: string) => {
    updateStatusMutation.mutate({ mentorId, status });
  };

  const mentors = mentorsData?.data.data.mentors || [];
  const pagination = mentorsData?.data.data.pagination;

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter(m => m.isAvailable).length;
  const inactiveMentors = totalMentors - activeMentors;

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64 flex-shrink-0" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mentor Management</h1>
            <p className="text-gray-600 mt-2">Manage and monitor mentor accounts</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mentors</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMentors}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Mentors</p>
                  <p className="text-2xl font-bold text-green-600">{activeMentors}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive Mentors</p>
                  <p className="text-2xl font-bold text-red-600">{inactiveMentors}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search mentors by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tiers</option>
                  <option value="TIER1">Tier 1</option>
                  <option value="TIER2">Tier 2</option>
                  <option value="TIER3">Tier 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentors List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : mentors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
              
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Showing {mentors.length} of {pagination.total} mentors
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter || tierFilter 
                  ? 'No mentors match your current filters' 
                  : 'No mentors have been registered yet'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminMentorsPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['ADMIN']} redirectTo="/admin/login">
      <AdminMentors />
    </ProtectedRoute>
  );
}