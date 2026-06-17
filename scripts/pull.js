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

function runGitSilent(command) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        }).trim();
    } catch (error) {
        return '';  // Return empty string on error, never null
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

async function pullCommand() {
    console.log('\n' + '='.repeat(50));
    log('📥 GIT PULL AUTOMATION', 'blue');
    console.log('='.repeat(50) + '\n');

    try {
        // Step 1: Get current branch
        const branch = runGitSilent('rev-parse --abbrev-ref HEAD');
        
        if (!branch) {
            log('❌ Not a git repository or no commits yet', 'red');
            rl.close();
            return;
        }
        
        log(`📍 Current branch: ${branch}`, 'blue');

        // Step 2: Fetch latest changes
        log('🔍 Checking for remote changes...', 'yellow');
        const fetchResult = runGitShow('fetch origin');
        
        if (!fetchResult.success) {
            log('⚠️  Could not fetch from remote. Check your internet connection.', 'yellow');
            log('Continuing with local operation only...', 'yellow');
        }

        // Step 3: Check if there are changes to pull
        let behindCount = 0;
        try {
            behindCount = parseInt(runGitSilent(`rev-list HEAD..origin/${branch} --count`)) || 0;
        } catch (e) {
            // Remote branch might not exist
        }

        if (behindCount === 0) {
            log('✅ Already up to date - no remote changes', 'green');
            rl.close();
            return;
        }

        // Step 4: Show what's coming
        log(`\n📊 Remote has ${behindCount} new commit(s)`, 'yellow');
        
        const remoteChanges = runGitSilent(`log HEAD..origin/${branch} --oneline --no-merges`);
        if (remoteChanges) {
            log('New commits:', 'cyan');
            console.log(remoteChanges);
        }
        
        const changedFiles = runGitSilent(`diff --stat HEAD...origin/${branch}`);
        if (changedFiles) {
            log('\n📁 Files that will be updated:', 'cyan');
            console.log(changedFiles);
        }

        // Step 5: Check for local changes
        const localChanges = runGitSilent('status --short');
        const hasLocalChanges = localChanges.length > 0;
        let stashCreated = false;

        if (hasLocalChanges) {
            log('\n⚠️  You have uncommitted local changes:', 'yellow');
            console.log(localChanges);
            
            const choice = await askQuestion('\nHow to proceed? [s]tash (safe) / [c]ommit / [x]cancel: ');
            
            if (choice === 'x') {
                log('❌ Pull cancelled - your work is untouched', 'yellow');
                rl.close();
                return;
            }
            
            if (choice === 'c') {
                const message = await askQuestion('Commit message: ');
                if (!message || message.length < 3) {
                    log('❌ Commit message too short. Cancelled.', 'red');
                    rl.close();
                    return;
                }
                
                log('📦 Committing changes...', 'yellow');
                runGitShow('add .');
                const commitResult = runGitShow(`commit -m "${message.replace(/"/g, '\\"')}"`);
                
                if (!commitResult.success) {
                    log('❌ Commit failed', 'red');
                    rl.close();
                    return;
                }
                log('✅ Changes committed', 'green');
            } else {
                // Default: stash
                log('📦 Stashing changes safely...', 'yellow');
                const stashResult = runGitShow('stash push -m "AUTO_STASH_BEFORE_PULL"');
                
                if (stashResult.success) {
                    stashCreated = true;
                    log('✅ Changes stashed', 'green');
                } else {
                    log('⚠️  Could not stash. Pull cancelled.', 'yellow');
                    rl.close();
                    return;
                }
            }
        }

        // Step 6: Pull the changes
        log('\n📥 Pulling changes...', 'yellow');
        const pullResult = runGitShow(`pull origin ${branch} --no-edit`);

        if (pullResult.success) {
            log('✅ Successfully pulled latest changes!', 'green');
        } else {
            // Check for conflicts
            const conflicts = runGitSilent('diff --name-only --diff-filter=U');
            
            if (conflicts) {
                log('\n⚠️  MERGE CONFLICTS DETECTED!', 'red');
                log('\nConflicted files:', 'yellow');
                console.log(conflicts);
                
                log('\n📝 How to resolve:', 'cyan');
                console.log('1. Open each conflicted file');
                console.log('2. Look for <<<<<<<, =======, >>>>>>> markers');
                console.log('3. Edit to keep desired changes');
                console.log('4. Remove the conflict markers');
                console.log('5. Save the file');
                console.log('6. Run: git add <filename>');
                console.log('7. Run: npm run push');
                
                if (stashCreated) {
                    log('\n⚠️  Your stashed changes are SAFE!', 'yellow');
                    log('Resolve conflicts first, then run:', 'cyan');
                    log('   git stash pop', 'cyan');
                }
            } else {
                log('\n❌ Pull failed for unknown reason', 'red');
                log('Your work is safe.', 'yellow');
            }
            
            rl.close();
            return;
        }

        // Step 7: Restore stashed changes
        if (stashCreated) {
            log('\n📤 Restoring your stashed changes...', 'yellow');
            const stashPopResult = runGitShow('stash pop');
            
            if (stashPopResult.success) {
                log('✅ Your changes restored successfully!', 'green');
            } else {
                log('\n⚠️  Conflicts when restoring your changes!', 'red');
                log('Your changes are SAFE in the stash.', 'yellow');
                log('Run manually:', 'cyan');
                log('   git stash pop', 'cyan');
                log('   (Resolve any conflicts, then: npm run push)', 'cyan');
            }
        }

        // Step 8: Show final status
        console.log('\n' + '='.repeat(50));
        log('✅ PULL COMPLETE', 'green');
        console.log('='.repeat(50));
        
        const finalStatus = runGitSilent('status --short');
        if (finalStatus) {
            log('\n📊 Current status:', 'blue');
            console.log(finalStatus);
        } else {
            log('\n✨ Working tree is clean!', 'green');
        }
        
        // Show latest commit
        const lastCommit = runGitSilent('log -1 --oneline');
        if (lastCommit) {
            log(`\n📝 Latest commit: ${lastCommit}`, 'cyan');
        }
        
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        log(`\n❌ Pull failed: ${error.message}`, 'red');
        log('\n💡 Your work is safe. Try these:', 'cyan');
        console.log('   1. Check your internet connection');
        console.log('   2. git status (check local state)');
        console.log('   3. npm run sync (full sync)');
    }
    
    rl.close();
}

pullCommand().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});