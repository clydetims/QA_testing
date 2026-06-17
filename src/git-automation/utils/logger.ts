import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logFile: string;
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.logFile = path.join(process.cwd(), 'logs', `git-ops-${new Date().toISOString().split('T')[0]}.log`);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private writeToFile(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(this.logFile, `[${timestamp}] ${level}: ${message}\n`);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), chalk.blue(message));
    this.writeToFile('INFO', message);
  }

  success(message: string): void {
    console.log(chalk.green('✔'), chalk.green(message));
    this.writeToFile('SUCCESS', message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), chalk.yellow(message));
    this.writeToFile('WARNING', message);
  }

  error(message: string): void {
    console.log(chalk.red('✘'), chalk.red(message));
    this.writeToFile('ERROR', message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
      this.writeToFile('DEBUG', message);
    }
  }

  section(title: string): void {
    console.log('\n' + chalk.bold.cyan('━━━ ' + title + ' ━━━'));
    this.writeToFile('SECTION', title);
  }
}