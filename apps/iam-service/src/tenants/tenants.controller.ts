import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { CreateApiKeyDto } from '../api-keys/dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PermissionsGuard } from '../auth/rbac/permissions.guard';
import { RequirePermission } from '../auth/rbac/permissions.decorator';
import { PermissionAction } from '../auth/rbac/permission.types';
import { User } from 'src/auth/decorator/user.decorator';
import type { UserPayload } from '../auth/types/user-payload.type';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: CreateTenantDto, @User() user: UserPayload) {
    return this.tenantsService.createTenant(dto, user.id);
  }

  @Get(':id')
  async getTenant(@Param('id') tenantId: string, @User() user: UserPayload) {
    return this.tenantsService.getTenantById(tenantId, user.id);
  }

  @Post(':id/keys')
  @RequirePermission([PermissionAction.MANAGE, 'ApiKey'])
  async generateKey(
    @Param('id') tenantId: string,
    @Body() dto: CreateApiKeyDto,
    @User() user: UserPayload,
  ) {
    await this.tenantsService.getTenantById(tenantId, user.id);
    return this.apiKeysService.createApiKey(tenantId, dto);
  }

  //   @Post()
  //   @RequirePermission([PermissionAction.CREATE, 'Tenant'])
  //   async createTenant(
  //     @Body() dto: CreateTenantDto,
  //     @GetUser() user: UserPayload,
  //   ) {
  //     return this.tenantsService.createTenant(dto, user.id);
  //   }

  //   @Post(':id/keys')
  //   @RequirePermission([PermissionAction.MANAGE, 'ApiKey'])
  //   async generateKey(
  //     @Param('id') tenantId: string,
  //     @Body() dto: CreateApiKeyDto,
  //     @GetUser() user: UserPayload,
  //   ) {
  //     // VETERAN TODO: Add ownership check here (Does user own tenantId?)
  //     // For now, assuming Platform Admin access via RBAC
  //     return this.apiKeysService.createApiKey(tenantId, dto);
  //   }
}
