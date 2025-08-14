#!/usr/bin/env node

// Deployment readiness check script
const fs = require('fs');
const path = require('path');

console.log('🚀 Checking deployment readiness...\n');

const checks = [
  {
    name: 'Database URL Environment Variable',
    check: () => !!process.env.DATABASE_URL,
    help: 'Ensure DATABASE_URL is properly set in your environment'
  },
  {
    name: 'Migration Files',
    check: () => {
      try {
        const migrationsDir = './migrations';
        return fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).some(f => f.endsWith('.sql'));
      } catch (e) {
        return false;
      }
    },
    help: 'Run "npm run db:generate" to create migration files if missing'
  },
  {
    name: 'Drizzle Kit in Dependencies',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        return !!(pkg.dependencies && pkg.dependencies['drizzle-kit']);
      } catch (e) {
        return false;
      }
    },
    help: 'Drizzle Kit should be in dependencies for production migrations'
  },
  {
    name: 'Build Directory',
    check: () => {
      try {
        return fs.existsSync('./dist');
      } catch (e) {
        return false;
      }
    },
    help: 'Run "npm run build" to create production build'
  },
  {
    name: 'Health Endpoint',
    check: async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        return data.status === 'healthy';
      } catch (e) {
        return false;
      }
    },
    help: 'Ensure the development server is running and healthy'
  }
];

async function runChecks() {
  let allPassed = true;
  
  for (const check of checks) {
    const passed = await check.check();
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    
    if (!passed) {
      console.log(`   → ${check.help}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All deployment checks passed! Ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Click the Deploy button in Replit');
    console.log('2. Verify the deployment has DATABASE_URL configured');
    console.log('3. Check the deployment logs for successful migration');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runChecks();