export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  conflicted: string[];
  staged: string[];
}

export interface SafetyCheckResult {
  safe: boolean;
  warnings: string[];
  errors: string[];
  requiresConfirmation: boolean;
}

export interface CommitOptions {
  message: string;
  files?: string[];
  all?: boolean;
}

export interface SyncOptions {
  strategy: 'stash' | 'commit' | 'cancel';
  stashMessage?: string;
}

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
  rollback?: () => Promise<void>;
}

export interface ConflictInfo {
  file: string;
  status: string;
  ours?: string;
  theirs?: string;
}

export enum GitOperation {
  PUSH = 'push',
  PULL = 'pull',
  SYNC = 'sync',
  COMMIT = 'commit',
  STASH = 'stash'
}