import { GitExecutor } from './git-executor';
import { Logger } from '../utils/logger';
import { ConflictInfo } from '../index';
import * as fs from 'fs';
import * as path from 'path';

export class ConflictDetector {
  private git: GitExecutor;
  private logger: Logger;

  constructor(git: GitExecutor) {
    this.git = git;
    this.logger = new Logger();
  }

  async detectConflicts(files: string[]): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.includes('<<<<<<<') && content.includes('>>>>>>>')) {
            conflicts.push({
              file,
              status: 'conflict',
              ours: this.extractSection(content, '<<<<<<<', '======='),
              theirs: this.extractSection(content, '=======', '>>>>>>>')
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to check conflicts in ${file}`);
      }
    }

    return conflicts;
  }

  private extractSection(content: string, startMarker: string, endMarker: string): string {
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker);
    if (start !== -1 && end !== -1) {
      return content.substring(start + startMarker.length, end).trim();
    }
    return '';
  }

  formatConflictReport(conflicts: ConflictInfo[]): void {
    if (conflicts.length === 0) return;

    this.logger.section('MERGE CONFLICTS DETECTED');
    this.logger.warning(`Found ${conflicts.length} conflicted file(s):\n`);

    conflicts.forEach((conflict, index) => {
      console.log(`   ${index + 1}. ${conflict.file}`);
    });

    console.log('\n📝 To resolve conflicts:');
    console.log('   1. Open each conflicted file');
    console.log('   2. Look for <<<<<<<, =======, and >>>>>>> markers');
    console.log('   3. Edit the file to keep the desired changes');
    console.log('   4. Remove the conflict markers');
    console.log('   5. Stage the resolved files: git add <file>');
    console.log('   6. Run node scripts/push.js to commit and push\n');
  }
}