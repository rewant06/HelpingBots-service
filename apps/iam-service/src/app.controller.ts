import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return 'HelpingBots IAM Platform Active';
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    const start = Date.now();
    const status = {
      database: 'UP',
      redis: 'UP',
      latency: 0,
      timestamp: new Date(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      status.database = 'DOWN';
    }

    try {
      await this.redis.client.ping();
    } catch (err) {
      status.redis = 'DOWN';
    }

    status.latency = Date.now() - start;
    return status;
  }
}
