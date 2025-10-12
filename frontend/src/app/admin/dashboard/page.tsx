'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Briefcase,
  BookOpen,
  Star,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
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

function AdminDashboard() {
  const { user } = useAuth();
  
  // Mock data - replace with actual API calls
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: () => {
      // Mock overview data
      return Promise.resolve({
        totalStudents: 1247,
        totalMentors: 89,
        totalBookings: 2156,
        totalRevenue: 487650,
        platformRevenue: 131665, // 27% of total
        mentorPayouts: 355985, // 73% of total
        refunds: 12300,
        avgSessionRating: 4.7,
        sessionCompletionRate: 92,
      });
    },
  });

  const { data: monthlyGrowth } = useQuery({
    queryKey: ['adminMonthlyGrowth'],
    queryFn: () => {
      return Promise.resolve({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        students: [150, 220, 350, 450, 680, 890],
        mentors: [12, 18, 25, 32, 45, 58],
        bookings: [180, 260, 420, 590, 850, 1200],
      });
    },
  });

  const revenueChartData = {
    labels: ['Platform Revenue (27%)', 'Mentor Payouts (73%)'],
    datasets: [
      {
        data: [
          overview?.platformRevenue || 0,
          overview?.mentorPayouts || 0
        ],
        backgroundColor: [
          'rgb(239, 68, 68)', // Red for platform
          'rgb(34, 197, 94)', // Green for mentors
        ],
        borderColor: [
          'rgb(220, 38, 38)',
          'rgb(22, 163, 74)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const growthChartData = {
    labels: monthlyGrowth?.labels || [],
    datasets: [
      {
        label: 'Students',
        data: monthlyGrowth?.students || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Mentors',
        data: monthlyGrowth?.mentors || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const bookingsChartData = {
    labels: monthlyGrowth?.labels || [],
    datasets: [
      {
        label: 'Total Bookings',
        data: monthlyGrowth?.bookings || [],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64 flex-shrink-0" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Platform overview and key metrics</p>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={overview?.totalStudents?.toLocaleString() || 0}
              change="+23% this month"
              icon={Users}
              color="blue"
              loading={overviewLoading}
            />
            <StatCard
              title="Active Mentors"
              value={overview?.totalMentors || 0}
              change="+15% this month"
              icon={Briefcase}
              color="green"
              loading={overviewLoading}
            />
            <StatCard
              title="Total Bookings"
              value={overview?.totalBookings?.toLocaleString() || 0}
              change="+31% this month"
              icon={Calendar}
              color="purple"
              loading={overviewLoading}
            />
            <StatCard
              title="Platform Revenue"
              value={`₹${overview?.platformRevenue?.toLocaleString()}`}
              change="+18% this month"
              icon={DollarSign}
              color="red"
              loading={overviewLoading}
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Avg Session Rating"
              value={overview?.avgSessionRating || 0}
              icon={Star}
              color="orange"
              loading={overviewLoading}
            />
            <StatCard
              title="Completion Rate"
              value={`${overview?.sessionCompletionRate || 0}%`}
              icon={BookOpen}
              color="green"
              loading={overviewLoading}
            />
            <StatCard
              title="Total Refunds"
              value={`₹${overview?.refunds?.toLocaleString()}`}
              icon={RefreshCw}
              color="red"
              loading={overviewLoading}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Split Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Distribution</h2>
              <div className="h-64 flex items-center justify-center">
                <Pie 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} 
                />
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Growth</h2>
              <div className="h-64">
                <Line 
                  data={growthChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Bookings</h2>
            <div className="h-64">
              <Bar 
                data={bookingsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['ADMIN']} redirectTo="/admin/login">
      <AdminDashboard />
    </ProtectedRoute>
  );
}