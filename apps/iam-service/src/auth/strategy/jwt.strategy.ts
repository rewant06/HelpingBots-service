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
  roles: string[];
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
    };

    this.httpContext.setActor(user);

    return user;
  }
}
