import { GitExecutor } from '../core/git-executor';
import { SafetyChecker } from '../core/safety-checker';
import { ConflictDetector } from '../core/conflict-detector';
import { RollbackManager } from '../core/rollback-manager';
import { Logger } from '../utils/logger';
import { PromptUtils } from '../utils/prompt';

export class PullCommand {
  private git: GitExecutor;
  private safetyChecker: SafetyChecker;
  private conflictDetector: ConflictDetector;
  private rollbackManager: RollbackManager;
  private logger: Logger;
  private prompt: PromptUtils;

  constructor() {
    this.git = new GitExecutor();
    this.safetyChecker = new SafetyChecker(this.git);
    this.conflictDetector = new ConflictDetector(this.git);
    this.rollbackManager = new RollbackManager(this.git);
    this.logger = new Logger();
    this.prompt = new PromptUtils();
  }

  async execute(): Promise<void> {
    try {
      this.logger.section('GIT PULL OPERATION');

      // Step 1: Fetch latest changes
      this.logger.info('Fetching latest changes...');
      await this.git.fetch();

      // Step 2: Check current status
      const status = await this.git.getStatus();
      const branch = await this.git.getCurrentBranch();

      // Step 3: Safety checks
      const safetyResult = await this.safetyChecker.checkBeforePull();
      
      if (!safetyResult.safe) {
        safetyResult.errors.forEach(e => this.logger.error(e));
        process.exit(1);
      }

      // Step 4: Handle uncommitted changes
      const hasUncommittedChanges = this.hasAnyChanges(status);
      
      if (hasUncommittedChanges) {
        safetyResult.warnings.forEach(w => this.logger.warning(w));
        
        const action = await this.prompt.askPullStrategy();
        
        switch (action) {
          case 'commit':
            await this.handleCommitBeforePull();
            break;
          case 'stash':
            await this.handleStashBeforePull(branch);
            break;
          case 'cancel':
            this.logger.info('Pull cancelled by user');
            return;
        }
      }

      // Step 5: Pull changes
      this.logger.info(`Pulling latest changes for ${branch}...`);
      await this.git.pull(branch);
      this.logger.success('Successfully pulled latest changes');

      // Step 6: Check for conflicts
      const conflictedFiles = await this.safetyChecker.checkForConflictsAfterPull();
      
      if (conflictedFiles.length > 0) {
        const conflicts = await this.conflictDetector.detectConflicts(conflictedFiles);
        this.conflictDetector.formatConflictReport(conflicts);
      } else {
        this.logger.success('No merge conflicts detected');
      }

    } catch (error: any) {
      this.logger.error(`Pull failed: ${error.message}`);
      await this.rollbackManager.rollback();
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

  private async handleCommitBeforePull(): Promise<void> {
    this.logger.info('Committing changes before pull...');
    
    const message = await this.prompt.askForCommitMessage();
    await this.git.stageFiles();
    await this.git.commit(message);
    this.logger.success('Changes committed');
  }

  private async handleStashBeforePull(branch: string): Promise<void> {
    this.logger.info('Stashing changes...');
    
    const result = await this.rollbackManager.safeStashAndPull(branch);
    
    if (result.success) {
      this.logger.success('Changes restored after pull');
    }
  }
}