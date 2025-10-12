'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check JWT expiry
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() / 1000 > payload.exp;
    } catch {
      return true;
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('edvisor_token');
        if (token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            localStorage.removeItem('edvisor_token');
            localStorage.removeItem('edvisor_user');
            toast.error('Session expired. Please login again.');
            return;
          }

          const response = await authAPI.getMe();
          setUser(response.data.data.user);
        }
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('edvisor_token');
        localStorage.removeItem('edvisor_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto logout on token expiry
  useEffect(() => {
    if (user) {
      const checkTokenExpiry = () => {
        const token = localStorage.getItem('edvisor_token');
        if (token && isTokenExpired(token)) {
          logout();
          toast.error('Session expired. Please login again.');
        }
      };

      const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password: string, role?: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data.data;
      
      // Validate role if specified
      if (role && user.role !== role) {
        toast.error(`Please use the correct login page for your account type.`);
        return false;
      }
      
      localStorage.setItem('edvisor_token', token);
      localStorage.setItem('edvisor_user', JSON.stringify(user));
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      
      // Role-based redirect
      setTimeout(() => {
        router.push(getRedirectPath());
      }, 1000);
      
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.signup(name, email, password);
      const { user, token } = response.data.data;
      
      localStorage.setItem('edvisor_token', token);
      localStorage.setItem('edvisor_user', JSON.stringify(user));
      setUser(user);
      
      toast.success(`Welcome to EdVisor, ${user.name}!`);
      
      // Redirect to mentors page for new students
      setTimeout(() => {
        router.push('/mentors');
      }, 1000);
      
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Signup failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('edvisor_token');
    localStorage.removeItem('edvisor_user');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const getRedirectPath = (): string => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'STUDENT':
        return '/mentors';
      case 'MENTOR':
        return '/mentor/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated,
    hasRole,
    getRedirectPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}