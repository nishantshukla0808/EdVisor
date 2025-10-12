# EdVisor - Complete Mentoring Platform 🚀

## 📋 Project Overview

EdVisor is a full-stack mentoring platform that connects students with expert mentors for personalized learning and career guidance. The platform supports three user roles: Students, Mentors, and Admins, each with their dedicated interfaces and features.

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **React Query** for server state management
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Chart.js** with react-chartjs-2 for admin analytics
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with SQLite database
- **JWT** for authentication
- **Joi** for validation
- **Helmet**, **CORS**, **Rate Limiting** for security

## 📁 Project Structure

```
EdVisor/
├── frontend/                          # Next.js frontend application
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/               # Student authentication
│   │   │   │   ├── login/page.tsx    # Student login
│   │   │   │   └── signup/page.tsx   # Student signup
│   │   │   ├── mentor/               # Mentor portal
│   │   │   │   ├── login/page.tsx    # Mentor login
│   │   │   │   ├── dashboard/page.tsx # Mentor dashboard
│   │   │   │   ├── bookings/page.tsx # Mentor bookings
│   │   │   │   ├── profile/page.tsx  # Mentor profile
│   │   │   │   ├── availability/page.tsx # Mentor availability
│   │   │   │   └── reviews/page.tsx  # Mentor reviews
│   │   │   ├── admin/                # Admin portal
│   │   │   │   ├── login/page.tsx    # Admin login
│   │   │   │   ├── dashboard/page.tsx # Admin dashboard
│   │   │   │   ├── mentors/page.tsx  # Admin mentor management
│   │   │   │   ├── bookings/page.tsx # Admin booking overview
│   │   │   │   ├── leaderboard/page.tsx # Admin leaderboard
│   │   │   │   └── funds/page.tsx    # Admin revenue tracking
│   │   │   ├── mentors/              # Student mentor browsing
│   │   │   │   ├── page.tsx          # Mentor listing
│   │   │   │   └── [id]/page.tsx     # Individual mentor
│   │   │   ├── bookings/page.tsx     # Student bookings
│   │   │   ├── leaderboard/page.tsx  # Public leaderboard
│   │   │   ├── profile/page.tsx      # Student profile
│   │   │   ├── layout.tsx            # Root layout with SEO
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── globals.css           # Global styles
│   │   │   └── providers.tsx         # React Query & Auth providers
│   │   ├── components/               # Reusable components
│   │   │   ├── AdminSidebar.tsx      # Admin navigation
│   │   │   ├── MentorSidebar.tsx     # Mentor navigation
│   │   │   ├── BookingModal.tsx      # Booking modal
│   │   │   ├── MentorCard.tsx        # Mentor display card
│   │   │   ├── Navbar.tsx            # Role-aware navigation
│   │   │   ├── ProtectedRoute.tsx    # Route protection
│   │   │   └── ReviewModal.tsx       # Review submission
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication context
│   │   ├── lib/
│   │   │   ├── api.ts                # API client with all endpoints
│   │   │   └── razorpay.ts           # Payment integration
│   │   └── types/
│   │       └── index.ts              # TypeScript definitions
│   ├── package.json                  # Frontend dependencies
│   └── tailwind.config.js            # Tailwind configuration
├── backend/                          # Express.js backend API
│   ├── src/
│   │   ├── v1/                       # API version 1
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # JWT authentication
│   │   │   │   └── errorHandler.ts   # Error handling
│   │   │   └── routes/               # API routes
│   │   │       ├── admin.ts          # Admin endpoints
│   │   │       ├── auth.ts           # Authentication
│   │   │       ├── bookings.ts       # Booking management
│   │   │       ├── leaderboard.ts    # Leaderboard & rankings
│   │   │       ├── mentor.ts         # Mentor endpoints
│   │   │       ├── mentors.ts        # Mentor browsing
│   │   │       ├── payments.ts       # Payment processing
│   │   │       ├── reviews.ts        # Review system
│   │   │       └── students.ts       # Student endpoints
│   │   └── server.ts                 # Express server setup
│   └── package.json                  # Backend dependencies
├── prisma/                           # Database schema & migrations
│   ├── schema.prisma                 # Database models
│   ├── seed.js                       # Sample data
│   └── dev.db                        # SQLite database (auto-generated)
├── .env                              # Environment variables
└── package.json                      # Root workspace configuration
```

