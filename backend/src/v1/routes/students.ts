import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schema
const bookingsQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

/**
 * GET /api/v1/students/:id/bookings
 * Get all bookings for a specific student
 */
router.get('/:id/bookings', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id: studentId } = req.params;
    const { error, value } = bookingsQuerySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details[0].message
      });
    }

    const { status, page, limit } = value;
    const skip = (page - 1) * limit;

    // Verify student exists and belongs to authenticated user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true } } }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if requesting user is the student owner or admin
    if (req.user!.role !== 'ADMIN' && student.user.id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query filters
    const where: any = { studentId };
    if (status) {
      where.status = status;
    }

    // Get bookings with related data
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          mentor: {
            include: {
              user: { 
                select: { 
                  id: true, 
                  name: true, 
                  avatar: true 
                } 
              }
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true
            }
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    // Format response data
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.user.name,
        avatar: booking.mentor.user.avatar,
        tier: booking.mentor.tier,
        expertise: booking.mentor.expertise
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMin: Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 60000),
      status: booking.status,
      payment: booking.payment ? {
        id: booking.payment.id,
        amount: booking.payment.amount,
        currency: booking.payment.currency,
        status: booking.payment.status,
        createdAt: booking.payment.createdAt
      } : null,
      review: booking.review,
      meetingLink: booking.meetingLink,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: skip + bookings.length < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/students/me/bookings
 * Get current authenticated student's bookings
 */
router.get('/me/bookings', authenticateToken, requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = bookingsQuerySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details[0].message
      });
    }

    // Get current student
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get bookings for current student
    const { status, page, limit } = value;
    const skip = (page - 1) * limit;

    // Build query filters
    const where: any = { studentId: student.id };
    if (status) {
      where.status = status;
    }

    // Get bookings with related data
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          mentor: {
            include: {
              user: { 
                select: { 
                  id: true, 
                  name: true, 
                  avatar: true 
                } 
              }
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true
            }
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    // Format response data
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.user.name,
        avatar: booking.mentor.user.avatar,
        tier: booking.mentor.tier,
        expertise: booking.mentor.expertise
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMin: Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 60000),
      status: booking.status,
      payment: booking.payment ? {
        id: booking.payment.id,
        amount: booking.payment.amount,
        currency: booking.payment.currency,
        status: booking.payment.status,
        createdAt: booking.payment.createdAt
      } : null,
      review: booking.review,
      meetingLink: booking.meetingLink,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: skip + bookings.length < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/students/me/dashboard
 * Get student dashboard data
 */
router.get('/me/dashboard', authenticateToken, requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get dashboard statistics
    const [
      totalBookings,
      completedSessions,
      upcomingBookings,
      totalSpent,
      recentBookings
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count({
        where: { studentId: student.id }
      }),
      
      // Completed sessions count
      prisma.booking.count({
        where: { 
          studentId: student.id,
          status: 'COMPLETED'
        }
      }),
      
      // Upcoming bookings
      prisma.booking.findMany({
        where: {
          studentId: student.id,
          status: 'CONFIRMED',
          startTime: { gte: new Date() }
        },
        include: {
          mentor: {
            include: {
              user: { select: { name: true, avatar: true } }
            }
          }
        },
        orderBy: { startTime: 'asc' },
        take: 3
      }),
      
      // Total amount spent
      prisma.payment.aggregate({
        where: {
          studentId: student.id,
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      
      // Recent bookings
      prisma.booking.findMany({
        where: { studentId: student.id },
        include: {
          mentor: {
            include: {
              user: { select: { name: true, avatar: true } }
            }
          },
          review: { select: { rating: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Format upcoming bookings
    const formattedUpcoming = upcomingBookings.map(booking => ({
      id: booking.id,
      mentor: {
        name: booking.mentor.user.name,
        avatar: booking.mentor.user.avatar
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      meetingLink: booking.meetingLink
    }));

    // Format recent bookings
    const formattedRecent = recentBookings.map(booking => ({
      id: booking.id,
      mentor: {
        name: booking.mentor.user.name,
        avatar: booking.mentor.user.avatar
      },
      startTime: booking.startTime,
      status: booking.status,
      hasReview: !!booking.review
    }));

    const dashboardData = {
      stats: {
        totalBookings,
        completedSessions,
        upcomingBookings: upcomingBookings.length,
        totalSpent: Math.round((totalSpent._sum.amount || 0) / 100) // Convert to rupees
      },
      upcomingBookings: formattedUpcoming,
      recentBookings: formattedRecent
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
});

export default router;