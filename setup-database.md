# 🗃️ Database Setup Guide

## Quick PostgreSQL Setup for Windows

### Option 1: Using PostgreSQL Installer (Recommended)

1. **Download PostgreSQL**:
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer for Windows x86-64
   - Run the installer

2. **Installation Settings**:
   ```
   Port: 5432 (default)
   Superuser: postgres
   Password: password (or choose your own)
   ```

3. **After Installation**:
   ```bash
   # Test connection (in Command Prompt or PowerShell)
   psql -U postgres -h localhost
   
   # Create the EdVisor database
   CREATE DATABASE edvisor;
   
   # List databases to verify
   \l
   
   # Exit
   \q
   ```

### Option 2: Using Docker (Alternative)

```bash
# Pull and run PostgreSQL container
docker run --name postgres-edvisor -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Connect to create database
docker exec -it postgres-edvisor psql -U postgres
CREATE DATABASE edvisor;
\q
```

### Option 3: Using pgAdmin (GUI Tool)

1. **Install pgAdmin** from https://www.pgadmin.org/download/
2. **Connect to PostgreSQL** using:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: (your password)
3. **Create Database**: Right-click Databases → Create → Database → Name: `edvisor`

## 🔧 Update Environment Variables

Edit `E:\EdVisor\.env`:

```env
# Update with your actual PostgreSQL credentials
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/edvisor"
```

Common variations:
```env
# If using default password 'password'
DATABASE_URL="postgresql://postgres:password@localhost:5432/edvisor"

# If using different username
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/edvisor"

# If PostgreSQL is on different port
DATABASE_URL="postgresql://postgres:password@localhost:5433/edvisor"

# If using Docker
DATABASE_URL="postgresql://postgres:password@localhost:5432/edvisor"
```

## 🚀 Start the Project

After setting up PostgreSQL:

```bash
# From E:\EdVisor directory
cd E:\EdVisor

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Start backend
npm run dev:backend
```

## 🔍 Troubleshooting

### Connection Issues

1. **"Connection refused"**:
   ```bash
   # Check if PostgreSQL is running
   # Windows Services: Search "services" → PostgreSQL should be running
   # Or restart: net stop postgresql-x64-15 && net start postgresql-x64-15
   ```

2. **"Authentication failed"**:
   ```bash
   # Double-check credentials in .env
   # Test connection manually:
   psql -U postgres -h localhost -d edvisor
   ```

3. **"Database does not exist"**:
   ```sql
   -- Connect as postgres user and create database
   psql -U postgres -h localhost
   CREATE DATABASE edvisor;
   \q
   ```

4. **Port conflicts**:
   ```bash
   # Check what's running on port 5432
   netstat -an | findstr :5432
   
   # If needed, change port in PostgreSQL config and update .env
   ```

## ✅ Verification

Test your setup:

```bash
# Should connect without errors
npx prisma db push

# Should show tables
npx prisma studio
```

If everything works, you should see:
- ✅ Database connection successful
- ✅ Tables created (users, students, mentors, bookings, etc.)
- ✅ Seed data populated
- ✅ Backend server starts on http://localhost:4000

## 📝 Default Credentials for Development

```
Database: edvisor
Username: postgres
Password: password
Host: localhost
Port: 5432

Test Account:
Email: demo@student.test
Password: demo123
```

Need help? Check the logs in the terminal for specific error messages!