# 🚀 EdVisor - Complete Setup Guide

## 📋 Prerequisites

- **Node.js** (v18 or higher): https://nodejs.org/
- **PostgreSQL** (v13 or higher): https://www.postgresql.org/download/
- **Git**: https://git-scm.com/download/

## 🛠️ Quick Setup (5 minutes)

### Step 1: Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd EdVisor

# Install all dependencies
npm install
```

### Step 2: Database Setup

**Option A: Quick PostgreSQL Setup**
```bash
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# During installation:
# - Port: 5432
# - Username: postgres  
# - Password: password (remember this!)

# After installation, create database:
psql -U postgres -h localhost
CREATE DATABASE edvisor;
\q
```

**Option B: Using Docker**
```bash
docker run --name postgres-edvisor -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
docker exec -it postgres-edvisor psql -U postgres -c "CREATE DATABASE edvisor;"
```

### Step 3: Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/edvisor"
```

### Step 4: Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### Step 5: Start Development
```bash
# Start backend (http://localhost:4000)
npm run dev:backend

# In a new terminal, start frontend (http://localhost:3000)
npm run dev:frontend

# Or start both at once:
npm run dev
```

## ✅ Verification

Visit these URLs to verify setup:
- **Backend Health**: http://localhost:4000/health
- **API Documentation**: http://localhost:4000/api/v1
- **Frontend App**: http://localhost:3000
- **Database GUI**: `npm run db:studio` (http://localhost:5555)

## 👤 Demo Accounts

Test the application with these accounts:

```
Student Account:
Email: demo@student.test
Password: demo123

Mentor Accounts:
Email: sarah.chen@mentor.test
Password: demo123
(+ 4 more mentors available)
```

## 📁 Project Structure

```
EdVisor/
├── frontend/           # Next.js 14 app
├── backend/           # Express.js API
├── prisma/           # Database schema & seeds
├── .env              # Environment variables (DO NOT COMMIT)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start Next.js only
npm run dev:backend      # Start Express API only

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed         # Seed demo data
npm run db:studio       # Open Prisma Studio GUI
npm run db:reset        # Reset database (careful!)

# Production
npm run build           # Build both apps
npm run start          # Start production servers

# Testing
cd backend && node test-backend.js  # Test backend APIs
```

## 🌐 API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get profile

### Mentors  
- `GET /mentors` - Search mentors
- `GET /mentors/:id` - Mentor details

### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Booking details

### Payments
- `POST /payments/initiate` - Start payment (mock)

### Reviews
- `POST /reviews` - Create review

### Leaderboard
- `GET /leaderboard` - Top mentors

### Students
- `GET /students/me/dashboard` - Student dashboard
- `GET /students/me/bookings` - Student bookings

See `BACKEND_INTEGRATION_GUIDE.md` for complete API documentation.

## 🚨 Common Issues & Solutions

### Database Connection Error
```bash
# Error: Environment variable not found: DATABASE_URL
# Solution: Check .env file exists and has correct DATABASE_URL

# Error: Connection refused
# Solution: Ensure PostgreSQL is running
# Windows: Services → PostgreSQL should be "Running"

# Error: Database "edvisor" does not exist  
# Solution: Create database manually
psql -U postgres -c "CREATE DATABASE edvisor;"
```

### Port Already in Use
```bash
# Error: Port 3000/4000 already in use
# Solution: Kill process or change port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change PORT in .env file
```

### Module Not Found
```bash
# Error: Cannot find module
# Solution: Reinstall dependencies
npm install
# or
npm run install:all
```

### Prisma Client Error
```bash
# Error: Prisma client not generated
# Solution: Regenerate client
npx prisma generate
```

## 🔐 Security Notes

- ✅ `.env` files are gitignored (contains sensitive data)
- ✅ JWT tokens expire after 30 days
- ✅ Passwords are hashed with bcrypt
- ✅ Rate limiting enabled (200 req/15min)
- ✅ CORS configured for localhost:3000

## 🎯 Features Implemented

### ✅ Backend (Express + Prisma)
- User authentication (JWT)
- Mentor search & filtering
- Booking system with slot locking
- Mock payment integration (Razorpay)
- Review system with auto-rating updates
- Leaderboard with caching
- Admin dashboard
- Comprehensive error handling

### ✅ Frontend (Next.js 14)
- Modern React with App Router
- TailwindCSS for styling
- React Query for data fetching
- Responsive design
- Authentication flow
- Type-safe API integration

### ✅ Database (PostgreSQL)
- 7 models with relationships
- Automated migrations
- Demo data seeding
- Performance optimizations

## 📝 Development Workflow

1. **Make Changes**: Edit code in `frontend/` or `backend/`
2. **Test Locally**: Changes auto-reload in development
3. **Test APIs**: Use backend test script or Postman
4. **Commit Changes**: Git will ignore `.env` and `node_modules`
5. **Deploy**: Build and deploy to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## 📞 Support

If you encounter issues:

1. Check this setup guide
2. Look at error messages in terminal
3. Test individual components:
   - Database: `npx prisma studio`
   - Backend: `cd backend && node test-backend.js`
   - Frontend: Check browser console

## 🎉 Next Steps

After setup is complete:

1. **Explore the App**: Login with demo account
2. **Browse Mentors**: Search and filter functionality
3. **Book a Session**: Try the booking flow
4. **Leave a Review**: Test the review system
5. **Check Leaderboard**: See mentor rankings
6. **Admin Features**: View admin dashboard

Happy coding! 🚀