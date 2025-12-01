import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ModerationModule } from './moderation/moderation.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 60000,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const publicKey = configService.getOrThrow<string>(
          'AUTH_SERVICE_PUBLIC_KEY',
        );
        return {
          publicKey: publicKey.replace(/\\n/g, '\n'),
          verifyOptions: {
            algorithms: ['RS256'],
          },
        };
      },
    }),
    PostsModule,
    PrismaModule,
    ModerationModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, PrismaService],
})
export class AppModule {}
