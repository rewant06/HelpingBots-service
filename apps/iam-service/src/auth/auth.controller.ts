import {
  Controller,
  Post,
  Body,
  Get,
  ValidationPipe,
  UsePipes,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { CreateLocalUserDto } from './dto/createUser.dto';
import { LoginDto } from './dto/loginUser.dto';
import { AuthService } from './auth.service';
import { parseDeviceInfo } from './device/device.util';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RequirePermission } from './rbac/permissions.decorator';
import { PermissionsGuard } from './rbac/permissions.guard';
import { PermissionAction } from './rbac/permission.types';
import { User } from './decorator/user.decorator';
import type { UserPayload } from './types/user-payload.type';
import { ForgotPassword } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';

function readCookie(req: Request, name: string): string | undefined {
  const cookies = (req as unknown as { cookies?: Record<string, unknown> })
    .cookies;
  const value = cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() dto: CreateLocalUserDto) {
    try {
      const newUser = await this.authService.register(dto);
      return { newUser };
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('Registration failed');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    const user = await this.authService.validateLocalUser(dto);

    const device = parseDeviceInfo(req);

    const { accessToken, refreshToken } =
      await this.authService.generateTokensForUser(user, device);

    const cookieSecure = process.env.COOKIE_SECURE === 'true';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    const sameSite: 'none' | 'lax' | 'strict' = cookieSecure ? 'none' : 'lax';
    const cookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite,
      domain: cookieDomain,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days in ms (match REFRESH_TOKEN_EXPIRY_DAYS)
    };

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookie = readCookie(req, REFRESH_COOKIE_NAME);
    if (!cookie)
      throw new UnauthorizedException('Refresh token missing or malformed');

    const device = parseDeviceInfo(req);
    // AuthService.refreshTokens should return { accessToken, refreshToken }
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      cookie,
      device,
    );

    // rotate cookie
    const cookieSecure = process.env.COOKIE_SECURE === 'true';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? 'none' : 'lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @User() actor: UserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validRefreshToken = readCookie(req, REFRESH_COOKIE_NAME);

    const authHeader = req.headers.authorization;
    const accessToken =
      typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;

    try {
      await this.authService.logout(validRefreshToken, accessToken, actor);
    } catch (err: unknown) {
      void this.authService.logRevokeFailure(err, actor, validRefreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
    return;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPassword) {
    await this.authService.forgotPassword(dto);
    return;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission([PermissionAction.READ, 'UserSelf'])
  @HttpCode(HttpStatus.OK)
  getMe(@User() user: UserPayload) {
    return { user: user };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async switchTenant(@User() actor: UserPayload, @Body() dto: SwitchTenantDto) {
    const { accessToken } = await this.authService.switchTenant(
      actor,
      dto.tenant_id,
    );
    return { accessToken };
  }
}
