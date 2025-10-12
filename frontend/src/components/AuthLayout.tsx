'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  type: 'student' | 'mentor' | 'admin';
}

export default function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'student':
        return 'from-blue-600 to-blue-800';
      case 'mentor':
        return 'from-emerald-600 to-emerald-800';
      case 'admin':
        return 'from-purple-600 to-purple-800';
      default:
        return 'from-blue-600 to-blue-800';
    }
  };

  const getAlternativeLinks = () => {
    const links = [];
    if (type !== 'student') {
      links.push({ label: 'Student', href: '/auth/login' });
    }
    if (type !== 'mentor') {
      links.push({ label: 'Mentor', href: '/mentor/login' });
    }
    if (type !== 'admin') {
      links.push({ label: 'Admin', href: '/admin/login' });
    }
    return links;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${getTypeColor()} text-white py-8`}>
        <div className="max-w-md mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-white hover:text-gray-200 mb-6">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">EdVisor</span>
          </Link>
          
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          {subtitle && (
            <p className="text-lg opacity-90">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {children}
        </div>

        {/* Alternative login types */}
        {getAlternativeLinks().length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Looking for a different login?</p>
            <div className="flex justify-center space-x-4">
              {getAlternativeLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {link.label} Login
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}