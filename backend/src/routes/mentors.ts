import express from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all mentors with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      tier, 
      expertise, 
      minRating, 
      maxRate, 
      isAvailable,
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (tier) where.tier = tier;
    if (expertise) where.expertise = { has: expertise };
    if (minRating) where.rating = { gte: Number(minRating) };
    if (maxRate) where.hourlyRate = { lte: Number(maxRate) * 100 }; // Convert to cents
    if (isAvailable) where.isAvailable = isAvailable === 'true';

    const [mentors, total] = await Promise.all([
      prisma.mentor.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.mentor.count({ where })
    ]);

    res.json({
      mentors,
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

// Get mentor by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const mentor = await prisma.mentor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            email: true
          }
        },
        reviews: {
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
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.json({ mentor });
  } catch (error) {
    next(error);
  }
});

// Get mentor leaderboard
router.get('/leaderboard/top', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await prisma.leaderboardCache.findMany({
      orderBy: { rank: 'asc' },
      take: Number(limit)
    });

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
});

// Update mentor profile (mentor only)
router.put('/profile', 
  authenticateToken, 
  requireRole(['MENTOR']), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const {
        bio,
        expertise,
        experience,
        hourlyRate,
        availability,
        isAvailable
      } = req.body;

      const mentor = await prisma.mentor.update({
        where: { userId: req.user!.id },
        data: {
          bio,
          expertise,
          experience: Number(experience),
          hourlyRate: Number(hourlyRate) * 100, // Convert to cents
          availability,
          isAvailable
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              email: true
            }
          }
        }
      });

      res.json({ 
        message: 'Profile updated successfully',
        mentor 
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;