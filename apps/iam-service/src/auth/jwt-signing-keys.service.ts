import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  createPublicKey,
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
} from 'crypto';

type PublicJwk = Record<string, any>;

@Injectable()
export class JwtSigningKeysService {
  private readonly logger = new Logger(JwtSigningKeysService.name);
  private readonly PUBKEY_CACHE_PREFIX = 'jwks:pubpem';
  private readonly PUBKEY_CACHE_TTL_SECONDS = 6 * 60 * 60;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async rotateNow(): Promise<{ newKid: string }> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      moduleLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const kid = `iam-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const publicJwk = createPublicKey(publicKey).export({
      format: 'jwk',
    }) as any;

    const ttlSeconds = Number(
      process.env.ACCESS_TOKEN_EXPIRRES_IN_SECONDS || 900,
    );
    const bufferSeconds = 5 * 60;
    const publishUntil = new Date(
      Date.now() + (ttlSeconds + bufferSeconds) * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.jwtSigningKey.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'RETIRED', retiredAt: new Date(), publishUntil },
      });

      await tx.jwtSigningKey.create({
        data: {
          kid,
          publicJwk,
          privateKeyEnc: this.encrypt(privateKey),
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });
    });

    try {
      await this.redis.set(
        `${this.PUBKEY_CACHE_PREFIX}`,
        publicKey,
        this.PUBKEY_CACHE_TTL_SECONDS,
      );
    } catch {}

    this.logger.log(`Rotated JWT signing key. New ACTIVE kid=${kid}`);
    return (newKid: kid);
  }

  async ensureActiveKey(): Promise<void> {
    const existing = await this.prisma.jwtSigningKey.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    if (existing) return;
    this.logger.warn('No ACTIVE JWT signing key found. bootstrapping one.');
    await this.rotateNow();
  }
}
