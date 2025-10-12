import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken, requireMentor, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// All routes require mentor authentication
router.use(authenticateToken, requireMentor);

/**
 * GET /api/v1/mentor/profile
 * Get current mentor's profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    res.json({
      success: true,
      data: {
        ...mentor,
        user: mentor.user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/mentor/profile
 * Update mentor profile
 */
const updateProfileSchema = Joi.object({
  bio: Joi.string().max(1000),
  expertise: Joi.string().max(500),
  experience: Joi.number().integer().min(0).max(50),
  hourlyRate: Joi.number().integer().min(1000).max(1000000), // ₹10 - ₹10,000 per hour
  isAvailable: Joi.boolean()
});

router.put('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const mentor = await prisma.mentor.update({
      where: { userId: req.user!.id },
      data: value,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: mentor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentor/stats
 * Get current mentor's statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res, next) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    // Get stats from bookings
    const bookingStats = await prisma.booking.aggregate({
      where: {
        mentorId: mentor.id,
        status: 'COMPLETED'
      },
      _count: { id: true }
    });

    // Calculate total hours and earnings
    const completedBookings = await prisma.booking.findMany({
      where: {
        mentorId: mentor.id,
        status: 'COMPLETED'
      },
      include: {
        payment: true
      }
    });

    let totalHours = 0;
    let totalEarnings = 0;

    completedBookings.forEach(booking => {
      const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
      totalHours += duration;
      
      if (booking.payment && booking.payment.status === 'COMPLETED') {
        // Mentor gets 73% of payment
        totalEarnings += Math.round(booking.payment.amount * 0.73);
      }
    });

    res.json({
      success: true,
      data: {
        totalSessions: bookingStats._count.id,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        totalEarnings: totalEarnings,
        avgRating: mentor.rating,
        totalReviews: mentor.totalReviews,
        tier: mentor.tier,
        isAvailable: mentor.isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentor/bookings
 * Get mentor's bookings with filters
 */
const bookingsQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sortBy: Joi.string().valid('startTime', 'createdAt').default('startTime'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

router.get('/bookings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = bookingsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details[0].message
      });
    }

    const { status, page, limit, sortBy, sortOrder } = value;
    const skip = (page - 1) * limit;

    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    const where: any = { mentorId: mentor.id };
    if (status) {
      where.status = status;
    }

    const orderBy = { [sortBy]: sortOrder };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          },
          payment: true,
          review: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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
 * PUT /api/v1/mentor/bookings/:id/complete
 * Mark booking as completed
 */
router.put('/bookings/:id/complete', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        mentorId: mentor.id,
        status: 'CONFIRMED'
      }
    });

    if (!booking) {
      return res.status(404).json({ 
        error: 'Booking not found or cannot be completed' 
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Booking marked as completed',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentor/reviews
 * Get reviews for mentor
 */
router.get('/reviews', async (req: AuthenticatedRequest, res, next) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { mentorId: mentor.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
        booking: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: mentor.rating,
        totalReviews: mentor.totalReviews
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/mentor/payout
 * Request payout (mock implementation)
 */
const payoutRequestSchema = Joi.object({
  amount: Joi.number().integer().min(100).required(), // Minimum ₹1
  bankAccount: Joi.object({
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().required(),
    accountName: Joi.string().required()
  }).required()
});

router.post('/payout', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = payoutRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { amount, bankAccount } = value;

    // Mock payout request - in real implementation, this would integrate with payment provider
    const payoutRequest = {
      id: `payout_${Date.now()}`,
      mentorId: req.user!.id,
      amount,
      bankAccount,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      estimatedTransferDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
    };

    // In real implementation, save to database
    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payoutRequest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentor/:id/bookings  
 * Get mentor's bookings by mentor ID (for admin use)
 */
router.get('/:id/bookings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const mentor = await prisma.mentor.findUnique({
      where: { id }
    });
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    
    const where: any = { mentorId: id };
    if (status) {
      where.status = status;
    }
    
    const orderBy = { [sortBy as string]: sortOrder };
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          },
          payment: true,
          review: true
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.booking.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
          hasMore: skip + bookings.length < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentor/:id/reviews
 * Get mentor's reviews by mentor ID (for admin use)
 */
router.get('/:id/reviews', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const mentor = await prisma.mentor.findUnique({
      where: { id }
    });
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    
    const reviews = await prisma.review.findMany({
      where: { mentorId: id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
        booking: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: {
        reviews,
        averageRating: mentor.rating,
        totalReviews: mentor.totalReviews
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;