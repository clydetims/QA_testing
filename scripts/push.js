require('dotenv').config();
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
        return '';
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
        return { success: false, error: error.message, stderr: error.stderr || '' };
    }
}

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
            resolve(answer.trim());
        });
    });
}

function getTokenFromEnv() {
    const token = process.env.GITHUB_TOKEN || 
                  process.env.GH_TOKEN || 
                  process.env.GITHUB_ACCESS_TOKEN;
    
    if (!token) {
        log('\n❌ GitHub token not found!', 'red');
        log('Run: npm run setup', 'cyan');
        return null;
    }
    return token;
}

/**
 * ✅ RELIABLE: Extract filename from git status line using regex
 * Handles all git status formats:
 *   " M path/to/file"      - unstaged modification
 *   "M  path/to/file"      - staged modification  
 *   "?? path/to/file"      - untracked
 *   " D path/to/file"      - unstaged deletion
 *   "MM path/to/file"      - staged + unstaged mod
 *   ' "path/with spaces"'  - quoted path with spaces
 */
function extractFilePath(statusLine) {
    // Remove the two status characters and any spaces between them and filename
    // Pattern: XY filename  (where X=staged status, Y=unstaged status)
    
    // First try: Remove first 2 chars, then trim spaces
    let filePath = statusLine.substring(2).trim();
    
    // If filePath starts with a space (rare), remove it
    filePath = filePath.trim();
    
    // Remove surrounding quotes if present (git quotes paths with spaces)
    if (filePath.startsWith('"') && filePath.endsWith('"')) {
        filePath = filePath.slice(1, -1);
    }
    
    return filePath;
}

/**
 * ✅ ALTERNATIVE: Even more reliable regex-based extraction
 */
function extractFilePathRegex(statusLine) {
    // Match: optional status chars, then the filename
    // This handles all git status formats
    const match = statusLine.match(/^[\s\?\!\w]{1,3}\s+(.+)$/);
    if (match && match[1]) {
        let filePath = match[1].trim();
        // Remove quotes
        if (filePath.startsWith('"') && filePath.endsWith('"')) {
            filePath = filePath.slice(1, -1);
        }
        return filePath;
    }
    
    // Fallback: just remove first 3 characters
    return statusLine.substring(3).trim();
}

