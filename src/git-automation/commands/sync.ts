import { GitExecutor } from '../core/git-executor';
import { SafetyChecker } from '../core/safety-checker';
import { ConflictDetector } from '../core/conflict-detector';
import { RollbackManager } from '../core/rollback-manager';
import { Logger } from '../utils/logger';
import { PromptUtils } from '../utils/prompt';

export class SyncCommand {
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
      this.logger.section('GIT SYNC OPERATION');
      
      // Step 1: Fetch remote changes
      this.logger.info('Fetching remote changes...');
      await this.git.fetch();

      // Step 2: Check local status
      const status = await this.git.getStatus();
      const branch = await this.git.getCurrentBranch();

      this.logger.info(`Current branch: ${branch}`);
      this.logger.info(`Ahead: ${status.ahead} | Behind: ${status.behind}`);

      // Step 3: Handle local changes
      const hasLocalChanges = this.hasAnyChanges(status);
      let stashCreated = false;

      if (hasLocalChanges) {
        this.logger.warning('Local changes detected:');
        [...status.modified, ...status.added, ...status.untracked].forEach(f => {
          console.log(`   - ${f}`);
        });

        const action = await this.prompt.askSyncStrategy();

        switch (action) {
          case 'stash':
            this.logger.info('Stashing local changes...');
            await this.git.stash('SYNC_STASH_' + new Date().getTime());
            stashCreated = true;
            break;
          case 'commit':
            await this.handleCommitBeforeSync();
            break;
          case 'cancel':
            this.logger.info('Sync cancelled');
            return;
        }
      }

      // Step 4: Pull if behind
      if (status.behind > 0) {
        this.logger.info('Pulling remote changes...');
        await this.git.pull(branch);
        this.logger.success('Remote changes pulled');
      } else {
        this.logger.info('Already up to date');
      }

      // Step 5: Push if ahead
      if (status.ahead > 0) {
        this.logger.info('Pushing local commits...');
        await this.git.push(branch);
        this.logger.success('Local commits pushed');
      }

      // Step 6: Restore stash if created
      if (stashCreated) {
        this.logger.info('Restoring stashed changes...');
        await this.git.stashPop();
        this.logger.success('Local changes restored');

        // Check for conflicts after stash pop
        const conflictedFiles = await this.safetyChecker.checkForConflictsAfterPull();
        if (conflictedFiles.length > 0) {
          const conflicts = await this.conflictDetector.detectConflicts(conflictedFiles);
          this.conflictDetector.formatConflictReport(conflicts);
        }
      }

      this.logger.success('Sync completed successfully');

    } catch (error: any) {
      this.logger.error(`Sync failed: ${error.message}`);
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

  private async handleCommitBeforeSync(): Promise<void> {
    const message = await this.prompt.askForCommitMessage();
    await this.git.stageFiles();
    await this.git.commit(message);
    this.logger.success('Local changes committed');
  }
}