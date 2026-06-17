const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function runGit(command, silent = false) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: silent ? 'pipe' : 'inherit'
        }).trim();
    } catch (error) {
        if (!silent) {
            log(`Git command failed: git ${command}`, 'red');
        }
        throw error;
    }
}

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
}

async function pullCommand() {
    console.log('\n' + '='.repeat(40));
    log('📥 GIT PULL AUTOMATION', 'blue');
    console.log('='.repeat(40) + '\n');

    // Step 1: Fetch latest changes
    log('🔍 Fetching latest changes...', 'yellow');
    runGit('fetch origin');

    // Step 2: Check for local changes
    const status = runGit('status --short', true);
    const branch = runGit('rev-parse --abbrev-ref HEAD', true);
    
    log(`📍 Current branch: ${branch}`, 'blue');

    if (status) {
        log('⚠️  You have uncommitted changes:', 'yellow');
        console.log(status);
        
        const choice = await askQuestion('\nHow to proceed? [s]tash / [c]ommit / [x]cancel: ');
        
        if (choice === 'x' || choice === 'cancel') {
            log('❌ Pull cancelled', 'yellow');
            rl.close();
            return;
        }
        
        if (choice === 'c' || choice === 'commit') {
            const message = await askQuestion('Enter commit message: ');
            if (message.length < 3) {
                log('❌ Invalid commit message', 'red');
                rl.close();
                return;
            }
            runGit('add .');
            runGit(`commit -m "${message}"`);
            log('✅ Changes committed', 'green');
        }
        
        if (choice === 's' || choice === 'stash') {
            log('📦 Stashing changes...', 'yellow');
            runGit('stash push -m "Auto-stash before pull"');
            log('✅ Changes stashed', 'green');
        }
    }

    // Step 3: Pull changes
    log('📥 Pulling changes...', 'yellow');
    try {
        runGit(`pull origin ${branch} --no-edit`);
        log('✅ Successfully pulled latest changes!', 'green');
    } catch (error) {
        if (error.message.includes('conflict')) {
            log('⚠️  Merge conflicts detected!', 'red');
            log('Please resolve conflicts manually, then run: npm run push', 'yellow');
        }
        throw error;
    }

    // Step 4: Restore stash if needed
    if (status && (choice === 's' || choice === 'stash')) {
        log('📤 Restoring stashed changes...', 'yellow');
        try {
            runGit('stash pop');
            log('✅ Stashed changes restored', 'green');
        } catch (error) {
            log('⚠️  Conflicts when restoring stash. Please resolve manually.', 'red');
        }
    }

    console.log('\n' + '='.repeat(40));
    log('✅ PULL COMPLETE', 'green');
    console.log('='.repeat(40) + '\n');

    rl.close();
}

pullCommand().catch(error => {
    log(`\n❌ Pull failed: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});