import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/logger';
import { GitStatus, GitOperationResult } from '../index';

const execAsync = promisify(exec);

export class GitExecutor {
  private logger: Logger;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.logger = new Logger();
    this.cwd = cwd;
  }

  async execute(command: string, errorMessage?: string): Promise<{ stdout: string; stderr: string }> {
    try {
      this.logger.debug(`Executing: git ${command}`);
      const result = await execAsync(`git ${command}`, { cwd: this.cwd });
      return result;
    } catch (error: any) {
      const message = errorMessage || error.message;
      this.logger.error(message);
      throw new Error(message);
    }
  }

  async getStatus(): Promise<GitStatus> {
    const { stdout } = await this.execute('status --porcelain=v2 --branch', 'Failed to get git status');
    return this.parseStatus(stdout);
  }

  private parseStatus(output: string): GitStatus {
    const lines = output.split('\n').filter(Boolean);
    const status: GitStatus = {
      branch: '',
      ahead: 0,
      behind: 0,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      conflicted: [],
      staged: []
    };

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        status.branch = line.replace('# branch.head ', '');
      }
      if (line.startsWith('# branch.ab ')) {
        const [, ahead, behind] = line.split(' ').map(Number);
        status.ahead = ahead || 0;
        status.behind = behind || 0;
      }
      
      if (line.length >= 2 && line[0] !== '#') {
        const file = line.substring(3);
        const stagedStatus = line[0];
        const unstagedStatus = line[1];
        
        if (['U', 'A', 'D'].includes(stagedStatus)) {
          if (stagedStatus === 'U') status.conflicted.push(file);
          else if (stagedStatus === 'A') status.added.push(file);
          else if (stagedStatus === 'D') status.deleted.push(file);
        }
        
        if (['M', 'D'].includes(unstagedStatus)) {
          if (unstagedStatus === 'M') status.modified.push(file);
          else if (unstagedStatus === 'D') status.deleted.push(file);
        }
        
        if (stagedStatus === '?') status.untracked.push(file);
      }
    }

    return status;
  }

  async stageFiles(files?: string[]): Promise<void> {
    if (files && files.length > 0) {
      await this.execute(`add ${files.join(' ')}`, 'Failed to stage files');
    } else {
      await this.execute('add -A', 'Failed to stage all files');
    }
  }

  async commit(message: string): Promise<void> {
    await this.execute(`commit -m "${message.replace(/"/g, '\\"')}"`, 'Failed to commit changes');
  }

  async push(branch: string): Promise<void> {
    await this.execute(`push origin ${branch}`, 'Failed to push changes');
  }

  async fetch(): Promise<void> {
    await this.execute('fetch origin', 'Failed to fetch from remote');
  }

  async pull(branch: string): Promise<void> {
    await this.execute(`pull origin ${branch} --no-edit`, 'Failed to pull changes');
  }

  async stash(message?: string): Promise<void> {
    const cmd = message ? `stash push -m "${message}"` : 'stash';
    await this.execute(cmd, 'Failed to stash changes');
  }

  async stashPop(): Promise<void> {
    await this.execute('stash pop', 'Failed to pop stash');
  }

  async getCurrentBranch(): Promise<string> {
    const { stdout } = await this.execute('rev-parse --abbrev-ref HEAD', 'Failed to get current branch');
    return stdout.trim();
  }

  async hasConflicts(): Promise<boolean> {
    try {
      const { stdout } = await this.execute('diff --name-only --diff-filter=U');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async abortMerge(): Promise<void> {
    await this.execute('merge --abort', 'Failed to abort merge');
  }

  async resetToRemote(branch: string): Promise<void> {
    // SAFETY: Only used when explicitly confirmed and no local changes exist
    await this.execute(`reset --hard origin/${branch}`, 'Failed to reset to remote');
  }
}