// Test script to check authentication
const axios = require('axios');

// Get token from localStorage (you'll need to manually copy this)
const token = 'YOUR_TOKEN_HERE'; // Replace with actual token

async function testAuth() {
  try {
    console.log('Testing /auth/me endpoint...');
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    const response = await axios.get('http://localhost:4001/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Auth successful!');
    console.log('User data:', response.data);
    
  } catch (error) {
    console.error('❌ Auth failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    console.error('Headers sent:', error.config?.headers);
  }
}

testAuth();