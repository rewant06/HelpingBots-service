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
import { TenantsMembershipService } from './tenants-membership.service';
import {
  ActivityLogActionType,
  ActivityLogStatus,
  Prisma,
  SubscriptionTier,
  TenantType,
} from '@prisma/iam-client';
import { randomBytes } from 'crypto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
    private tenantsMembershipService: TenantsMembershipService,
  ) {}

  private async ensureUniqueSlug(
    name: string,
    requestedSlug?: string,
  ): Promise<string> {
    const slug =
      requestedSlug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const exists = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!exists) return slug;

    if (requestedSlug) {
      throw new ConflictException(
        `The Organization ID '${slug}' is already taken.`,
      );
    } else {
      return `${slug}-${randomBytes(2).toString('hex')}`;
    }
  }

  async createTenant(dto: CreateTenantDto, ownerId: string) {
    this.logger.log(`User [${ownerId}] creating tenant [${dto.slug}]`);
    const finalSlug = await this.ensureUniqueSlug(dto.name, dto.slug);
    const tenantAdminRole = await this.prisma.role.upsert({
      where: { name: 'TENANT_ADMIN' },
      update: {},
      create: { name: 'TENANT_ADMIN', description: 'Tenant admin' },
    });

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const tenant = await tx.tenant.create({
            data: {
              name: dto.name,
              slug: finalSlug,
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

          const member = await tx.tenantMember.create({
            data: {
              tenantId: tenant.id,
              userId: ownerId,
              status: 'ACTIVE',
            },
          });

          await tx.tenantMemberRole.create({
            data: {
              tenantMemberId: member.id,
              roleId: tenantAdminRole.id,
            },
          });

          await this.activityLogService.createLog(
            ActivityLogActionType.CREATE,
            ActivityLogStatus.SUCCESS,
            'Tenant',
            tenant.id,
            {
              slug: finalSlug,
              type: dto.type,
              jobTitle: dto.jobTitle,
              authorized: dto.isAuthorized,
            },
            undefined,
            tx,
          );
          return tenant;
        },
        { timeout: 15000, maxWait: 5000 },
      );
      await this.tenantsMembershipService.clearMembershipCache(ownerId);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Tenant creation failed: ${msg}`, stack);

      await this.activityLogService.createLog(
        ActivityLogActionType.CREATE,
        ActivityLogStatus.FAILED,
        'Tenant',
        null,
        { dto, ownerId },
        msg,
      );
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException('Organization ID (slug) already taken.');
        }
      }
      throw new InternalServerErrorException('Failed to create Organization.');
    }
  }

  async getTenantById(tenantId: string, userId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          subscription: true,
          apiKeys: {
            select: {
              id: true,
              name: true,
              prefix: true,
              last4: true,
              scopes: true,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (Error instanceof NotFoundException) throw Error;
      this.logger.error(`Get Tenant Failed: ${msg}`);
      throw new InternalServerErrorException(
        'Could not fetch Organization details',
      );
    }
  }

  async getUserTenants(userId: string) {
    try {
      return await this.prisma.tenant.findMany({
        where: { ownerId: userId },
        include: {
          subscription: true,
          _count: {
            select: { apiKeys: true, shadowUsers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`List Tenants Failed: ${msg}`);
      throw new InternalServerErrorException('Could not fetch organizations');
    }
  }

  async getTenantKeys(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerId: true },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    if (tenant.ownerId !== userId) {
      throw new NotFoundException('Organization not found');
    }
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        prefix: true,
        last4: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }
}
