import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/v1/admin/overview
 * Get comprehensive admin dashboard overview
 */
router.get('/overview', async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      totalStudents,
      totalMentors,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalReviews,
      totalRevenue,
      refunds,
      avgRating,
      monthlyStats
    ] = await Promise.all([
      // User counts
      prisma.student.count(),
      prisma.mentor.count(),
      
      // Booking statistics
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      
      // Review count
      prisma.review.count(),
      
      // Revenue (completed payments)
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // Refunds
      prisma.payment.aggregate({
        where: { status: 'REFUNDED' },
        _sum: { amount: true }
      }),
      
      // Average rating
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
      
      // Monthly growth (last 6 months)
      Promise.all([
        ...Array.from({ length: 6 }, (_, i) => {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i);
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);
          
          return Promise.all([
            prisma.student.count({ where: { user: { createdAt: { gte: monthStart, lte: monthEnd } } } }),
            prisma.mentor.count({ where: { user: { createdAt: { gte: monthStart, lte: monthEnd } } } }),
            prisma.booking.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } })
          ]).then(([students, mentors, bookings]) => ({
            month: monthStart.toISOString().substr(0, 7),
            students,
            mentors, 
            bookings
          }));
        })
      ]).then(results => results.reverse())
    ]);
    
    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const refundsAmount = refunds._sum.amount || 0;
    const netRevenue = totalRevenueAmount - refundsAmount;
    
    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalMentors,
          totalBookings,
          completedBookings,
          pendingBookings,
          totalReviews,
          totalRevenue: Math.round(totalRevenueAmount / 100), // Convert to rupees
          refunds: Math.round(refundsAmount / 100),
          netRevenue: Math.round(netRevenue / 100),
          platformRevenue: Math.round(netRevenue * 0.27 / 100), // 27% platform fee
          mentorPayouts: Math.round(netRevenue * 0.73 / 100), // 73% to mentors
          avgRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
          completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
        },
        growth: monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/mentors
 * Get all mentors with filtering
 */
router.get('/mentors', async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      status,
      tier,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    // Filter by status
    if (status === 'active') {
      where.isAvailable = true;
    } else if (status === 'inactive') {
      where.isAvailable = false;
    }
    
    // Filter by tier
    if (tier && ['TIER1', 'TIER2', 'TIER3'].includes(tier as string)) {
      where.tier = tier;
    }
    
    // Search by name or email
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'totalReviews') {
      orderBy.totalReviews = sortOrder;
    } else {
      orderBy.user = { [sortBy as string]: sortOrder };
    }
    
    const [mentors, total] = await Promise.all([
      prisma.mentor.findMany({
        where,
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
          },
          bookings: {
            where: { status: 'COMPLETED' },
            select: { id: true }
          }
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.mentor.count({ where })
    ]);
    
    const formattedMentors = mentors.map(mentor => ({
      id: mentor.id,
      user: mentor.user,
      bio: mentor.bio,
      expertise: mentor.expertise,
      experience: mentor.experience,
      tier: mentor.tier,
      hourlyRate: Math.round(mentor.hourlyRate / 100),
      rating: mentor.rating,
      totalReviews: mentor.totalReviews,
      completedSessions: mentor.bookings.length,
      isAvailable: mentor.isAvailable,
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
 * PUT /api/v1/admin/mentors/:id/status
 * Update mentor status (active/inactive)
 */
router.put('/mentors/:id/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "active" or "inactive"'
      });
    }
    
    const isAvailable = status === 'active';
    
    const mentor = await prisma.mentor.update({
      where: { id },
      data: { isAvailable },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`Admin ${req.user!.email} set mentor ${mentor.user.email} status to ${status}`);
    
    res.json({
      success: true,
      message: `Mentor status updated to ${status}`,
      data: {
        mentorId: id,
        status,
        isAvailable
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    next(error);
  }
});

/**
 * GET /api/v1/admin/bookings
 * Get all bookings with filtering
 */
router.get('/bookings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    // Filter by status
    if (status && ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status as string)) {
      where.status = status;
    }
    
    // Search by student or mentor name
    if (search) {
      where.OR = [
        { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { mentor: { user: { name: { contains: search, mode: 'insensitive' } } } }
      ];
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
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          mentor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatar: true
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
    
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      student: {
        name: booking.student.user.name,
        email: booking.student.user.email,
        avatar: booking.student.user.avatar
      },
      mentor: {
        name: booking.mentor.user.name,
        email: booking.mentor.user.email,
        avatar: booking.mentor.user.avatar
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
      paymentStatus: booking.payment?.status || 'PENDING',
      paymentAmount: booking.payment ? Math.round(booking.payment.amount / 100) : 0,
      hasReview: !!booking.review,
      reviewRating: booking.review?.rating || null,
      createdAt: booking.createdAt
    }));
    
    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
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
 * GET /api/v1/admin/revenue
 * Get revenue analytics
 */
router.get('/revenue', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    let startDate: Date;
    const endDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const [
      totalRevenue,
      refunds,
      dailyRevenue
    ] = await Promise.all([
      // Total revenue in period
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Refunds in period
      prisma.payment.aggregate({
        where: {
          status: 'REFUNDED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true }
      }),
      
      // Daily revenue breakdown
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactions,
          SUM(amount) as revenue
        FROM payments 
        WHERE status = 'COMPLETED' 
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ]);
    
    const grossRevenue = totalRevenue._sum.amount || 0;
    const refundsAmount = refunds._sum.amount || 0;
    const netRevenue = grossRevenue - refundsAmount;
    const platformFee = Math.round(netRevenue * 0.27);
    const mentorPayouts = Math.round(netRevenue * 0.73);
    
    res.json({
      success: true,
      data: {
        timeRange,
        summary: {
          grossRevenue: Math.round(grossRevenue / 100),
          refunds: Math.round(refundsAmount / 100),
          netRevenue: Math.round(netRevenue / 100),
          platformRevenue: Math.round(platformFee / 100),
          mentorPayouts: Math.round(mentorPayouts / 100),
          totalTransactions: totalRevenue._count.id,
          currency: 'INR'
        },
        dailyBreakdown: (dailyRevenue as any[]).map(day => ({
          date: day.date,
          transactions: Number(day.transactions),
          revenue: Math.round(Number(day.revenue) / 100)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/ranking
 * Get leaderboard with filters
 */
router.get('/ranking', async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      domain,
      tier,
      timeRange = '30d'
    } = req.query;
    
    const where: any = {};
    
    if (domain) {
      where.expertise = { contains: domain, mode: 'insensitive' };
    }
    
    if (tier && ['TIER1', 'TIER2', 'TIER3'].includes(tier as string)) {
      where.tier = tier;
    }
    
    const ranking = await prisma.leaderboardCache.findMany({
      where,
      orderBy: { rank: 'asc' },
      take: 50
    });
    
    res.json({
      success: true,
      data: {
        ranking,
        filters: {
          domain: domain || 'all',
          tier: tier || 'all',
          timeRange
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

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