import { GitExecutor } from '../core/git-executor';
import { SafetyChecker } from '../core/safety-checker';
import { Logger } from '../utils/logger';
import { PromptUtils } from '../utils/prompt';

export class PushCommand {
  private git: GitExecutor;
  private safetyChecker: SafetyChecker;
  private logger: Logger;
  private prompt: PromptUtils;

  constructor() {
    this.git = new GitExecutor();
    this.safetyChecker = new SafetyChecker(this.git);
    this.logger = new Logger();
    this.prompt = new PromptUtils();
  }

  async execute(): Promise<void> {
    try {
      this.logger.section('GIT PUSH OPERATION');

      // Step 1: Get current status
      this.logger.info('Checking repository status...');
      const status = await this.git.getStatus();
      const branch = await this.git.getCurrentBranch();

      this.displayStatus(status);

      // Step 2: Safety checks
      const safetyResult = await this.safetyChecker.checkBeforePush();
      
      if (!safetyResult.safe) {
        safetyResult.errors.forEach(e => this.logger.error(e));
        process.exit(1);
      }

      if (safetyResult.warnings.length > 0) {
        safetyResult.warnings.forEach(w => this.logger.warning(w));
        if (safetyResult.requiresConfirmation) {
          const proceed = await this.prompt.confirm('Do you want to continue?');
          if (!proceed) {
            this.logger.info('Push cancelled by user');
            process.exit(0);
          }
        }
      }

      // Step 3: Check for changes to commit
      const hasChanges = this.hasAnyChanges(status);
      
      if (!hasChanges) {
        this.logger.warning('No changes to commit');
        if (status.ahead > 0) {
          this.logger.info(`You have ${status.ahead} unpushed commits. Pushing...`);
          await this.git.push(branch);
          this.logger.success('Pushed existing commits successfully');
        } else {
          this.logger.info('Everything is up to date');
        }
        return;
      }

      // Step 4: Ask for commit message
      const commitMessage = await this.prompt.askForCommitMessage();
      
      if (!this.safetyChecker.validateCommitMessage(commitMessage)) {
        this.logger.error('Invalid commit message. Must be at least 3 characters.');
        process.exit(1);
      }

      // Step 5: Stage and commit changes
      this.logger.info('Staging changes...');
      await this.git.stageFiles();

      this.logger.info('Committing changes...');
      await this.git.commit(commitMessage);
      this.logger.success('Changes committed');

      // Step 6: Push to remote
      this.logger.info(`Pushing to origin/${branch}...`);
      await this.git.push(branch);
      this.logger.success('Successfully pushed to remote');

      // Step 7: Summary
      this.displaySummary(commitMessage, branch);

    } catch (error: any) {
      this.logger.error(`Push failed: ${error.message}`);
      process.exit(1);
    }
  }

  private hasAnyChanges(status: any): boolean {
    return [
      ...status.modified,
      ...status.added,
      ...status.deleted,
      ...status.untracked
    ].length > 0;
  }

  private displayStatus(status: any): void {
    console.log(`\n📍 Branch: ${status.branch}`);
    console.log(`📊 Ahead: ${status.ahead} | Behind: ${status.behind}`);
    
    if (status.modified.length > 0) {
      console.log('\n📝 Modified files:');
      status.modified.forEach((f: string) => console.log(`   ✏️  ${f}`));
    }
    
    if (status.added.length > 0) {
      console.log('\n➕ New files:');
      status.added.forEach((f: string) => console.log(`   🆕 ${f}`));
    }
    
    if (status.deleted.length > 0) {
      console.log('\n🗑️  Deleted files:');
      status.deleted.forEach((f: string) => console.log(`   ❌ ${f}`));
    }
    
    if (status.untracked.length > 0) {
      console.log('\n❓ Untracked files:');
      status.untracked.forEach((f: string) => console.log(`   🔍 ${f}`));
    }
  }

  private displaySummary(message: string, branch: string): void {
    this.logger.section('PUSH SUMMARY');
    this.logger.success(`✅ Successfully pushed to ${branch}`);
    this.logger.info(`📝 Commit message: "${message}"`);
    console.log('\n🔗 Create a pull request:');
    console.log(`   https://github.com/your-repo/pull/new/${branch}\n`);
  }
}