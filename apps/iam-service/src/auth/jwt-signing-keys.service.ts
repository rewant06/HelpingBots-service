import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/iam-client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { createPublicKey, generateKeyPairSync, randomBytes } from 'crypto';
import { JwtKeyCrypto } from '../common/jwt-keys/jwt-key-crypto';

@Injectable()
export class JwtSigningKeysService {
  private readonly logger = new Logger(JwtSigningKeysService.name);

  private readonly PUBKEY_CACHE_PREFIX = 'jwks:pubpem';
  private readonly PUBKEY_CACHE_TTL_SECONDS = 6 * 60 * 60;

  // Stable app-level lock id for pg_advisory_xact_lock to serialize rotations across instances.
  private readonly ROTATION_LOCK_ID = 78345219;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtKeyCrypto: JwtKeyCrypto,
  ) {}

  private getAccessTokenTtlSeconds(): number {
    const raw = process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS;
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) return 900;
    return Math.floor(parsed);
  }

  private computePublishUntil(ttlSeconds: number): Date {
    const bufferSeconds = 5 * 60;
    return new Date(Date.now() + (ttlSeconds + bufferSeconds) * 1000);
  }

  private buildKid(): string {
    return `iam-${Date.now()}-${randomBytes(6).toString('hex')}`;
  }

  private exportPublicJwk(publicKeyPem: string): Record<string, unknown> {
    const jwk = createPublicKey(publicKeyPem).export({
      format: 'jwk',
    }) as unknown;
    if (!jwk || typeof jwk !== 'object') {
      throw new Error('Failed to export public key as JWK');
    }
    return jwk as Record<string, unknown>;
  }

  async rotateNow(): Promise<{ newKid: string }> {
    let publicKeyPem: string;
    let privateKeyPem: string;

    try {
      const kp = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      publicKeyPem = kp.publicKey;
      privateKeyPem = kp.privateKey;
    } catch (err) {
      this.logger.error(
        `RSA key generation failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to rotate signing key');
    }

    const kid = this.buildKid();
    const ttlSeconds = this.getAccessTokenTtlSeconds();
    const publishUntil = this.computePublishUntil(ttlSeconds);

    let publicJwk: Record<string, unknown>;
    try {
      publicJwk = this.exportPublicJwk(publicKeyPem);
    } catch (err) {
      this.logger.error(
        `Public JWK export failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to rotate signing key');
    }

    const encryptedPrivate = this.jwtKeyCrypto.encryptPem(privateKeyPem);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '2s'`;
        // Transaction-scoped advisory lock avoids session-lock issues with pooling.

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${this.ROTATION_LOCK_ID})`;

        const cleanup = await tx.jwtSigningKey.deleteMany({
          where: {
            status: 'RETIRED',
            publishUntil: { lte: new Date() },
          },
        });
        if (cleanup.count > 0) {
          this.logger.log(
            `Deleted ${cleanup.count} expired RETIRED signing keys`,
          );
        }

        await tx.jwtSigningKey.updateMany({
          where: { status: 'ACTIVE' },
          data: { status: 'RETIRED', retiredAt: new Date(), publishUntil },
        });

        await tx.jwtSigningKey.create({
          data: {
            kid,
            publicJwk: publicJwk as unknown as Prisma.InputJsonValue,
            privateKeyEnc: encryptedPrivate,
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        });
      });
    } catch (err) {
      this.logger.error(
        `DB rotation transaction failed kid=${kid}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to rotate signing key');
    }

    // Best-effort cache. Must never be an availability dependency.
    try {
      await this.redis.set(
        `${this.PUBKEY_CACHE_PREFIX}:${kid}`,
        publicKeyPem,
        this.PUBKEY_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.debug(
        `Redis SET failed for jwks pubkey cache kid=${kid}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.logger.log(`Rotated JWT signing key. New ACTIVE kid=${kid}`);
    return { newKid: kid };
  }

  async ensureActiveKey(): Promise<void> {
    const existing = await this.prisma.jwtSigningKey.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    if (existing) return;

    this.logger.warn('No ACTIVE JWT signing key found; bootstrapping one.');
    await this.rotateNow();
  }
}
