import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule'; // Keep CronExpression if using enum
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsCronService {
  private readonly logger = new Logger(PostsCronService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // Run every 30 seconds
  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncViewsToDb() {
    const dirtySetKey = 'posts:pending_view_sync';
    const postIds = await this.redis.client.smembers(dirtySetKey);

    if (postIds.length === 0) return;

    this.logger.log(`Syncing views for ${postIds.length} posts...`);

    const results = await Promise.allSettled(
      postIds.map(async (postId) => {
        const key = `post:${postId}:view_buffer`;
        // Atomic Get & Delete
        const countStr = await this.redis.client.getdel(key);

        if (!countStr) return;

        const count = parseInt(countStr, 10);

        try {
          await this.prisma.post.update({
            where: { id: postId },
            data: { viewCount: { increment: count } },
          });
        } catch (e: any) {
          // Prisma P1001 = can't reach DB server
          if (e?.code === 'P1001') {
            this.logger.error(
              `DB unreachable, skipping view sync for ${postId}`,
            );
            return;
          }
          throw e;
        }
      }),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.error(
        `Failed to sync views for ${failures.length} posts.`,
        (failures[0] as PromiseRejectedResult).reason,
      );
    }

    // Clean up the Set
    await this.redis.client.srem(dirtySetKey, ...postIds);
  }
}
