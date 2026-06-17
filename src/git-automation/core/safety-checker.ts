import { GitExecutor } from './git-executor';
import { Logger } from '../utils/logger';
import { SafetyCheckResult } from '../index';

export class SafetyChecker {
  private git: GitExecutor;
  private logger: Logger;

  constructor(git: GitExecutor) {
    this.git = git;
    this.logger = new Logger();
  }

  async checkBeforePush(): Promise<SafetyCheckResult> {
    const result: SafetyCheckResult = {
      safe: true,
      warnings: [],
      errors: [],
      requiresConfirmation: false
    };

    const status = await this.git.getStatus();
    const currentBranch = await this.git.getCurrentBranch();

    // Check for protected branches
    const protectedBranches = ['main', 'master', 'develop', 'production'];
    if (protectedBranches.includes(currentBranch)) {
      result.errors.push(`⚠️  You are on protected branch '${currentBranch}'. Direct pushes are not allowed.`);
      result.safe = false;
      result.requiresConfirmation = true;
    }

    // Check for merge conflicts
    if (status.conflicted.length > 0) {
      result.errors.push('❌ You have merge conflicts that must be resolved first:');
      status.conflicted.forEach(file => result.errors.push(`   - ${file}`));
      result.safe = false;
    }

    // Check if behind remote
    if (status.behind > 0) {
      result.warnings.push(`⚠️  Your branch is ${status.behind} commit(s) behind remote. Consider pulling first.`);
      result.requiresConfirmation = true;
    }

    // Warn about large changes
    const totalChanges = [...status.modified, ...status.added, ...status.deleted];
    if (totalChanges.length > 10) {
      result.warnings.push(`⚠️  You have ${totalChanges.length} files changed. Review before pushing.`);
      result.requiresConfirmation = true;
    }

    return result;
  }

  async checkBeforePull(): Promise<SafetyCheckResult> {
    const result: SafetyCheckResult = {
      safe: true,
      warnings: [],
      errors: [],
      requiresConfirmation: false
    };

    const status = await this.git.getStatus();

    // Check for uncommitted changes
    const uncommittedChanges = [
      ...status.modified,
      ...status.added,
      ...status.deleted,
      ...status.untracked
    ];

    if (uncommittedChanges.length > 0) {
      result.warnings.push('⚠️  You have uncommitted changes:');
      uncommittedChanges.forEach(file => result.warnings.push(`   - ${file}`));
      result.requiresConfirmation = true;
    }

    // Check for conflicts
    if (status.conflicted.length > 0) {
      result.errors.push('❌ You have unresolved merge conflicts. Resolve them before pulling.');
      result.safe = false;
    }

    return result;
  }

  async checkForConflictsAfterPull(): Promise<string[]> {
    const hasConflicts = await this.git.hasConflicts();
    if (hasConflicts) {
      const status = await this.git.getStatus();
      return status.conflicted;
    }
    return [];
  }

  validateCommitMessage(message: string): boolean {
    if (!message || message.trim().length === 0) {
      return false;
    }
    if (message.length < 3) {
      return false;
    }
    return true;
  }
}