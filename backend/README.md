# EdVisor Backend API

A robust REST API for the EdVisor mentorship platform, built with Express.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database with demo data
npx prisma db seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:4000`

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api/v1
```

### Authentication
Most endpoints require authentication via Bearer token:
```bash
Authorization: Bearer <your_jwt_token>
```

## 🔐 Authentication Endpoints

### POST /api/v1/auth/signup
Create new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT"
    },
    "token": "jwt_token_here"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "securepassword"
  }'
```

### POST /api/v1/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@student.test",
    "password": "demo123"
  }'
```

### GET /api/v1/auth/me
Get current user profile (requires authentication).

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 👥 Mentors Endpoints

### GET /api/v1/mentors
Search and filter mentors with pagination.

**Query Parameters:**
- `q` - Search query (name, bio, expertise)
- `domain` - Filter by expertise domain
- `tier` - Filter by tier (TIER1, TIER2, TIER3)
- `minPrice` - Minimum price per hour
- `maxPrice` - Maximum price per hour
- `sort` - Sort by: rating, reviews, hours, price
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 50)

**cURL Example:**
```bash
# Get all mentors
curl -X GET "http://localhost:4000/api/v1/mentors"

# Search React mentors under ₹70/hour
curl -X GET "http://localhost:4000/api/v1/mentors?domain=React&maxPrice=70&sort=rating"

# Get TIER1 mentors with pagination
curl -X GET "http://localhost:4000/api/v1/mentors?tier=TIER1&page=1&limit=5"
```

### GET /api/v1/mentors/:id
Get detailed mentor profile with reviews.

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/mentors/MENTOR_ID_HERE
```

## 📅 Bookings Endpoints

### POST /api/v1/bookings
Create new booking (requires student authentication).

**Request Body:**
```json
{
  "mentorId": "mentor_id",
  "startTime": "2024-01-15T10:00:00Z",
  "durationMin": 60,
  "preQuestions": [
    "What topics would you like to cover?",
    "What is your current experience level?"
  ],
  "priceTotal": 8000
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "MENTOR_ID_HERE",
    "startTime": "2024-02-15T10:00:00Z",
    "durationMin": 60,
    "preQuestions": ["I want to learn React hooks"],
    "priceTotal": 8000
  }'
```

### GET /api/v1/bookings/:id
Get booking details with Zoom link (for confirmed bookings).

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/bookings/BOOKING_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 💳 Payments Endpoints

### POST /api/v1/payments/initiate
Initiate payment for a booking (mock implementation).

**Request Body:**
```json
{
  "bookingId": "booking_id"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "BOOKING_ID_HERE"}'
```

### POST /api/v1/payments/webhook
Handle payment webhook (mock Razorpay webhook).

**Request Body:**
```json
{
  "razorpay_order_id": "order_mock_123",
  "razorpay_payment_id": "pay_mock_456", 
  "razorpay_signature": "signature_here",
  "bookingId": "booking_id"
}
```

## ⭐ Reviews Endpoints

### POST /api/v1/reviews
Create review for completed booking (requires student authentication).

**Request Body:**
```json
{
  "bookingId": "booking_id",
  "rating": 5,
  "clarity": 5,
  "relevance": 4,
  "roadmap": 5,
  "comment": "Excellent session! Very helpful and clear explanations."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/reviews \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_HERE",
    "rating": 5,
    "clarity": 5,
    "relevance": 4,
    "roadmap": 5,
    "comment": "Great session!"
  }'
```

## 🏆 Leaderboard Endpoints

### GET /api/v1/leaderboard
Get top mentors leaderboard with optional domain filtering.

**Query Parameters:**
- `domain` - Filter by expertise domain (e.g., "Machine Learning")
- `tier` - Filter by tier (TIER1, TIER2, TIER3)
- `limit` - Number of results (default: 20, max: 100)
- `minReviews` - Minimum review count (default: 1)

**cURL Examples:**
```bash
# Get general leaderboard
curl -X GET "http://localhost:4000/api/v1/leaderboard"

# Get top ML mentors
curl -X GET "http://localhost:4000/api/v1/leaderboard?domain=Machine Learning&limit=10"

# Get available domains
curl -X GET "http://localhost:4000/api/v1/leaderboard/domains"

