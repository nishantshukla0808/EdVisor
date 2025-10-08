'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, User, LogOut, Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800">EdVisor</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/mentors" 
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              Find Mentors
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              Leaderboard
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login"
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/mentors" 
                className="text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Mentors
              </Link>
              <Link 
                href="/leaderboard" 
                className="text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-primary-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login"
                    className="text-gray-600 hover:text-primary-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
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