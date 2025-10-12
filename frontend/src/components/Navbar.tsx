'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, BookOpen, Trophy, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EdVisor</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Navigation based on user role */}
            {!isAuthenticated ? (
              <>
                <Link
                  href="/mentors"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Find Mentors
                </Link>
                <Link
                  href="/leaderboard"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Leaderboard
                </Link>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Student Login
                  </Link>
                  <Link
                    href="/mentor/login"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Mentor Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn btn-primary"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Student Navigation */}
                {user?.role === 'STUDENT' && (
                  <>
                    <Link
                      href="/mentors"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Find Mentors
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Leaderboard
                    </Link>
                    <Link
                      href="/bookings"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      My Bookings
                    </Link>
                  </>
                )}
                
                {/* Mentor Navigation */}
                {user?.role === 'MENTOR' && (
                  <>
                    <Link
                      href="/mentor/dashboard"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/mentor/bookings"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Bookings
                    </Link>
                    <Link
                      href="/mentor/profile"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Profile
                    </Link>
                  </>
                )}
                
                {/* Admin Navigation */}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/mentors"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Mentors
                    </Link>
                    <Link
                      href="/admin/bookings"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Bookings
                    </Link>
                  </>
                )}
                
                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user?.role === 'ADMIN' ? 'bg-red-100' : 
                      user?.role === 'MENTOR' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <User className={`w-4 h-4 ${
                        user?.role === 'ADMIN' ? 'text-red-600' : 
                        user?.role === 'MENTOR' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <span>{user?.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user?.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 
                      user?.role === 'MENTOR' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {user?.role}
                    </span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        href={user?.role === 'STUDENT' ? '/profile' : 
                              user?.role === 'MENTOR' ? '/mentor/profile' : '/admin/dashboard'}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {user?.role === 'ADMIN' ? 'Admin Panel' : 'Profile'}
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="inline w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/mentors"
                className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Mentors
              </Link>
              <Link
                href="/leaderboard"
                className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/bookings"
                    className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 text-blue-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}