import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_USER_OPTIONAL_KEY } from '../decorators/optional-auth.decorator';

// Strict Type for the Context we receive from IAM
export class TenantContext {
  tenantId: string;
  keyId: string;
  scopes: string[];
}

export interface AuthenticatedRequest extends Request {
  tenant: TenantContext;
  user: { shadowId: string };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly IAM_URL =
    process.env.IAM_SERVICE_URL || 'http://iam-service:5000';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extract Headers (Case insensitive usually, but strict here)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = request.headers['x-api-key'] as string;
    const userId = request.headers['x-user-id'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // VETERAN RULE: B2B Apps must declare the End-User
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    try {
      // We verify keys remotely. To prevent latency on every request, we cache valid keys.
      const cacheKey = `auth:apikey:${apiKey}`;
      const cachedContext =
        await this.cacheManager.get<TenantContext>(cacheKey);

      if (cachedContext) {
        request.tenant = cachedContext;
        request.user = { shadowId: userId };
        return true;
      }

      // 3. Remote Verification (Call IAM)
      const { data } = await firstValueFrom(
        this.httpService.post<TenantContext>(
          `${this.IAM_URL}/internal/api-keys/verify`,
          { apiKey },
          { timeout: 5000 }, // Fail fast if IAM is down
        ),
      );

      // 4. Cache Result (TTL: 60 seconds)
      await this.cacheManager.set(cacheKey, data, 60 * 1000);

      // 5. Attach Context
      request.tenant = data;
      if (userId) {
        request.user = { shadowId: userId };
      } else {
        // Public Visitor
        request.user = { shadowId: 'public-visitor' };
      }

      return true;
    } catch (error) {
      // Handle Axios Errors
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          this.logger.warn(`Invalid API Key used: ${apiKey.slice(0, 10)}...`);
          throw new UnauthorizedException('Invalid or Expired API Key');
        }
      }

      // Handle Network/System Errors
      this.logger.error(
        `IAM Service Auth Failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Authentication Service Unavailable',
      );
    }
  }
}
