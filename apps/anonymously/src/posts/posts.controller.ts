import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiKeyGuard, TenantContext } from '../common/guards/api-key.guard';
import { Tenant, ShadowUser } from '../common/decorators/tenant.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@ApiTags('Posts')
@ApiHeader({
  name: 'x-api-key',
  description: 'The API Key for the Tenant (Organization)',
  required: true,
})
@ApiHeader({
  name: 'x-user-id',
  description: 'The ID of the user in the Client system (e.g. "alice_123")',
  required: true,
})
@Controller('v1/posts')
@UseGuards(ApiKeyGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // --- 1. GET GLOBAL FEED (Public/B2C) ---
  @Get('global')
  @ApiOperation({ summary: 'Get the Global Public Feed (HelpingBots)' })
  @ApiResponse({ status: 200, description: 'Returns global posts.' })
  findAllGlobal(@Query() dto: PaginationQueryDto) {
    // Note: Still requires a valid API Key (e.g. the Public Client's key) for rate limiting
    return this.postsService.findAllGlobal(dto);
  }
  // --- 2. GET TENANT FEED (Private) ---
  @Get()
  @ApiOperation({ summary: 'Get the Private Feed for this Tenant' })
  @ApiResponse({ status: 200, description: 'Returns paginated posts.' })
  findAllTenant(
    @Tenant() tenant: TenantContext,
    @Query() dto: PaginationQueryDto,
  ) {
    return this.postsService.findAllTenant(tenant.tenantId, dto);
  }

  // --- 3. CREATE POST ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Anonymous (or Public) Post' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation Error or Profanity Detected.',
  })
  create(
    @Body() dto: CreatePostDto,
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.create(dto, tenant.tenantId, user.shadowId);
  }

  // --- 4. VOTE ON POLL ---
  @Post('poll-options/:id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a specific Poll Option' })
  @ApiParam({ name: 'id', description: 'The UUID of the Poll Option' })
  vote(
    @Param('id') pollOptionId: string,
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.votePoll(
      tenant.tenantId,
      user.shadowId,
      pollOptionId,
    );
  }

  // --- 5. UPDATE POST ---
  @Patch(':id')
  @ApiOperation({ summary: 'Edit a Post (Author Only)' })
  update(
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.update(
      tenant.tenantId,
      user.shadowId,
      postId,
      dto,
    );
  }

  // --- 6. ARCHIVE POST ---
  @Delete(':id')
  @ApiOperation({ summary: 'Archive/Delete a Post (Author or Admin)' })
  archive(
    @Param('id') postId: string,
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    // VETERAN TODO: Check x-user-role header or scopes to set 'isPrivileged' to true for Admins.
    // For now, defaulting to false (Author only).
    const isPrivileged = false;
    return this.postsService.archive(
      tenant.tenantId,
      user.shadowId,
      postId,
      isPrivileged,
    );
  }
}
