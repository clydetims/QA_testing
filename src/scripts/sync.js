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

// Execute git command and return output (silent mode)
function runGitSilent(command) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        }).trim();
    } catch (error) {
        return '';
    }
}

// Execute git command and show output to user
function runGitShow(command) {
    try {
        execSync(`git ${command}`, { 
            encoding: 'utf8',
            stdio: 'inherit'
        });
        return true;
    } catch (error) {
        return false;
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
        // Step 1: Get current branch
        const branch = runGitSilent('rev-parse --abbrev-ref HEAD');
        if (!branch) {
            log('❌ Not a git repository or no commits yet', 'red');
            rl.close();
            return;
        }
        log(`\n📍 Current branch: ${branch}`, 'blue');

        // Step 2: Check for local changes
        const localChanges = runGitSilent('status --short');
        const hasLocalChanges = localChanges.length > 0;

        if (hasLocalChanges) {
            log('\n📝 Your local changes:', 'yellow');
            console.log(localChanges);
        } else {
            log('✅ Working tree clean - no local changes', 'green');
        }

        // Step 3: Fetch latest from remote (this is safe, just downloads info)
        log('\n🔍 Checking for team updates...', 'yellow');
        const fetchSuccess = runGitShow('fetch origin');
        
        if (!fetchSuccess) {
            log('⚠️  Could not fetch from remote. Check your internet connection.', 'yellow');
            log('Continuing with local operation only...', 'yellow');
        }

        // Step 4: Check how far behind/ahead we are
        let behindCount = 0;
        let aheadCount = 0;
        
        try {
            behindCount = parseInt(runGitSilent(`rev-list HEAD..origin/${branch} --count`)) || 0;
            aheadCount = parseInt(runGitSilent(`rev-list origin/${branch}..HEAD --count`)) || 0;
        } catch (error) {
            // Remote branch might not exist yet
        }

        log(`📊 You are ${behindCount} commit(s) behind and ${aheadCount} commit(s) ahead`, 'cyan');

        // Step 5: Show what team members changed
        if (behindCount > 0) {
            log('\n👥 Team members have made changes!', 'magenta');
            
            const remoteChanges = runGitSilent(`log HEAD..origin/${branch} --oneline --no-merges`);
            if (remoteChanges) {
                log('Recent commits:', 'cyan');
                console.log(remoteChanges);
            }
            
            const changedFiles = runGitSilent(`diff --stat HEAD...origin/${branch}`);
            if (changedFiles) {
                log('\n📁 Files changed:', 'cyan');
                console.log(changedFiles);
            }
        }

        // Step 6: Handle local changes before pulling
        let stashedChanges = false;
        
        if (hasLocalChanges && behindCount > 0) {
            log('\n⚠️  You have BOTH local changes AND team updates!', 'yellow');
            
            const choice = await askQuestion('\nHow to proceed? [s]tash (safe) / [c]ommit / [x]cancel: ');
            
            if (choice === 'x') {
                log('❌ Sync cancelled - your work is untouched', 'yellow');
                log('💡 Run "npm run push" to save your work first', 'cyan');
                rl.close();
                return;
            }
            
            if (choice === 'c') {
                const message = await askQuestion('Commit message: ');
                if (message.length < 3) {
                    log('❌ Commit message too short. Cancelled.', 'red');
                    rl.close();
                    return;
                }
                log('📦 Committing your changes...', 'yellow');
                runGitShow('add .');
                runGitShow(`commit -m "${message.replace(/"/g, '\\"')}"`);
                log('✅ Changes committed', 'green');
            } else {
                // Default: stash (safest option)
                log('📦 Stashing your changes safely...', 'yellow');
                runGitShow('stash push -m "SYNC_AUTO_STASH"');
                stashedChanges = true;
                log('✅ Changes stashed (safe)', 'green');
            }
        }

        // Step 7: Pull team changes if behind
        if (behindCount > 0) {
            log('\n📥 Pulling team updates...', 'yellow');
            
            const pullSuccess = runGitShow(`pull origin ${branch} --no-edit`);
            
            if (!pullSuccess) {
                // Check for conflicts
                const conflicts = runGitSilent('diff --name-only --diff-filter=U');
                if (conflicts) {
                    log('\n⚠️  MERGE CONFLICTS DETECTED!', 'red');
                    log('\nThese files were changed by both you and a teammate:', 'yellow');
                    console.log(conflicts);
                    
                    log('\n📝 How to resolve conflicts:', 'cyan');
                    console.log('1. Open each conflicted file');
                    console.log('2. Look for <<<<<<<, =======, >>>>>>> markers');
                    console.log('3. Choose which changes to keep (or keep both)');
                    console.log('4. Remove the conflict markers');
                    console.log('5. Save the file');
                    console.log('6. Run: git add <filename>');
                    console.log('7. Run: npm run push');
                    
                    if (stashedChanges) {
                        log('\n⚠️  Your stashed changes are SAFE!', 'yellow');
                        log('Resolve conflicts first, then restore stash manually:', 'cyan');
                        log('  git stash pop', 'cyan');
                    }
                    
                    log('\n💡 Need help? Ask your team lead', 'cyan');
                    rl.close();
                    return;
                }
            } else {
                log('✅ Team updates pulled successfully!', 'green');
            }
        } else {
            log('\n✅ Already up to date with remote', 'green');
        }

        // Step 8: Restore stashed changes
        if (stashedChanges) {
            log('\n📤 Restoring your stashed changes...', 'yellow');
            const stashSuccess = runGitShow('stash pop');
            
            if (!stashSuccess) {
                log('\n⚠️  Conflicts when restoring your changes!', 'red');
                log('The team\'s updates conflict with your work.', 'yellow');
                log('\nYour changes are SAFE in the stash.', 'green');
                log('Resolve conflicts, then run: git stash pop', 'cyan');
            } else {
                log('✅ Your changes restored successfully!', 'green');
            }
        }

        // Step 9: Push if we have local commits ahead
        const newAheadCount = parseInt(runGitSilent(`rev-list origin/${branch}..HEAD --count`)) || 0;
        if (newAheadCount > 0) {
            log('\n📤 Pushing your commits...', 'yellow');
            const pushSuccess = runGitShow(`push origin ${branch}`);
            
            if (pushSuccess) {
                log('✅ Your commits pushed successfully!', 'green');
            } else {
                log('⚠️  Push failed. Try: npm run push', 'yellow');
            }
        }

        // Final summary
        console.log('\n' + '='.repeat(50));
        log('✅ SYNC COMPLETE!', 'green');
        console.log('='.repeat(50));
        
        const finalStatus = runGitSilent('status --short');
        if (finalStatus) {
            log('\n📊 Current status:', 'blue');
            console.log(finalStatus);
        } else {
            log('\n✨ Working tree is clean and up to date!', 'green');
        }
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        log(`\n❌ Sync failed: ${error.message}`, 'red');
        log('\n💡 Your work is safe. Try these steps:', 'cyan');
        console.log('  1. npm run pull    - Just get updates');
        console.log('  2. npm run push    - Save your work');
        console.log('  3. npm run sync    - Try full sync again');
    }
    
    rl.close();
}

// Run sync
syncCommand().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    rl.close();
    process.exit(1);
});