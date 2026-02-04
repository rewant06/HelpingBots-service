import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtSigningKeysCleanupJob {
  private readonly logger = new Logger(JwtSigningKeysCleanupJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupExpiredRetiredKeys(): Promise<void> {
    // Fail-safe switch (default enabled). Set ENABLE_JWT_KEY_CLEANUP_JOB=false to disable.
    if (process.env.ENABLE_JWT_KEY_CLEANUP_JOB?.toLowerCase() === 'false')
      return;
    this.logger.debug('JWT signing key cleanup tick');

    try {
      const now = new Date();
      const res = await this.prisma.jwtSigningKey.deleteMany({
        where: {
          status: 'RETIRED',
          publishUntil: { lte: now },
        },
      });

      if (res.count > 0) {
        this.logger.log(
          `Deleted ${res.count} expired RETIRED jwt signing keys`,
        );
      }
    } catch (err) {
      this.logger.error(
        `JWT signing key cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }
}
