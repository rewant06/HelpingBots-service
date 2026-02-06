import { Injectable } from '@nestjs/common';
import { TenantsMembershipService } from 'src/tenants/tenants-membership.service';

@Injectable()
export class UvmvService {
  constructor(private tenantsMembership: TenantsMembershipService) {}

  async verify(claims: any) {
    const userId = claims.sub;
    const activeTenantId = claims.active_tenant_id ?? null;

    const memberships =
      await this.tenantsMembership.getActiveMembershipsForUser(userId);
    const membership = activeTenantId
      ? memberships.find((m) => m.tenantId === activeTenantId)
      : null;

    const scopedRoles = membership?.roles ?? [];
    const membershipStatus = membership ? 'ACTIVE' : 'INACTIVE';

    return {
      user_id: userId,
      active_tenant_id: activeTenantId,

      // TODO: replace with DB user.status if you want true “user verification”
      user_status: 'ACTIVE',
      membership_status: membershipStatus,

      scoped_roles: scopedRoles,
      permissions: Array.isArray(claims.permissions) ? claims.permissions : [],

      evaluated_at: new Date().toISOString(),
      cache_ttl_seconds: 30,
    };
  }
}
