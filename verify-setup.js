#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const statusColor = exists ? 'green' : 'red';
  log(`${status} ${description}: ${filePath}`, statusColor);
  return exists;
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkNodeModules(dir, description) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageJsonPath = path.join(dir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log(`❌ ${description}: package.json not found`, 'red');
    return false;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    log(`❌ ${description}: node_modules not found`, 'red');
    return false;
  }

  log(`✅ ${description}`, 'green');
  return true;
}

function checkEnvFile(filePath, requiredVars) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Environment file missing: ${filePath}`, 'red');
    return false;
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!envContent.includes(varName + '=')) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    log(`⚠️ Environment file ${filePath} missing variables:`, 'yellow');
    missingVars.forEach(variable => log(`   - ${variable}`, 'yellow'));
    return false;
  }

  log(`✅ Environment file configured: ${filePath}`, 'green');
  return true;
}

async function main() {
  log('🔍 EdVisor Setup Verification', 'bold');
  log('==============================', 'bold');
  
  let allChecksPass = true;
  const projectRoot = process.cwd();

  // Check system prerequisites
  log('\n📋 System Prerequisites:', 'blue');
  allChecksPass &= checkCommand('node --version', 'Node.js installed');
  allChecksPass &= checkCommand('npm --version', 'npm installed');
  allChecksPass &= checkCommand('psql --version', 'PostgreSQL installed');

  // Check project structure
  log('\n📁 Project Structure:', 'blue');
  allChecksPass &= checkFile(path.join(projectRoot, 'package.json'), 'Root package.json');
  allChecksPass &= checkFile(path.join(projectRoot, 'frontend', 'package.json'), 'Frontend package.json');
  allChecksPass &= checkFile(path.join(projectRoot, 'backend', 'package.json'), 'Backend package.json');
  allChecksPass &= checkFile(path.join(projectRoot, 'prisma', 'schema.prisma'), 'Prisma schema');

  // Check dependencies
  log('\n📦 Dependencies:', 'blue');
  allChecksPass &= checkNodeModules(projectRoot, 'Root dependencies');
  allChecksPass &= checkNodeModules(path.join(projectRoot, 'frontend'), 'Frontend dependencies');
  allChecksPass &= checkNodeModules(path.join(projectRoot, 'backend'), 'Backend dependencies');

  // Check environment files
  log('\n🔧 Environment Configuration:', 'blue');
  const requiredRootVars = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'PORT'];
  allChecksPass &= checkEnvFile(path.join(projectRoot, '.env'), requiredRootVars);

  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');
  const requiredFrontendVars = ['NEXT_PUBLIC_API_URL'];
  if (fs.existsSync(frontendEnvPath)) {
    allChecksPass &= checkEnvFile(frontendEnvPath, requiredFrontendVars);
  } else {
    log(`⚠️ Frontend environment file optional: ${frontendEnvPath}`, 'yellow');
  }

  // Check database connection
  log('\n🗄️ Database Connection:', 'blue');
  try {
    execSync('npx prisma db pull', { stdio: 'pipe', cwd: projectRoot });
    log('✅ Database connection successful', 'green');
  } catch (error) {
    log('❌ Database connection failed', 'red');
    log('   Make sure PostgreSQL is running and DATABASE_URL is correct', 'yellow');
    allChecksPass = false;
  }

  // Check Prisma client
  log('\n🔄 Prisma Setup:', 'blue');
  try {
    const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
      log('✅ Prisma client generated', 'green');
    } else {
      log('❌ Prisma client not generated', 'red');
      log('   Run: npx prisma generate', 'yellow');
      allChecksPass = false;
    }
  } catch (error) {
    log('⚠️ Could not verify Prisma client', 'yellow');
  }

  // Check for essential files
  log('\n📄 Essential Files:', 'blue');
  allChecksPass &= checkFile(path.join(projectRoot, '.gitignore'), '.gitignore');
  allChecksPass &= checkFile(path.join(projectRoot, 'README.md'), 'README.md');
  allChecksPass &= checkFile(path.join(projectRoot, 'backend', 'src', 'server.ts'), 'Backend server');
  allChecksPass &= checkFile(path.join(projectRoot, 'frontend', 'src', 'app', 'page.tsx'), 'Frontend main page');

  // Test build capability
  log('\n🔨 Build Test:', 'blue');
  try {
    log('   Testing TypeScript compilation...', 'yellow');
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: path.join(projectRoot, 'backend') });
    log('✅ Backend TypeScript compilation successful', 'green');
  } catch (error) {
    log('❌ Backend TypeScript compilation failed', 'red');
    allChecksPass = false;
  }

  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: path.join(projectRoot, 'frontend') });
    log('✅ Frontend TypeScript compilation successful', 'green');
  } catch (error) {
    log('❌ Frontend TypeScript compilation failed', 'red');
    allChecksPass = false;
  }

  // Final summary
  log('\n📊 Setup Summary:', 'bold');
  log('==================', 'bold');
  
  if (allChecksPass) {
    log('🎉 All checks passed! Your EdVisor setup is ready.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start development servers: npm run dev', 'yellow');
    log('2. Visit frontend: http://localhost:3000', 'yellow');
    log('3. Test backend API: http://localhost:4000/health', 'yellow');
    log('4. Login with demo account: demo@student.test / demo123', 'yellow');
    log('\n✨ Happy coding!', 'bold');
  } else {
    log('⚠️ Some checks failed. Please address the issues above.', 'red');
    log('\nCommon solutions:', 'yellow');
    log('1. Install dependencies: npm install', 'yellow');
    log('2. Setup environment: cp .env.example .env', 'yellow');
    log('3. Generate Prisma client: npx prisma generate', 'yellow');
    log('4. Run database migrations: npm run db:migrate', 'yellow');
    log('5. Seed database: npm run db:seed', 'yellow');
    log('\n📖 See SETUP.md for detailed instructions.', 'blue');
  }

  process.exit(allChecksPass ? 0 : 1);
}

main().catch(console.error);