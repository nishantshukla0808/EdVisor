# EdVisor - Expert Mentorship Platform

A full-stack TypeScript web application connecting students with expert mentors for personalized learning and career guidance.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript**
- **TailwindCSS** for styling
- **React Query** for data fetching
- **Axios** for API calls
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **Prisma ORM**
- **PostgreSQL** database
- **JWT Authentication**
- **Google OAuth** (skeleton)
- **Razorpay** payment integration (mock)

## 📁 Project Structure

```
EdVisor/
├── package.json                 # Root workspace configuration
├── .env.example                 # Environment variables template
├── README.md                    # This file
│
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React contexts (Auth, etc.)
│   │   ├── lib/               # Utilities and API client
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # Express.js API server
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Express middleware
│   │   └── server.ts          # Main server file
│   ├── package.json
│   └── tsconfig.json
│
└── prisma/                      # Database schema and migrations
    ├── schema.prisma           # Database schema
    └── seed.ts                 # Demo data seeder
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v13 or higher)

### PostgreSQL Setup (Windows)

1. **Download and Install PostgreSQL:**
   - Visit https://www.postgresql.org/download/windows/
   - Download the installer for your system
   - Run installer and follow setup wizard
   - Remember your postgres user password!

2. **Verify Installation:**
   ```bash
   psql --version
   ```

3. **Create Database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres -h localhost
   
   # Create database
   CREATE DATABASE edvisor;
   
   # Exit psql
   \q
   ```

## 📦 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd E:\EdVisor

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment files
copy .env.example .env
copy frontend\.env.example frontend\.env.local
```

**Edit `.env` with your settings:**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/edvisor"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

**Edit `frontend\.env.local`:**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_RAZORPAY_KEY="rzp_test_your_key_id"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate

# Seed the database with demo data
npm run db:seed
```

### 4. Start Development Servers

**Option A: Start both servers concurrently**
```bash
npm run dev
```

**Option B: Start servers separately**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

## 🌐 Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Health Check:** http://localhost:4000/health
- **Prisma Studio:** `npm run db:studio` (http://localhost:5555)

## 👤 Demo Credentials

After running the seed script, you can login with:

**Student Account:**
- Email: `demo@student.test`
- Password: `demo123`

**Mentor Accounts:**
- Email: `sarah.chen@mentor.test` (or any mentor email)
- Password: `demo123`

## 🎯 Available Scripts

### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start Next.js frontend only
npm run dev:backend      # Start Express backend only
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with demo data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (careful!)
npm run build            # Build both applications
npm run install:all      # Install all workspace dependencies
```

### Frontend Specific
```bash
cd frontend
npm run dev              # Start Next.js development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

### Backend Specific
```bash
cd backend
npm run dev              # Start with ts-node (development)
npm run build            # Compile TypeScript
npm start                # Start compiled JavaScript
npm test                 # Run tests
```

## 🗃️ Database Models

The application includes the following main models:

- **User** - Base user account (Student or Mentor)
- **Student** - Student profile with goals and interests
- **Mentor** - Mentor profile with expertise and availability
- **Booking** - Session bookings between students and mentors
- **Review** - Student reviews for completed sessions
- **Payment** - Payment records with Razorpay integration
- **LeaderboardCache** - Cached mentor rankings

## 🎨 Key Features

- ✅ **User Authentication** - JWT-based auth with role management
- ✅ **Mentor Discovery** - Browse and filter expert mentors
- ✅ **Session Booking** - Schedule mentorship sessions
- ✅ **Payment Integration** - Razorpay payment processing (mock)
- ✅ **Review System** - Rate and review mentors
- ✅ **Leaderboard** - Top-rated mentors ranking
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Real-time Updates** - React Query for live data
- 🔄 **Google OAuth** - OAuth integration (skeleton)

## 🔧 Development Tips

1. **Database Changes:**
   - Modify `prisma/schema.prisma`
   - Run `npm run db:migrate`
   - Update TypeScript types if needed

2. **Adding New API Endpoints:**
   - Create route in `backend/src/routes/`
   - Add to main server in `backend/src/server.ts`
   - Update frontend API client in `frontend/src/lib/api.ts`

3. **Frontend Pages:**
   - Create in `frontend/src/app/` following App Router structure
   - Use React Query for data fetching
   - Follow existing component patterns

4. **Styling:**
   - Use TailwindCSS utility classes
   - Custom colors defined in `tailwind.config.js`
   - Global styles in `frontend/src/app/globals.css`

## 🚨 Troubleshooting

### Common Issues:

**1. Database Connection Error:**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Ensure database 'edvisor' exists
```

**2. Port Already in Use:**
```bash
# Kill process on port 3000 or 4000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**3. Prisma Client Issues:**
```bash
# Regenerate Prisma client
npx prisma generate
```

**4. TypeScript Errors:**
```bash
# Check for type mismatches
npm run type-check
```

## 🚀 Production Deployment

1. **Environment Variables:**
   - Set production DATABASE_URL
   - Use strong JWT_SECRET
   - Configure real Razorpay keys
   - Set FRONTEND_URL to production domain

2. **Build Applications:**
   ```bash
   npm run build
   ```

3. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

## 🤝 Contributing

1. Create feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 What's Next?

This foundation provides:
- Complete authentication system
- CRUD operations for all entities  
- Payment integration structure
- Responsive UI components
- Type-safe API layer

You can extend it by:
- Implementing real Google OAuth
- Adding real-time chat/video
- Building mobile apps with the same API
- Adding more mentor tiers and features
- Implementing notifications
- Adding analytics dashboard

Happy coding! 🚀