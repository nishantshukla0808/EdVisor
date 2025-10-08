import express from 'express';
import Joi from 'joi';
import { prisma } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const createBookingSchema = Joi.object({
  mentorId: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  notes: Joi.string().optional()
});

// Create booking (students only)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can create bookings' });
    }

    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { mentorId, startTime, endTime, notes } = value;
    
    // Get student ID
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Validate mentor exists and is available
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId }
    });

    if (!mentor || !mentor.isAvailable) {
      return res.status(404).json({ error: 'Mentor not available' });
    }

    // Check for conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        mentorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gte: new Date(startTime) }
          },
          {
            startTime: { lte: new Date(endTime) },
            endTime: { gte: new Date(endTime) }
          },
          {
            startTime: { gte: new Date(startTime) },
            endTime: { lte: new Date(endTime) }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }

    // Calculate duration and amount
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60); // hours
    const amount = Math.round(duration * mentor.hourlyRate);

    const booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        mentorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
        payment: {
          create: {
            studentId: student.id,
            amount,
            currency: 'INR'
          }
        }
      },
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
        payment: true
      }
    });

    res.status(201).json({ 
      message: 'Booking created successfully',
      booking 
    });
  } catch (error) {
    next(error);
  }
});

// Get user's bookings
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (status) where.status = status;

    let bookings;
    
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      
      where.studentId = student.id;
      
      bookings = await prisma.booking.findMany({
        where,
        include: {
          mentor: {
            include: {
              user: { select: { name: true, email: true, avatar: true } }
            }
          },
          payment: true,
          review: true
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: Number(limit)
      });
    } else if (req.user!.role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor profile not found' });
      }
      
      where.mentorId = mentor.id;
      
      bookings = await prisma.booking.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, avatar: true } }
            }
          },
          payment: true,
          review: true
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: Number(limit)
      });
    }

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

// Update booking status
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { mentor: true, student: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions
    const canUpdate = (
      (req.user!.role === 'MENTOR' && booking.mentor.userId === req.user!.id) ||
      (req.user!.role === 'STUDENT' && booking.student.userId === req.user!.id)
    );

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
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
        payment: true
      }
    });

    res.json({ 
      message: 'Booking status updated successfully',
      booking: updatedBooking 
    });
  } catch (error) {
    next(error);
  }
});

export default router;