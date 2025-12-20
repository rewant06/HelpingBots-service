// import {
//   Injectable,
//   OnModuleInit,
//   Logger,
//   OnModuleDestroy,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { RedisService } from 'src/redis/redis.service';

// @Injectable()
// export class MetricsWorker implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(MetricsWorker.name);
//   private interval: NodeJS.Timeout;
//   private isProcessing = false;

//   constructor(
//     private prisma: PrismaService,
//     private redis: RedisService,
//   ) {}

//   onModuleInit() {
//     this.interval = setInterval(() => this.syncMetrics(), 60000);
//     this.logger.log('Metrics Worker started.');
//   }

//   onModuleDestroy() {
//     clearInterval(this.interval);
//   }

//   async syncMetrics() {
//     if (this.isProcessing) return; // prevent overlap
//     this.isProcessing = true;

//     try {
//       const batchId = Date.now().toString();
//       const countKey = `metrics:buffer:counts:${batchId}`;
//       const durationKey = `metrics:buffer:duration:${batchId}`;

//       try {
//         const pipeline = this.redis.client.pipeline();
//         pipeline.rename('metrics:buffer:counts', countKey);
//         pipeline.rename(`metrics:buffer:durations`, durationKey);
//         await pipeline.exec();
//       } catch (e) {
//         this.isProcessing = false;
//         return;
//       }

//       const counts = await this.redis.client.hgetall(countKey);
//       const durations = await this.redis.client.hgetall(durationKey);

//       const operations = [];

//       for (const [key, countStr] of Object.entries(counts)) {
//         const [tenantId, route, method, statusStr, timestampStr] =
//           key.split('|');
//         const count = parseInt(countStr, 10);
//         const duration = parseInt(durations[key] || '0', 10);
//         const statusCode = parseInt(statusStr, 10);

//         operations.push(
//           this.prisma.apiMetric.upsert({
//             where: {
//               timestamp_tenantId_route_method_statusCode: {
//                 timestamp: new Date(timestampStr),
//                 tenantId,
//                 route,
//                 method,
//                 statusCode,
//               },
//             },
//             update: {
//               requestCount: { increment: count },
//               totalDuration: { increment: BigInt(duration) },
//             },
//             create: {
//               timestamp: new Date(timestampStr),
//               tenantId,
//               route,
//               method,
//               statusCode,
//               requestCount: count,
//               totalDuration: BigInt(duration),
//             },
//           }),
//         );
//       }
//       if (operations.length > 0) {
//         await this.prisma.$transaction(operations);
//         this.logger.log(`Synced ${operations.length} metric buckets to DB.`);
//       }
//       await this.redis.client.del(countKey, durationKey);
//     } catch (err) {
//       this.logger.error('Failed to sync metrics', err);
//     } finally {
//       this.isProcessing = false;
//     }
//   }
// }