async function pushCommand() {
    console.log('\n' + '='.repeat(50));
    log('🚀 GIT PUSH AUTOMATION', 'blue');
    console.log('='.repeat(50) + '\n');

    // Get token
    const token = getTokenFromEnv();
    if (!token) {
        rl.close();
        process.exit(1);
    }

    // Get remote URL
    const remoteUrl = runGitSilent('remote get-url origin');
    if (!remoteUrl) {
        log('❌ No remote repository configured', 'red');
        rl.close();
        process.exit(1);
    }

    // Extract repo path
    let repoPath = remoteUrl;
    if (repoPath.includes('github.com/')) {
        repoPath = repoPath.split('github.com/')[1].replace('.git', '');
    }

    const username = process.env.GITHUB_USERNAME || 'clydetims';
    const authUrl = remoteUrl.replace(
        'https://github.com',
        `https://${username}:${token}@github.com`
    );

    log('✅ Authenticated with GitHub token', 'green');
    execSync(`git remote set-url origin ${authUrl}`, { stdio: 'pipe' });

    try {
        // Get branch
        const branch = runGitSilent('rev-parse --abbrev-ref HEAD');
        log(`📍 Current branch: ${branch}`, 'blue');

        // Check for changes
        const statusOutput = runGitSilent('status --short');
        
        if (!statusOutput) {
            log('✅ No changes to commit', 'green');
            
            // Check for unpushed commits
            const unpushed = runGitSilent(`log origin/${branch}..HEAD --oneline`);
            if (unpushed) {
                const count = unpushed.split('\n').length;
                log(`📤 You have ${count} unpushed commit(s)`, 'yellow');
                
                execSync('git fetch origin', { stdio: 'pipe' });
                const behindCount = parseInt(runGitSilent(`rev-list HEAD..origin/${branch} --count`)) || 0;
                
                if (behindCount > 0) {
                    log(`\n⚠️  Remote has ${behindCount} new commit(s). Run: npm run sync`, 'yellow');
                    return;
                }
                
                log('📤 Pushing...', 'yellow');
                const result = runGitShow(`push origin ${branch}`);
                if (result.success) {
                    log('✅ Pushed!', 'green');
                } else {
                    handlePushError(result, branch);
                }
            } else {
                log('✅ Everything up to date', 'green');
            }
            return;
        }

        // Parse changed files
        const allLines = statusOutput.split('\n').filter(line => line.length > 0);
        
        // ✅ DEBUG: Show raw lines for troubleshooting
        log('📝 Changes to commit:', 'blue');
        allLines.forEach(line => {
            console.log(`   RAW: "${line}"`);
            console.log(`   Extracted: "${extractFilePath(line)}"`);
        });

        // Filter out .env files
        const safeLines = allLines.filter(line => {
            const file = extractFilePath(line);
            return !file.includes('.env') && !file.includes('node_modules');
        });

        if (safeLines.length === 0) {
            log('⚠️  Only .env files changed (not committed)', 'yellow');
            return;
        }

        // Get commit message
        const args = process.argv.slice(2);
        let commitMessage = '';
        
        const mIndex = args.indexOf('-m');
        if (mIndex !== -1 && args[mIndex + 1]) {
            commitMessage = args[mIndex + 1];
            log(`\n💬 Commit message: ${commitMessage}`, 'cyan');
        } else {
            commitMessage = await askQuestion('\n💬 Commit message: ');
        }

        if (!commitMessage || commitMessage.length < 3) {
            log('❌ Commit message must be at least 3 characters', 'red');
            return;
        }

        // Warn if on main
        if (branch === 'main' || branch === 'master') {
            log('\n⚠️  Pushing directly to main branch', 'yellow');
        }

        // Stage files
        log('\n📦 Staging changes...', 'yellow');
        
        for (const line of safeLines) {
            const filePath = extractFilePath(line);
            
            if (filePath) {
                log(`   Staging: ${filePath}`, 'cyan');
                
                // ✅ Use double quotes for paths with spaces
                const escapedPath = filePath.includes(' ') ? `"${filePath}"` : filePath;
                
                try {
                    const result = execSync(`git add ${escapedPath}`, { 
                        encoding: 'utf8', 
                        stdio: 'pipe' 
                    });
                } catch (error) {
                    log(`   ❌ Failed: ${filePath}`, 'red');
                    log(`   ${error.message.trim().split('\n')[0]}`, 'red');
                }
            }
        }
        
        log('✅ Safe files staged', 'green');

        // Verify staging
        const stagedFiles = runGitSilent('diff --cached --name-only');
        if (!stagedFiles) {
            log('\n⚠️  No files staged. Trying git add . instead...', 'yellow');
            runGitShow('add .');
            
            const stagedAgain = runGitSilent('diff --cached --name-only');
            if (!stagedAgain) {
                log('❌ Still nothing staged. Check file paths manually.', 'red');
                return;
            }
        }

        // Commit
        log('\n💾 Committing...', 'yellow');
        const commitResult = runGitShow(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
        
        if (!commitResult.success) {
            log('❌ Commit failed', 'red');
            return;
        }
        log('✅ Committed', 'green');

        // Check remote before push
        log('\n🔍 Checking remote...', 'yellow');
        execSync('git fetch origin', { stdio: 'pipe' });
        
        const behindCount = parseInt(runGitSilent(`rev-list HEAD..origin/${branch} --count`)) || 0;
        
        if (behindCount > 0) {
            log(`\n⚠️  Remote has ${behindCount} new commit(s). Pulling...`, 'yellow');
            const pullResult = runGitShow(`pull origin ${branch} --no-edit`);
            
            if (!pullResult.success) {
                log('\n❌ Auto-pull failed. Run: npm run sync', 'red');
                return;
            }
            log('✅ Pulled successfully', 'green');
        }

        // Push
        log(`\n📤 Pushing to origin/${branch}...`, 'yellow');
        const pushResult = runGitShow(`push origin ${branch}`);

        if (pushResult.success) {
            console.log('\n' + '='.repeat(50));
            log('✅ PUSH SUCCESSFUL!', 'green');
            console.log('='.repeat(50));
            log(`Branch: ${branch}`, 'cyan');
            log(`Commit: ${commitMessage}`, 'cyan');
            if (repoPath) log(`Remote: https://github.com/${repoPath}`, 'cyan');
            console.log('='.repeat(50) + '\n');
        } else {
            handlePushError(pushResult, branch);
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
    } finally {
        try {
            execSync(`git remote set-url origin ${remoteUrl}`, { stdio: 'pipe' });
            log('🔒 Token removed from remote URL', 'green');
        } catch {}
    }

    rl.close();
}

function handlePushError(result, branch) {
    const errorMsg = result.stderr || result.error || '';
    
    console.log('\n' + '='.repeat(50));
    log('❌ PUSH FAILED', 'red');
    console.log('='.repeat(50));
    
    if (errorMsg.includes('non-fast-forward') || errorMsg.includes('rejected')) {
        log('\n📌 Remote has changes you don\'t have', 'yellow');
        log('Run: npm run sync', 'green');
    } else if (errorMsg.includes('403') || errorMsg.includes('Permission') || 
               errorMsg.includes('Invalid username') || errorMsg.includes('Authentication')) {
        log('\n📌 Authentication failed', 'yellow');
        log('Run: npm run setup (update your token)', 'cyan');
    } else {
        log(`\n📌 Error: ${errorMsg.substring(0, 200)}`, 'red');
    }
    
    log('\n✅ Your work is SAFE locally', 'green');
    console.log('='.repeat(50) + '\n');
}

pushCommand().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
});