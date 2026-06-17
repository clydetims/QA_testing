#!/usr/bin/env node
import { SyncCommand } from '../git-automation/commands/sync';

const sync = new SyncCommand();
sync.execute().catch(console.error);