# Get leaderboard stats
curl -X GET "http://localhost:4000/api/v1/leaderboard/stats"
```

## 🎓 Students Endpoints

### GET /api/v1/students/:id/bookings
Get all bookings for a specific student.

**Query Parameters:**
- `status` - Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 50)

**cURL Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/students/STUDENT_ID_HERE/bookings?status=COMPLETED" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### GET /api/v1/students/me/bookings
Get current student's bookings.

**cURL Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/students/me/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### GET /api/v1/students/me/dashboard
Get student dashboard data with stats and recent activity.

**cURL Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/students/me/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Admin Endpoints (Admin Only)

### POST /api/v1/admin/ranking/compute
Recompute cached rankings for all mentors.

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/ranking/compute \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### GET /api/v1/admin/mentors/pending
List mentors that need verification.

**cURL Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/mentors/pending?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### GET /api/v1/admin/stats
Get admin dashboard statistics.

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## 🧪 Testing the API

### 1. Get Demo Credentials
Use the seeded demo data:
```bash
# Student Account
Email: demo@student.test
Password: demo123

# Mentor Accounts  
Email: sarah.chen@mentor.test
Password: demo123
```

### 2. Complete Booking Flow Test

```bash
# 1. Login as student
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@student.test", "password": "demo123"}' \
  | jq -r '.data.token')

# 2. Get mentors
curl -s -X GET "http://localhost:4000/api/v1/mentors?limit=5" | jq

# 3. Create booking (replace MENTOR_ID)
BOOKING_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "MENTOR_ID_HERE", 
    "startTime": "2024-02-15T10:00:00Z",
    "durationMin": 60,
    "preQuestions": ["Test booking"],
    "priceTotal": 8000
  }')

echo $BOOKING_RESPONSE | jq

# 4. Initiate payment
BOOKING_ID=$(echo $BOOKING_RESPONSE | jq -r '.data.booking.id')
curl -s -X POST http://localhost:4000/api/v1/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\": \"$BOOKING_ID\"}" | jq

# 5. Check booking status (payment will auto-complete in 2 seconds)
sleep 3
curl -s -X GET "http://localhost:4000/api/v1/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 🚀 Deployment

### Environment Variables
Set these in production:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/edvisor"
JWT_SECRET="your-super-secret-jwt-key"
RAZORPAY_KEY_ID="rzp_live_your_key_id"  
RAZORPAY_KEY_SECRET="your_razorpay_secret"
FRONTEND_URL="https://your-frontend-domain.com"
PORT=4000
```

### Build for Production
```bash
npm run build
npm start
```

## 🔍 API Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## 📊 Database Schema

The API uses the following main models:
- **User** - Base user accounts (Student/Mentor/Admin)  
- **Student** - Student profiles with goals/interests
- **Mentor** - Mentor profiles with expertise/pricing
- **Booking** - Session bookings with status tracking
- **Payment** - Payment records with Razorpay integration
- **Review** - Student reviews with detailed ratings
- **LeaderboardCache** - Cached mentor rankings for performance

## 🔒 Security Features

- JWT token authentication with 30-day expiration
- Password hashing with bcrypt (12 rounds)
- Rate limiting (200 requests per 15 minutes)
- Input validation with Joi schemas
- SQL injection protection via Prisma
- CORS configuration for frontend domain
- Helmet.js for security headers

## 🎯 Key Features

- **Slot Locking**: 5-minute locks prevent double-booking
- **Payment Integration**: Mock Razorpay with auto-completion
- **Rating System**: Automatic recalculation of mentor ratings
- **Leaderboard Cache**: Optimized rankings with smart caching
- **Admin Tools**: Mentor verification and stats dashboard
- **Comprehensive Search**: Full-text search with filters
- **Real-time Updates**: Instant status updates via webhooks

## 🐛 Troubleshooting

**Database Connection Issues:**
```bash
# Check PostgreSQL is running
psql --version

# Verify database exists
psql -d "postgresql://user:pass@localhost:5432/edvisor" -c "SELECT 1;"
```

**Token Issues:**
```bash
# Test token validity
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Prisma Issues:**
```bash
# Regenerate client
npx prisma generate

# Reset database
npx prisma migrate reset --force
```

## 📈 Performance Notes

- Leaderboard uses caching for fast responses
- Database queries are optimized with proper indexing
- Pagination prevents large data transfers
- Slot locking uses in-memory storage (consider Redis for production)
- Background tasks for rating recalculation

This API provides a solid foundation for a production mentorship platform with room for scaling and additional features!