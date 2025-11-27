import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import {
  ActivityLogActionType,
  ActivityLogStatus,
  Prisma,
  SubscriptionTier,
  TenantType,
} from '@prisma/iam-client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
  ) {}

  async createTenant(dto: CreateTenantDto, ownerId: string) {
    this.logger.log(`User [${ownerId}] creating tenant [${dto.slug}]`);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            type: dto.type || TenantType.ORGANIZATION,
            ownerId,
            subscription: {
              create: {
                tier: SubscriptionTier.FREE,
                usageLimits: {
                  users: 200,
                  storage_gb: 1,
                },
              },
            },
          },
          include: {
            subscription: true,
          },
        });
        await this.activityLogService.createLog(
          ActivityLogActionType.CREATE,
          ActivityLogStatus.SUCCESS,
          'Tenant',
          tenant.id,
          { slug: dto.slug, type: dto.type },
          undefined,
          tx,
        );
        return tenant;
      });
      return result;
    } catch (err) {
      this.logger.error(`Tenant creation failed: ${err.message}`, err.stack);

      await this.activityLogService.createLog(
        ActivityLogActionType.CREATE,
        ActivityLogStatus.FAILED,
        'Tenant',
        null,
        { dto, ownerId },
        err.message,
      );
    }

    if (Error instanceof Prisma.PrismaClientKnownRequestError) {
      if (Error.code === 'P2002') {
        throw new ConflictException('Organization ID (slug) already taken.');
      }
    }
    throw new InternalServerErrorException('Failed to create Organization.');
  }

  async getTenantById(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        apiKeys: {
          select: {
            name: true,
            prefix: true,
            last4: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    if (tenant.ownerId !== userId) {
      throw new NotFoundException('Organization not found');
    }
    return tenant;
  }
}