## 🔐 User Roles & Features

### 👨‍🎓 Students (STUDENT)
- **Authentication**: Login, signup, profile management
- **Mentor Discovery**: Browse mentors, filter by expertise/tier/price
- **Booking System**: Schedule sessions, manage bookings
- **Reviews**: Rate and review completed sessions
- **Leaderboard**: View top-rated mentors
- **Dashboard**: Track learning progress and bookings

### 👨‍🏫 Mentors (MENTOR)
- **Portal Access**: Dedicated mentor login and dashboard
- **Profile Management**: Edit bio, expertise, hourly rates
- **Booking Management**: View and manage sessions
- **Session Completion**: Mark sessions as completed
- **Reviews**: View student feedback and ratings
- **Earnings**: Track income and request payouts (73% of session fees)
- **Availability**: Manage scheduling availability

### 👨‍💼 Admins (ADMIN)
- **Analytics Dashboard**: Platform KPIs, revenue, user growth
- **Mentor Management**: Activate/deactivate mentors, verification
- **Booking Oversight**: Monitor all platform bookings
- **Revenue Tracking**: Platform fees (27%) vs mentor payouts (73%)
- **Leaderboard Control**: Recompute rankings, manage domains
- **User Analytics**: Growth metrics, session completion rates

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `GET /api/v1/auth/me` - Get current user

### Student Routes
- `GET /api/v1/students/me/bookings` - Get student bookings
- `GET /api/v1/students/me/dashboard` - Student dashboard stats

### Mentor Routes
- `GET /api/v1/mentor/profile` - Get mentor profile
- `PUT /api/v1/mentor/profile` - Update mentor profile
- `GET /api/v1/mentor/stats` - Get mentor statistics
- `GET /api/v1/mentor/bookings` - Get mentor bookings
- `PUT /api/v1/mentor/bookings/:id/complete` - Complete session
- `GET /api/v1/mentor/reviews` - Get mentor reviews
- `POST /api/v1/mentor/payout` - Request payout

### Admin Routes
- `GET /api/v1/admin/overview` - Dashboard overview
- `GET /api/v1/admin/mentors` - Get all mentors
- `PUT /api/v1/admin/mentors/:id/status` - Update mentor status
- `GET /api/v1/admin/bookings` - Get all bookings
- `GET /api/v1/admin/revenue` - Revenue analytics
- `GET /api/v1/admin/ranking` - Leaderboard with filters
- `POST /api/v1/admin/ranking/compute` - Recompute rankings

### Public Routes
- `GET /api/v1/mentors` - Browse mentors
- `GET /api/v1/mentors/:id` - Get mentor details
- `GET /api/v1/leaderboard` - Public leaderboard
- `POST /api/v1/bookings` - Create booking
- `POST /api/v1/reviews` - Submit review
- `POST /api/v1/payments/initiate` - Start payment

## 🗄️ Database Schema

### Core Models
- **User**: Base user entity with roles (STUDENT/MENTOR/ADMIN)
- **Student**: Student-specific profile and relationships
- **Mentor**: Mentor profile, expertise, rates, availability
- **Booking**: Session bookings with status tracking
- **Review**: Student feedback and ratings
- **Payment**: Razorpay integration for payments
- **LeaderboardCache**: Cached mentor rankings

### Key Relationships
- User → Student/Mentor (one-to-one)
- Mentor → Bookings (one-to-many)
- Student → Bookings (one-to-many)
- Booking → Review (one-to-one)
- Booking → Payment (one-to-one)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd EdVisor

# Install all dependencies
npm run install:all
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update .env with your configurations
# DATABASE_URL, JWT_SECRET, RAZORPAY_KEYS etc.
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate

# Seed with sample data
npm run db:seed

# Open Prisma Studio (optional)
npm run db:studio
```

### 4. Development Server
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:4001
```

