import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
import { TenantsMembershipService } from './tenants-membership.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly apiKeysService: ApiKeysService,
    private readonly tenantsMembershipService: TenantsMembershipService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Organization (Tenant)' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully.',
  })
  @ApiResponse({ status: 409, description: 'Slug already taken.' })
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission([PermissionAction.CREATE, 'Tenant'])
  async createTenant(@Body() dto: CreateTenantDto, @User() user: UserPayload) {
    return this.tenantsService.createTenant(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Organization details and API Key metadata' })
  @ApiResponse({
    status: 200,
    description: 'Returns details if user is owner.',
  })
  async getTenant(@Param('id') tenantId: string, @User() user: UserPayload) {
    return this.tenantsService.getTenantById(tenantId, user.id);
  }

  @Post(':id/keys')
  @ApiOperation({ summary: 'Generate a new API Key for the Organization' })
  @ApiResponse({
    status: 201,
    description: 'Returns the raw API key (ONCE ONLY).',
  })
  @RequirePermission([PermissionAction.MANAGE, 'ApiKey'])
  async generateKey(
    @Param('id') tenantId: string,
    @Body() dto: CreateApiKeyDto,
    @User() user: UserPayload,
  ) {
    await this.tenantsService.getTenantById(tenantId, user.id);
    return this.apiKeysService.createApiKey(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Organizations owned by the current user' })
  @ApiResponse({ status: 200, description: 'List of tenants.' })
  async getMyTenants(@User() user: UserPayload) {
    // We allow any authenticated user to list their own tenants
    return this.tenantsService.getUserTenants(user.id);
  }

  @Get(':id/keys')
  @ApiOperation({ summary: 'List all API Keys for the Organization' })
  @ApiResponse({
    status: 200,
    description: 'List of keys metadata (secrets hidden).',
  })
  @RequirePermission([PermissionAction.MANAGE, 'ApiKey']) // Requires Admin-level access
  async getTenantKeys(
    @Param('id') tenantId: string,
    @User() user: UserPayload,
  ) {
    return this.tenantsService.getTenantKeys(tenantId, user.id);
  }

  @Post(':tenantId/api-keys')
  @HttpCode(HttpStatus.CREATED)
  async createTenantApiKey(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateApiKeyDto,
    @User() user: UserPayload,
  ) {
    const isAdmin = await this.tenantsMembershipService.isTenantAdmin(
      user.id,
      tenantId,
    );
    if (!isAdmin) throw new ForbiddenException('TENANT_ADMIN required');

    //  must include labs:write (labs:attachments:write optional)
    if (!Array.isArray(dto.scopes) || !dto.scopes.includes('labs:write')) {
      throw new BadRequestException('scopes must include labs:write');
    }

    return await this.apiKeysService.createApiKey(tenantId, dto);
  }

  @Post(':tenantId/api-keys/:keyId/rotate')
  @HttpCode(HttpStatus.OK)
  async rotateTenantApiKey(
    @Param('tenantId') tenantId: string,
    @Param('keyId') keyId: string,
    @User() user: UserPayload,
  ) {
    const isAdmin = await this.tenantsMembershipService.isTenantAdmin(
      user.id,
      tenantId,
    );
    if (!isAdmin) throw new ForbiddenException('TENANT_ADMIN required');

    return await this.apiKeysService.rotateApiKey(tenantId, keyId);
  }

  @Post(':tenantId/api-keys/:keyId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeTenantApiKey(
    @Param('tenantId') tenantId: string,
    @Param('keyId') keyId: string,
    @User() user: UserPayload,
  ) {
    const isAdmin = await this.tenantsMembershipService.isTenantAdmin(
      user.id,
      tenantId,
    );
    if (!isAdmin) throw new ForbiddenException('TENANT_ADMIN required');

    await this.apiKeysService.revokeApiKey(tenantId, keyId);
    return;
  }
}
