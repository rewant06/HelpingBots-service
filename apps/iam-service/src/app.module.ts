import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HttpContextInterceptor } from './activity-log/http-context.interceptor';
import { MailModule } from './mail/mail.module';
import { QueuesModule } from './queues/queues.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PasswordWorkerModule } from './password-worker/password-worker.module';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { TenantsModule } from './tenants/tenants.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000, // 60 seconds
            limit: 20, // 20 requests
          },
        ],
        storage: new ThrottlerStorageRedisService(
          config.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379',
        ),
      }),
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    RedisModule,
    ActivityLogModule,
    MailModule,
    QueuesModule,
    ApiKeysModule,
    PasswordWorkerModule,
    TenantsModule,
  ],
  controllers: [AppController, TenantsController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    TenantsService,
  ],
})
export class AppModule {}
