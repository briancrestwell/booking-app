import { Global, Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

// Lua script for atomic lock release — only deletes the key if the value
// matches our lock token, preventing accidental release of another owner's lock.
export const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export const BOOKING_LOCK_TTL_MS = 300_000; // 5 minutes

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
      password: process.env.REDIS_PASSWORD ?? 'redis_pass',
      lazyConnect: true,
    });

    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Acquire a distributed lock using SET NX PX (atomic).
   * Returns the lock token string if acquired, null if already locked.
   */
  async acquireLock(key: string, token: string, ttlMs = BOOKING_LOCK_TTL_MS): Promise<boolean> {
    // ioredis v5: SET key value PX milliseconds NX
    const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  /**
   * Release the lock only if we own it (Lua ensures atomicity).
   */
  async releaseLock(key: string, token: string): Promise<void> {
    await this.client.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
  }

  bookingLockKey(tableId: string, slotId: string): string {
    return `lock:booking:table:${tableId}:${slotId}`;
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
