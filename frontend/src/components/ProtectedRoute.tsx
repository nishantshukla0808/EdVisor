'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  roleRedirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  allowedRoles,
  redirectTo = '/auth/login',
  roleRedirectTo = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Check role-based access
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push(roleRedirectTo);
        return;
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, allowedRoles, user, redirectTo, roleRedirectTo, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If role check fails, don't render children
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}