import * as readline from 'readline';
import chalk from 'chalk';

export class PromptUtils {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async askForCommitMessage(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(chalk.cyan('\n📝 Enter commit message: '), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async confirm(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(chalk.yellow(`\n${question} (y/n): `), (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async askPullStrategy(): Promise<'commit' | 'stash' | 'cancel'> {
    return new Promise((resolve) => {
      console.log(chalk.yellow('\n⚠️  Uncommitted changes detected. How would you like to proceed?'));
      console.log('   1. Commit changes first');
      console.log('   2. Stash changes (recommended)');
      console.log('   3. Cancel operation');
      
      this.rl.question(chalk.cyan('\nEnter choice (1-3): '), (answer) => {
        switch (answer.trim()) {
          case '1':
            resolve('commit');
            break;
          case '2':
            resolve('stash');
            break;
          case '3':
            resolve('cancel');
            break;
          default:
            console.log(chalk.red('Invalid choice. Cancelling.'));
            resolve('cancel');
        }
      });
    });
  }

  async askSyncStrategy(): Promise<'stash' | 'commit' | 'cancel'> {
    return new Promise((resolve) => {
      console.log(chalk.yellow('\n⚠️  Local changes detected. How would you like to proceed?'));
      console.log('   1. Stash changes, pull, then restore (recommended)');
      console.log('   2. Commit changes before pulling');
      console.log('   3. Cancel sync');
      
      this.rl.question(chalk.cyan('\nEnter choice (1-3): '), (answer) => {
        switch (answer.trim()) {
          case '1':
            resolve('stash');
            break;
          case '2':
            resolve('commit');
            break;
          case '3':
            resolve('cancel');
            break;
          default:
            console.log(chalk.red('Invalid choice. Cancelling.'));
            resolve('cancel');
        }
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}