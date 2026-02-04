import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/rbac/permissions.guard';
import { RequirePermission } from 'src/auth/rbac/permissions.decorator';
import { PermissionAction } from 'src/auth/rbac/permission.types';
import { ActivityLogService } from './activity-log.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('activity-log')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission([PermissionAction.READ, 'ActivityLog'])
  @HttpCode(HttpStatus.OK)
  async getLogs(@Query() paginationDto: PaginationDto) {
    return this.activityLogService.getLogs(paginationDto);
  }
}