### 5. Create Admin Account
```bash
# Use Prisma Studio or run this in backend directory:
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@edvisor.com',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    }
  });
  console.log('Admin created:', admin.email);
}
createAdmin();
"
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# CORS & API
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4001/api/v1"

# Payments (Optional)
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# SEO (Optional)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Build Commands
```bash
# Build for production
npm run build

# Database operations
npm run db:reset      # Reset database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed data

# Verification
npm run verify        # Check setup
```

## 🔄 Data Flow

### Student Booking Flow
1. Student browses mentors (`/mentors`)
2. Selects mentor and time slot
3. Booking modal opens with payment
4. Razorpay payment processing
5. Booking confirmed, mentor notified
6. Session completion by mentor
7. Student can submit review

### Mentor Dashboard Flow
1. Mentor logs in via `/mentor/login`
2. Dashboard shows earnings, sessions, ratings
3. Manage bookings in `/mentor/bookings`
4. Mark sessions complete
5. View reviews and student feedback
6. Request payouts (73% of session fees)

### Admin Management Flow
1. Admin accesses `/admin/login`
2. Overview dashboard with KPIs
3. Mentor management and verification
4. Booking oversight and monitoring
5. Revenue analytics (27% platform fee)
6. Leaderboard ranking computation

## 💰 Revenue Model

### Platform Economics
- **Student Payment**: 100% session fee
- **Platform Fee**: 27% of session fee
- **Mentor Payout**: 73% of session fee
- **Automatic Calculation**: Built into booking system

### Payment Flow
1. Student pays full session amount
2. Platform retains 27% as service fee
3. Mentor receives 73% upon completion
4. Payout requests processed by admin

## 🎨 UI/UX Features

### Design System
- **Blue & Emerald** primary theme
- **Responsive Design** with mobile-first approach
- **Role-based Navigation** with color coding
- **Loading States** and animations
- **Toast Notifications** for user feedback

### Accessibility
- **Semantic HTML** structure
- **Keyboard Navigation** support
- **Screen Reader** friendly
- **High Contrast** colors
- **Focus Indicators** visible

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** with expiry checking
- **Role-based Access Control** (RBAC)
- **Protected Routes** for all user types
- **Password Hashing** with bcrypt
- **Session Management** with auto-logout

### API Security
- **Rate Limiting** on all endpoints
- **CORS Configuration** for frontend
- **Helmet.js** for security headers
- **Input Validation** with Joi schemas
- **SQL Injection** protection via Prisma

## 📈 Future Enhancements

### Immediate Next Steps
1. **Real Payment Integration** - Full Razorpay implementation
2. **Email Notifications** - Booking confirmations, reminders
3. **Video Calling** - Integrated meeting solution
4. **Mobile App** - React Native companion app

### Advanced Features
1. **AI Mentor Matching** - Smart recommendation system
2. **Group Sessions** - Multiple students per session
3. **Course Creation** - Structured learning paths
4. **Analytics Dashboard** - Advanced metrics and insights
5. **Multi-language** - Internationalization support

## 🚦 Testing

### Development Testing
```bash
# Run frontend tests
npm run test --workspace=frontend

# Run backend tests  
npm run test --workspace=backend

# API testing with curl
curl -X GET http://localhost:4001/api/v1/mentors
```

### Manual Testing Checklist
- [ ] Student registration and login
- [ ] Mentor registration and login  
- [ ] Admin login and dashboard access
- [ ] Booking flow end-to-end
- [ ] Payment integration (if configured)
- [ ] Review submission
- [ ] Role-based route protection
- [ ] Responsive design on mobile

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional Commits** for messages

## 📞 Support

### Getting Help
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check this guide first
- **Community**: Join our Discord (link in repo)

### Common Issues
1. **Port Conflicts**: Change ports in package.json if needed
2. **Database Issues**: Run `npm run db:reset` to start fresh
3. **Environment**: Ensure all .env variables are set
4. **Dependencies**: Try `rm -rf node_modules && npm install`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Prisma Team** for the excellent ORM
- **Tailwind CSS** for utility-first styling
- **React Query** for server state management
- **All Contributors** who make this project possible

---

**Built with ❤️ by the EdVisor Team**

*Happy Learning! 🚀*