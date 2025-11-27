import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Piscina from 'piscina';
import { resolve } from 'path';
import './password.worker';
@Injectable()
export class PasswordWorkerService implements OnModuleDestroy {
  private pool: Piscina;

  constructor() {
    this.pool = new Piscina({
      // Point to the worker file we just made
      filename: resolve(__dirname, './password.worker.js'),
      // Limit max threads to CPU cores - 1 to leave room for OS/HTTP
      maxThreads: Math.max(1, require('os').cpus().length - 1),
    });
  }

  async hash(password: string): Promise<string> {
    return this.pool.run({ task: 'hash', args: { password } });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return this.pool.run({ task: 'verify', args: { hash, password } });
  }

  async onModuleDestroy() {
    // Gracefully clean up threads
    await this.pool.destroy();
  }
}
