Write-Host "Setting up Git Automation..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check Git
Write-Host "`n[1/6] Checking Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "   [OK] Git is installed" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Git not found. Please install Git first." -ForegroundColor Red
    exit
}

# Check Git repo
Write-Host "`n[2/6] Checking Git repository..." -ForegroundColor Yellow
try {
    git status | Out-Null
    Write-Host "   [OK] Git repository found" -ForegroundColor Green
} catch {
    Write-Host "   Initializing Git..." -ForegroundColor Yellow
    git init
    Write-Host "   [OK] Git initialized" -ForegroundColor Green
}

# Check remote
Write-Host "`n[3/6] Checking remote connection..." -ForegroundColor Yellow
$remote = git remote -v
if ($remote -match "origin") {
    Write-Host "   [OK] Remote exists:" -ForegroundColor Green
    Write-Host "   $remote"
} else {
    Write-Host "   Adding remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/clydetims/QA_testing.git
    Write-Host "   [OK] Remote added" -ForegroundColor Green
}

# Create folders
Write-Host "`n[4/6] Creating folder structure..." -ForegroundColor Yellow
$folders = @(
    "src/git-automation/commands",
    "src/git-automation/core",
    "src/git-automation/utils",
    "src/git-automation/types",
    "scripts",
    "logs"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Write-Host "   + $folder"
}
Write-Host "   [OK] Folders created" -ForegroundColor Green

# Install dependencies
Write-Host "`n[5/6] Installing dependencies..." -ForegroundColor Yellow
npm install chalk@4.1.2 commander@11.0.0
npm install --save-dev ts-node @types/node
Write-Host "   [OK] Dependencies installed" -ForegroundColor Green

# Update .gitignore
Write-Host "`n[6/6] Updating .gitignore..." -ForegroundColor Yellow
$gitignore = @(
    "node_modules/",
    "dist/",
    "test-results/",
    "playwright-report/",
    "logs/",
    "*.log",
    ".env"
) -join "`n"
Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "   [OK] .gitignore updated" -ForegroundColor Green

Write-Host "`n================================`n" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "   1. Create scripts/push.js and scripts/pull.js"
Write-Host "   2. Run: npm run push"
Write-Host "   3. Visit: https://github.com/clydetims/QA_testing"
Write-Host "`nIf you need to push your existing code:" -ForegroundColor Cyan
Write-Host "   git add ."
Write-Host "   git commit -m 'Initial commit'"
Write-Host "   git push -u origin main"