import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthzService {
  constructor(private readonly config: ConfigService) {}

  getContract() {
    const issuer =
      this.config.get<string>('PUBLIC_ISSUER') || 'http://localhost:8000';

    return {
      contractVersion: '2.0.0',
      issuer,
      audiences: ['drreach-api'],
      jwksUri: `${issuer}/.well-known/jwks.json`,
      jwt: {
        alg: 'RS256',
        requiredClaims: [
          'sub',
          'iss',
          'aud',
          'exp',
          'active_tenant_id',
          'roles',
          'permissions',
        ],
        actorContext: {
          user_id: 'sub',
          active_tenant_id: 'active_tenant_id',
          roles: 'roles (scoped to active tenant)',
          permissions: 'derived via ROLE_TO_PERMS',
        },
      },
      roleToPerms: {
        version: '2026-02-05',
      },
    };
  }
}
