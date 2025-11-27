import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpContextInterceptor } from './activity-log/http-context.interceptor';
import { MailModule } from './mail/mail.module';
import { QueuesModule } from './queues/queues.module';
import { ConfigModule } from '@nestjs/config';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { PasswordWorkerModule } from './password-worker/password-worker.module';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    TenantsService,
  ],
})
export class AppModule {}
