import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadPublicKey } from '../../common/keys';
import { UserPayload } from '../types/user-payload.type';
import { RedisService } from 'src/redis/redis.service';
import { HttpContextService } from 'src/activity-log/http-context.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  jti: string;
  roles?: string[];
  tenant_ids?: string[];
  active_tenant_id?: string;
  tenant_roles_by_tenant?: Record<string, string[]>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private redis: RedisService,
    private httpContext: HttpContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKey: loadPublicKey(),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<UserPayload | null> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token claim: missing jti');
    }

    const isDenied = await this.redis.get(`denylist:jti:${payload.jti}`);
    if (isDenied) {
      return null; // This token is on the denylist (logged out)
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
