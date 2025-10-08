/**
 * Backend API Test Script
 * This script tests all major endpoints to ensure they work correctly
 * before frontend integration.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
let authToken = '';
let testMentorId = '';
let testBookingId = '';

async function testBackend() {
  console.log('🧪 Testing EdVisor Backend API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthRes = await axios.get('http://localhost:4000/health');
    console.log('✅ Health check:', healthRes.data.status);

    // Test 2: API Info
    console.log('\n2. Testing API info...');
    const apiRes = await axios.get(`${BASE_URL}`);
    console.log('✅ API Info:', apiRes.data.name, apiRes.data.version);

    // Test 3: User Registration
    console.log('\n3. Testing user registration...');
    const registerRes = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    authToken = registerRes.data.data.token;
    console.log('✅ User registered:', registerRes.data.data.user.name);

    // Test 4: Authentication Check
    console.log('\n4. Testing authentication...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Auth verified:', meRes.data.data.user.email);

    // Test 5: Get Mentors
    console.log('\n5. Testing mentors endpoint...');
    const mentorsRes = await axios.get(`${BASE_URL}/mentors?limit=3`);
    if (mentorsRes.data.data.mentors.length > 0) {
      testMentorId = mentorsRes.data.data.mentors[0].id;
      console.log('✅ Mentors fetched:', mentorsRes.data.data.mentors.length, 'mentors');
    }

    // Test 6: Get Mentor Details
    if (testMentorId) {
      console.log('\n6. Testing mentor details...');
      const mentorRes = await axios.get(`${BASE_URL}/mentors/${testMentorId}`);
      console.log('✅ Mentor details:', mentorRes.data.data.mentor.name);
    }

    // Test 7: Get Leaderboard
    console.log('\n7. Testing leaderboard...');
    const leaderboardRes = await axios.get(`${BASE_URL}/leaderboard?limit=5`);
    console.log('✅ Leaderboard fetched:', leaderboardRes.data.data.leaderboard.length, 'entries');

    // Test 8: Create Booking
    if (testMentorId) {
      console.log('\n8. Testing booking creation...');
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
        mentorId: testMentorId,
        startTime: futureDate.toISOString(),
        durationMin: 60,
        preQuestions: ['Test booking question'],
        priceTotal: 8000
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      testBookingId = bookingRes.data.data.booking.id;
      console.log('✅ Booking created:', bookingRes.data.data.booking.id);
    }

    // Test 9: Get Booking Details
    if (testBookingId) {
      console.log('\n9. Testing booking details...');
      const bookingRes = await axios.get(`${BASE_URL}/bookings/${testBookingId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Booking details:', bookingRes.data.data.booking.status);
    }

    // Test 10: Initiate Payment
    if (testBookingId) {
      console.log('\n10. Testing payment initiation...');
      const paymentRes = await axios.post(`${BASE_URL}/payments/initiate`, {
        bookingId: testBookingId
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Payment initiated:', paymentRes.data.data.payment.orderId);
    }

    // Test 11: Student Dashboard
    console.log('\n11. Testing student dashboard...');
    const dashboardRes = await axios.get(`${BASE_URL}/students/me/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Dashboard data:', dashboardRes.data.data.stats.totalBookings, 'total bookings');

    // Test 12: Student Bookings
    console.log('\n12. Testing student bookings...');
    const studentBookingsRes = await axios.get(`${BASE_URL}/students/me/bookings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Student bookings:', studentBookingsRes.data.data.bookings.length, 'bookings');

    console.log('\n🎉 All backend tests passed! Backend is ready for frontend integration.');
    
  } catch (error) {
    console.error('\n❌ Backend test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:4000/health');
    await testBackend();
  } catch (error) {
    console.error('❌ Backend server is not running on http://localhost:4000');
    console.log('Please start the backend server first:');
    console.log('  cd E:\\EdVisor\\backend');
    console.log('  npm run dev');
    process.exit(1);
  }
}

checkServer();