const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMentorSchema() {
  try {
    console.log('Checking mentor schema structure...\n');
    
    const mentor = await prisma.mentor.findFirst({
      include: {
        user: true
      }
    });
    
    if (mentor) {
      console.log('Sample mentor structure:');
      console.log(JSON.stringify(mentor, null, 2));
    } else {
      console.log('No mentors found in database');
    }
    
  } catch (error) {
    console.error('Error checking mentor schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMentorSchema();