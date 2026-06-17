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
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runGitSilent(command) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        }).trim();
    } catch (error) {
        return '';  // Always return string, never null
    }
}

function runGitShow(command) {
    try {
        execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: 'inherit'
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
}

async function syncCommand() {
    console.log('\n' + '='.repeat(50));
    log('🔄 GIT SYNC AUTOMATION', 'blue');
    log('Sync your work with the team safely', 'cyan');
    console.log('='.repeat(50));

    try {
        // Get current branch
        const branch = runGitSilent('rev-parse --abbrev-ref HEAD');
        if (!branch) {
            log('❌ Not a git repository', 'red');
            rl.close();
            return;
        }
        log(`\n📍 Current branch: ${branch}`, 'blue');

        // Check local changes
        const localChanges = runGitSilent('status --short');
        const hasLocalChanges = localChanges.length > 0;

        if (hasLocalChanges) {
            log('\n📝 Your local changes:', 'yellow');
            console.log(localChanges);
        } else {
            log('✅ No local changes', 'green');
        }

        // Fetch remote
        log('\n🔍 Checking for team updates...', 'yellow');
        const fetchResult = runGitShow('fetch origin');
        
        if (!fetchResult.success) {
            log('⚠️  Could not fetch from remote', 'yellow');
        }

        // Check behind/ahead
        let behindCount = 0;
        let aheadCount = 0;
        try {
            behindCount = parseInt(runGitSilent(`rev-list HEAD..origin/${branch} --count`)) || 0;
            aheadCount = parseInt(runGitSilent(`rev-list origin/${branch}..HEAD --count`)) || 0;
        } catch (e) {}

        log(`📊 You are ${behindCount} behind, ${aheadCount} ahead`, 'cyan');

        // Show team changes
        if (behindCount > 0) {
            log('\n👥 Team changes:', 'magenta');
            const teamCommits = runGitSilent(`log HEAD..origin/${branch} --oneline --no-merges`);
            if (teamCommits) console.log(teamCommits);
            
            const changedFiles = runGitSilent(`diff --stat HEAD...origin/${branch}`);
            if (changedFiles) {
                log('\n📁 Files:', 'cyan');
                console.log(changedFiles);
            }
        }

        // Handle local changes
        let stashCreated = false;
        if (hasLocalChanges && behindCount > 0) {
            log('\n⚠️  You have both local changes AND team updates', 'yellow');
            const choice = await askQuestion('\n[s]tash (safe) / [c]ommit / [x]cancel: ');
            
            if (choice === 'x') {
                log('Sync cancelled', 'yellow');
                rl.close();
                return;
            }
            
            if (choice === 'c') {
                const msg = await askQuestion('Commit message: ');
                if (msg.length >= 3) {
                    runGitShow('add .');
                    runGitShow(`commit -m "${msg}"`);
                    log('✅ Committed', 'green');
                }
            } else {
                runGitShow('stash push -m "SYNC_STASH"');
                stashCreated = true;
                log('✅ Stashed', 'green');
            }
        }

        // Pull if behind
        if (behindCount > 0) {
            log('\n📥 Pulling team updates...', 'yellow');
            const pullResult = runGitShow(`pull origin ${branch} --no-edit`);
            
            if (!pullResult.success) {
                const conflicts = runGitSilent('diff --name-only --diff-filter=U');
                if (conflicts) {
                    log('\n⚠️  CONFLICTS!', 'red');
                    console.log(conflicts);
                    log('\nResolve manually then: npm run push', 'cyan');
                }
                rl.close();
                return;
            }
            log('✅ Pulled successfully', 'green');
        }

        // Restore stash
        if (stashCreated) {
            log('\n📤 Restoring your changes...', 'yellow');
            const stashResult = runGitShow('stash pop');
            if (!stashResult.success) {
                log('⚠️  Conflicts restoring stash. Your work is safe.', 'yellow');
            } else {
                log('✅ Changes restored', 'green');
            }
        }

        // Push if ahead
        if (aheadCount > 0) {
            log('\n📤 Pushing your commits...', 'yellow');
            runGitShow(`push origin ${branch}`);
            log('✅ Pushed', 'green');
        }

        console.log('\n' + '='.repeat(50));
        log('✅ SYNC COMPLETE!', 'green');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        log(`\n❌ Sync failed: ${error.message}`, 'red');
        log('Your work is safe.', 'yellow');
    }
    
    rl.close();
}

syncCommand().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});