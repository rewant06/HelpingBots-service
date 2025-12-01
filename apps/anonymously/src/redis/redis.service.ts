import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis, { Cluster, ClusterNode, RedisOptions } from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis | Cluster;

  private createClient(): Redis | Cluster {
    const isCluster = process.env.REDIS_CLUSTER_MODE === 'true';
    const url = process.env.REDIS_URL;

    const commonOptions: RedisOptions = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    if (isCluster) {
      const nodes = process.env.REDIS_CLUSTER_NODES
        ? process.env.REDIS_CLUSTER_NODES.split(',').map((url) => url.trim())
        : [url];

      return new Redis.Cluster(nodes as ClusterNode[], {
        ...commonOptions,
        redisOptions: commonOptions,
        scaleReads: 'slave',
      });
    } else {
      return new Redis(url || 'redis://127.0.0.1:6379', {
        ...commonOptions,
        lazyConnect: true,
      });
    }
  }

  private isCluster(): boolean {
    return this.client instanceof Redis.Cluster;
  }

  async onModuleInit() {
    // const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    this.client = this.createClient();

    this.client.on('error', (err) => {
      if (err.message.includes('ECONNRESET')) return;
      this.logger.error(`[Redis] Error: ${err.message}`, err.stack);
    });

    this.client.on('connect', () => {
      this.logger.log(
        `[Redis] connection established (${this.isCluster() ? 'Cluster' : 'Standalone'}) `,
      );
    });

    try {
      if (this.client.status === 'end') {
        await this.client.connect();
      }
      await this.client.ping();
    } catch (err) {
      this.logger.error('[Redis] CRITICAL: Initial connection failed:', err);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Redis Infrastructure Unavailable');
      }
    }
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }
    try {
      await this.client.quit();
    } catch (err) {
      this.logger.error(
        '[Redis] Graceful quit failed. Forcing disconnect.',
        err,
      );
      this.client.disconnect();
    }
  }

  async set(
    key: string,
    val: string | number | Buffer,
    ...args: (string | number)[]
  ) {
    if (args.length === 1 && typeof args[0] === 'number') {
      return this.client.set(key, val, 'EX', args[0]);
    }

    return this.client.set(key, val, ...(args as any));
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async setJson(key: string, val: any, ttl?: number) {
    const stringVal = JSON.stringify(val);
    if (ttl) {
      return this.set(key, stringVal, ttl);
    }
    return this.set(key, stringVal);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch (err) {
      this.logger.warn(`Failed to parse JSON for key ${key}: `, err);
      return null;
    }
  }

  async addToStream(stream: string, data: Record<string, string | number>) {
    try {
      const args: (string | number)[] = [];
      for (const [k, v] of Object.entries(data)) {
        args.push(k, String(v));
      }
      await this.client.xadd(
        stream,
        'MAXLEN',
        '~',
        10000,
        '*',
        ...(args as any),
      );
    } catch (err) {
      this.logger.error(`Failed to add to stream ${stream}`, err);
    }
  }

  async acquireLock(key: string, ttl = 5000): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const token = randomUUID();

    const result = await this.client.set(lockKey, token, 'PX', ttl, 'NX');
    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
    else
      return 0
    end`;
    const result = await this.client.eval(script, 1, lockKey, token);
    return result === 1;
  }
}
