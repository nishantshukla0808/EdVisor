const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoAccounts() {
  try {
    console.log('Creating demo accounts...\n');

    // Create Demo Mentor Account
    console.log('1. Creating demo mentor account...');
    const existingMentor = await prisma.user.findUnique({
      where: { email: 'demo@mentor.test' }
    });

    if (existingMentor) {
      console.log('   ⚠️  Demo mentor already exists');
    } else {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      const demoMentor = await prisma.user.create({
        data: {
          email: 'demo@mentor.test',
          password: hashedPassword,
          name: 'Demo Mentor',
          role: 'MENTOR',
          emailVerified: true,
          mentor: {
            create: {
              bio: 'Demo mentor account for testing purposes. Expert in full-stack development with 5+ years of experience.',
              expertise: 'React,Node.js,Python,JavaScript,Web Development',
              experience: 5,
              tier: 'TIER2',
              hourlyRate: 7500, // ₹75 per hour in paise
              isAvailable: true,
              rating: 4.8,
              totalReviews: 45,
              availability: JSON.stringify({
                monday: ['09:00-17:00'],
                tuesday: ['09:00-17:00'],
                wednesday: ['09:00-17:00'],
                thursday: ['09:00-17:00'],
                friday: ['09:00-17:00'],
                saturday: ['10:00-14:00'],
                sunday: []
              })
            }
          }
        },
        include: {
          mentor: true
        }
      });
      
      console.log('   ✅ Demo mentor created:', demoMentor.email);
    }

    // Create Demo Admin Account
    console.log('\n2. Creating demo admin account...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'demo@admin.test' }
    });

    if (existingAdmin) {
      console.log('   ⚠️  Demo admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      const demoAdmin = await prisma.user.create({
        data: {
          email: 'demo@admin.test',
          password: hashedPassword,
          name: 'Demo Admin',
          role: 'ADMIN',
          emailVerified: true,
          avatar: '/images/admin/demo-admin.jpg'
        }
      });
      
      console.log('   ✅ Demo admin created:', demoAdmin.email);
    }

    console.log('\n🎉 Demo accounts setup completed!');
    console.log('\nYou can now login with:');
    console.log('📚 Student: demo@student.test / demo123');
    console.log('👨‍🏫 Mentor: demo@mentor.test / demo123');
    console.log('⚙️  Admin: demo@admin.test / demo123');

  } catch (error) {
    console.error('Error creating demo accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoAccounts();