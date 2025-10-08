import express from 'express';
import Joi from 'joi';
import { prisma } from '../../server';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Query validation schema
const mentorSearchSchema = Joi.object({
  q: Joi.string().max(100).optional(),
  domain: Joi.string().max(50).optional(),
  tier: Joi.string().valid('TIER1', 'TIER2', 'TIER3').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sort: Joi.string().valid('rating', 'reviews', 'hours', 'price').default('rating'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

/**
 * GET /api/v1/mentors
 * Search and filter mentors with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = mentorSearchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details[0].message
      });
    }

    const { q, domain, tier, minPrice, maxPrice, sort, page, limit } = value;
    const skip = (page - 1) * limit;

    // Build search filters
    const where: any = {
      isAvailable: true,
      user: {
        emailVerified: true
      }
    };

    // Text search in name, bio, or expertise
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { bio: { contains: q, mode: 'insensitive' } },
        { expertise: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Domain/expertise filter
    if (domain) {
      where.expertise = { contains: domain, mode: 'insensitive' };
    }

    // Tier filter
    if (tier) {
      where.tier = tier;
    }

    // Price range filters (convert from rupees to cents)
    if (minPrice !== undefined) {
      where.hourlyRate = { ...where.hourlyRate, gte: minPrice * 100 };
    }
    if (maxPrice !== undefined) {
      where.hourlyRate = { ...where.hourlyRate, lte: maxPrice * 100 };
    }

    // Build sort order
    let orderBy: any = { rating: 'desc' };
    switch (sort) {
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'reviews':
        orderBy = { totalReviews: 'desc' };
        break;
      case 'hours':
        orderBy = { experience: 'desc' };
        break;
      case 'price':
        orderBy = { hourlyRate: 'asc' };
        break;
    }

    // Execute queries
    const [mentors, total] = await Promise.all([
      prisma.mentor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: [orderBy, { createdAt: 'desc' }],
        skip,
        take: limit
      }),
      prisma.mentor.count({ where })
    ]);

    // Format response data
    const formattedMentors = mentors.map(mentor => ({
      id: mentor.id,
      name: mentor.user.name,
      avatar: mentor.user.avatar,
      bio: mentor.bio,
      expertise: mentor.expertise,
      experience: mentor.experience,
      tier: mentor.tier,
      pricePerHour: Math.round(mentor.hourlyRate / 100), // Convert to rupees
      rating: mentor.rating,
      totalReviews: mentor.totalReviews,
      isAvailable: mentor.isAvailable
    }));

    res.json({
      success: true,
      data: {
        mentors: formattedMentors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: skip + mentors.length < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/mentors/:id
 * Get detailed mentor profile
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            createdAt: true
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
          take: 10 // Latest 10 reviews
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Mock institution and availability data
    const firstExpertise = mentor.expertise.split(',')[0]?.trim();
    const mockInstitution = {
      name: getMockInstitution(firstExpertise),
      logo: null
    };

    const mockAvailability = {
      timezone: 'Asia/Kolkata',
      slots: [
        { day: 'Monday', times: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Tuesday', times: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Wednesday', times: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Thursday', times: ['09:00-12:00', '14:00-17:00'] },
        { day: 'Friday', times: ['09:00-12:00', '14:00-16:00'] },
        { day: 'Saturday', times: ['10:00-13:00'] },
        { day: 'Sunday', times: [] }
      ]
    };

    // Format reviews
    const formattedReviews = mentor.reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      student: {
        name: review.student.user.name,
        avatar: review.student.user.avatar
      }
    }));

    const responseData = {
      id: mentor.id,
      name: mentor.user.name,
      avatar: mentor.user.avatar,
      bio: mentor.bio,
      expertise: mentor.expertise,
      experience: mentor.experience,
      tier: mentor.tier,
      pricePerHour: Math.round(mentor.hourlyRate / 100),
      rating: mentor.rating,
      totalReviews: mentor.totalReviews,
      isAvailable: mentor.isAvailable,
      institution: mockInstitution,
      availability: mockAvailability,
      joinedAt: mentor.user.createdAt,
      reviews: formattedReviews
    };

    res.json({
      success: true,
      data: {
        mentor: responseData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate mock institution names
function getMockInstitution(expertise?: string): string {
  const institutions: Record<string, string[]> = {
    'React': ['Google', 'Facebook', 'Netflix'],
    'Python': ['Google', 'Microsoft', 'Spotify'],
    'Machine Learning': ['OpenAI', 'DeepMind', 'Tesla'],
    'Product Management': ['Meta', 'Stripe', 'Airbnb'],
    'DevOps': ['Amazon', 'Microsoft', 'HashiCorp'],
    'Flutter': ['Google', 'Alibaba', 'BMW'],
    'default': ['Tech Corp', 'Innovation Labs', 'Digital Solutions']
  };

  const institutionList = institutions[expertise!] || institutions.default;
  return institutionList[Math.floor(Math.random() * institutionList.length)];
}

export default router;