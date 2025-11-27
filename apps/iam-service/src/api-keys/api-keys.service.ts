import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { randomBytes, randomUUID } from 'crypto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  Prisma,
  ActivityLogActionType,
  ActivityLogStatus,
} from '@prisma/iam-client';
import { RedisService } from '../redis/redis.service';
import { PasswordWorkerService } from 'src/password-worker/password-worker.service';

export interface ApiKeyCreationResult {
  id: string;
  name: string;
  rawKey: string;
  createdAt: Date;
}

// The result of a successful validation
export interface ValidatedKeyContext {
  tenantId: string;
  keyId: string;
  scopes: string[];
}

@Injectable()
export class ApiKeysService {
  private readonly USAGE_THROTTLE_TTL = 3600;
  private readonly logger = new Logger(ApiKeysService.name);
  private readonly KEY_PREFIX = 'hk_live'; // HelpingKeys live
  private readonly KEY_SEPARATOR = '_';
  private readonly ENTROPY_BYTES = 32; // 256-bit entropy

  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
    private redisService: RedisService,
    private passwordWorker: PasswordWorkerService,
  ) {}

  async createApiKey(
    tenantId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyCreationResult> {
    const keyId = randomUUID();
    const randomSecret = randomBytes(this.ENTROPY_BYTES).toString('hex');
    const rawKey = `${this.KEY_PREFIX}${this.KEY_SEPARATOR}${keyId}${this.KEY_SEPARATOR}${randomSecret}`;
    const last4 = rawKey.slice(-4);

    let keyHash: string;
    try {
      keyHash = await this.passwordWorker.hash(rawKey);
    } catch (err) {
      this.logger.error(`Passwork hashing failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Security module failed.');
    }

    try {
      const apiKeyRecord = await this.prisma.$transaction(async (tx) => {
        const createdKey = await tx.apiKey.create({
          data: {
            id: keyId,
            keyHash,
            prefix: this.KEY_PREFIX,
            last4,
            name: dto.name,
            description: dto.description,
            scopes: dto.scopes,
            tenantId,
            expiresAt: null,
          },
        });

        await this.activityLogService.createLog(
          ActivityLogActionType.CREATE,
          ActivityLogStatus.SUCCESS,
          'ApiKey',
          createdKey.id,
          { name: dto.name, scopes: dto.scopes, tenantId },
          undefined,
          tx,
        );

        return createdKey;
      });
      this.logger.log(`Generated API key [${apiKeyRecord.id}]`);

      return {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name || 'Unnamed Key',
        rawKey,
        createdAt: apiKeyRecord.createdAt,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`API key Transaction failed: ${msg}`);

      await this.activityLogService.createLog(
        ActivityLogActionType.CREATE,
        ActivityLogStatus.FAILED,
        'ApiKey',
        null,
        { tenantId, dto },
        msg,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Key generation collision. Please try again.',
          );
        }
      }
      throw new InternalServerErrorException('Failed to generate API Key');
    }
  }

  async validateKey(rawKey: string): Promise<ValidatedKeyContext> {
    if (!rawKey || !rawKey.startsWith(this.KEY_PREFIX)) {
      throw new UnauthorizedException('Invalid API Key');
    }

    const parts = rawKey.split(this.KEY_SEPARATOR);

    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid API Key format');
    }

    const [, uuidPart] = parts;

    let keyRecord;
    try {
      keyRecord = await this.prisma.apiKey.findUnique({
        where: { id: uuidPart },
        select: {
          id: true,
          keyHash: true,
          tenantId: true,
          scopes: true,
          expiresAt: true,
          tenant: {
            select: { status: true },
          },
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database error during key validation: ${msg}`);
      throw new InternalServerErrorException(
        'Key validation service unavailable',
      );
    }

    if (!keyRecord) {
      this.logger.warn(`Invalid Key Hash for ID: ${uuidPart}`);
      throw new UnauthorizedException('Invalid API Key');
    }

    const isValid = await this.passwordWorker.verify(keyRecord.keyHash, rawKey);

    if (!isValid) {
      await this.activityLogService.createLog(
        ActivityLogActionType.EXECUTE,
        ActivityLogStatus.FAILED,
        'ApiKey',
        keyRecord.id,
        { action: 'validate-key', reason: 'Hash mismatch' },
        'Hash verification failed (potential breach attempt)',
      );
      throw new UnauthorizedException('Invalid API Key');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    if (keyRecord.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Organization is suspended');
    }

    await this.updateLastUsed(keyRecord.id);
    return {
      tenantId: keyRecord.tenantId,
      keyId: keyRecord.id,
      scopes: keyRecord.scopes,
    };
  }

  private async updateLastUsed(id: string) {
    const throttleKey = `apikey:usage_throttle:${id}`;
    try {
      const result = await this.redisService.set(
        throttleKey,
        '1',
        'EX',
        this.USAGE_THROTTLE_TTL,
        'NX',
      );

      if (!result) {
        return;
      }
      await this.prisma.apiKey.update({
        where: { id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to update metrics for key ${id}`, error);
    }
  }
}
