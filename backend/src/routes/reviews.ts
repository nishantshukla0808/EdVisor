import express from 'express';
import Joi from 'joi';
import { prisma } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const createReviewSchema = Joi.object({
  bookingId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional()
});

// Create review (students only, after completed booking)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can create reviews' });
    }

    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { bookingId, rating, comment } = value;

    // Verify booking exists and belongs to student
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        student: true,
        mentor: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.student.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    if (booking.review) {
      return res.status(409).json({ error: 'Review already exists for this booking' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        studentId: booking.student.id,
        mentorId: booking.mentor.id,
        rating,
        comment
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        },
        booking: true
      }
    });

    // Update mentor's rating
    const mentorReviews = await prisma.review.findMany({
      where: { mentorId: booking.mentor.id }
    });

    const totalRating = mentorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / mentorReviews.length;

    await prisma.mentor.update({
      where: { id: booking.mentor.id },
      data: {
        rating: averageRating,
        totalReviews: mentorReviews.length
      }
    });

    // Update leaderboard cache
    await updateLeaderboardCache(booking.mentor.id);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    next(error);
  }
});

// Get reviews for a mentor
router.get('/mentor/:mentorId', async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { mentorId },
        include: {
          student: {
            include: {
              user: { select: { name: true, avatar: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.review.count({ where: { mentorId } })
    ]);

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's reviews (student's reviews they've written)
router.get('/my-reviews', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can view their reviews' });
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { studentId: student.id },
      include: {
        mentor: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        },
        booking: {
          select: { startTime: true, endTime: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

// Update leaderboard cache helper function
async function updateLeaderboardCache(mentorId: string) {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!mentor) return;

    const existingCache = await prisma.leaderboardCache.findUnique({
      where: { mentorId }
    });

    const cacheData = {
      mentorId,
      mentorName: mentor.user.name,
      rating: mentor.rating,
      totalReviews: mentor.totalReviews,
      tier: mentor.tier,
      expertise: mentor.expertise,
      rank: 0 // Will be calculated separately
    };

    if (existingCache) {
      await prisma.leaderboardCache.update({
        where: { mentorId },
        data: cacheData
      });
    } else {
      await prisma.leaderboardCache.create({
        data: cacheData
      });
    }

    // Update ranks
    const allCacheEntries = await prisma.leaderboardCache.findMany({
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ]
    });

    // Update ranks in batch
    for (let i = 0; i < allCacheEntries.length; i++) {
      await prisma.leaderboardCache.update({
        where: { id: allCacheEntries[i].id },
        data: { rank: i + 1 }
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard cache:', error);
  }
}

export default router;