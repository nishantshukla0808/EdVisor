import express from 'express';
import Joi from 'joi';
import { prisma, slotLocks } from '../../server';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
  mentorId: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  durationMin: Joi.number().integer().min(30).max(180).required(),
  preQuestions: Joi.array().items(Joi.string().max(500)).max(5).default([]),
  priceTotal: Joi.number().min(0).required()
});

/**
 * POST /api/v1/bookings
 * Create new booking with slot locking
 */
router.post('/', authenticateToken, requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { mentorId, startTime, durationMin, preQuestions, priceTotal } = value;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Verify mentor exists and is available
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: { user: { select: { name: true } } }
    });

    if (!mentor || !mentor.isAvailable) {
      return res.status(404).json({ error: 'Mentor not available' });
    }

    // Validate price calculation
    const expectedPrice = Math.round((durationMin / 60) * mentor.hourlyRate);
    if (Math.abs(priceTotal - expectedPrice) > 100) { // Allow 1 rupee difference for rounding
      return res.status(400).json({
        error: 'Invalid price calculation',
        expected: expectedPrice,
        provided: priceTotal
      });
    }

    // Create slot lock key
    const slotKey = `${mentorId}-${startDate.toISOString()}`;
    
    // Check if slot is already locked or booked
    if (slotLocks.has(slotKey)) {
      return res.status(409).json({ 
        error: 'Time slot temporarily locked by another user',
        message: 'Please try again in a few minutes'
      });
    }

    // Check for existing booking conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        mentorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lte: startDate },
            endTime: { gt: startDate }
          },
          {
            startTime: { lt: endDate },
            endTime: { gte: endDate }
          },
          {
            startTime: { gte: startDate },
            endTime: { lte: endDate }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({ 
        error: 'Time slot already booked',
        message: 'Please select a different time slot'
      });
    }

    // Lock the slot for 5 minutes
    slotLocks.set(slotKey, {
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    // Create booking and payment record
    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        mentorId,
        startTime: startDate,
        endTime: endDate,
        status: 'PENDING',
        notes: preQuestions.join('\n\n'),
        payment: {
          create: {
            studentId: student.id,
            amount: priceTotal,
            currency: 'INR',
            status: 'PENDING'
          }
        }
      },
      include: {
        mentor: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        payment: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id: booking.id,
          mentorId: booking.mentorId,
          mentorName: booking.mentor.user.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          durationMin,
          status: booking.status,
          paymentStatus: booking.payment?.status,
          priceTotal: booking.payment?.amount || 0,
          notes: booking.notes,
          createdAt: booking.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/bookings/:id
 * Get single booking details
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: { select: { name: true, email: true, avatar: true } }
          }
        },
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } }
          }
        },
        payment: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check access permissions
    const isStudent = req.user!.role === 'STUDENT' && booking.student.userId === req.user!.id;
    const isMentor = req.user!.role === 'MENTOR' && booking.mentor.userId === req.user!.id;
    
    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock zoom link for confirmed bookings
    const mockZoomLink = booking.status === 'CONFIRMED' 
      ? `https://zoom.us/j/${Math.random().toString().substr(2, 10)}`
      : null;

    const responseData = {
      id: booking.id,
      mentorId: booking.mentorId,
      studentId: booking.studentId,
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.user.name,
        avatar: booking.mentor.user.avatar,
        email: booking.mentor.user.email
      },
      student: {
        id: booking.student.id,
        name: booking.student.user.name,
        avatar: booking.student.user.avatar,
        email: booking.student.user.email
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMin: Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 60000),
      status: booking.status,
      paymentStatus: booking.payment?.status,
      priceTotal: booking.payment?.amount || 0,
      notes: booking.notes,
      zoomLink: mockZoomLink,
      review: booking.review ? {
        id: booking.review.id,
        rating: booking.review.rating,
        comment: booking.review.comment,
        createdAt: booking.review.createdAt
      } : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    res.json({
      success: true,
      data: {
        booking: responseData
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;