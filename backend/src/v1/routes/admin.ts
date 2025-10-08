import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/v1/admin/ranking/compute
 * Recompute cached rankings for all mentors (admin only)
 */
router.post('/ranking/compute', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    console.log(`Admin ${req.user!.email} initiated ranking computation`);
    
    // Get all mentors with their current stats
    const mentors = await prisma.mentor.findMany({
      include: {
        user: { select: { name: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ]
    });

    const computationResults = {
      processed: 0,
      updated: 0,
      created: 0,
      errors: 0
    };

    // Process each mentor
    for (let i = 0; i < mentors.length; i++) {
      const mentor = mentors[i];
      
      try {
        // Recalculate rating from reviews
        const reviews = mentor.reviews;
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
          : 0;

        // Update mentor's rating if different
        if (Math.abs(mentor.rating - averageRating) > 0.01 || mentor.totalReviews !== totalReviews) {
          await prisma.mentor.update({
            where: { id: mentor.id },
            data: {
              rating: Math.round(averageRating * 10) / 10,
              totalReviews
            }
          });
        }

        // Check if leaderboard cache exists
        const existingCache = await prisma.leaderboardCache.findUnique({
          where: { mentorId: mentor.id }
        });

        const cacheData = {
          mentorId: mentor.id,
          mentorName: mentor.user.name,
          rating: Math.round(averageRating * 10) / 10,
          totalReviews,
          tier: mentor.tier,
          expertise: mentor.expertise,
          rank: i + 1
        };

        if (existingCache) {
          await prisma.leaderboardCache.update({
            where: { mentorId: mentor.id },
            data: cacheData
          });
          computationResults.updated++;
        } else {
          await prisma.leaderboardCache.create({
            data: cacheData
          });
          computationResults.created++;
        }

        computationResults.processed++;
      } catch (error) {
        console.error(`Error processing mentor ${mentor.id}:`, error);
        computationResults.errors++;
      }
    }

    // Clean up orphaned cache entries
    const allMentorIds = mentors.map(m => m.id);
    const orphanedEntries = await prisma.leaderboardCache.findMany({
      where: {
        mentorId: {
          notIn: allMentorIds
        }
      }
    });

    if (orphanedEntries.length > 0) {
      await prisma.leaderboardCache.deleteMany({
        where: {
          mentorId: {
            notIn: allMentorIds
          }
        }
      });
    }

    console.log('Ranking computation completed:', computationResults);

    res.json({
      success: true,
      message: 'Ranking computation completed successfully',
      data: {
        results: {
          ...computationResults,
          orphanedCleaned: orphanedEntries.length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/mentors/pending
 * List pending mentors for verification (admin only)
 */
router.get('/mentors/pending', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get mentors that might need verification
    // For now, we'll show mentors with low review counts or recently joined
    const [pendingMentors, total] = await Promise.all([
      prisma.mentor.findMany({
        where: {
          OR: [
            { totalReviews: { lt: 3 } }, // Less than 3 reviews
            { user: { emailVerified: false } }, // Email not verified
            { 
              user: { 
                createdAt: { 
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Created in last 30 days
                } 
              } 
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              emailVerified: true,
              createdAt: true
            }
          }
        },
        orderBy: { user: { createdAt: 'desc' } },
        skip,
        take: Number(limit)
      }),

      prisma.mentor.count({
        where: {
          OR: [
            { totalReviews: { lt: 3 } },
            { user: { emailVerified: false } },
            { 
              user: { 
                createdAt: { 
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
                } 
              } 
            }
          ]
        }
      })
    ]);

    const formattedMentors = pendingMentors.map(mentor => ({
      id: mentor.id,
      user: mentor.user,
      bio: mentor.bio,
      expertise: mentor.expertise,
      experience: mentor.experience,
      tier: mentor.tier,
      pricePerHour: Math.round(mentor.hourlyRate / 100),
      rating: mentor.rating,
      totalReviews: mentor.totalReviews,
      isAvailable: mentor.isAvailable,
      verificationStatus: getVerificationStatus(mentor),
      joinedAt: mentor.user.createdAt
    }));

    res.json({
      success: true,
      data: {
        mentors: formattedMentors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/mentors/:id/verify
 * Verify a mentor (admin only)
 */
router.post('/mentors/:id/verify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;

    const mentor = await prisma.mentor.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Update mentor availability based on verification
    await prisma.mentor.update({
      where: { id },
      data: { isAvailable: verified }
    });

    // Update user email verification if needed
    if (verified && !mentor.user.emailVerified) {
      await prisma.user.update({
        where: { id: mentor.userId },
        data: { emailVerified: true }
      });
    }

    console.log(`Admin ${req.user!.email} ${verified ? 'verified' : 'rejected'} mentor ${mentor.user.email}`);
    if (notes) {
      console.log(`Verification notes: ${notes}`);
    }

    res.json({
      success: true,
      message: `Mentor ${verified ? 'verified' : 'rejected'} successfully`,
      data: {
        mentorId: id,
        verified,
        notes: notes || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      totalUsers,
      totalMentors,
      totalStudents,
      totalBookings,
      totalReviews,
      totalRevenue,
      recentBookings,
      topMentors
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      
      // Mentor count
      prisma.mentor.count(),
      
      // Student count
      prisma.student.count(),
      
      // Booking statistics
      prisma.booking.count(),
      
      // Review count
      prisma.review.count(),
      
      // Revenue (completed payments)
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // Recent bookings
      prisma.booking.findMany({
        include: {
          mentor: { include: { user: { select: { name: true } } } },
          student: { include: { user: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top mentors by rating
      prisma.mentor.findMany({
        where: { totalReviews: { gte: 1 } },
        include: { user: { select: { name: true } } },
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' }
        ],
        take: 5
      })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        mentors: totalMentors,
        students: totalStudents
      },
      bookings: {
        total: totalBookings
      },
      reviews: {
        total: totalReviews
      },
      revenue: {
        total: Math.round((totalRevenue._sum.amount || 0) / 100), // Convert to rupees
        currency: 'INR'
      },
      recent: {
        bookings: recentBookings.map(booking => ({
          id: booking.id,
          student: booking.student.user.name,
          mentor: booking.mentor.user.name,
          status: booking.status,
          createdAt: booking.createdAt
        }))
      },
      topMentors: topMentors.map((mentor, index) => ({
        rank: index + 1,
        name: mentor.user.name,
        rating: mentor.rating,
        totalReviews: mentor.totalReviews,
        tier: mentor.tier
      }))
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to determine verification status
 */
function getVerificationStatus(mentor: any): 'pending' | 'needs_review' | 'new' {
  if (!mentor.user.emailVerified) {
    return 'pending';
  }
  
  if (mentor.totalReviews < 3) {
    return 'needs_review';
  }
  
  const joinedRecently = new Date(mentor.user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (joinedRecently) {
    return 'new';
  }
  
  return 'needs_review';
}

export default router;