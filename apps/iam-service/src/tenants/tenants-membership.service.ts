import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import type { TenantMember, TenantMemberRole, Role } from '@prisma/iam-client';

export interface UserTenantMembership {
  tenantId: string;
  tenantName: string;
  status: string;
  roles: string[];
  createdAt: Date;
}

export interface TenantRolesMap {
  [tenantId: string]: string[];
}

type MembershipWithRoles = TenantMember & {
  tenant: {
    id: string;
    name: string;
  };
  roles: (TenantMemberRole & {
    role: {
      name: string;
    };
  })[];
};

type MembershipCheck = TenantMember & {
  roles: (TenantMemberRole & {
    role: Role;
  })[];
};

@Injectable()
export class TenantsMembershipService {
  private readonly logger = new Logger(TenantsMembershipService.name);
  private readonly CACHE_TTL = 15 * 60;
  private readonly CACHE_KEY_PREFIX = 'tenantmemberships:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getActiveMembershipsForUser(
    userId: string,
  ): Promise<UserTenantMembership[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;

    // Try Redis cache

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as UserTenantMembership[];
        return parsed;
      }
    } catch (err) {
      this.logger.warn(
        `Redis GET failed for ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Cache miss - fetch from database
    let memberships: MembershipWithRoles[];
    try {
      memberships = (await this.prisma.tenantMember.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          roles: {
            include: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })) as MembershipWithRoles[];
    } catch (err) {
      this.logger.error(
        `Database query failed user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }

    // Transform to DTO

    const result = memberships.map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenant.name,
      status: m.status,
      roles: m.roles.map((r) => r.role.name),
      createdAt: m.createdAt,
    }));

    // Store in Redis for future requests (non-blocking)
    try {
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    } catch (err) {
      this.logger.warn(
        `Redis SET failed for ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return result;
  }

  async getTenantIds(userId: string): Promise<string[]> {
    const memberships = await this.getActiveMembershipsForUser(userId);
    return memberships.map((m) => m.tenantId);
  }

  async getDefaultActiveTenantId(userId: string): Promise<string | null> {
    const memberships = await this.getActiveMembershipsForUser(userId);
    return memberships.length > 0 ? memberships[0].tenantId : null;
  }

  async getTenantRolesByTenant(userId: string): Promise<TenantRolesMap> {
    const memberships = await this.getActiveMembershipsForUser(userId);
    const map: TenantRolesMap = {};

    for (const membership of memberships) {
      map[membership.tenantId] = membership.roles;
    }

    return map;
  }

  async userHasRoleInTenant(
    userId: string,
    tenantId: string,
    roleName: string,
  ): Promise<boolean> {
    try {
      const membership = (await this.prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId,
          },
        },
        include: {
          roles: {
            include: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })) as MembershipCheck | null;

      if (!membership || membership.status !== 'ACTIVE') {
        return false;
      }

      return membership.roles.some((r) => r.role.name === roleName);
    } catch (err) {
      this.logger.error(
        `Failed to check role for user ${userId} in tenant ${tenantId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  async isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    return this.userHasRoleInTenant(userId, tenantId, 'TENANT_ADMIN');
  }

  async clearMembershipCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
    try {
      await this.redis.del(cacheKey);
      this.logger.log(`Cleared membership cache for user ${userId}`);
    } catch (err) {
      this.logger.warn(
        `Failed to clear membership cache for ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // o(n) for large tenants 1000+ users, running it in background
  async clearMembershipCacheForTenant(tenantId: string): Promise<void> {
    try {
      const members = await this.prisma.tenantMember.findMany({
        where: { tenantId },
        select: { userId: true },
      });

      const clearPromises = members.map((m) =>
        this.clearMembershipCache(m.userId),
      );
      await Promise.all(clearPromises);
      this.logger.debug(
        `Cleared membership cache for ${members.length} users in tenant ${tenantId}`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to clear tenant-wide membership cache for ${tenantId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
