import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';

const router = express.Router();

// Query validation schema
const leaderboardQuerySchema = Joi.object({
  domain: Joi.string().max(50).optional(),
  tier: Joi.string().valid('TIER1', 'TIER2', 'TIER3').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  minReviews: Joi.number().integer().min(0).default(1)
});

/**
 * GET /api/v1/leaderboard
 * Get top mentors leaderboard with optional domain filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = leaderboardQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details[0].message
      });
    }

    const { domain, tier, limit, minReviews } = value;

    // Build where clause for filtering
    const where: any = {
      totalReviews: { gte: minReviews }
    };

    if (domain) {
      where.expertise = { contains: domain };
    }

    if (tier) {
      where.tier = tier;
    }

    // Get leaderboard data from cache or calculate fresh
    let leaderboard;
    
    // Try to get from cache first
    const cachedResults = await prisma.leaderboardCache.findMany({
      where,
      orderBy: { rank: 'asc' },
      take: limit
    });

    if (cachedResults.length > 0) {
      // Use cached data
      leaderboard = cachedResults.map((entry, index) => ({
        rank: entry.rank,
        mentorId: entry.mentorId,
        name: entry.mentorName,
        rating: entry.rating,
        totalReviews: entry.totalReviews,
        tier: entry.tier,
        expertise: entry.expertise,
        score: calculateScore(entry.rating, entry.totalReviews),
        lastUpdated: entry.updatedAt
      }));
    } else {
      // Calculate fresh leaderboard
      const mentors = await prisma.mentor.findMany({
        where: {
          ...where,
          isAvailable: true,
          user: { emailVerified: true }
        },
        include: {
          user: { select: { name: true } }
        },
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' }
        ],
        take: limit
      });

      leaderboard = mentors.map((mentor, index) => ({
        rank: index + 1,
        mentorId: mentor.id,
        name: mentor.user.name,
        rating: mentor.rating,
        totalReviews: mentor.totalReviews,
        tier: mentor.tier,
        expertise: mentor.expertise,
        score: calculateScore(mentor.rating, mentor.totalReviews),
        lastUpdated: new Date()
      }));
    }

    // Get additional stats
    const stats = await getLeaderboardStats(domain, tier);

    res.json({
      success: true,
      data: {
        leaderboard,
        stats,
        filters: {
          domain: domain || null,
          tier: tier || null,
          minReviews,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leaderboard/domains
 * Get available domains/expertise areas
 */
router.get('/domains', async (req, res, next) => {
  try {
    // Get all unique expertise areas from mentors
    const mentors = await prisma.mentor.findMany({
      where: { isAvailable: true },
      select: { expertise: true }
    });

    // Flatten and count expertise areas
    const expertiseCount: Record<string, number> = {};
    
    mentors.forEach(mentor => {
      // expertise is now a comma-separated string
      const skills = mentor.expertise.split(',').map(skill => skill.trim()).filter(Boolean);
      skills.forEach(skill => {
        expertiseCount[skill] = (expertiseCount[skill] || 0) + 1;
      });
    });

    // Sort by popularity and return top domains
    const domains = Object.entries(expertiseCount)
      .map(([domain, count]) => ({ domain, mentorCount: count }))
      .sort((a, b) => b.mentorCount - a.mentorCount)
      .slice(0, 20); // Top 20 domains

    res.json({
      success: true,
      data: {
        domains,
        totalDomains: domains.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leaderboard/stats
 * Get general leaderboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalMentors,
      totalReviews,
      averageRating,
      tierDistribution
    ] = await Promise.all([
      // Total active mentors
      prisma.mentor.count({
        where: { 
          isAvailable: true,
          user: { emailVerified: true }
        }
      }),
      
      // Total reviews
      prisma.review.count(),
      
      // Average rating across all mentors
      prisma.mentor.aggregate({
        where: { 
          isAvailable: true,
          totalReviews: { gt: 0 }
        },
        _avg: { rating: true }
      }),
      
      // Tier distribution
      prisma.mentor.groupBy({
        by: ['tier'],
        where: { isAvailable: true },
        _count: true
      })
    ]);

    const stats = {
      totalMentors,
      totalReviews,
      averageRating: Math.round((averageRating._avg.rating || 0) * 10) / 10,
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item.tier] = item._count;
        return acc;
      }, {} as Record<string, number>)
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
 * Calculate mentor score based on rating and review count
 * Higher weight for mentors with more reviews
 */
function calculateScore(rating: number, reviewCount: number): number {
  // Score = (rating * review_weight_factor) where weight increases with review count
  const reviewWeight = Math.min(1 + (reviewCount * 0.1), 2); // Max weight of 2x
  return Math.round((rating * reviewWeight) * 100) / 100;
}

/**
 * Get additional statistics for leaderboard context
 */
async function getLeaderboardStats(domain?: string, tier?: string) {
  const where: any = { isAvailable: true };
  
  if (domain) {
    where.expertise = { contains: domain };
  }
  
  if (tier) {
    where.tier = tier;
  }

  const [
    totalMentors,
    averageRating,
    topRating
  ] = await Promise.all([
    prisma.mentor.count({ where }),
    
    prisma.mentor.aggregate({
      where: { ...where, totalReviews: { gt: 0 } },
      _avg: { rating: true }
    }),
    
    prisma.mentor.findFirst({
      where,
      orderBy: { rating: 'desc' },
      select: { rating: true }
    })
  ]);

  return {
    totalMentors,
    averageRating: Math.round((averageRating._avg.rating || 0) * 10) / 10,
    topRating: topRating?.rating || 0
  };
}

export default router;