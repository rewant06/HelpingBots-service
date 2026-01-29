import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { JwtKeysService } from './jwt-keys.service';
import { JwtKeyCrypto } from './jwt-key-crypto';
import { JwtSigningKeysService } from '../../auth/jwt-signing-keys.service';
import { JwksController } from './jwks.controller';
import { JwtSigningKeysCleanupJob } from '../../auth/jwt-signing-keys-cleanup.job';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [JwksController],
  providers: [
    JwtKeysService,
    JwtKeyCrypto,
    JwtSigningKeysService,
    JwtSigningKeysCleanupJob,
  ],
  exports: [JwtKeysService, JwtKeyCrypto, JwtSigningKeysService],
})
export class JwtKeysModule {}
