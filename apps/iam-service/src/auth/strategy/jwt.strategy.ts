import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadPublicKey } from '../../common/keys';
import { UserPayload } from '../types/user-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { HttpContextService } from 'src/activity-log/http-context.service';
import { Request } from 'express';
import { JwtKeysService } from 'src/common/jwt-keys/jwt-keys.service';

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  jti: string;

  iss?: string;
  aud?: string | string[];
  exp?: number;

  roles?: string[];
  permissions?: string[];

  tenant_ids?: string[];
  active_tenant_id?: string;
  tenant_roles_by_tenant?: Record<string, string[]>;
}

function base64UrlToUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + '='.repeat(padLen);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function readKidFromRawJwt(rawJwtToken: string): string | null {
  try {
    const headerPart = rawJwtToken.split('.')[0];
    if (!headerPart) return null;
    const headerJson = base64UrlToUtf8(headerPart);
    const header = JSON.parse(headerJson) as { kid?: unknown };
    const kid = header.kid;
    return typeof kid === 'string' && kid.length > 0 ? kid : null;
  } catch {
    return null;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private redis: RedisService,
    private httpContext: HttpContextService,
    private jwtKeys: JwtKeysService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKeyProvider: (
        req: Request,
        rawJwtToken: string,
        done: (err: any, secret?: string) => void,
      ) => {
        const kid = readKidFromRawJwt(rawJwtToken);
        if (!kid) {
          return done(null, loadPublicKey());
        }
        void this.jwtKeys
          .getPublicKeyPemForKid(kid)
          .then((pem) => {
            if (!pem)
              return done(
                new UnauthorizedException('Unknown or retired signing key'),
              );
            return done(null, pem);
          })
          .catch((e) => done(e));
      },
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<UserPayload | null> {
    (req as any).authClaims = payload;
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token claim: missing jti');
    }

    const isDenied = await this.redis.get(`denylist:jti:${payload.jti}`);
    if (isDenied) {
      return null; // This token is on the denylist (logged out)
    }

    const expectedIss = process.env.JWT_ISSUER;
    if (!expectedIss) {
      throw new UnauthorizedException('JWT_ISSUER not configured');
    }
    if (payload.iss !== expectedIss) {
      throw new UnauthorizedException('Invalid issuer');
    }

    const aud = payload.aud;
    const okAud =
      aud === 'drreach-api' ||
      (Array.isArray(aud) && aud.includes('drreach-api'));
    if (!okAud) {
      throw new UnauthorizedException('Invalid audience');
    }

    const roles = Array.isArray(payload.roles)
      ? payload.roles.map((r: string) => ({ name: r }))
      : [];

    const user: UserPayload = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || null,
      roles: roles,
      tenant_ids: Array.isArray(payload.tenant_ids) ? payload.tenant_ids : [],
      active_tenant_id: payload.active_tenant_id ?? null,
      tenant_roles_by_tenant:
        payload.tenant_roles_by_tenant &&
        typeof payload.tenant_roles_by_tenant === 'object'
          ? payload.tenant_roles_by_tenant
          : {},
    };

    this.httpContext.setActor(user);

    return user;
  }
}
