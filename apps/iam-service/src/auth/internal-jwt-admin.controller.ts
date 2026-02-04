import {
  Controller,
  Header,
  Headers,
  Logger,
  NotFoundException,
  Req,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtSigningKeysService } from './jwt-signing-keys.service';

@Controller('internal/jwt')
export class InternalJwtAdminController {
  private readonly logger = new Logger(InternalJwtAdminController.name);

  constructor(private readonly signingKeys: JwtSigningKeysService) {}

  @Post('rotate')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store')
  async rotate(
    @Req() req: Request,
    @Headers('x-internal-api-key') apiKey?: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ kid: string }> {
    const enabled =
      process.env.ENABLE_INTERNAL_ROTATE?.toLowerCase() === 'true';
    if (!enabled) {
      this.logger.warn(
        `rotate disabled by config requestId=${requestId ?? 'n/a'} ip=${req.ip}`,
      );
      throw new NotFoundException();
    }

    const expected = process.env.INTERNAL_ADMIN_API_KEY;
    if (!expected) {
      this.logger.warn(
        `rotate denied: INTERNAL_ADMIN_API_KEY not configured requestId=${requestId ?? 'n/a'} ip=${req.ip}`,
      );
      // Fail closed: if not configured, nobody can rotate keys via HTTP.
      throw new UnauthorizedException('Internal admin API key not configured');
    }

    if (!apiKey || apiKey !== expected) {
      this.logger.warn(
        `rotate denied: invalid api key requestId=${requestId ?? 'n/a'} ip=${req.ip}`,
      );
      throw new UnauthorizedException('Invalid internal admin API key');
    }

    try {
      const res = await this.signingKeys.rotateNow();
      this.logger.log(
        `rotate success requestId=${requestId ?? 'n/a'} ip=${req.ip} newKid=${res.newKid}`,
      );
      return { kid: res.newKid };
    } catch (err) {
      this.logger.error(
        `rotate failed requestId=${requestId ?? 'n/a'} ip=${req.ip}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
