'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Clock, 
  Star, 
  LogOut,
  Briefcase
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/mentor/bookings', icon: Calendar },
  { name: 'Profile', href: '/mentor/profile', icon: User },
  { name: 'Availability', href: '/mentor/availability', icon: Clock },
  { name: 'Reviews', href: '/mentor/reviews', icon: Star },
];

interface MentorSidebarProps {
  className?: string;
}

export default function MentorSidebar({ className = '' }: MentorSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">EdVisor</h1>
            <p className="text-sm text-blue-600">Mentor Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">Mentor Account</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign out
        </button>
      </div>
    </div>
  );
}