const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 QA Testing - Git Automation Setup');
console.log('=====================================\n');

// Step 1: Check Git installation
console.log('1️⃣ Checking Git installation...');
try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' });
    console.log('   ✅ ' + gitVersion.trim());
} catch {
    console.log('   ❌ Git is not installed. Please install Git from https://git-scm.com/');
    process.exit(1);
}

// Step 2: Check Node.js installation
console.log('\n2️⃣ Checking Node.js installation...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' });
    console.log('   ✅ Node.js ' + nodeVersion.trim());
} catch {
    console.log('   ❌ Node.js is not installed. Please install from https://nodejs.org/');
    process.exit(1);
}

// Step 3: Initialize Git if needed
console.log('\n3️⃣ Setting up Git repository...');
try {
    execSync('git status', { stdio: 'pipe' });
    console.log('   ✅ Git repository exists');
} catch {
    console.log('   Initializing Git repository...');
    execSync('git init');
    console.log('   ✅ Git repository initialized');
}

// Step 4: Check/Create initial files
console.log('\n4️⃣ Setting up project files...');
const readmePath = path.join(process.cwd(), 'README.md');
if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, '# QA Testing\n\nAutomated testing project with Playwright\n');
    console.log('   ✅ Created README.md');
}

const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreContent = `node_modules/
dist/
build/
logs/
*.log
.env
.env.local
test-results/
playwright-report/
.DS_Store
Thumbs.db
`;

fs.writeFileSync(gitignorePath, gitignoreContent);
console.log('   ✅ Created .gitignore');

// Step 5: Create initial commit
console.log('\n5️⃣ Creating initial commit...');
try {
    const hasCommits = execSync('git log --oneline', { encoding: 'utf8' });
    if (!hasCommits) {
        execSync('git add README.md .gitignore');
        execSync('git commit -m "Initial commit: Project setup"');
        console.log('   ✅ Initial commit created');
    } else {
        console.log('   ✅ Commits already exist');
    }
} catch {
    execSync('git add README.md .gitignore');
    execSync('git commit -m "Initial commit: Project setup"');
    console.log('   ✅ Initial commit created');
}

// Step 6: Set up main branch
console.log('\n6️⃣ Setting up main branch...');
try {
    execSync('git branch -M main');
    console.log('   ✅ Branch set to main');
} catch {
    console.log('   ⚠️  Branch rename may have failed');
}

// Step 7: Add remote
console.log('\n7️⃣ Adding GitHub remote...');
try {
    execSync('git remote remove origin', { stdio: 'pipe' });
} catch {
    // No remote to remove
}

try {
    execSync('git remote add origin https://github.com/clydetims/QA_testing.git');
    console.log('   ✅ Remote origin added');
} catch (error) {
    console.log('   ❌ Failed to add remote. Please check repository name.');
    console.log('   Expected: https://github.com/clydetims/QA_testing.git');
}

// Step 8: Push to GitHub
console.log('\n8️⃣ Pushing to GitHub...');
console.log('   Note: You may need to login. A browser window will open.');
try {
    execSync('git push -u origin main', { stdio: 'inherit' });
    console.log('   ✅ Pushed to GitHub successfully!');
} catch {
    console.log('   ⚠️  Push failed. You might need to:');
    console.log('   1. Create the repository on GitHub first');
    console.log('   2. Or use SSH instead of HTTPS');
    console.log('\n   Try manually:');
    console.log('   git push -u origin main');
}

// Step 9: Create project structure
console.log('\n9️⃣ Creating automation folder structure...');
const dirs = [
    'src/git-automation/commands',
    'src/git-automation/core',
    'src/git-automation/utils',
    'src/git-automation/types',
    'scripts',
    'logs',
    'tests/ui',
    'tests/api'
];

dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   📁 ${dir}`);
});

// Step 10: Setup npm
console.log('\n🔟 Setting up npm...');
if (!fs.existsSync('package.json')) {
    execSync('npm init -y', { stdio: 'pipe' });
    console.log('   ✅ package.json created');
}

// Update package.json with scripts
const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts = {
    ...pkg.scripts,
    "push": "ts-node scripts/push.ts",
    "pull": "ts-node scripts/pull.ts",
    "sync": "ts-node scripts/sync.ts",
    "test": "echo \"Add your test command here\""
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('   ✅ Scripts added to package.json');

// Step 11: Install dependencies
console.log('\n📦 Installing dependencies...');
execSync('npm install chalk@4.1.2 commander@11.0.0', { stdio: 'inherit' });
execSync('npm install -D typescript ts-node @types/node', { stdio: 'inherit' });
console.log('   ✅ Dependencies installed');

// Final summary
console.log('\n' + '='.repeat(40));
console.log('✅ SETUP COMPLETE!');
console.log('='.repeat(40));
console.log('\n📝 Your repository is now connected to:');
console.log('   https://github.com/clydetims/QA_testing');
console.log('\n🚀 Next steps:');
console.log('   1. Copy the TypeScript automation files');
console.log('   2. Run: npm run push');
console.log('   3. Start automating your Git workflow!');
console.log('\n💡 Quick commands:');
console.log('   git status          - Check your status');
console.log('   git remote -v       - Check remote connection');
console.log('   npm run push        - Automated commit and push');