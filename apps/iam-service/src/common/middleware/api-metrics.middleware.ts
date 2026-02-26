import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { pipe } from 'rxjs';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiMetricsMiddleware.name);

  constructor(private readonly redis: RedisService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime(); // High Resolution

    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationMs = diff[0] * 1e3 + diff[1] * 1e-6; // Converting nanoseconds to ms

      this.logMetric(req, res, durationMs).catch((err) =>
        this.logger.error(`Metrics Error: ${err.message}`),
      );
    });
    next();
  }

  private async logMetric(req: Request, res: Response, durationMs: number) {
    const user = (req as any).user;

    let tenantId = 'public';
    if (user) {
      tenantId =
        user.tenantId ||
        (user.ownedTenants && user.ownedTenants[0]?.id) ||
        'public';
    }

    const routePattern = (req as any).route?.path || 'unknown_route';
    const finalRoute = res.statusCode === 404 ? '404_not_found' : routePattern;
    const hourTimestamp = new Date();
    hourTimestamp.setMinutes(0, 0, 0);
    const timestampStr = hourTimestamp.toISOString();

    const fieldKey = `${tenantId}|${finalRoute}|${res.statusCode}|${timestampStr}`;

    const pipeline = this.redis.client.pipeline();
    pipeline.hincrby('metrics:buffer:counts', fieldKey, 1);
    pipeline.hincrby(
      'metrics:buffer:duration',
      fieldKey,
      Math.round(durationMs),
    );

    await pipeline.exec();
  }
}
