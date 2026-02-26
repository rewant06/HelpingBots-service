import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { InternalJwtAdminController } from './internal-jwt-admin.controller';
import { UsersModule } from 'src/users/users.module';
import { loadPrivateKey, loadPublicKey } from 'src/common/keys';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RedisModule } from 'src/redis/redis.module';
import { RbacService } from './rbac/rbac.service';
import { PermissionsGuard } from './rbac/permissions.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { QueuesModule } from 'src/queues/queues.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantsMembershipService } from 'src/tenants/tenants-membership.service';
import { JwtKeysModule } from 'src/common/jwt-keys/jwt-keys.module';


@Module({
  imports: [
    forwardRef(() => UsersModule),
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresInSeconds = configService.get<number>(
          'ACCESS_TOKEN_EXPIRES_IN_SECONDS',
        );

        const expiresIn = expiresInSeconds || 900;
        return {
          privateKey: loadPrivateKey(),
          publicKey: loadPublicKey(),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: expiresIn,
          },
        };
      },
    }),
    QueuesModule,
    JwtKeysModule,
  ],
  providers: [
    RbacService,
    AuthService,
    JwtStrategy,
    PermissionsGuard,
    JwtAuthGuard,
    TenantsMembershipService,
  ],
  controllers: [AuthController, InternalJwtAdminController],
  exports: [AuthService, RbacService, PermissionsGuard, JwtAuthGuard],
})
export class AuthModule {}
