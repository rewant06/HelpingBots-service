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
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiKeyGuard, TenantContext } from '../common/guards/api-key.guard';
import { Tenant, ShadowUser } from '../common/decorators/tenant.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OptionalUser } from '../common/decorators/optional-auth.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

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
  @OptionalUser()
  @Public()
  @ApiOperation({ summary: 'Get the Global Public Feed (HelpingBots)' })
  @ApiResponse({ status: 200, description: 'Returns global posts.' })
  findAllGlobal(
    @Query() dto: PaginationQueryDto,
    @ShadowUser() user?: { shadowId: string },
  ) {
    return this.postsService.findAllGlobal(dto, user?.shadowId);
  }
  // --- 2. GET TENANT FEED (Private) ---
  @Get()
  @ApiOperation({ summary: 'Get the Private Feed for this Tenant' })
  @ApiResponse({ status: 200, description: 'Returns paginated posts.' })
  findAllTenant(
    @Tenant() tenant: TenantContext,
    @Query() dto: PaginationQueryDto,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.findAllTenant(tenant.tenantId, dto, user.shadowId);
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

  // --- 5. REACT (Agree / Disagree) ---
  @Post(':id/react')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'React to a post (AGREE / DISAGREE)' })
  @ApiParam({ name: 'id', description: 'The UUID of the Post' })
  react(
    @Param('id') postId: string,
    @Body('type') type: 'AGREE' | 'DISAGREE',
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    // Default to AGREE if type is missing (though DTO should enforce it)
    const reactionType = type || 'AGREE';
    return this.postsService.react(
      tenant.tenantId,
      user.shadowId,
      postId,
      reactionType,
    );
  }

  // --- 6. UPDATE POST ---
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

  // --- 7. ARCHIVE POST ---
  @Delete(':id')
  @ApiOperation({ summary: 'Archive/Delete a Post (Author or Admin)' })
  archive(
    @Param('id') postId: string,
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    const isPrivileged = false;
    return this.postsService.archive(
      tenant.tenantId,
      user.shadowId,
      postId,
      isPrivileged,
    );
  }

  // --- 8. GET MY PROFILE ---
  @Get('me/profile')
  @ApiOperation({ summary: 'Get current anonymous identity' })
  getMyProfile(
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.getMyProfile(tenant.tenantId, user.shadowId);
  }

  // --- 7. CREATE COMMENT ---
  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  async createComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto, // You need to create this DTO
    @Tenant() tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.createComment(
      tenant.tenantId,
      user.shadowId,
      postId,
      dto.content,
      dto.isAnonymous, // Pass preference
    );
  }

  // --- 8. GET COMMENTS ---
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  async getComments(
    @Param('id') postId: string,
    @Query() dto: PaginationQueryDto,
  ) {
    return this.postsService.getComments(postId, dto);
  }

  // --- 9.FINDONE ---
  @Get(':id')
  @OptionalUser()
  @Public()
  @ApiOperation({ summary: 'Get a single post by ID' })
  async findOne(@Param('id') postId: string, @Tenant() tenant: TenantContext) {
    return this.postsService.findOne(tenant.tenantId, postId);
  }
  // --- 10. BATCH INTERACTIONS ---
  @Post('interactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hydrate Feed State (Reactions/Votes)' })
  getInteractions(
    @Body('postIds') postIds: string[],
    @Tenant() Tenant: TenantContext,
    @ShadowUser() user: { shadowId: string },
  ) {
    return this.postsService.getUserInteractions(
      Tenant.tenantId,
      user.shadowId,
      postIds,
    );
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @OptionalUser() // Public users count too
  @ApiOperation({ summary: 'Increment View Count (Impression)' })
  async trackView(
    @Param('id') postId: string,
    @Tenant() tenant: TenantContext,
  ) {
    // Fire-and-forget: Increments Redis buffer instantly
    this.postsService.incrementView(postId);
    return { success: true };
  }
}
