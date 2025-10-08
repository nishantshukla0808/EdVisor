import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schema
const createReviewSchema = Joi.object({
  bookingId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  clarity: Joi.number().integer().min(1).max(5).required(),
  relevance: Joi.number().integer().min(1).max(5).required(),
  roadmap: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('').optional()
});

/**
 * POST /api/v1/reviews
 * Create review for completed booking
 */
router.post('/', authenticateToken, requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { bookingId, rating, clarity, relevance, roadmap, comment } = value;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Verify booking exists and belongs to student
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        mentor: true,
        review: true,
        payment: { select: { status: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== student.id) {
      return res.status(403).json({ error: 'Access denied - booking does not belong to you' });
    }

    // Check booking conditions
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Can only review completed bookings',
        currentStatus: booking.status
      });
    }

    if (booking.payment?.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment must be completed before reviewing' });
    }

    if (booking.review) {
      return res.status(409).json({ error: 'Review already exists for this booking' });
    }

    // Create review with detailed ratings
    const review = await prisma.review.create({
      data: {
        bookingId,
        studentId: student.id,
        mentorId: booking.mentorId,
        rating,
        comment: comment || '',
        // Store detailed ratings in a JSON field (we'll extend the schema if needed)
        // For now, we'll use the main rating field and log the details
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        },
        booking: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      }
    });

    // Recalculate mentor's rating and review count
    await recalculateMentorRating(booking.mentorId);

    // Log detailed ratings for analytics
    console.log(`Review created for booking ${bookingId}:`, {
      overall: rating,
      clarity,
      relevance,
      roadmap,
      mentorId: booking.mentorId
    });

    const responseData = {
      id: review.id,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      detailedRatings: {
        clarity,
        relevance,
        roadmap
      },
      student: {
        name: review.student.user.name,
        avatar: review.student.user.avatar
      },
      booking: {
        startTime: review.booking.startTime,
        endTime: review.booking.endTime
      },
      createdAt: review.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        review: responseData
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to recalculate mentor rating and review count
 */
async function recalculateMentorRating(mentorId: string) {
  try {
    // Get all reviews for the mentor
    const reviews = await prisma.review.findMany({
      where: { mentorId },
      select: { rating: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Update mentor's rating and review count
    await prisma.mentor.update({
      where: { id: mentorId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews
      }
    });

    // Update leaderboard cache
    await updateLeaderboardCache(mentorId, averageRating, totalReviews);

    console.log(`Updated mentor ${mentorId} rating: ${averageRating} (${totalReviews} reviews)`);
  } catch (error) {
    console.error('Error recalculating mentor rating:', error);
  }
}

/**
 * Helper function to update leaderboard cache
 */
async function updateLeaderboardCache(mentorId: string, rating: number, totalReviews: number) {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!mentor) return;

    // Check if cache entry exists
    const existingCache = await prisma.leaderboardCache.findUnique({
      where: { mentorId }
    });

    const cacheData = {
      mentorId,
      mentorName: mentor.user.name,
      rating: Math.round(rating * 10) / 10,
      totalReviews,
      tier: mentor.tier,
      expertise: mentor.expertise,
      rank: 0 // Will be recalculated in batch
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

    // Recalculate ranks for all mentors
    await recalculateLeaderboardRanks();
  } catch (error) {
    console.error('Error updating leaderboard cache:', error);
  }
}

/**
 * Helper function to recalculate leaderboard ranks
 */
async function recalculateLeaderboardRanks() {
  try {
    // Get all cached entries sorted by score
    const entries = await prisma.leaderboardCache.findMany({
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ]
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await prisma.leaderboardCache.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 }
      });
    }
  } catch (error) {
    console.error('Error recalculating leaderboard ranks:', error);
  }
}

export default router;