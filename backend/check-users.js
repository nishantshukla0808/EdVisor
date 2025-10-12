const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking existing users...\n');
    
    const users = await prisma.user.findMany({
      include: {
        student: true,
        mentor: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      if (user.student) {
        console.log(`   Student Profile: Yes`);
      }
      if (user.mentor) {
        console.log(`   Mentor Profile: Yes`);
      }
      console.log('');
    });
    
    // Check for specific demo accounts
    console.log('\nDemo accounts status:');
    const demoStudent = await prisma.user.findUnique({
      where: { email: 'demo@student.test' }
    });
    console.log(`Demo Student: ${demoStudent ? '✅ Exists' : '❌ Not found'}`);
    
    const demoMentor = await prisma.user.findUnique({
      where: { email: 'demo@mentor.test' }
    });
    console.log(`Demo Mentor: ${demoMentor ? '✅ Exists' : '❌ Not found'}`);
    
    const demoAdmin = await prisma.user.findUnique({
      where: { email: 'demo@admin.test' }
    });
    console.log(`Demo Admin: ${demoAdmin ? '✅ Exists' : '❌ Not found'}`);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();