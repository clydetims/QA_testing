const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Color helpers
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runGit(command) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
    } catch (error) {
        log(`Git command failed: git ${command}`, 'red');
        log(error.message, 'red');
        process.exit(1);
    }
}

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function pushCommand() {
    console.log('\n' + '='.repeat(40));
    log('🚀 GIT PUSH AUTOMATION', 'blue');
    console.log('='.repeat(40) + '\n');

    // Step 1: Check repository status
    log('📊 Checking repository status...', 'yellow');
    const status = runGit('status --short');
    
    if (!status) {
        log('✅ No changes to commit - working tree is clean', 'green');
        
        // Check if there are unpushed commits
        const branch = runGit('rev-parse --abbrev-ref HEAD');
        try {
            const unpushed = runGit(`log origin/${branch}..HEAD --oneline`);
            if (unpushed) {
                log(`📤 You have unpushed commits. Pushing to ${branch}...`, 'yellow');
                runGit(`push origin ${branch}`);
                log('✅ Successfully pushed to remote!', 'green');
            } else {
                log('✅ Everything is up to date!', 'green');
            }
        } catch {
            log('⚠️  No remote branch found. Will push when you commit.', 'yellow');
        }
        
        rl.close();
        return;
    }

    // Show current changes
    log('📝 Current changes:', 'blue');
    console.log(status);

    // Step 2: Get branch name
    const branch = runGit('rev-parse --abbrev-ref HEAD');
    log(`📍 Current branch: ${branch}`, 'blue');

    // Step 3: Ask for commit message
    const commitMessage = await askQuestion('\n💬 Enter commit message: ');
    
    if (!commitMessage || commitMessage.length < 3) {
        log('❌ Commit message must be at least 3 characters.', 'red');
        rl.close();
        return;
    }

    // Step 4: Stage all changes
    log('\n📦 Staging changes...', 'yellow');
    runGit('add .');
    log('✅ Changes staged', 'green');

    // Step 5: Commit
    log('💾 Committing changes...', 'yellow');
    runGit(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    log('✅ Changes committed', 'green');

    // Step 6: Push
    log(`📤 Pushing to origin/${branch}...`, 'yellow');
    try {
        runGit(`push origin ${branch}`);
        log('✅ Successfully pushed to remote!', 'green');
    } catch (error) {
        if (error.message.includes('no upstream branch')) {
            log('First push - setting upstream...', 'yellow');
            runGit(`push -u origin ${branch}`);
            log('✅ Successfully pushed to remote!', 'green');
        } else {
            throw error;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(40));
    log('✨ PUSH SUMMARY', 'blue');
    console.log('='.repeat(40));
    log(`Branch: ${branch}`, 'cyan');
    log(`Commit: ${commitMessage}`, 'cyan');
    log(`Remote: ${runGit('remote get-url origin')}`, 'cyan');
    console.log('='.repeat(40) + '\n');

    rl.close();
}

// Run the command
pushCommand().catch(error => {
    log(`\n❌ Push failed: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});