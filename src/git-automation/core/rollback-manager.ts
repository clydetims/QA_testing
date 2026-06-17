import { GitExecutor } from './git-executor';
import { Logger } from '../utils/logger';
import { GitOperationResult } from '../index';

export class RollbackManager {
  private git: GitExecutor;
  private logger: Logger;
  private operations: Array<() => Promise<void>>;

  constructor(git: GitExecutor) {
    this.git = git;
    this.logger = new Logger();
    this.operations = [];
  }

  addRollbackStep(operation: () => Promise<void>): void {
    this.operations.unshift(operation);
  }

  async executeWithRollback<T>(
    operation: () => Promise<T>,
    rollbackSteps: Array<() => Promise<void>>
  ): Promise<T> {
    this.operations = [...rollbackSteps];
    
    try {
      return await operation();
    } catch (error) {
      this.logger.warning('⚠️  Operation failed. Initiating rollback...');
      await this.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    for (const operation of this.operations) {
      try {
        await operation();
        this.logger.success('Rollback step completed');
      } catch (error: any) {
        this.logger.error(`Rollback failed: ${error.message}`);
      }
    }
  }

  async safeStashAndPull(branch: string): Promise<GitOperationResult> {
    const originalBranch = await this.git.getCurrentBranch();
    let stashCreated = false;

    return this.executeWithRollback(
      async () => {
        // Create backup stash
        await this.git.stash('AUTO_BACKUP_' + new Date().getTime());
        stashCreated = true;

        // Pull changes
        await this.git.pull(branch);

        // Try to pop stash
        await this.git.stashPop();

        return {
          success: true,
          message: 'Successfully pulled and restored changes',
          details: { branch }
        };
      },
      [
        async () => {
          if (stashCreated) {
            this.logger.info('Restoring stashed changes...');
            await this.git.stashPop().catch(() => {});
          }
        },
        async () => {
          // Ensure we're on the original branch
          await this.git.execute(`checkout ${originalBranch}`);
        }
      ]
    );
  }
}