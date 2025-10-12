import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../server';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT Authentication middleware
 * Verifies Bearer token and attaches user to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers:', req.headers);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('Auth header:', authHeader);
    console.log('Token present:', !!token);
    console.log('Token length:', token?.length);

    if (!token) {
      console.log('ERROR: No token provided');
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    // Verify token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('Decoded token:', decoded);
    
    // Verify user still exists and is active
    console.log('Looking up user with ID:', decoded.userId);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        role: true,
        emailVerified: true 
      }
    });
    console.log('User found:', !!user);
    if (user) {
      console.log('User details:', { id: user.id, email: user.email, role: user.role });
    }

    if (!user) {
      console.log('ERROR: User not found in database');
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found or token expired'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    console.log('Authentication successful, user attached:', req.user);
    console.log('==============================');

    next();
  } catch (error) {
    console.log('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('JWT Error:', error.message);
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token is malformed or expired'
      });
    }
    console.log('Other auth error:', error);
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Requires user to have one of the specified roles
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('=== ROLE CHECK DEBUG ===');
    console.log('Required roles:', roles);
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.log('ERROR: No user attached to request');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    console.log('User role:', req.user.role);
    console.log('Role match:', roles.includes(req.user.role));
    
    if (!roles.includes(req.user.role)) {
      console.log('ERROR: Role check failed');
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    console.log('Role check passed');
    console.log('========================');
    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Student-only middleware  
 */
export const requireStudent = requireRole(['STUDENT']);

/**
 * Mentor-only middleware
 */
export const requireMentor = requireRole(['MENTOR']);