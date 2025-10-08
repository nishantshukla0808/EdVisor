import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.leaderboardCache.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('demo123', 12);

  // Create demo student
  const studentUser = await prisma.user.create({
    data: {
      email: 'demo@student.test',
      password: hashedPassword,
      name: 'Demo Student',
      role: 'STUDENT',
      emailVerified: true,
      student: {
        create: {
          bio: 'Aspiring developer looking to learn from the best!',
          goals: ['Learn React', 'Master JavaScript', 'Build full-stack apps'],
          interests: ['Web Development', 'Mobile Apps', 'UI/UX Design']
        }
      }
    },
    include: {
      student: true
    }
  });

  console.log('✅ Created demo student:', studentUser.email);

  // Create 5 demo mentors
  const mentorsData = [
    {
      email: 'sarah.chen@mentor.test',
      name: 'Sarah Chen',
      bio: 'Senior Full-Stack Engineer at Google with 8 years of experience in React, Node.js, and system design. I love helping developers level up their skills!',
      expertise: ['React', 'Node.js', 'System Design', 'JavaScript', 'TypeScript'],
      experience: 8,
      tier: 'TIER1' as const,
      hourlyRate: 8000, // ₹80/hour
      rating: 4.9,
      totalReviews: 45
    },
    {
      email: 'marcus.johnson@mentor.test',
      name: 'Marcus Johnson',
      bio: 'Data Scientist and ML Engineer with expertise in Python, TensorFlow, and building production ML systems. Former Microsoft, now at startup.',
      expertise: ['Python', 'Machine Learning', 'Data Science', 'TensorFlow', 'AWS'],
      experience: 6,
      tier: 'TIER2' as const,
      hourlyRate: 6000, // ₹60/hour
      rating: 4.8,
      totalReviews: 32
    },
    {
      email: 'elena.rodriguez@mentor.test',
      name: 'Elena Rodriguez',
      bio: 'VP of Product at Stripe. 10+ years in product management, strategy, and team leadership. Helped launch products used by millions.',
      expertise: ['Product Management', 'Strategy', 'Leadership', 'Growth', 'Analytics'],
      experience: 12,
      tier: 'TIER1' as const,
      hourlyRate: 9000, // ₹90/hour
      rating: 5.0,
      totalReviews: 28
    },
    {
      email: 'raj.patel@mentor.test',
      name: 'Raj Patel',
      bio: 'DevOps Engineer and Cloud Architect specializing in AWS, Kubernetes, and CI/CD. Building scalable infrastructure for high-traffic applications.',
      expertise: ['DevOps', 'AWS', 'Kubernetes', 'Docker', 'Terraform'],
      experience: 7,
      tier: 'TIER2' as const,
      hourlyRate: 5500, // ₹55/hour
      rating: 4.7,
      totalReviews: 38
    },
    {
      email: 'lisa.wang@mentor.test',
      name: 'Lisa Wang',
      bio: 'Mobile App Developer and Flutter expert. Built 20+ mobile apps with millions of downloads. Passionate about clean architecture and UX.',
      expertise: ['Flutter', 'Dart', 'Mobile Development', 'Firebase', 'Clean Architecture'],
      experience: 5,
      tier: 'TIER3' as const,
      hourlyRate: 4500, // ₹45/hour
      rating: 4.6,
      totalReviews: 24
    }
  ];

  const mentors = [];
  for (const mentorData of mentorsData) {
    const mentor = await prisma.user.create({
      data: {
        email: mentorData.email,
        password: hashedPassword,
        name: mentorData.name,
        role: 'MENTOR',
        emailVerified: true,
        mentor: {
          create: {
            bio: mentorData.bio,
            expertise: mentorData.expertise,
            experience: mentorData.experience,
            tier: mentorData.tier,
            hourlyRate: mentorData.hourlyRate,
            rating: mentorData.rating,
            totalReviews: mentorData.totalReviews,
            isAvailable: true,
            availability: {
              monday: ['09:00-17:00'],
              tuesday: ['09:00-17:00'],
              wednesday: ['09:00-17:00'],
              thursday: ['09:00-17:00'],
              friday: ['09:00-17:00'],
              saturday: ['10:00-14:00'],
              sunday: []
            }
          }
        }
      },
      include: {
        mentor: true
      }
    });

    mentors.push(mentor);
    console.log(`✅ Created mentor: ${mentor.name}`);
  }

  // Create a demo booking
  const booking = await prisma.booking.create({
    data: {
      studentId: studentUser.student!.id,
      mentorId: mentors[0].mentor!.id, // Sarah Chen
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      status: 'COMPLETED',
      notes: 'Looking forward to learning about React best practices!',
      meetingLink: 'https://meet.google.com/demo-link',
      payment: {
        create: {
          studentId: studentUser.student!.id,
          amount: 8000, // ₹80
          currency: 'INR',
          status: 'COMPLETED',
          razorpayId: 'pay_demo123456',
          razorpayOrderId: 'order_demo123456'
        }
      }
    },
    include: {
      payment: true
    }
  });

  console.log('✅ Created demo booking');

  // Create a demo review
  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      studentId: studentUser.student!.id,
      mentorId: mentors[0].mentor!.id,
      rating: 5,
      comment: 'Absolutely fantastic session! Sarah explained React hooks and state management so clearly. Her real-world examples really helped me understand the concepts. Highly recommend!'
    }
  });

  console.log('✅ Created demo review');

  // Create leaderboard cache entries
  for (let i = 0; i < mentors.length; i++) {
    const mentor = mentors[i];
    await prisma.leaderboardCache.create({
      data: {
        mentorId: mentor.mentor!.id,
        mentorName: mentor.name,
        rating: mentor.mentor!.rating,
        totalReviews: mentor.mentor!.totalReviews,
        tier: mentor.mentor!.tier,
        expertise: mentor.mentor!.expertise,
        rank: i + 1
      }
    });
  }

  console.log('✅ Created leaderboard cache');

  // Create additional bookings for variety
  const additionalBookings = [
    {
      mentorIndex: 1, // Marcus Johnson
      status: 'CONFIRMED' as const,
      startTime: new Date('2024-01-20T14:00:00Z'),
      endTime: new Date('2024-01-20T15:30:00Z'),
      notes: 'Want to learn about machine learning fundamentals'
    },
    {
      mentorIndex: 2, // Elena Rodriguez
      status: 'PENDING' as const,
      startTime: new Date('2024-01-25T16:00:00Z'),
      endTime: new Date('2024-01-25T17:00:00Z'),
      notes: 'Career guidance and product management insights'
    }
  ];

  for (const bookingData of additionalBookings) {
    const mentor = mentors[bookingData.mentorIndex];
    await prisma.booking.create({
      data: {
        studentId: studentUser.student!.id,
        mentorId: mentor.mentor!.id,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: bookingData.status,
        notes: bookingData.notes,
        payment: {
          create: {
            studentId: studentUser.student!.id,
            amount: mentor.mentor!.hourlyRate * 1.5, // 1.5 hour session
            currency: 'INR',
            status: bookingData.status === 'CONFIRMED' ? 'COMPLETED' : 'PENDING'
          }
        }
      }
    });
  }

  console.log('✅ Created additional bookings');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Student: demo@student.test / demo123');
  console.log('   Mentors: [mentor-email] / demo123');
  console.log('\n🔗 You can now:');
  console.log('   1. Login as the demo student');
  console.log('   2. Browse mentors and make bookings');
  console.log('   3. View the completed booking and review');
  console.log('   4. Check out the leaderboard\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });