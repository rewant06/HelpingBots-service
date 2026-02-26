import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { createPublicKey } from 'crypto';
import { JwtSigningKeysService } from '../../auth/jwt-signing-keys.service';
import { JwtKeyCrypto } from './jwt-key-crypto';

@Injectable()
export class JwtKeysService implements OnModuleInit {
  private readonly logger = new Logger(JwtKeysService.name);

  private readonly PUBKEY_CACHE_PREFIX = 'jwks:pubpem';
  private readonly PUBKEY_CACHE_TTL_SECONDS = 6 * 60 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly signingKeys: JwtSigningKeysService,
    private readonly crypto: JwtKeyCrypto,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.signingKeys.ensureActiveKey();
  }

  async getCurrentSigningKey(): Promise<{ kid: string; privateKeyPem: string }> {
    const row = await this.prisma.jwtSigningKey.findFirst({
      where: { status: 'ACTIVE' },
      select: { kid: true, privateKeyEnc: true },
      orderBy: { activatedAt: 'desc' },
    });

    if (!row) throw new Error('No ACTIVE signing key available');

    return {
      kid: row.kid,
      privateKeyPem: this.crypto.decryptPem(row.privateKeyEnc),
    };
  }

  async getPublishablePublicJwks(): Promise<Array<Record<string, unknown>>> {
    const now = new Date();
    const rows = await this.prisma.jwtSigningKey.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'RETIRED', publishUntil: { gt: now } },
        ],
      },
      select: { kid: true, publicJwk: true, status: true },
      orderBy: [{ status: 'asc' }, { activatedAt: 'desc' }],
    });

    return rows.map((r) => ({
      ...(r.publicJwk as Record<string, unknown>),
      kid: r.kid,
      use: 'sig',
      alg: 'RS256',
    }));
  }

  private isRecord(x: unknown): x is Record<string, unknown> {
    return !!x && typeof x === 'object' && !Array.isArray(x);
  }

  private jwkLooksLikeRsaPublicKey(jwk: Record<string, unknown>): boolean {
    // Minimal shape check to avoid trying to import garbage.
    return jwk.kty === 'RSA' && typeof jwk.n === 'string' && typeof jwk.e === 'string';
  }

  async getPublicKeyPemForKid(kid: string): Promise<string | null> {
    const cacheKey = `${this.PUBKEY_CACHE_PREFIX}:${kid}`;

    // Cache read: graceful degradation (fallback to DB).
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.debug(
        `Redis GET failed for jwks pubkey cache kid=${kid}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const row = await this.prisma.jwtSigningKey.findUnique({
      where: { kid },
      select: { publicJwk: true, status: true, publishUntil: true },
    });
    if (!row) return null;

    const now = new Date();
    const publishable =
      row.status === 'ACTIVE' ||
      (row.status === 'RETIRED' && row.publishUntil && row.publishUntil > now);
    if (!publishable) return null;

    if (!this.isRecord(row.publicJwk) || !this.jwkLooksLikeRsaPublicKey(row.publicJwk)) {
      this.logger.warn(`Invalid JWK stored for kid=${kid}; refusing to use it`);
      return null;
    }

    // Node supports JWK key import, but @types/node historically lagged `format: 'jwk'`,
    // so we keep the runtime-correct call and cast narrowly.
    const pem = createPublicKey({ key: row.publicJwk as any, format: 'jwk' as any }).export({
      format: 'pem',
      type: 'spki',
    }) as string;

    // Cache write: log-and-continue.
    try {
      await this.redis.set(cacheKey, pem, this.PUBKEY_CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.debug(
        `Redis SET failed for jwks pubkey cache kid=${kid}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return pem;
  }
}
